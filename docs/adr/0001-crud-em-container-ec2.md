# ADR 0001 — O CRUD roda em container (EC2 + Docker), não em Lambda

- **Status:** aceita
- **Data:** 2026-10-20
- **Requisito:** RNF-04

## Contexto

O DoaPerto tem dois tipos de carga bem diferentes:

1. **API CRUD** (ONGs, necessidades, doadores, doações, URLs pré-assinadas, algoritmo de *match*).
   Muitas requisições curtas, consultas relacionadas (JOINs via JPA) e uso contínuo enquanto alguém navega no site.
   Escrita em **Java 25 + Spring Boot 4.1** (exigência do projeto).
2. **Tarefas por evento ou esporádicas**: processar um arquivo que chegou no S3 e gerar relatórios agregados.

O ambiente é o **AWS Academy Learner Lab**: não podemos criar IAM roles (só `LabRole` / `LabInstanceProfile`),
a sessão expira a cada ~4 h e os recursos são parados entre sessões. O banco é um RDS PostgreSQL em subnet privada.

## Opções avaliadas

| Critério | Lambda (Java) | **EC2 + Docker** | ECS Fargate |
|---|---|---|---|
| Cold start do Spring Boot | 5–10 s sem SnapStart; SnapStart ajuda mas exige cuidado com conexões | **Nenhum (processo sempre quente)** | Nenhum |
| Conexões com o RDS | Cada instância abre conexões; o ideal é RDS Proxy (role/secret próprios — limitado no Learner Lab) | **Pool HikariCP reaproveitado** | Pool reaproveitado |
| Esforço de adaptação do código | Handler/adaptador `aws-serverless-java-container`, empacotamento específico | **Zero: o mesmo `Dockerfile` roda local e na nuvem** | Precisa ECR, task definition, service, ALB |
| Funciona no Learner Lab sem roles novas | Sim (LabRole) | **Sim (LabInstanceProfile)** | Sim, mas exige `ecsTaskExecutionRole`/LabRole e mais peças |
| Custo durante a sessão | Por requisição | t3.small ≈ US$ 0,02/h (parada fora da sessão) | ≈ US$ 0,03/h + ALB |
| Escalabilidade automática | Nativa | Manual (evolução: ASG + ALB) | Nativa |

## Decisão

- **CRUD em container Docker numa EC2** (Amazon Linux 2023, `t3.small`), na subnet pública,
  exposto ao front através do **API Gateway (HTTP API)** com integração HTTP para `:8080/api/{proxy}`.
- **Lambda apenas onde ela brilha**:
  - `doaperto-processar-arquivo` — disparada pelo S3 (miniaturas, metadados de PDF, importação de CSV);
  - `doaperto-relatorios` — consultas analíticas raras, expostas em `GET /relatorios/{tipo}`.

## Consequências

**Positivas**
- Latência estável e baixa no CRUD; pool de conexões com o RDS sob controle (máx. 10).
- O mesmo artefato (imagem Docker) roda no notebook (`docker compose`) e na nuvem.
- Separação clara: síncrono/transacional no container; assíncrono/analítico em funções.
- `docker run --restart unless-stopped` + `systemctl enable docker` fazem a API voltar sozinha quando
  o Learner Lab religa a instância (RNF-03).

**Negativas / riscos aceitos**
- Uma única instância = sem alta disponibilidade. Evolução: Auto Scaling Group + ALB, ou migrar a mesma
  imagem para ECS Fargate.
- A integração do API Gateway com a EC2 passa pela internet pública, então a porta 8080 fica aberta.
  Mitigação documentada em [`docs/seguranca.md`](../seguranca.md); evolução: VPC Link + ALB interno.
- O IP público da EC2 muda a cada sessão. Mitigação: Elastic IP **ou** o script
  `deploy/scripts/atualizar-integracao.sh`, que reaponta a integração (nenhum IP fica no código).
