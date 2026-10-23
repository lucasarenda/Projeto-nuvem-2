# ia-log.md — Uso de IA no projeto

Registro de como a IA foi usada: o que foi pedido, o que foi gerado, o que a equipe revisou e o que mudou.

| Campo | Significado |
|---|---|
| **Ferramenta** | Qual IA foi usada |
| **Pedido** | O prompt ou objetivo |
| **Resultado** | O que a IA produziu |
| **Revisão humana** | O que a equipe conferiu, corrigiu ou rejeitou |

---

## Escolha do domínio, código inicial e especificação

- **Ferramenta:** Claude Code + GitHub Copilot
- **Pedido:** criar o projeto do tema doação de alimentos e roupas com back-end Java Spring Boot, front Angular
  (versões LTS), atendendo os requisitos mínimos RF-01 a RF-05 e RNF-01 a RNF-05.
- **Resultado:**
  - nome e conceito do sistema (**DoaPerto**) e algoritmo de match (distância Haversine ajustada por urgência);
  - API Spring Boot 4.1 / Java 25 (CRUD, URLs pré-assinadas do S3, testes);
  - front Angular 21 (telas de doação, ONGs, necessidades, doações, doadores e relatórios);
  - Lambdas Python (processamento de arquivos e relatórios com JOIN/GROUP BY);
  - README com passo a passo no Learner Lab, ADR do RNF-04 e documentação de Security Groups.
- **Verificação feita:** testes do backend e do front passando; fluxo "Quero doar" testado no navegador;
  Lambda de arquivos testada com S3/banco simulados.
- **Revisão humana:** Foi revisado todo o código, feita a revisão dos requisitos funcionais e não funcionais. Percebemos que não havia sido implementada as migrations do banco de dados, sendo necessário ser ajustado. Também foi pensado alguns ajustes para o design da aplicação.

## spec.md, design.md e tasks.md

- **Ferramenta:** Claude Code + GitHub Copilot
- **Pedido:** gerar `spec.md` (problema, personas, histórias com critérios de aceite, RFs aplicados ao domínio),
  `design.md` (diagrama de arquitetura, modelo ER, rotas da API) e `tasks.md` com as entregas.
- **Resultado:** os três arquivos, com diagramas gerados a partir do código existente.
- **Revisão humana:** Foi revisada toda a documentação, sendo necessário realizar algumas alterações, assim como ajustes no tema proposto, nas personas, nas histórias de usuário e adicionar os responsáveis pela tarefa.

---


