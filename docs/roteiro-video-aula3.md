# Roteiro do vídeo — Aula 3 (máx. 5 min)

Objetivo: provar que **VPC, RDS privado e o CRUD do RF-01** estão rodando de verdade na AWS.
Deixe todas as abas abertas antes de gravar e grave a tela com o áudio narrando.

| Tempo | O que mostrar | Onde |
|---|---|---|
| 0:00–0:20 | Grupo, tema (DoaPerto) e o que será demonstrado | Slide ou README no GitHub |
| 0:20–1:00 | **VPC** `doaperto-vpc`: 2 subnets públicas e 2 privadas; route table pública com Internet Gateway e privada **sem** rota para a internet | Console → VPC → *Your VPCs* → *Resource map* |
| 1:00–1:40 | **RDS** `doaperto-db`: *Publicly accessible = No*, subnet group com subnets privadas, SG `sg-rds` | Console → RDS → *Connectivity & security* |
| 1:40–2:10 | **Security Groups**: `sg-rds` aceita 5432 só de `sg-api`; `sg-api` expõe 8080. Mostre o `docs/seguranca.md` no GitHub | Console → EC2 → Security Groups |
| 2:10–2:40 | **Schema versionado**: `V1__schema.sql` no GitHub e o log da API com `Successfully applied 2 migrations` | GitHub + `docker logs doaperto-api` (EC2 Instance Connect) |
| 2:40–4:20 | **CRUD funcionando na AWS** pelo site no S3: criar uma ONG → editar → publicar uma necessidade → fazer uma doação no "Quero doar" → marcar como entregue (progresso sobe) → excluir. Mostre a URL `s3-website` e o `http://<DNS-EC2>:8080` no `config.json` | Navegador |
| 4:20–4:45 | Prova de que o dado está no RDS: `GET http://<DNS-EC2>:8080/api/ongs` mostrando a ONG criada | Navegador |
| 4:45–5:00 | `tasks.md` atualizado e próximos passos (Aula 4: upload, Lambda, relatórios) | GitHub |

## Dicas

- Não mostre senhas: o Parameter Store pode aparecer, mas sem clicar em *Show decrypted value*.
- Grave depois de conferir que o `/actuator/health` está `UP`; a API leva uns 2 min para subir após ligar a EC2.
- Se estourar o tempo, encurte a parte de VPC; o CRUD na AWS é o item principal.
