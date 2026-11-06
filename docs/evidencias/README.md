# Evidências — DoaPerto na AWS

Prints da aplicação publicada e dos recursos AWS, região **us-east-1**. Nenhum print mostra senha, chave de acesso
ou o painel *AWS Details* do Learner Lab.

## Aplicação

Site em `http://doaperto-site-10436971.s3-website-us-east-1.amazonaws.com`, consumindo a API pelo API Gateway.

| Print | O que mostra | Requisito |
|---|---|---|
| ![](app-home.png) | Página inicial com os números de impacto vindos da Lambda de relatórios (11 ONGs, 45 necessidades abertas, 462 itens entregues, 9 cidades) | RF-04, RF-05 |
| ![](app-ongs-lista.png) | Lista de ONGs, com busca e filtro por UF | RF-01 |
| ![](app-ong-cadastro.png) | Formulário de cadastro de ONG | RF-01 |
| ![](app-ong-detalhe.png) | Detalhe de uma ONG com logo, necessidades, doações e as abas *Importar CSV* e *Fotos e documentos* | RF-01, RF-02 |
| ![](app-necessidades.png) | Mural de necessidades, incluindo itens criados *via CSV* pela Lambda | RF-01, RF-03 |
| ![](app-necessidade-cadastro.png) | Formulário de nova necessidade | RF-01 |
| ![](app-doacoes.png) | Doações por status: pendentes, confirmadas e entregues | RF-01 |
| ![](app-doadores.png) | Lista de doadores | RF-01 |
| ![](app-doador-cadastro.png) | Formulário de novo doador | RF-01 |
| ![](app-quero-doar.png) | Fluxo *Quero doar*, que sugere a ONG mais próxima | Match |
| ![](app-impacto.png) | Tela *Impacto*: resumo, doações por mês e atendimento por categoria | RF-04 |
| ![](app-impacto-rankings.png) | Tela *Impacto*: ONGs que mais receberam e quem mais doou | RF-04 |

## Recursos AWS

| Print | O que mostra | Requisito |
|---|---|---|
| ![](aws-s3-buckets.png) | Os dois buckets: `doaperto-site-10436971` (site) e `doaperto-arquivos-doaperto-arquivos-lucas123` (arquivos) | RF-02, RF-05 |
| ![](aws-vpc-route-tables.png) | Route tables da VPC: `doaperto-rtb-public` com as 2 subnets públicas e uma privada por zona (`private1-us-east-1a`, `private2-us-east-1b`) | RNF-01 |
| ![](aws-vpc-rotas-publica.png) | Rotas da `doaperto-rtb-public`: `0.0.0.0/0` → Internet Gateway e `10.0.0.0/16` → `local` | RNF-01 |
| ![](aws-vpc-endpoint-s3.png) | S3 Gateway Endpoint `doaperto-vpce-s3` associado às duas route tables privadas | RNF-01, RF-03 |
| ![](aws-security-groups.png) | Security Groups da VPC: `doaperto-api-sg` (EC2), `doaperto-rds-sg` (RDS) e `lambda` (Lambdas) | RNF-01 |
| ![](aws-sg-rds-regras.png) | Regras de entrada do `doaperto-rds-sg`: PostgreSQL 5432 só de `lambda` e de `doaperto-api-sg` | RNF-01 |
| ![](aws-rds.png) | RDS `doaperto-db`: PostgreSQL, `db.t3.micro`, `us-east-1a`, disponível | RNF-01 |
| ![](aws-rds-conectividade.png) | Conectividade do `doaperto-db`: *Gateway de acesso à internet: Desabilitado* | RNF-01 |
| ![](aws-ssm-parametros.png) | Parameter Store: `/doaperto/db/url`, `/doaperto/db/username`, `/doaperto/db/password` (SecureString) e `/doaperto/s3/bucket`, sem mostrar valores | RNF-02 |
| ![](aws-ec2-docker.png) | `sudo docker ps` na EC2: container `doaperto-api` rodando (*healthy*) na porta 8080 | RNF-04 |
| ![](aws-lambda-funcoes.png) | As duas Lambdas do projeto, `doaperto-processar-arquivo` e `doaperto-relatorios`, em Python 3.13 (as demais são do Learner Lab) | RF-03, RF-04 |
| ![](aws-lambda-processar-gatilho-s3.png) | `doaperto-processar-arquivo` com os 2 gatilhos do S3 | RF-03 |
| ![](aws-lambda-gatilhos-prefixos.png) | Detalhes dos gatilhos: prefixos `uploads/` e `importacoes/`, eventos `s3:ObjectCreated:*` | RF-03 |
| ![](aws-cloudwatch-processar.png) | Grupo de logs `/aws/lambda/doaperto-processar-arquivo` com as execuções registradas | RF-03 |
| ![](aws-s3-thumbnails.png) | Bucket de arquivos com as pastas `importacoes/`, `uploads/` e `thumbnails/`, criada pela Lambda | RF-03 |
| ![](aws-lambda-relatorios-api-gateway.png) | `doaperto-relatorios` acionada pelo API Gateway | RF-04 |
| ![](aws-lambda-relatorios-teste.png) | Teste da `doaperto-relatorios`: `statusCode: 200` com os dados do resumo | RF-04 |
| ![](aws-api-gateway-rotas.png) | Rotas da HTTP API `doaperto-api`: `ANY /api/{proxy+}` → EC2 (HTTP) e `GET /relatorios`, `GET /relatorios/{tipo}` → Lambda | RF-04, RF-05 |
| ![](aws-api-gateway-rota-proxy.png) | Detalhe da rota `ANY /api/{proxy+}` e a integração ligada a ela | RF-05 |

## Ainda falta capturar

- [ ] `app-upload-miniatura.png` — aba *Fotos e documentos* com a miniatura e as dimensões em px (RF-02, RF-03)
- [ ] `app-importacao-csv.png` — resultado da importação: linhas importadas e linhas com erro (RF-03)
- [ ] `app-network-execute-api.png` — F12 → *Network* com as chamadas indo para `execute-api` e o `PUT` direto ao S3
- [ ] `aws-cloudwatch-processar-log.png` — conteúdo de um stream do log, com `Processando s3://...` e `Importação N: X de Y linhas`
