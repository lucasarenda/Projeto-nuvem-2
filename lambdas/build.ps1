# Empacota as Lambdas em build\<nome>.zip (equivalente ao build.sh, para PowerShell).
$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot
$PyVersion = "3.13"

foreach ($fn in @("processar-arquivo", "relatorios")) {
    Write-Host ">> $fn"
    Remove-Item -Recurse -Force "build\$fn", "build\$fn.zip" -ErrorAction SilentlyContinue
    New-Item -ItemType Directory -Force "build\$fn" | Out-Null
    python -m pip install -r "$fn\requirements.txt" -t "build\$fn" `
        --platform manylinux2014_x86_64 --platform manylinux_2_28_x86_64 --implementation cp --python-version $PyVersion `
        --only-binary=:all: --upgrade --quiet
    Copy-Item "$fn\lambda_function.py" "build\$fn\"
    python -c "import shutil; shutil.make_archive('build/$fn', 'zip', 'build/$fn')"
    Write-Host "   build\$fn.zip"
}
