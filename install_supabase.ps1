# Script PowerShell pour installer Supabase CLI
# Méthode : Téléchargement direct du binaire

Write-Host "🚀 Installation de Supabase CLI..." -ForegroundColor Cyan

# Créer le dossier d'installation
$installPath = "$env:LOCALAPPDATA\supabase"
if (-not (Test-Path $installPath)) {
    New-Item -ItemType Directory -Path $installPath -Force | Out-Null
    Write-Host "✅ Dossier créé: $installPath" -ForegroundColor Green
}

# URL de la dernière version
$latestRelease = "https://github.com/supabase/cli/releases/latest/download/supabase_windows_amd64.zip"
$zipPath = "$env:TEMP\supabase.zip"

Write-Host "📥 Téléchargement de Supabase CLI..." -ForegroundColor Yellow

try {
    # Télécharger le ZIP
    Invoke-WebRequest -Uri $latestRelease -OutFile $zipPath -UseBasicParsing
    Write-Host "✅ Téléchargement terminé" -ForegroundColor Green

    # Extraire le ZIP
    Write-Host "📦 Extraction..." -ForegroundColor Yellow
    Expand-Archive -Path $zipPath -DestinationPath $installPath -Force
    Write-Host "✅ Extraction terminée" -ForegroundColor Green

    # Nettoyer
    Remove-Item $zipPath -Force

    # Ajouter au PATH de l'utilisateur
    $currentPath = [Environment]::GetEnvironmentVariable("Path", "User")
    if ($currentPath -notlike "*$installPath*") {
        [Environment]::SetEnvironmentVariable(
            "Path",
            "$currentPath;$installPath",
            "User"
        )
        Write-Host "✅ Ajouté au PATH" -ForegroundColor Green
    }

    # Vérifier l'installation
    Write-Host "" -ForegroundColor Green
    Write-Host "Installation terminee !" -ForegroundColor Green
    Write-Host "" -ForegroundColor Yellow
    Write-Host "IMPORTANT: Fermez et rouvrez votre terminal pour utiliser 'supabase'" -ForegroundColor Yellow
    Write-Host "" -ForegroundColor Cyan
    Write-Host "Pour verifier l'installation, tapez:" -ForegroundColor Cyan
    Write-Host "  supabase --version" -ForegroundColor White

}
catch {
    Write-Host "Erreur lors de l'installation: $_" -ForegroundColor Red
    exit 1
}
