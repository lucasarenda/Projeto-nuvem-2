#!/bin/bash
# Compila o Angular e publica no bucket do site estático, gravando o config.json
# com a URL do API Gateway. Rode na sua máquina (com as credenciais do "AWS Details")
# ou no CloudShell.
#
#   SITE_BUCKET=doaperto-site-123 API_URL=https://abc123.execute-api.us-east-1.amazonaws.com bash publicar-front.sh
set -euo pipefail

: "${SITE_BUCKET:?defina SITE_BUCKET}"
: "${API_URL:?defina API_URL (URL do API Gateway, sem barra no final)}"
RAIZ="$(cd "$(dirname "$0")/../.." && pwd)"

cd "$RAIZ/frontend"
npm ci
npx ng build
DIST="dist/frontend/browser"

printf '{\n  "apiBaseUrl": "%s",\n  "relatoriosBaseUrl": "%s"\n}\n' "$API_URL" "$API_URL" > "$DIST/config.json"

# Arquivos com hash no nome podem ficar em cache por 1 ano; index.html e config.json nunca.
aws s3 sync "$DIST" "s3://$SITE_BUCKET" --delete --exclude index.html --exclude config.json \
  --cache-control "public,max-age=31536000,immutable"
aws s3 cp "$DIST/index.html" "s3://$SITE_BUCKET/index.html" --cache-control "no-cache"
aws s3 cp "$DIST/config.json" "s3://$SITE_BUCKET/config.json" --cache-control "no-cache" --content-type application/json

echo "Publicado: http://$SITE_BUCKET.s3-website-us-east-1.amazonaws.com"
