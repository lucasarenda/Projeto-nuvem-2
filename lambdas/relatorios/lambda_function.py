"""
Lambda "doaperto-relatorios" (RF-04)

Exposta pelo API Gateway (HTTP API):
    GET /relatorios                     -> lista os relatórios disponíveis
    GET /relatorios/{tipo}?uf=SP        -> executa um relatório

Todos os relatórios são consultas com JOIN + GROUP BY no RDS PostgreSQL.

Variáveis de ambiente: DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD,
DB_SSL (true/false), CORS_ORIGIN (padrão "*").
"""

import datetime as dt
import decimal
import json
import logging
import os
import re
import ssl

import pg8000.native

log = logging.getLogger()
log.setLevel(logging.INFO)

CATEGORIAS = ["ALIMENTO", "ROUPA", "CALCADO", "HIGIENE", "COBERTOR", "BRINQUEDO", "OUTRO"]


def conectar():
    contexto = None
    if os.environ.get("DB_SSL", "true").lower() == "true":
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


def consultar(con, sql, **params):
    linhas = con.run(sql, **params)
    colunas = [c["name"] for c in con.columns]
    return [dict(zip(colunas, linha)) for linha in linhas]


def filtro_uf(uf, alias="o"):
    # Fragmento SQL fixo; o valor vai sempre como parâmetro (:uf).
    return f" AND {alias}.uf = :uf" if uf else ""


# --------------------------------------------------------------------------- relatórios

def resumo(con, uf, _params):
    """Números de impacto (home e topo do dashboard)."""
    p = {"uf": uf} if uf else {}
    linha = consultar(con, f"""
        SELECT COUNT(DISTINCT o.id)                                                   AS ongs,
               COUNT(DISTINCT n.id) FILTER (WHERE n.status = 'ABERTA')                AS necessidades_abertas,
               COUNT(DISTINCT n.id) FILTER (WHERE n.status = 'ATENDIDA')              AS necessidades_atendidas,
               COUNT(DISTINCT d.id) FILTER (WHERE d.status = 'ENTREGUE')              AS doacoes_entregues,
               COUNT(DISTINCT d.id) FILTER (WHERE d.status IN ('PENDENTE','CONFIRMADA')) AS doacoes_em_andamento,
               COALESCE(SUM(d.quantidade) FILTER (WHERE d.status = 'ENTREGUE'), 0)    AS itens_entregues,
               COUNT(DISTINCT d.doador_id) FILTER (WHERE d.status <> 'CANCELADA')     AS doadores_ativos,
               ROUND(AVG(d.distancia_km) FILTER (WHERE d.status = 'ENTREGUE'), 1)     AS distancia_media_km
          FROM ongs o
          LEFT JOIN necessidades n ON n.ong_id = o.id
          LEFT JOIN doacoes d      ON d.necessidade_id = n.id
         WHERE 1 = 1 {filtro_uf(uf)}
    """, **p)[0]
    linha["cidades_atendidas"] = consultar(
        con, f"SELECT COUNT(DISTINCT o.cidade || '/' || o.uf) AS total FROM ongs o WHERE 1 = 1 {filtro_uf(uf)}",
        **p)[0]["total"]
    return linha


def necessidades_por_categoria(con, uf, _params):
    p = {"uf": uf} if uf else {}
    return consultar(con, f"""
        SELECT n.categoria,
               COUNT(*) FILTER (WHERE n.status = 'ABERTA')                             AS abertas,
               COUNT(*) FILTER (WHERE n.status = 'ATENDIDA')                           AS atendidas,
               COUNT(DISTINCT n.ong_id)                                                AS ongs,
               SUM(n.quantidade)                                                       AS quantidade_solicitada,
               SUM(LEAST(n.quantidade_recebida, n.quantidade))                         AS quantidade_recebida,
               ROUND(100.0 * SUM(LEAST(n.quantidade_recebida, n.quantidade)) / NULLIF(SUM(n.quantidade), 0), 1)
                                                                                       AS percentual_atendido,
               COUNT(*) FILTER (WHERE n.status = 'ABERTA' AND n.urgencia = 'ALTA')     AS urgentes
          FROM necessidades n
          JOIN ongs o ON o.id = n.ong_id
         WHERE n.status <> 'CANCELADA' {filtro_uf(uf)}
         GROUP BY n.categoria
         ORDER BY abertas DESC, n.categoria
    """, **p)


def ranking_ongs(con, uf, params):
    limite = min(max(int(params.get("limite", 10)), 1), 50)
    p = {"limite": limite}
    if uf:
        p["uf"] = uf
    return consultar(con, f"""
        WITH nec AS (
            SELECT ong_id,
                   COUNT(*) FILTER (WHERE status = 'ABERTA')  AS abertas,
                   SUM(quantidade)                            AS solicitado,
                   SUM(LEAST(quantidade_recebida, quantidade)) AS recebido
              FROM necessidades
             WHERE status <> 'CANCELADA'
             GROUP BY ong_id
        ), doa AS (
            SELECT n.ong_id,
                   COUNT(*) FILTER (WHERE d.status = 'ENTREGUE')                     AS doacoes_recebidas,
                   COALESCE(SUM(d.quantidade) FILTER (WHERE d.status = 'ENTREGUE'), 0) AS itens_recebidos,
                   COUNT(DISTINCT d.doador_id)                                       AS doadores
              FROM doacoes d
              JOIN necessidades n ON n.id = d.necessidade_id
             GROUP BY n.ong_id
        )
        SELECT o.id, o.nome, o.cidade, o.uf,
               COALESCE(nec.abertas, 0)            AS necessidades_abertas,
               COALESCE(doa.doacoes_recebidas, 0)  AS doacoes_recebidas,
               COALESCE(doa.itens_recebidos, 0)    AS itens_recebidos,
               COALESCE(doa.doadores, 0)           AS doadores,
               ROUND(100.0 * nec.recebido / NULLIF(nec.solicitado, 0), 1) AS percentual_atendido
          FROM ongs o
          LEFT JOIN nec ON nec.ong_id = o.id
          LEFT JOIN doa ON doa.ong_id = o.id
         WHERE 1 = 1 {filtro_uf(uf)}
         ORDER BY itens_recebidos DESC, percentual_atendido DESC NULLS LAST, o.nome
         LIMIT :limite
    """, **p)


def doacoes_por_mes(con, uf, _params):
    p = {"uf": uf} if uf else {}
    linhas = consultar(con, f"""
        SELECT to_char(date_trunc('month', d.criado_em), 'YYYY-MM') AS mes,
               n.categoria,
               COUNT(*)          AS doacoes,
               SUM(d.quantidade) AS itens
          FROM doacoes d
          JOIN necessidades n ON n.id = d.necessidade_id
          JOIN ongs o         ON o.id = n.ong_id
         WHERE d.status <> 'CANCELADA'
           AND d.criado_em >= date_trunc('month', now()) - INTERVAL '11 months' {filtro_uf(uf)}
         GROUP BY 1, 2
         ORDER BY 1, 2
    """, **p)

    hoje = dt.date.today().replace(day=1)
    meses = []
    for i in range(11, -1, -1):
        ano, mes = divmod(hoje.year * 12 + hoje.month - 1 - i, 12)
        meses.append(f"{ano:04d}-{mes + 1:02d}")
    series = {c: [0] * 12 for c in CATEGORIAS}
    totais = [0] * 12
    for linha in linhas:
        if linha["mes"] in meses:
            idx = meses.index(linha["mes"])
            series[linha["categoria"]][idx] += int(linha["doacoes"])
            totais[idx] += int(linha["doacoes"])
    return {"meses": meses, "series": {c: v for c, v in series.items() if any(v)}, "totais": totais,
            "linhas": linhas}


def top_doadores(con, uf, params):
    limite = min(max(int(params.get("limite", 10)), 1), 50)
    p = {"limite": limite}
    if uf:
        p["uf"] = uf
    linhas = consultar(con, f"""
        SELECT dd.id, dd.nome, dd.cidade, dd.uf,
               COUNT(*)                 AS doacoes,
               SUM(d.quantidade)        AS itens,
               COUNT(DISTINCT n.ong_id) AS ongs_ajudadas
          FROM doacoes d
          JOIN doadores dd    ON dd.id = d.doador_id
          JOIN necessidades n ON n.id = d.necessidade_id
          JOIN ongs o         ON o.id = n.ong_id
         WHERE d.status = 'ENTREGUE' {filtro_uf(uf)}
         GROUP BY dd.id, dd.nome, dd.cidade, dd.uf
         ORDER BY itens DESC, doacoes DESC
         LIMIT :limite
    """, **p)
    for linha in linhas:  # relatório público: só primeiro nome + inicial
        partes = (linha.pop("nome") or "").split()
        linha["nome"] = partes[0] + (f" {partes[-1][0]}." if len(partes) > 1 else "") if partes else "Anônimo"
    return linhas


RELATORIOS = {
    "resumo": (resumo, "Números de impacto da rede"),
    "necessidades-por-categoria": (necessidades_por_categoria, "Necessidades abertas/atendidas por categoria"),
    "ranking-ongs": (ranking_ongs, "ONGs que mais receberam doações"),
    "doacoes-por-mes": (doacoes_por_mes, "Doações dos últimos 12 meses por categoria"),
    "top-doadores": (top_doadores, "Doadores que mais entregaram itens"),
}


# --------------------------------------------------------------------------- HTTP

def _json_padrao(valor):
    if isinstance(valor, decimal.Decimal):
        return int(valor) if valor == valor.to_integral_value() else float(valor)
    if isinstance(valor, (dt.date, dt.datetime)):
        return valor.isoformat()
    raise TypeError(f"Tipo não serializável: {type(valor)}")


def resposta(status, corpo):
    return {
        "statusCode": status,
        "headers": {
            "Content-Type": "application/json; charset=utf-8",
            "Access-Control-Allow-Origin": os.environ.get("CORS_ORIGIN", "*"),
            "Access-Control-Allow-Methods": "GET,OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
            "Cache-Control": "max-age=30",
        },
        "body": json.dumps(corpo, default=_json_padrao, ensure_ascii=False) if corpo is not None else "",
    }


def lambda_handler(event, context):
    metodo = (event.get("requestContext", {}).get("http", {}).get("method")  # HTTP API (payload 2.0)
              or event.get("httpMethod") or "GET")                              # REST API (payload 1.0)
    if metodo == "OPTIONS":
        return resposta(204, None)

    tipo = (event.get("pathParameters") or {}).get("tipo")
    if not tipo:
        return resposta(200, [{"tipo": k, "descricao": v[1], "url": f"/relatorios/{k}"} for k, v in RELATORIOS.items()])
    if tipo not in RELATORIOS:
        return resposta(404, {"title": "Relatório não encontrado", "disponiveis": list(RELATORIOS)})

    params = event.get("queryStringParameters") or {}
    uf = (params.get("uf") or "").strip().upper()
    if uf and not re.fullmatch(r"[A-Z]{2}", uf):
        return resposta(400, {"title": "UF inválida"})

    try:
        con = conectar()
    except Exception:
        log.exception("Falha ao conectar no banco")
        return resposta(503, {"title": "Banco de dados indisponível"})
    try:
        funcao = RELATORIOS[tipo][0]
        dados = funcao(con, uf or None, params)
        return resposta(200, {"relatorio": tipo, "uf": uf or None,
                              "geradoEm": dt.datetime.now(dt.timezone.utc), "dados": dados})
    except Exception:
        log.exception("Erro no relatório %s", tipo)
        return resposta(500, {"title": "Erro ao gerar relatório"})
    finally:
        con.close()
