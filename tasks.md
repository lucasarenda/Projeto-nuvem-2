# tasks.md — DoaPerto

Legenda: `[x]` feito e verificado · `[ ]` pendente.
**Escopo desta entrega: até a Aula 3 (23/10).** RF-02, RF-03, RF-04 e o API Gateway ficam para a Aula 4.

## Aula 1 — 09/10 · em sala

- [x] Grupo formado
- [x] Repositório no GitHub criado, com acesso do professor
- [x] Domínio escolhido: doação de alimentos e roupas (**DoaPerto**)
- [x] `spec.md` inicial: problema, personas, 7 histórias, como cada RF se aplica
- [x] Primeira entrada no `ia-log.md`
- [ ] Link do repositório no Moodle

## Aula 2 — 16/10 · em sala

- [x] `spec.md` revisado com critérios de aceite - Leonardo e Lucas Arenda
- [x] `design.md`: diagrama de arquitetura, modelo ER e rotas da API - Leonardo e Lucas Arenda
- [x] ADR do RNF-04 (`docs/adr/0001-crud-em-container-ec2.md`) - Leonardo e Lucas Arenda
- [ ] Bucket S3 `doaperto-site-<id>` com static website hosting e política pública - Lucas Arenda
- [ ] Landing page/protótipo publicada e acessível. URL: `____________` - Lucas Arenda

**Rede**
- [ ] VPC `doaperto-vpc`: 2 subnets públicas + 2 privadas, sem NAT, com S3 Gateway Endpoint
- [ ] Security Groups criados: `sg-api` (8080 aberto, 22 só do seu IP), `sg-rds` (5432 só de `sg-api`)
- [x] Security Groups documentados (`docs/seguranca.md`)

**Banco**
- [ ] DB subnet group só com as subnets privadas
- [ ] RDS PostgreSQL privado (`Public access = No`), banco inicial `doaperto`
- [x] Scripts SQL versionados (`backend/src/main/resources/db/migration/V1__schema.sql`, `db/seed/V2__dados_exemplo.sql`)
- [ ] Parâmetros no SSM: `/doaperto/db/url`, `/doaperto/db/username`, `/doaperto/db/password`

**CRUD do RF-01 na AWS**
- [ ] Push do código para o GitHub e URL do repositório no `deploy/ec2/user-data.sh`
- [ ] EC2 `doaperto-api` (t3.small, subnet pública, `LabInstanceProfile`, user data) no ar
- [ ] `http://<DNS-EC2>:8080/actuator/health` responde `UP`
- [ ] Schema criado no RDS pelo Flyway (logs: `Successfully applied 2 migrations`)
- [ ] Front publicado no bucket do site com `config.json` apontando para `http://<DNS-EC2>:8080`
- [ ] CRUD testado na AWS: criar, listar, editar e excluir ONG e necessidade; registrar doação

## Aula 3 — 23/10 · entrega por vídeo (até 5 min)

**Entrega**
- [ ] Gravar o vídeo seguindo `docs/roteiro-video-aula3.md`
- [ ] Vídeo + link do repositório no Moodle

## Aula 4 — 30/10 · em sala (fora do escopo desta entrega)

- [ ] Bucket de arquivos privado com CORS e upload por URL pré-assinada (RF-02)
- [ ] Lambda `doaperto-processar-arquivo` com gatilhos `uploads/` e `importacoes/`, log no CloudWatch (RF-03)
- [ ] Lambda `doaperto-relatorios` + API Gateway (`/api/{proxy+}` e `/relatorios/{tipo}`) (RF-04)
- [ ] Front final apontando para o API Gateway (RF-05)
- [ ] `design.md` conferido com o que está rodando

## Já pronto no código 

- [x] API Spring Boot 4.1 / Java 25: CRUD, match, URLs pré-assinadas
- [x] Front Angular 21 com todas as telas
- [x] Lambdas de arquivos e relatórios + scripts de empacotamento (usados só na Aula 4)
- [x] Testes locais: backend (5) e front (3) passando
