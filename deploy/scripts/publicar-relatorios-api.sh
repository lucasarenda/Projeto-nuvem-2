#!/bin/bash
# Passos finais da Aula 4: Lambda de relatórios, API Gateway e config.json do site.
# Pode rodar de novo a qualquer momento: atualiza o que já existe, inclusive o DNS atual da EC2.
#
# Rode no AWS CloudShell, com relatorios.zip na pasta home (Ações → Carregar arquivo):
#
#   bash publicar-relatorios-api.sh
#   SITE_BUCKET=doaperto-site-123 ZIP=~/relatorios.zip bash publicar-relatorios-api.sh
#
# VPC, Security Group, role e variáveis do banco são copiados da doaperto-processar-arquivo,
# então nenhuma senha fica neste arquivo.
set -euo pipefail

REGIAO="${AWS_REGION:-us-east-1}"
SITE_BUCKET="${SITE_BUCKET:-doaperto-site-10436971}"
ZIP="${ZIP:-$HOME/relatorios.zip}"
EC2_NOME="${EC2_NOME:-doaperto-api}"
API_NOME="${API_NOME:-doaperto-api}"
RDS_NOME="${RDS_NOME:-doaperto-db}"
LAMBDA_BASE="doaperto-processar-arquivo"
LAMBDA="doaperto-relatorios"
CORS='{"AllowOrigins":["*"],"AllowMethods":["GET","POST","PUT","PATCH","DELETE","OPTIONS"],"AllowHeaders":["content-type"]}'
export AWS_DEFAULT_REGION="$REGIAO"

falhar() { echo "ERRO: $1"; exit 1; }

# --------------------------------------------------------------------------- pré-requisitos
echo ">> Conferindo o que já existe"
aws s3api head-bucket --bucket "$SITE_BUCKET" 2>/dev/null \
  || falhar "bucket do site '$SITE_BUCKET' não encontrado. Use SITE_BUCKET=<nome> bash $0"

DNS=$(aws ec2 describe-instances \
  --filters "Name=tag:Name,Values=$EC2_NOME" "Name=instance-state-name,Values=running" \
  --query 'Reservations[0].Instances[0].PublicDnsName' --output text)
{ [ "$DNS" = "None" ] || [ -z "$DNS" ]; } && falhar "EC2 '$EC2_NOME' não está rodando."
echo "   EC2: $DNS"

STATUS_RDS=$(aws rds describe-db-instances --db-instance-identifier "$RDS_NOME" \
  --query 'DBInstances[0].DBInstanceStatus' --output text 2>/dev/null || echo "não encontrado")
echo "   RDS: $STATUS_RDS"
[ "$STATUS_RDS" = "available" ] || echo "   AVISO: com o RDS assim, os testes do final vão falhar."

ROLE=$(aws lambda get-function-configuration --function-name "$LAMBDA_BASE" --query Role --output text 2>/dev/null) \
  || falhar "crie a Lambda $LAMBDA_BASE antes: este script copia a configuração dela."
VPC=$(aws lambda get-function-configuration --function-name "$LAMBDA_BASE" \
  --query 'VpcConfig.{SubnetIds:SubnetIds,SecurityGroupIds:SecurityGroupIds}' --output json)
VARIAVEIS=$(aws lambda get-function-configuration --function-name "$LAMBDA_BASE" \
  --query 'Environment.Variables' --output json)
AMBIENTE="{\"Variables\":$VARIAVEIS}"
CONTA=$(aws sts get-caller-identity --query Account --output text)

# --------------------------------------------------------------------------- Lambda de relatórios
echo ">> Lambda $LAMBDA"
if aws lambda get-function-configuration --function-name "$LAMBDA" --query FunctionName --output text >/dev/null 2>&1; then
  if [ -f "$ZIP" ]; then
    aws lambda update-function-code --function-name "$LAMBDA" --zip-file "fileb://$ZIP" >/dev/null
    aws lambda wait function-updated-v2 --function-name "$LAMBDA"
    echo "   código atualizado"
  else
    echo "   AVISO: $ZIP não encontrado; mantive o código que já está na função."
  fi
  aws lambda update-function-configuration --function-name "$LAMBDA" --memory-size 256 --timeout 15 \
    --vpc-config "$VPC" --environment "$AMBIENTE" >/dev/null
  aws lambda wait function-updated-v2 --function-name "$LAMBDA"
  echo "   configuração atualizada"
else
  [ -f "$ZIP" ] || falhar "$ZIP não encontrado. No CloudShell: Ações → Carregar arquivo → relatorios.zip"
  aws lambda create-function --function-name "$LAMBDA" --runtime python3.13 --architectures x86_64 \
    --role "$ROLE" --handler lambda_function.lambda_handler --zip-file "fileb://$ZIP" \
    --memory-size 256 --timeout 15 --vpc-config "$VPC" --environment "$AMBIENTE" >/dev/null
  echo "   criada; aguardando ficar ativa (1 a 2 min)"
  aws lambda wait function-active-v2 --function-name "$LAMBDA"
fi
LAMBDA_ARN=$(aws lambda get-function-configuration --function-name "$LAMBDA" --query FunctionArn --output text)

# --------------------------------------------------------------------------- API Gateway
echo ">> API Gateway $API_NOME"
API_ID=$(aws apigatewayv2 get-apis --query "Items[?Name=='$API_NOME'].ApiId | [0]" --output text)
if [ "$API_ID" = "None" ]; then
  API_ID=$(aws apigatewayv2 create-api --name "$API_NOME" --protocol-type HTTP \
    --cors-configuration "$CORS" --query ApiId --output text)
  echo "   criada: $API_ID"
else
  aws apigatewayv2 update-api --api-id "$API_ID" --cors-configuration "$CORS" >/dev/null
  echo "   já existia: $API_ID"
fi

URI_EC2="http://$DNS:8080/api/{proxy}"
INT_EC2=$(aws apigatewayv2 get-integrations --api-id "$API_ID" \
  --query "Items[?IntegrationType=='HTTP_PROXY'].IntegrationId | [0]" --output text)
if [ "$INT_EC2" = "None" ]; then
  INT_EC2=$(aws apigatewayv2 create-integration --api-id "$API_ID" --integration-type HTTP_PROXY \
    --integration-method ANY --integration-uri "$URI_EC2" --payload-format-version 1.0 \
    --query IntegrationId --output text)
else
  aws apigatewayv2 update-integration --api-id "$API_ID" --integration-id "$INT_EC2" \
    --integration-uri "$URI_EC2" >/dev/null
fi

INT_LAMBDA=$(aws apigatewayv2 get-integrations --api-id "$API_ID" \
  --query "Items[?IntegrationType=='AWS_PROXY'].IntegrationId | [0]" --output text)
if [ "$INT_LAMBDA" = "None" ]; then
  INT_LAMBDA=$(aws apigatewayv2 create-integration --api-id "$API_ID" --integration-type AWS_PROXY \
    --integration-uri "$LAMBDA_ARN" --payload-format-version 2.0 --query IntegrationId --output text)
else
  aws apigatewayv2 update-integration --api-id "$API_ID" --integration-id "$INT_LAMBDA" \
    --integration-uri "$LAMBDA_ARN" >/dev/null
fi

garantir_rota() {
  local chave="$1" destino="integrations/$2" rota
  rota=$(aws apigatewayv2 get-routes --api-id "$API_ID" \
    --query "Items[?RouteKey=='$chave'].RouteId | [0]" --output text)
  if [ "$rota" = "None" ]; then
    aws apigatewayv2 create-route --api-id "$API_ID" --route-key "$chave" --target "$destino" >/dev/null
  else
    aws apigatewayv2 update-route --api-id "$API_ID" --route-id "$rota" --target "$destino" >/dev/null
  fi
  echo "   rota: $chave"
}
garantir_rota 'ANY /api/{proxy+}' "$INT_EC2"
garantir_rota 'GET /relatorios' "$INT_LAMBDA"
garantir_rota 'GET /relatorios/{tipo}' "$INT_LAMBDA"

ESTAGIO=$(aws apigatewayv2 get-stages --api-id "$API_ID" \
  --query "Items[?StageName=='\$default'].StageName | [0]" --output text)
if [ "$ESTAGIO" = "None" ]; then
  aws apigatewayv2 create-stage --api-id "$API_ID" --stage-name '$default' --auto-deploy >/dev/null
else
  aws apigatewayv2 update-stage --api-id "$API_ID" --stage-name '$default' --auto-deploy >/dev/null
fi

aws lambda remove-permission --function-name "$LAMBDA" --statement-id apigw-relatorios >/dev/null 2>&1 || true
aws lambda add-permission --function-name "$LAMBDA" --statement-id apigw-relatorios \
  --action lambda:InvokeFunction --principal apigateway.amazonaws.com \
  --source-arn "arn:aws:execute-api:$REGIAO:$CONTA:$API_ID/*/*" >/dev/null

URL="https://$API_ID.execute-api.$REGIAO.amazonaws.com"

# --------------------------------------------------------------------------- site
echo ">> config.json do site"
printf '{\n  "apiBaseUrl": "%s",\n  "relatoriosBaseUrl": "%s"\n}\n' "$URL" "$URL" | \
  aws s3 cp - "s3://$SITE_BUCKET/config.json" --content-type application/json --cache-control no-cache >/dev/null
echo "   s3://$SITE_BUCKET/config.json -> $URL"

# --------------------------------------------------------------------------- testes
FALHAS=0
testar() {
  local caminho="$1" codigo=000
  for _ in 1 2 3 4 5 6; do
    codigo=$(curl -s -o /dev/null -w '%{http_code}' -m 20 "$URL$caminho" || true)
    [ "$codigo" = "200" ] && break
    sleep 5
  done
  if [ "$codigo" = "200" ]; then
    echo "   OK     $caminho"
  else
    echo "   FALHOU $caminho (HTTP $codigo)"
    FALHAS=$((FALHAS + 1))
  fi
}
echo ">> Testes"
testar /api/ongs
testar /relatorios/resumo

echo
echo "URL da API: $URL"
echo "Site:       http://$SITE_BUCKET.s3-website-$REGIAO.amazonaws.com (abra e dê Ctrl+F5)"
if [ "$FALHAS" -gt 0 ]; then
  echo "$FALHAS teste(s) falharam. /api/ongs: confira a API na EC2 e o RDS. /relatorios: veja o log da Lambda no CloudWatch."
  exit 1
fi
echo "Tudo certo."
