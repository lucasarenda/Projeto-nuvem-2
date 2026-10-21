#!/bin/bash
# (Re)constrói a imagem e (re)cria o container da API na EC2.
# Uso:  sudo bash /opt/doaperto/deploy/ec2/iniciar-api.sh   [--pull]
#
# Lê a configuração do SSM Parameter Store (bônus) com as credenciais temporárias
# do LabInstanceProfile — nada sensível fica no disco nem no Git.
set -euo pipefail

REGIAO="${AWS_REGION:-us-east-1}"
RAIZ="$(cd "$(dirname "$0")/../.." && pwd)"

if [ "${1:-}" = "--pull" ]; then
  git -C "$RAIZ" pull --ff-only
fi

param() {
  aws ssm get-parameter --region "$REGIAO" --name "$1" --with-decryption --query Parameter.Value --output text
}

DB_URL="$(param /doaperto/db/url)"
DB_USERNAME="$(param /doaperto/db/username)"
DB_PASSWORD="$(param /doaperto/db/password)"
# Opcional até a Aula 4 (uploads): sem o parâmetro, a API sobe e só os uploads ficam indisponíveis.
S3_BUCKET="$(param /doaperto/s3/bucket 2>/dev/null || true)"

docker build -t doaperto-api "$RAIZ/backend"
docker rm -f doaperto-api 2>/dev/null || true

# --restart unless-stopped: quando o Learner Lab religar a EC2, o Docker sobe a API sozinho (RNF-03).
docker run -d --name doaperto-api --restart unless-stopped -p 8080:8080 \
  -e DB_URL="$DB_URL" \
  -e DB_USERNAME="$DB_USERNAME" \
  -e DB_PASSWORD="$DB_PASSWORD" \
  -e S3_BUCKET="$S3_BUCKET" \
  -e AWS_REGION="$REGIAO" \
  --log-driver json-file --log-opt max-size=10m --log-opt max-file=3 \
  doaperto-api

echo "API subindo... acompanhe com: docker logs -f doaperto-api"
