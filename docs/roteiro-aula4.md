# Roteiro da Aula 4 — RF-02, RF-03, RF-04 e front final

Região **us-east-1**. Já existem: VPC, `doaperto-api-sg`, `doaperto-rds-sg`, RDS, parâmetros `/doaperto/db/*`, EC2 com a API e o
bucket do site `doaperto-site-10436971`. Hoje criamos o resto, nesta ordem. Cada passo termina com um **✔ teste**:
só siga quando ele passar.

---

## 0. Começo da sessão

1. **Start Lab**, espere ficar verde.
2. **EC2** `doaperto-api` *running* e **RDS** `doaperto-db` *available*.
3. Copie o **Public IPv4 DNS** da EC2 (muda a cada sessão sem Elastic IP). Daqui pra frente: `<DNS-EC2>`.
4. Copie o **endpoint do RDS** (RDS → `doaperto-db` → *Connectivity*). Daqui pra frente: `<ENDPOINT-RDS>`.

✔ `http://<DNS-EC2>:8080/api/ongs` mostra a lista de ONGs.

## 1. Conferir o S3 Gateway Endpoint

A Lambda vai rodar na subnet privada (para alcançar o RDS) e lá **não há internet** (sem NAT). O S3 só é
alcançável pelo **VPC Gateway Endpoint**, que é gratuito.

**VPC → Endpoints**: deve existir um com *Service name* `com.amazonaws.us-east-1.s3`, *Type* **Gateway**.
Abra → aba **Route tables**: precisam estar marcadas **as route tables das subnets privadas**.

Se não existir: **Create endpoint** → *AWS services* → filtre `s3` → escolha o de tipo **Gateway** →
VPC `doaperto-vpc` → marque as **route tables privadas** → *Full access* → Create.

✔ **VPC → Route tables** → route table privada → aba *Routes*: tem uma linha `pl-63a5400a` → `vpce-...`.

## 2. Security Group das Lambdas

1. **EC2 → Security Groups → Create**: nome `lambda`, VPC `doaperto-vpc`.
   - **Inbound:** nenhuma regra.
   - **Outbound:** deixe a regra padrão (*All traffic*). Continua sem internet, porque a subnet privada não tem NAT.
2. Edite o **`doaperto-rds-sg`** → *Inbound* → **Add rule**: *PostgreSQL* (5432) → origem `lambda`.
   A regra que já existe para `doaperto-api-sg` continua lá.

## 3. Bucket de arquivos (RF-02)

1. **S3 → Create bucket** `doaperto-arquivos-doaperto-arquivos-lucas123`, **Block all public access ligado** (padrão).
2. Bucket → *Permissions* → **CORS → Edit** → cole o conteúdo de [`deploy/s3/cors-arquivos.json`](../deploy/s3/cors-arquivos.json).
3. **Systems Manager → Parameter Store → Create parameter**: nome `/doaperto/s3/bucket`, tipo *String*,
   valor `doaperto-arquivos-doaperto-arquivos-lucas123`.
4. Na EC2 (Instance Connect), recrie o container para ele ler o parâmetro novo:
   ```bash
   sudo bash /opt/doaperto/deploy/ec2/iniciar-api.sh --pull
   ```

✔ `sudo docker inspect doaperto-api --format '{{range .Config.Env}}{{println .}}{{end}}' | grep S3_BUCKET`
mostra o nome do bucket. Depois de ~30 s, `sudo docker logs --tail 3 doaperto-api` mostra `Started DoacoesApiApplication`.

## 4. Lambda `doaperto-processar-arquivo` (RF-03)

Os pacotes já estão gerados em `lambdas/build/` (se precisar refazer: `bash lambdas/build.sh`).

1. **Lambda → Create function → Author from scratch**
   - Nome `doaperto-processar-arquivo` · Runtime **Python 3.13** · Arquitetura **x86_64**
   - *Change default execution role* → **Use an existing role** → `LabRole`
   - *Additional configurations* → **Enable VPC** → `doaperto-vpc`, **as 2 subnets privadas**, SG **`lambda`**
   - Create (leva ~1 min criando as ENIs).
2. *Code* → **Upload from → .zip file** → `lambdas/build/processar-arquivo.zip` → Save.
   Confira que *Runtime settings → Handler* está `lambda_function.lambda_handler`.
3. *Configuration → General configuration → Edit*: memória **512 MB**, timeout **1 min**.
4. *Configuration → Environment variables → Edit*:

   | Key | Value |
   |---|---|
   | `DB_HOST` | `<ENDPOINT-RDS>` (só o host, **sem** `jdbc:` e sem porta) |
   | `DB_NAME` | `doaperto` |
   | `DB_USER` | o mesmo de `/doaperto/db/username` |
   | `DB_PASSWORD` | o mesmo de `/doaperto/db/password` |

5. **Add trigger → S3** → bucket `doaperto-arquivos-doaperto-arquivos-lucas123` → *All object create events* →
   **Prefix `uploads/`** → marque o aviso de invocação recursiva → Add.
   Repita com **Prefix `importacoes/`**.

> ⚠️ Nunca crie o gatilho sem prefixo: a Lambda grava as miniaturas em `thumbnails/` e entraria em loop.

✔ No site (ainda apontando para a EC2), abra uma ONG → envie uma **foto** → em alguns segundos aparece a miniatura.
Depois: **importar CSV** com [`docs/exemplos/necessidades-exemplo.csv`](exemplos/necessidades-exemplo.csv) → o resumo mostra as linhas
importadas e 1 erro (proposital).
✔ Lambda → *Monitor* → **View CloudWatch logs** → log group `/aws/lambda/doaperto-processar-arquivo` tem
`Processando s3://doaperto-arquivos-doaperto-arquivos-lucas123/uploads/...` e `Importação N: X de Y linhas`.

## Atalho para os passos 5, 6 e 7

Com a `doaperto-processar-arquivo` já criada, dá para fazer os três passos seguintes de uma vez. No **CloudShell**,
use *Ações → Carregar arquivo* para enviar `lambdas/build/relatorios.zip` e
[`deploy/scripts/publicar-relatorios-api.sh`](../deploy/scripts/publicar-relatorios-api.sh), e rode:

```bash
bash publicar-relatorios-api.sh
```

O script pode ser repetido: em uma nova sessão do Learner Lab, ele atualiza o DNS da EC2 no API Gateway.

## 5. Lambda `doaperto-relatorios` (RF-04)

Igual ao passo 4, com estas diferenças:

- Nome `doaperto-relatorios`, zip `lambdas/build/relatorios.zip`
- Memória **256 MB**, timeout **15 s**
- Mesmas variáveis de ambiente, mesma VPC/subnets/`lambda`
- **Sem gatilho S3**

✔ *Test* → evento novo com este JSON → resposta `statusCode: 200` com os números do resumo:
```json
{ "requestContext": { "http": { "method": "GET" } }, "pathParameters": { "tipo": "resumo" } }
```

## 6. API Gateway (HTTP API)

**API Gateway → Create API → HTTP API → Build**, nome **`doaperto-api`**.

1. *Integrations* → **Add integration**:
   - **HTTP** · método `ANY` · URL `http://<DNS-EC2>:8080/api/{proxy}`
   - **Lambda** · `doaperto-relatorios`
2. *Configure routes*:
   - `ANY` `/api/{proxy+}` → integração HTTP
   - `GET` `/relatorios` → Lambda
   - `GET` `/relatorios/{tipo}` → Lambda
3. Stage `$default`, *Auto-deploy* ligado → Create.
4. Menu **CORS → Configure**: *Access-Control-Allow-Origin* `*` · *Allow-Methods*
   `GET, POST, PUT, PATCH, DELETE, OPTIONS` · *Allow-Headers* `content-type` → Save.
5. Copie a **Invoke URL** (`https://<api-id>.execute-api.us-east-1.amazonaws.com`). Daqui pra frente: `<URL-API>`.

✔ No navegador: `<URL-API>/api/ongs` (lista) e `<URL-API>/relatorios/resumo` (JSON do relatório).

> Nova sessão do Learner Lab → o DNS da EC2 muda. Rode no CloudShell (com o repo clonado):
> `bash deploy/scripts/atualizar-integracao.sh`. Ou associe um **Elastic IP** à EC2 e esqueça isso.

## 7. Front final (RF-05)

Edite o `config.json` no bucket `doaperto-site-10436971` (Upload por cima, *Content-Type* `application/json`):

```json
{
  "apiBaseUrl": "https://<api-id>.execute-api.us-east-1.amazonaws.com",
  "relatoriosBaseUrl": "https://<api-id>.execute-api.us-east-1.amazonaws.com"
}
```

Sem barra e sem `/api` no final. Abra o site e dê **Ctrl+F5**.

✔ F12 → aba *Network*: as chamadas vão para `execute-api` (não mais `:8080`). A tela **Impacto** mostra os gráficos.

## 8. Fechar a entrega

- [ ] `specs/design.md` bate com o que está rodando: nomes dos SGs, bucket, rotas do API Gateway, versões
      (Python 3.13, PostgreSQL 17, t3.small). Ajuste o que divergir.
- [ ] `docs/seguranca.md`: outbound do `lambda` igual ao que ficou no console.
- [ ] `specs/tasks.md`: marque os itens da Aula 4 com o nome de quem fez.
- [ ] Entrada no `specs/ia-log.md` sobre a ajuda da IA na Aula 4.
- [ ] Commit + push.

---

## Se der errado

| Sintoma | Causa provável | Onde mexer |
|---|---|---|
| Lambda: `Task timed out` antes de qualquer log de banco | Não alcança o S3: endpoint ausente ou não associado à route table privada | Passo 1 |
| Lambda: `timeout` / `could not connect` no log | `doaperto-rds-sg` não aceita `lambda`, ou `DB_HOST` errado (com `jdbc:` ou porta) | Passos 2 e 4 |
| Lambda: `password authentication failed` | `DB_USER`/`DB_PASSWORD` diferentes dos do SSM | Passo 4 |
| Upload: erro de CORS no PUT para `s3.amazonaws.com` | CORS do bucket de arquivos não aplicado | Passo 3 |
| Upload: `Upload indisponível: variável S3_BUCKET não configurada` | `/doaperto/s3/bucket` não existe ou o container não foi recriado | Passo 3 |
| Foto sobe mas a miniatura nunca aparece | Gatilho sem o prefixo `uploads/`, ou Lambda com erro — veja o CloudWatch | Passo 4 |
| Lambda: `module 'scramp' has no attribute 'make_channel_binding'` | Zip antigo, sem a versão fixa do `scramp` | Gere o zip de novo e faça o upload |
| Lambda: `Unable to import module` / `No module named PIL` | Zip gerado para Windows ou Python errado | `bash lambdas/build.sh` |
| `<URL-API>/api/...` dá 503/504 | Integração HTTP com o DNS antigo da EC2 | Passo 6 (`atualizar-integracao.sh`) |
| Site: erro de CORS em `execute-api` | CORS do API Gateway não configurado | Passo 6.4 |

## Ordem da apresentação (~5 min)

1. **Arquitetura** — diagrama do `design.md`: S3 site → API Gateway → EC2 (container) / Lambda → RDS privado.
2. **RF-01** — criar uma ONG e uma necessidade no site; registrar uma doação e ver o match por distância.
3. **RF-02** — enviar uma foto; no F12 mostrar o `PUT` indo **direto ao S3** com URL pré-assinada.
4. **RF-03** — a miniatura aparece; abrir o **CloudWatch** com o log da Lambda. Importar o CSV e mostrar a linha com erro.
5. **RF-04** — tela **Impacto**; mostrar uma das consultas `JOIN + GROUP BY` em `lambdas/relatorios`.
6. **Segurança** — RDS `Public access: No`, SGs por referência, Lambda sem internet usando o **S3 Gateway Endpoint**,
   senhas no Parameter Store.
