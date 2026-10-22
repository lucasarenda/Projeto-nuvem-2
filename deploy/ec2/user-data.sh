#!/bin/bash
# User data da EC2 (Amazon Linux 2023). Cole em "Advanced details → User data" ao criar a instância.
# Instala Docker e Git, clona o repositório e sobe a API. Nenhum segredo aqui: o script
# iniciar-api.sh busca tudo no SSM Parameter Store usando o LabInstanceProfile.
set -euxo pipefail

REPO_URL="https://github.com/lucasarenda/Projeto-nuvem-2"   # <-- ajuste
BRANCH="main"

dnf install -y docker git
systemctl enable --now docker
usermod -aG docker ec2-user

if [ ! -d /opt/doaperto ]; then
  git clone --depth 1 --branch "$BRANCH" "$REPO_URL" /opt/doaperto
fi

bash /opt/doaperto/deploy/ec2/iniciar-api.sh
