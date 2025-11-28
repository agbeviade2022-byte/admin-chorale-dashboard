# Script de déploiement des Edge Functions sans login

Write-Host "Deploiement des Edge Functions Supabase..." -ForegroundColor Cyan

# Variables
$projectRef = "milzcdtfblwhblstwuzh"
$supabaseUrl = "https://milzcdtfblwhblstwuzh.supabase.co"

Write-Host ""
Write-Host "IMPORTANT: Vous aurez besoin de votre Access Token Supabase" -ForegroundColor Yellow
Write-Host ""
Write-Host "Pour obtenir votre token:" -ForegroundColor White
Write-Host "1. Allez sur: https://supabase.com/dashboard/account/tokens" -ForegroundColor White
Write-Host "2. Cliquez sur 'Generate new token'" -ForegroundColor White
Write-Host "3. Copiez le token (commence par sbp_...)" -ForegroundColor White
Write-Host ""

$token = Read-Host "Collez votre Access Token ici"

if ($token -eq "") {
    Write-Host "Erreur: Token requis" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Connexion a Supabase..." -ForegroundColor Yellow
npx supabase@latest login --token $token

if ($LASTEXITCODE -ne 0) {
    Write-Host "Erreur de connexion" -ForegroundColor Red
    exit 1
}

Write-Host "Connexion reussie!" -ForegroundColor Green
Write-Host ""

Write-Host "Liaison du projet..." -ForegroundColor Yellow
npx supabase@latest link --project-ref $projectRef

if ($LASTEXITCODE -ne 0) {
    Write-Host "Erreur de liaison" -ForegroundColor Red
    exit 1
}

Write-Host "Projet lie!" -ForegroundColor Green
Write-Host ""

Write-Host "Deploiement de send-otp..." -ForegroundColor Yellow
npx supabase@latest functions deploy send-otp --project-ref $projectRef

if ($LASTEXITCODE -ne 0) {
    Write-Host "Erreur deploiement send-otp" -ForegroundColor Red
    exit 1
}

Write-Host "send-otp deploye!" -ForegroundColor Green
Write-Host ""

Write-Host "Deploiement de verify-otp..." -ForegroundColor Yellow
npx supabase@latest functions deploy verify-otp --project-ref $projectRef

if ($LASTEXITCODE -ne 0) {
    Write-Host "Erreur deploiement verify-otp" -ForegroundColor Red
    exit 1
}

Write-Host "verify-otp deploye!" -ForegroundColor Green
Write-Host ""
Write-Host "Deploiement termine avec succes!" -ForegroundColor Green
Write-Host ""
Write-Host "Testez maintenant votre app Flutter!" -ForegroundColor Cyan
