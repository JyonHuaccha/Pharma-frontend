param([switch]$Produccion, [string]$ApiUrl = 'http://localhost:8080')
$ErrorActionPreference = 'Stop'
Push-Location (Split-Path $PSScriptRoot -Parent)
$saved = @{}
$keys = 'E2E_ADMIN_PASSWORD','E2E_VENDEDOR_PASSWORD','E2E_ALMACEN_PASSWORD','E2E_CHROME_PATH','E2E_API_URL','E2E_PRODUCCION','E2E_BASE_URL','E2E_PORT'
foreach ($key in $keys) { $saved[$key] = [Environment]::GetEnvironmentVariable($key,'Process') }
try {
    foreach ($rol in 'ADMIN','VENDEDOR','ALMACEN') {
        $key = 'E2E_'+$rol+'_PASSWORD'
        if (-not [Environment]::GetEnvironmentVariable($key,'Process')) {
            $secret = Read-Host "Contraseña local de $($rol.ToLower())" -AsSecureString
            $credential = New-Object System.Net.NetworkCredential('', $secret)
            [Environment]::SetEnvironmentVariable($key,$credential.Password,'Process')
        }
    }
    $chrome = 'C:\Program Files\Google\Chrome\Application\chrome.exe'
    if (Test-Path -LiteralPath $chrome) { $env:E2E_CHROME_PATH = $chrome }
    $env:E2E_API_URL = $ApiUrl
    if ($Produccion) {
        $env:E2E_PRODUCCION = '1'
        $env:E2E_PORT = '4210'
        $env:E2E_BASE_URL = 'http://127.0.0.1:4210'
        & npm.cmd run build
        if ($LASTEXITCODE -ne 0) { throw 'Falló el build' }
        Write-Host 'El backend debe permitir el origen http://127.0.0.1:4210 en APP_CORS_ALLOWED_ORIGINS.'
    }
    & npx.cmd playwright test --repeat-each=3
    $resultado = $LASTEXITCODE
    & node scripts/registrar-resultados.mjs
    if ($resultado -ne 0) { throw 'Hubo fallos. Revisar test-results y trace.zip antes de otra ejecución.' }
} finally {
    foreach ($key in $keys) { [Environment]::SetEnvironmentVariable($key,$saved[$key],'Process') }
    Pop-Location
}
