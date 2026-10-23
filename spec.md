# spec.md — DoaPerto

> Sistema de doação de alimentos e roupas · Projeto Nuvem 1 (tema 9)

## 1. Problema

Muita gente quer doar alimentos, roupas e itens de higiene, mas não sabe **qual instituição perto de casa precisa
exatamente daquilo agora**. O resultado é desperdício: ONGs recebem o que não precisam (roupa de verão no inverno,
excesso de um item) e ficam sem o que é urgente. Do outro lado, as ONGs divulgam necessidades em redes sociais
e planilhas soltas, sem saber quanto já foi prometido ou entregue.

**Objetivo:** ligar doadores a ONGs. A ONG publica necessidades; o doador informa o que tem; o sistema
**sugere a instituição mais próxima que precisa daquilo**, priorizando urgências.

## 2. Personas

| Persona | Quem é | O que quer | Dor atual |
|---|---|---|---|
| **Ana, doadora** | 34 anos, analista, mora em São Paulo. Doa algumas vezes por ano. | Doar rápido, para quem realmente precisa, perto de casa. | Não sabe onde levar; já doou e a ONG não precisava. |
| **Marcos, coordenador de ONG** | 48 anos, coordena um abrigo com 3 voluntários. | Divulgar o que falta e saber o que está a caminho. | Necessidades espalhadas em WhatsApp e planilhas; não sabe o que foi prometido. |
| **Júlia, voluntária de banco de alimentos** | 26 anos, cuida da logística e das planilhas. | Cadastrar dezenas de itens de uma vez. | Digitar item por item é lento. |
| **Prof. Renata, gestora/avaliadora** | Acompanha o impacto da rede. | Ver números: o que foi entregue, onde, por categoria. | Não há visão consolidada. |

## 3. Histórias de usuário e critérios de aceite

### H1 — Encontrar a ONG certa para doar *(Ana)*
> Como **doadora**, quero informar o que tenho e onde estou para **receber a sugestão da ONG mais próxima que precisa daquilo**.

- [ ] Escolho uma categoria (alimento, roupa, calçado, higiene, cobertor, brinquedo, outro), descrevo os itens e a quantidade.
- [ ] Informo minha localização pelo navegador **ou** escolho uma cidade.
- [ ] Vejo até 6 sugestões ordenadas; a primeira tem o selo **"Melhor match"**.
- [ ] Cada sugestão mostra ONG, cidade, **distância em km**, urgência e quanto ainda falta.
- [ ] Necessidades **urgentes** ou longe da meta sobem no ranking mesmo um pouco mais distantes.
- [ ] Se nenhuma ONG precisar da categoria, vejo uma mensagem clara e posso trocar a categoria.

### H2 — Registrar a doação *(Ana)*
> Como **doadora**, quero confirmar a doação informando só meu e-mail e nome, **sem criar conta**.

- [ ] Se o e-mail já existe, o sistema me reconhece ("Que bom te ver de novo").
- [ ] Ao confirmar, a doação fica com status **PENDENTE** e vejo o endereço da ONG.
- [ ] Posso anexar uma foto dos itens (opcional).
- [ ] Não consigo doar para uma necessidade que não está mais **ABERTA** (erro 422 com mensagem).

### H3 — Publicar necessidades *(Marcos)*
> Como **coordenador de ONG**, quero cadastrar minha instituição e publicar o que ela precisa.

- [ ] Cadastro a ONG com nome, e-mail, cidade/UF e coordenadas (preenchidas ao escolher a cidade ou pelo GPS).
- [ ] Campos obrigatórios inválidos mostram a mensagem no próprio campo (HTTP 400 com `campos`).
- [ ] Publico necessidades com item, categoria, quantidade, unidade e urgência; posso editar e excluir.
- [ ] Vejo o progresso de cada necessidade (recebido / pedido).
- [ ] Posso enviar o logo da ONG (imagem até 10 MB).

### H4 — Importar necessidades por planilha *(Júlia)*
> Como **voluntária**, quero **enviar um CSV** com várias necessidades de uma vez.

- [ ] Posso baixar um modelo de CSV na tela da ONG.
- [ ] Aceita separador `,` ou `;` e arquivos do Excel (UTF-8 ou Windows-1252).
- [ ] Linhas válidas viram necessidades com origem **CSV**; linhas inválidas são listadas com o motivo (ex.: "Linha 6: categoria 'esporte' desconhecida").
- [ ] O histórico mostra arquivo, data, importadas e com erro; atualiza sozinho enquanto processa.

### H5 — Acompanhar as entregas *(Marcos)*
> Como **coordenador**, quero acompanhar as doações e **marcar como entregue** quando os itens chegarem.

- [ ] Vejo as doações em colunas: Pendentes → Confirmadas → Entregues.
- [ ] Ao marcar **ENTREGUE**, a quantidade recebida da necessidade aumenta; ao atingir a meta, ela passa a **ATENDIDA**.
- [ ] Doação entregue ou cancelada não volta para pendente (HTTP 422).
- [ ] Excluir uma doação entregue estorna a quantidade recebida.

### H6 — Ver o impacto da rede *(Renata)*
> Como **gestora**, quero um **painel de relatórios** com o impacto das doações.

- [ ] Vejo itens entregues, doações concluídas, nº de ONGs/cidades e distância média.
- [ ] Vejo doações por mês (12 meses) por categoria, com opção de **tabela**.
- [ ] Vejo atendimento por categoria (%), ranking de ONGs e top doadores (nome abreviado).
- [ ] Posso filtrar por UF.

### H7 — Gerenciar doadores *(Marcos)*
> Como **coordenador**, quero consultar e corrigir os dados de doadores.

- [ ] Listo, busco por nome/e-mail, edito e excluo doadores.
- [ ] E-mail é único (HTTP 409/422 em duplicidade).

## 4. Como cada requisito se aplica ao domínio

| ID | No DoaPerto |
|---|---|
| **RF-01** | CRUD de **ONG 1:N Necessidade** e **Doador 1:N Doação N:1 Necessidade** no RDS PostgreSQL (histórias H2, H3, H5, H7). |
| **RF-02** | Logo da ONG, fotos de necessidades/doações e o **CSV** de importação são enviados ao **S3 por URL pré-assinada** gerada pela API (H2, H3, H4). |
| **RF-03** | O upload dispara a Lambda **processar-arquivo**: gera **miniatura** e grava largura/altura; conta páginas de PDF; **importa o CSV** gravando as necessidades no RDS (H3, H4). |
| **RF-04** | Lambda **relatorios** em `GET /relatorios/{tipo}` no API Gateway, com **JOIN + GROUP BY** (H6). |
| **RF-05** | Front Angular publicado em **S3 static website**, consumindo a API pelo API Gateway. |
| **RNF-01** | RDS em subnet privada, sem acesso público; Security Groups por referência. |
| **RNF-02** | Senhas no Parameter Store / variáveis da Lambda; nada no Git. |
| **RNF-03** | Sem IP no código: `config.json` no front, integração do API Gateway reapontada por script. |
| **RNF-04** | ADR: CRUD em container (EC2 + Docker), Lambda para eventos e relatórios. |
| **RNF-05** | Recursos criados pelo console/CLI e documentados no README. |

