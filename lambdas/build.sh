#!/usr/bin/env bash
# Empacota as Lambdas em build/<nome>.zip com as dependências compiladas para
# o runtime da AWS (Linux x86_64, Python 3.13) - funciona em Windows/Mac/Linux.
set -euo pipefail
cd "$(dirname "$0")"
PY_VERSION=3.13

for fn in processar-arquivo relatorios; do
  echo ">> $fn"
  rm -rf "build/$fn" "build/$fn.zip"
  mkdir -p "build/$fn"
  python -m pip install -r "$fn/requirements.txt" -t "build/$fn" \
    --platform manylinux2014_x86_64 --platform manylinux_2_28_x86_64 --implementation cp --python-version "$PY_VERSION" \
    --only-binary=:all: --upgrade --quiet
  cp "$fn/lambda_function.py" "build/$fn/"
  (cd "build/$fn" && python -c "import shutil; shutil.make_archive('../$fn', 'zip', '.')")
  echo "   build/$fn.zip"
done
