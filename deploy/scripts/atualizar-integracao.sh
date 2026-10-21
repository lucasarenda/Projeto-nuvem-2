#!/bin/bash
# Reaponta a integração "ANY /api/{proxy+}" do API Gateway para o DNS público ATUAL da EC2.
# Rode no AWS CloudShell no início de cada sessão do Learner Lab (desnecessário se usar Elastic IP).
#
#   bash atualizar-integracao.sh            # usa os nomes padrão abaixo
#   API_NOME=doaperto-api EC2_NOME=doaperto-api bash atualizar-integracao.sh
set -euo pipefail

API_NOME="${API_NOME:-doaperto-api}"
EC2_NOME="${EC2_NOME:-doaperto-api}"
REGIAO="${AWS_REGION:-us-east-1}"

DNS=$(aws ec2 describe-instances --region "$REGIAO" \
  --filters "Name=tag:Name,Values=$EC2_NOME" "Name=instance-state-name,Values=running" \
  --query 'Reservations[0].Instances[0].PublicDnsName' --output text)
[ "$DNS" = "None" ] || [ -z "$DNS" ] && { echo "EC2 '$EC2_NOME' não está rodando."; exit 1; }

API_ID=$(aws apigatewayv2 get-apis --region "$REGIAO" --query "Items[?Name=='$API_NOME'].ApiId | [0]" --output text)
INTEGRACAO_ID=$(aws apigatewayv2 get-integrations --region "$REGIAO" --api-id "$API_ID" \
  --query "Items[?IntegrationType=='HTTP_PROXY'].IntegrationId | [0]" --output text)

aws apigatewayv2 update-integration --region "$REGIAO" --api-id "$API_ID" --integration-id "$INTEGRACAO_ID" \
  --integration-uri "http://$DNS:8080/api/{proxy}" --output text --query IntegrationUri

echo "OK: https://$API_ID.execute-api.$REGIAO.amazonaws.com/api/* -> http://$DNS:8080/api/*"
