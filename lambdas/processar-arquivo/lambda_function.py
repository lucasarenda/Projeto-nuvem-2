"""
Lambda "doaperto-processar-arquivo" (RF-03)

Disparada pelo S3 (evento ObjectCreated) para dois prefixos:

  uploads/...      foto ou PDF ligado a uma ONG/necessidade/doação
                   -> imagem: gera miniatura JPEG em thumbnails/... e grava largura/altura
                   -> PDF: conta as páginas
                   -> atualiza a linha em `anexos` (status PROCESSADO ou ERRO)

  importacoes/...  CSV de necessidades enviado por uma ONG
                   -> valida cada linha, insere em `necessidades` (origem CSV)
                   -> grava o resumo em `importacoes`

IMPORTANTE: a notificação do S3 deve ser configurada SÓ para os prefixos
"uploads/" e "importacoes/". A miniatura é gravada em "thumbnails/", fora
deles, para não disparar a Lambda em loop.

Variáveis de ambiente: DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD,
DB_SSL (true/false), THUMBNAIL_SIZE (px), CSV_MAX_LINHAS.
"""

import csv
import io
import logging
import os
import re
import ssl
import unicodedata
import urllib.parse

import boto3
import pg8000.native

log = logging.getLogger()
log.setLevel(logging.INFO)

s3 = boto3.client("s3")

PREFIXO_THUMB = "thumbnails/"
TAMANHO_THUMB = int(os.environ.get("THUMBNAIL_SIZE", "480"))
MAX_LINHAS = int(os.environ.get("CSV_MAX_LINHAS", "5000"))

CATEGORIAS = {
    "alimento": "ALIMENTO", "alimentos": "ALIMENTO", "comida": "ALIMENTO",
    "roupa": "ROUPA", "roupas": "ROUPA", "vestuario": "ROUPA",
    "calcado": "CALCADO", "calcados": "CALCADO", "sapato": "CALCADO", "sapatos": "CALCADO",
    "higiene": "HIGIENE", "higiene pessoal": "HIGIENE",
    "cobertor": "COBERTOR", "cobertores": "COBERTOR", "manta": "COBERTOR", "mantas": "COBERTOR",
    "brinquedo": "BRINQUEDO", "brinquedos": "BRINQUEDO",
    "outro": "OUTRO", "outros": "OUTRO",
}
URGENCIAS = {"baixa": "BAIXA", "media": "MEDIA", "alta": "ALTA"}


def conectar():
    contexto = None
    if os.environ.get("DB_SSL", "true").lower() == "true":
        # RDS PostgreSQL 15+ exige SSL (rds.force_ssl=1). Canal cifrado; para validar
        # a cadeia, inclua o global-bundle.pem da AWS e use ssl.create_default_context(cafile=...).
        contexto = ssl.create_default_context()
        contexto.check_hostname = False
        contexto.verify_mode = ssl.CERT_NONE
    return pg8000.native.Connection(
        host=os.environ["DB_HOST"],
        port=int(os.environ.get("DB_PORT", "5432")),
        database=os.environ.get("DB_NAME", "doaperto"),
        user=os.environ["DB_USER"],
        password=os.environ["DB_PASSWORD"],
        ssl_context=contexto,
        timeout=15,
    )


def lambda_handler(event, context):
    resultados = []
    con = conectar()
    try:
        for registro in event.get("Records", []):
            bucket = registro["s3"]["bucket"]["name"]
            key = urllib.parse.unquote_plus(registro["s3"]["object"]["key"])
            tamanho = registro["s3"]["object"].get("size")
            log.info("Processando s3://%s/%s (%s bytes)", bucket, key, tamanho)

            if key.startswith("importacoes/"):
                resultados.append(importar_csv(con, bucket, key))
            elif key.startswith("uploads/"):
                resultados.append(processar_anexo(con, bucket, key, tamanho))
            else:
                log.info("Prefixo ignorado: %s", key)
                resultados.append({"key": key, "ignorado": True})
    finally:
        con.close()
    return {"processados": resultados}


# --------------------------------------------------------------------------- anexos

def processar_anexo(con, bucket, key, tamanho):
    linhas = con.run("SELECT id, content_type FROM anexos WHERE s3_key = :k", k=key)
    if not linhas:
        log.warning("Nenhum anexo registrado para %s (upload fora do fluxo da API?)", key)
        return {"key": key, "erro": "anexo não encontrado"}
    anexo_id, content_type = linhas[0]

    try:
        dados = s3.get_object(Bucket=bucket, Key=key)["Body"].read()
        if content_type.startswith("image/"):
            largura, altura, thumb_key = gerar_miniatura(bucket, key, dados)
            con.run(
                """UPDATE anexos SET status = 'PROCESSADO', largura = :l, altura = :a, thumbnail_key = :t,
                          tamanho_bytes = :s, erro = NULL, processado_em = now() WHERE id = :id""",
                l=largura, a=altura, t=thumb_key, s=tamanho or len(dados), id=anexo_id)
            return {"anexo": anexo_id, "miniatura": thumb_key, "largura": largura, "altura": altura}

        if content_type == "application/pdf":
            paginas = contar_paginas_pdf(dados)
            con.run(
                """UPDATE anexos SET status = 'PROCESSADO', paginas = :p, tamanho_bytes = :s, erro = NULL,
                          processado_em = now() WHERE id = :id""",
                p=paginas, s=tamanho or len(dados), id=anexo_id)
            return {"anexo": anexo_id, "paginas": paginas}

        con.run("UPDATE anexos SET status = 'PROCESSADO', tamanho_bytes = :s, processado_em = now() WHERE id = :id",
                s=tamanho or len(dados), id=anexo_id)
        return {"anexo": anexo_id}
    except Exception as e:  # registra o erro na linha para o front exibir
        log.exception("Falha ao processar anexo %s", anexo_id)
        con.run("UPDATE anexos SET status = 'ERRO', erro = :e, processado_em = now() WHERE id = :id",
                e=str(e)[:1000], id=anexo_id)
        return {"anexo": anexo_id, "erro": str(e)}


def gerar_miniatura(bucket, key, dados):
    from PIL import Image, ImageOps  # import tardio: só imagens precisam do Pillow

    img = Image.open(io.BytesIO(dados))
    img = ImageOps.exif_transpose(img)
    largura, altura = img.size

    if img.mode in ("RGBA", "LA", "P"):
        img = img.convert("RGBA")
        fundo = Image.new("RGB", img.size, (255, 255, 255))
        fundo.paste(img, mask=img.split()[-1])
        img = fundo
    elif img.mode != "RGB":
        img = img.convert("RGB")

    img.thumbnail((TAMANHO_THUMB, TAMANHO_THUMB))
    saida = io.BytesIO()
    img.save(saida, "JPEG", quality=82, optimize=True, progressive=True)

    base = key[len("uploads/"):].rsplit(".", 1)[0]
    thumb_key = f"{PREFIXO_THUMB}{base}.jpg"
    s3.put_object(Bucket=bucket, Key=thumb_key, Body=saida.getvalue(), ContentType="image/jpeg",
                  CacheControl="max-age=31536000")
    return largura, altura, thumb_key


def contar_paginas_pdf(dados):
    # Conta objetos /Type /Page (exclui /Pages). Suficiente para PDFs comuns, sem dependências.
    return len(re.findall(rb"/Type\s*/Page(?!s)", dados)) or None


# --------------------------------------------------------------------------- importação CSV

def importar_csv(con, bucket, key):
    linhas = con.run("SELECT id, ong_id FROM importacoes WHERE s3_key = :k", k=key)
    if not linhas:
        log.warning("Nenhuma importação registrada para %s", key)
        return {"key": key, "erro": "importação não encontrada"}
    importacao_id, ong_id = linhas[0]

    try:
        bruto = s3.get_object(Bucket=bucket, Key=key)["Body"].read()
        validas, erros, total = ler_csv(decodificar(bruto))
    except Exception as e:
        log.exception("CSV ilegível: %s", key)
        con.run("""UPDATE importacoes SET status = 'ERRO', mensagens = :m, processado_em = now() WHERE id = :id""",
                m=f"Arquivo inválido: {e}"[:4000], id=importacao_id)
        return {"importacao": importacao_id, "erro": str(e)}

    con.run("BEGIN")
    try:
        for v in validas:
            con.run(
                """INSERT INTO necessidades (ong_id, titulo, descricao, categoria, quantidade, unidade, urgencia, origem)
                   VALUES (:ong, :titulo, :descricao, :categoria, :quantidade, :unidade, :urgencia, 'CSV')""",
                ong=ong_id, **v)
        status = "CONCLUIDA" if validas or not erros else "ERRO"
        mensagens = "\n".join(erros[:60]) or None
        con.run(
            """UPDATE importacoes SET status = :st, linhas_total = :t, linhas_importadas = :i, linhas_com_erro = :e,
                      mensagens = :m, processado_em = now() WHERE id = :id""",
            st=status, t=total, i=len(validas), e=len(erros), m=mensagens[:4000] if mensagens else None,
            id=importacao_id)
        con.run("COMMIT")
    except Exception:
        con.run("ROLLBACK")
        raise

    log.info("Importação %s: %s de %s linhas", importacao_id, len(validas), total)
    return {"importacao": importacao_id, "importadas": len(validas), "erros": len(erros)}


def decodificar(bruto):
    for codificacao in ("utf-8-sig", "cp1252"):  # Excel em pt-BR costuma salvar em cp1252
        try:
            return bruto.decode(codificacao)
        except UnicodeDecodeError:
            continue
    return bruto.decode("latin-1")


def normalizar(texto):
    sem_acento = unicodedata.normalize("NFD", texto or "").encode("ascii", "ignore").decode()
    return sem_acento.strip().lower()


def ler_csv(texto):
    amostra = texto[:2048]
    try:
        delimitador = csv.Sniffer().sniff(amostra, delimiters=",;\t").delimiter
    except csv.Error:
        delimitador = ";" if amostra.count(";") > amostra.count(",") else ","

    leitor = csv.DictReader(io.StringIO(texto), delimiter=delimitador)
    if not leitor.fieldnames:
        raise ValueError("CSV vazio")
    leitor.fieldnames = [normalizar(c) for c in leitor.fieldnames]
    faltando = {"titulo", "categoria", "quantidade"} - set(leitor.fieldnames)
    if faltando:
        raise ValueError("Colunas obrigatórias ausentes: " + ", ".join(sorted(faltando)))

    validas, erros, total = [], [], 0
    for numero, linha in enumerate(leitor, start=2):
        if not any((v or "").strip() for v in linha.values()):
            continue
        total += 1
        if total > MAX_LINHAS:
            erros.append(f"Limite de {MAX_LINHAS} linhas atingido; o restante foi ignorado.")
            break
        try:
            validas.append(validar_linha(linha))
        except ValueError as e:
            erros.append(f"Linha {numero}: {e}")
    return validas, erros, total


def validar_linha(linha):
    titulo = (linha.get("titulo") or "").strip()
    if not titulo:
        raise ValueError("título vazio")
    if len(titulo) > 150:
        raise ValueError("título com mais de 150 caracteres")

    categoria = CATEGORIAS.get(normalizar(linha.get("categoria")))
    if not categoria:
        raise ValueError(f"categoria '{linha.get('categoria')}' desconhecida")

    try:
        quantidade = int(float((linha.get("quantidade") or "").replace(",", ".")))
    except ValueError:
        raise ValueError(f"quantidade '{linha.get('quantidade')}' não é número")
    if quantidade <= 0:
        raise ValueError("quantidade deve ser maior que zero")

    urgencia_txt = normalizar(linha.get("urgencia")) or "media"
    urgencia = URGENCIAS.get(urgencia_txt)
    if not urgencia:
        raise ValueError(f"urgência '{linha.get('urgencia')}' inválida (use baixa, media ou alta)")

    unidade = (linha.get("unidade") or "unidades").strip()[:20] or "unidades"
    descricao = (linha.get("descricao") or "").strip()[:2000] or None
    return {"titulo": titulo, "descricao": descricao, "categoria": categoria, "quantidade": quantidade,
            "unidade": unidade, "urgencia": urgencia}
