[CmdletBinding()]
param(
    [string]$ImageName = "laundr-app",
    [string]$Registry = "lavanderiapro.azurecr.io",
    [string]$Tag = "latest"
)

$ErrorActionPreference = "Stop"

$fullImageName = "${Registry}/${ImageName}:${Tag}"
$localImageName = "${ImageName}:${Tag}"

Write-Host "Construyendo imagen local: $localImageName" -ForegroundColor Cyan
docker build -t $localImageName .
if ($LASTEXITCODE -ne 0) {
    throw "Fallo el comando docker build."
}

Write-Host "Etiquetando imagen: $fullImageName" -ForegroundColor Cyan
docker tag $localImageName $fullImageName
if ($LASTEXITCODE -ne 0) {
    throw "Fallo el comando docker tag."
}

Write-Host "Subiendo imagen a Azure Container Registry: $fullImageName" -ForegroundColor Cyan
docker push $fullImageName
if ($LASTEXITCODE -ne 0) {
    throw "Fallo el comando docker push."
}

Write-Host "Imagen publicada correctamente: $fullImageName" -ForegroundColor Green
