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

---


