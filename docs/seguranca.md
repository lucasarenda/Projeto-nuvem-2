# Rede, Security Groups e segredos (RNF-01 / RNF-02)

## VPC `doaperto-vpc` (10.0.0.0/16)

Criada pelo assistente **VPC → Create VPC → "VPC and more"**:

| Recurso | Configuração |
|---|---|
| AZs | 2 (`us-east-1a`, `us-east-1b`) |
| Subnets públicas | 2 — EC2 da API |
| Subnets privadas | 2 — RDS e Lambdas |
| NAT Gateway | **Nenhum** (economia; nada na subnet privada precisa de internet) |
| VPC endpoint | **S3 Gateway** (gratuito) associado às route tables privadas — é por ele que a Lambda lê/grava no S3 |

```
                 Internet
                    │
         ┌──────────┴──────────┐
         │  API Gateway (HTTP) │──────────────┐
         └──────────┬──────────┘              │ invoke
                    │ HTTP :8080              ▼
 ┌──────────────── VPC 10.0.0.0/16 ───────────────────────────────┐
 │ Subnet pública                     Subnets privadas             │
 │ ┌─────────────┐   5432   ┌──────────────┐   5432  ┌──────────┐ │
 │ │ EC2 + Docker│─────────▶│ RDS Postgres │◀────────│ Lambdas  │ │
 │ │  sg-api     │          │   sg-rds     │         │sg-lambda │ │
 │ └─────────────┘          └──────────────┘         └────┬─────┘ │
 │                                       S3 Gateway Endpoint│      │
 └──────────────────────────────────────────────────────────┼─────┘
                                                            ▼
                                                     S3 (arquivos)
```

## Security Groups

| SG | Anexado a | Entrada (inbound) | Saída (outbound) | Por quê |
|---|---|---|---|---|
| `sg-api` | EC2 da API | TCP **8080** de `0.0.0.0/0` | Tudo | O API Gateway HTTP API não tem IP fixo, então a integração chega pela internet. Ver "Riscos" abaixo. |
| | | TCP **22** de **Meu IP** (opcional) | | Só para manutenção. Prefira *EC2 Instance Connect* ou *Session Manager* e deixe sem SSH. |
| `sg-lambda` | As duas Lambdas (ENIs na subnet privada) | **Nenhuma** | TCP 5432 → `sg-rds`; TCP 443 → prefix list do S3 (`pl-63a5400a` em us-east-1) | Lambda só inicia conexões. |
| `sg-rds` | RDS PostgreSQL | TCP **5432** de **`sg-api`** e de **`sg-lambda`** (referência a SG, não a IP) | (padrão) | Banco aceita conexões só da API e das Lambdas. |

O RDS foi criado com **Public access = No**, num *DB subnet group* que contém **apenas as subnets privadas**.
Não há rota da internet até ele, nem com a senha certa (RNF-01).

### Riscos aceitos e evolução

- A porta 8080 da EC2 está aberta para a internet porque a integração HTTP do API Gateway não sai de dentro da VPC.
  Mitigações já aplicadas: a API não guarda segredos em respostas, valida toda entrada e o banco não é alcançável.
  Evolução recomendada: **VPC Link + ALB interno** (aí `sg-api` aceita só o SG do ALB) ou CloudFront com header secreto.
- Os PUTs de upload vão direto ao S3 por URL pré-assinada válida por 10 min; o bucket continua **privado**
  (Block Public Access ligado). As imagens são exibidas por URLs GET pré-assinadas de 60 min.

## Segredos (RNF-02)

Nenhuma senha, chave ou endpoint está no Git:

| Segredo / config | Onde fica | Quem lê |
|---|---|---|
| URL JDBC, usuário e senha do RDS | **SSM Parameter Store**: `/doaperto/db/url`, `/doaperto/db/username`, `/doaperto/db/password` (*SecureString*) | `deploy/ec2/iniciar-api.sh` na EC2, via `LabInstanceProfile` |
| Nome do bucket de arquivos | SSM `/doaperto/s3/bucket` | idem |
| Credenciais do banco para as Lambdas | Variáveis de ambiente da função (console), criptografadas em repouso pelo KMS | Lambdas |
| Credenciais AWS | **Não existem no código**: EC2 usa o Instance Profile; Lambda usa a `LabRole` | SDKs (cadeia padrão) |
| URL da API para o front | `config.json` no bucket do site (editado no deploy) | navegador |

> Por que a Lambda não lê do Parameter Store? Ela roda numa subnet privada **sem NAT**; acessar o SSM exigiria
> um *interface endpoint* (≈ US$ 0,01/h por AZ). Fica documentado como melhoria opcional.

O `.gitignore` bloqueia `.env`, `*.pem`, `credentials` e `config.local.json`; o `docker-compose.yml` exige
`DB_PASSWORD` vindo do `.env` local.
