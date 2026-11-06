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

## Deploy da Aula 4 (RF-02, RF-03, RF-04)

- **Ferramenta:** Claude Code + GitHub Copilot
- **Pedido:** passo a passo para publicar o upload, a Lambda de arquivos com log no CloudWatch, os relatórios, o API
  Gateway e o front final, e ajuda para diagnosticar os erros durante o deploy.
- **Resultado:**
  - pacotes das Lambdas gerados com `lambdas/build.sh`;
  - correção de dependência: o log do CloudWatch mostrou `module 'scramp' has no attribute 'make_channel_binding'`,
    porque o `pg8000` puxava o `scramp` 1.5.0. Os `requirements.txt` agora fixam `scramp==1.4.18` e
    `python-dateutil==2.9.0.post0`;
  - `deploy/scripts/publicar-relatorios-api.sh`, que cria ou atualiza a Lambda de relatórios, o API Gateway e o
    `config.json` pelo CloudShell;
  - `design.md`, `seguranca.md` e `tasks.md` ajustados para os nomes e regras reais do console;
- **Erros da IA corrigidos:**
  - informou o bucket de arquivos como `doaperto-arquivos-lucas123`; o nome real, conferido no console, é
    `doaperto-arquivos-doaperto-arquivos-lucas123`;
  - o roteiro restringia a saída do `lambda`, mas a orientação passou a ser manter o padrão (*All traffic*);
  - o build inicial das Lambdas não fixava o `scramp`, e o erro só apareceu na execução real, no CloudWatch.
- **Verificação feita:** a IA conferiu o conteúdo dos pacotes e a importação do `pg8000` com o `scramp` fixado.
- **Revisão humana:**
  - a equipe executou o deploy no console e conferiu cada etapa na AWS;
  - os prints do console e o log do CloudWatch mostraram o erro do `scramp` e o nome real do bucket;
  - Novamente revisada toda documentação, também feito alguns ajustes.

## Reflexão final

**Onde a IA ajudou mais**
- Acelerou a parte repetitiva: estrutura do projeto, CRUD, telas, scripts de deploy e documentação.
- Explicou conceitos de nuvem que usamos na prática: route tables, Security Groups, S3 Gateway Endpoint, URL
  pré-assinada, gatilhos de Lambda e o papel do API Gateway.
- Ajudou a diagnosticar erros a partir de evidências reais: logs do CloudWatch, saída do Docker e prints do console.

**Onde a IA errou ou precisou de correção**
- Dependências: o pacote da Lambda funcionou no build, mas falhou na AWS porque uma biblioteca (`scramp`) mudou de
  versão. O erro só apareceu no log do CloudWatch.
- Nomes de recursos: a IA informou um nome de bucket diferente do real, e só o print do console mostrou o certo.
- Ambiente: a IA não tinha acesso à conta AWS, então tudo o que ela sugeriu precisou ser executado e conferido pela
  equipe no console.

**O que aprendemos**
- Testar localmente não garante que funciona na nuvem: rede, permissões e versões só se confirmam no ambiente real.
- Logs e prints são a fonte da verdade. O diagnóstico ficou rápido quando mostramos à IA o que estava na tela.
- Segurança é feita em camadas: subnet privada sem rota para a internet, Security Groups por referência, bucket
  privado com URL assinada e segredos fora do código.
- A IA é útil para gerar e explicar, mas a equipe precisa entender cada parte para revisar, corrigir e apresentar.

**Evidências:** prints da aplicação e dos recursos AWS em [`docs/evidencias/`](../docs/evidencias/README.md).

---


