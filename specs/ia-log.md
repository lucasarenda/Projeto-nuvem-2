# ia-log.md — Uso de IA no projeto

Registro de como a IA foi usada: o que foi pedido, o que foi gerado, o que a equipe revisou e o que mudou.

| Campo | Significado |
|---|---|
| **Ferramenta** | Qual IA foi usada |
| **Pedido** | O prompt ou objetivo |
| **Resultado** | O que a IA produziu |
| **Revisão humana** | O que a equipe conferiu, corrigiu ou rejeitou |

---

## 2026-10-20 — Escolha do domínio, código inicial e especificação

- **Ferramenta:** Claude Code (Claude, da Anthropic)
- **Pedido:** criar o projeto do tema doação de alimentos e roupas com back-end Java Spring Boot, front Angular
  (versões LTS), atendendo os requisitos mínimos RF-01 a RF-05 e RNF-01 a RNF-05.
- **Resultado:**
  - nome e conceito do sistema (**DoaPerto**) e algoritmo de match (distância Haversine ajustada por urgência);
  - API Spring Boot 4.1 / Java 25 (CRUD, URLs pré-assinadas do S3, migrations Flyway, testes);
  - front Angular 21 (telas de doação, ONGs, necessidades, doações, doadores e relatórios);
  - Lambdas Python (processamento de arquivos e relatórios com JOIN/GROUP BY);
  - README com passo a passo no Learner Lab, ADR do RNF-04 e documentação de Security Groups.
- **Verificação feita:** testes do backend (5) e do front (3) passando; fluxo "Quero doar" testado no navegador;
  Lambda de arquivos testada com S3/banco simulados. **Não** testado ainda na AWS nem em PostgreSQL real.
- **Revisão humana:** _(preencher: o que a equipe leu, mudou ou rejeitou)_

## 2026-10-21 — spec.md, design.md e tasks.md

- **Ferramenta:** Claude Code (Claude, da Anthropic)
- **Pedido:** gerar `spec.md` (problema, personas, histórias com critérios de aceite, RFs aplicados ao domínio),
  `design.md` (diagrama de arquitetura, modelo ER, rotas da API) e `tasks.md` com as entregas.
- **Resultado:** os três arquivos, com diagramas em Mermaid gerados a partir do código existente.
- **Revisão humana:** _(preencher)_

## 2026-10-30 — Deploy da Aula 4 (RF-02, RF-03, RF-04)

- **Ferramenta:** Claude Code (Claude, da Anthropic)
- **Pedido:** passo a passo para publicar o upload, a Lambda de arquivos com log no CloudWatch, os relatórios, o API
  Gateway e o front final, e ajuda para diagnosticar os erros durante o deploy.
- **Resultado:**
  - `docs/roteiro-aula4.md`, com os passos no console, testes de cada etapa e tabela de erros;
  - pacotes das Lambdas gerados com `lambdas/build.sh`;
  - correção de dependência: o log do CloudWatch mostrou `module 'scramp' has no attribute 'make_channel_binding'`,
    porque o `pg8000` puxava o `scramp` 1.5.0. Os `requirements.txt` agora fixam `scramp==1.4.18` e
    `python-dateutil==2.9.0.post0`;
  - `deploy/scripts/publicar-relatorios-api.sh`, que cria ou atualiza a Lambda de relatórios, o API Gateway e o
    `config.json` pelo CloudShell (testado só com a AWS CLI simulada);
  - `design.md`, `seguranca.md` e `tasks.md` ajustados para os nomes e regras reais do console;
  - explicações para a apresentação: função das Lambdas, Lambda × backend, route tables, subnets públicas e privadas.
- **Erros da IA corrigidos:**
  - informou o bucket de arquivos como `doaperto-arquivos-lucas123`; o nome real, conferido no console, é
    `doaperto-arquivos-doaperto-arquivos-lucas123`;
  - o roteiro restringia a saída do `sg-lambda`, mas a orientação passou a ser manter o padrão (*All traffic*);
  - o build inicial das Lambdas não fixava o `scramp`, e o erro só apareceu na execução real, no CloudWatch.
- **Verificação feita:** a IA conferiu o conteúdo dos pacotes e a importação do `pg8000` com o `scramp` fixado, e testou
  o script só com a AWS CLI simulada. A IA não acessou a conta AWS: os testes na nuvem são da equipe.
- **Revisão humana:**
  - a equipe executou o deploy no console e conferiu cada etapa na AWS;
  - os prints do console e o log do CloudWatch mostraram o erro do `scramp` e o nome real do bucket;
  - _(preencher: resultado dos testes de foto, PDF, CSV e relatórios, e o que a equipe mudou ou rejeitou)_

---


