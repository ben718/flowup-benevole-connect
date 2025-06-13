# Script pour exécuter les tests en changeant temporairement le type de module dans package.json

$packageJsonPath = Join-Path $PSScriptRoot "package.json"
$packageJson = Get-Content $packageJsonPath -Raw | ConvertFrom-Json

# Sauvegarder le type de module original
$originalType = $packageJson.type
Write-Host "Type de module original: $originalType"

try {
    # Supprimer le type de module pour les tests
    $packageJson.PSObject.Properties.Remove("type")
    $packageJson | ConvertTo-Json -Depth 10 | Set-Content $packageJsonPath

    Write-Host "Type de module temporairement supprimé pour les tests"
    
    # Exécuter les tests
    npm test
} finally {
    # Restaurer le type de module original
    $packageJson = Get-Content $packageJsonPath -Raw | ConvertFrom-Json
    $packageJson | Add-Member -Type NoteProperty -Name "type" -Value $originalType -Force
    $packageJson | ConvertTo-Json -Depth 10 | Set-Content $packageJsonPath
    
    Write-Host "Type de module restauré: $originalType"
}
