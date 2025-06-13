# Script de construction avec tests et rapports de couverture
param (
    [switch]$SkipTests,
    [switch]$Production,
    [switch]$DeployToNetlify,
    [switch]$DeployToVercel
)

$ErrorActionPreference = "Stop"
$startTime = Get-Date

# Couleurs pour une meilleure lisibilité
$colorInfo = "Cyan"
$colorSuccess = "Green"
$colorWarning = "Yellow"
$colorError = "Red"

function Write-Step {
    param (
        [string]$Message
    )
    Write-Host "`n>>> $Message" -ForegroundColor $colorInfo
}

function Show-Duration {
    param (
        [DateTime]$Start,
        [string]$StepName
    )
    $duration = (Get-Date) - $Start
    Write-Host "$StepName terminé en $($duration.TotalSeconds.ToString("0.00")) secondes" -ForegroundColor $colorSuccess
}

# Afficher l'environnement
$envType = if ($Production) { "production" } else { "développement" }
Write-Host "`n===============================================" -ForegroundColor $colorInfo
Write-Host "  Début de la construction pour $envType" -ForegroundColor $colorInfo
Write-Host "===============================================`n" -ForegroundColor $colorInfo

# Installer les dépendances
Write-Step "Installation des dépendances..."
$npmStart = Get-Date
npm ci
if ($LASTEXITCODE -ne 0) {
    Write-Host "Erreur lors de l'installation des dépendances" -ForegroundColor $colorError
    exit 1
}
Show-Duration -Start $npmStart -StepName "Installation des dépendances"

# Lint du code
Write-Step "Vérification du code avec ESLint..."
$lintStart = Get-Date
npm run lint
if ($LASTEXITCODE -ne 0) {
    Write-Host "Des erreurs de lint ont été détectées. Veuillez les corriger avant de continuer." -ForegroundColor $colorWarning
    # Optionnel: exit 1 pour bloquer le build en cas d'erreurs de lint
}
Show-Duration -Start $lintStart -StepName "Vérification du code"

# Exécution des tests
if (-not $SkipTests) {
    Write-Step "Exécution des tests unitaires..."
    $testStart = Get-Date
    npm test
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Des tests ont échoué." -ForegroundColor $colorError
        exit 1
    }
    Show-Duration -Start $testStart -StepName "Tests unitaires"

    Write-Step "Génération du rapport de couverture de tests..."
    $coverageStart = Get-Date
    npm run test:coverage
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Erreur lors de la génération du rapport de couverture" -ForegroundColor $colorError
        exit 1
    }
    $coverageReport = Get-Content -Path "coverage/lcov.info" | Select-String -Pattern "lines.+?(\d+\.\d+)%" | ForEach-Object { $_.Matches.Groups[1].Value }
    Write-Host "Couverture de code: $coverageReport%" -ForegroundColor $colorSuccess
    Show-Duration -Start $coverageStart -StepName "Génération du rapport de couverture"
} else {
    Write-Host "Tests ignorés (utilisez -SkipTests:$false pour les exécuter)" -ForegroundColor $colorWarning
}

# Compilation TypeScript (si utilisé)
Write-Step "Compilation TypeScript..."
$tscStart = Get-Date
tsc -b
if ($LASTEXITCODE -ne 0) {
    Write-Host "Erreur lors de la compilation TypeScript" -ForegroundColor $colorError
    exit 1
}
Show-Duration -Start $tscStart -StepName "Compilation TypeScript"

# Construction Vite
Write-Step "Construction de l'application avec Vite..."
$viteStart = Get-Date
if ($Production) {
    $env:NODE_ENV = "production"
}
vite build
if ($LASTEXITCODE -ne 0) {
    Write-Host "Erreur lors de la construction Vite" -ForegroundColor $colorError
    exit 1
}
Show-Duration -Start $viteStart -StepName "Construction Vite"

# Vérification de la taille des assets
Write-Step "Analyse de la taille des fichiers générés..."
Get-ChildItem -Path "dist/assets" -Recurse -File | 
    Sort-Object -Property Length -Descending | 
    Select-Object -First 10 |
    ForEach-Object {
        $sizeKB = [math]::Round($_.Length/1KB, 2)
        if ($sizeKB -gt 1000) {
            $sizeMB = [math]::Round($sizeKB/1024, 2)
            Write-Host "$($_.Name): $sizeMB MB" -ForegroundColor $(if ($sizeMB -gt 2) { $colorWarning } else { "White" })
        } else {
            Write-Host "$($_.Name): $sizeKB KB" -ForegroundColor "White"
        }
    }

# Déploiement (optionnel)
if ($DeployToNetlify) {
    Write-Step "Déploiement sur Netlify..."
    $netlifyStart = Get-Date
    npx netlify deploy --prod
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Erreur lors du déploiement sur Netlify" -ForegroundColor $colorError
        exit 1
    }
    Show-Duration -Start $netlifyStart -StepName "Déploiement Netlify"
}

if ($DeployToVercel) {
    Write-Step "Déploiement sur Vercel..."
    $vercelStart = Get-Date
    npx vercel --prod
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Erreur lors du déploiement sur Vercel" -ForegroundColor $colorError
        exit 1
    }
    Show-Duration -Start $vercelStart -StepName "Déploiement Vercel"
}

# Afficher le temps total
$totalDuration = (Get-Date) - $startTime
Write-Host "`n===============================================" -ForegroundColor $colorSuccess
Write-Host "  Construction terminée avec succès!" -ForegroundColor $colorSuccess
Write-Host "  Temps total: $($totalDuration.TotalMinutes.ToString("0.00")) minutes" -ForegroundColor $colorSuccess
Write-Host "===============================================`n" -ForegroundColor $colorSuccess
