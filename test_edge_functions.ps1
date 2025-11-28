# Script de test des Edge Functions

Write-Host "Test des Edge Functions Supabase" -ForegroundColor Cyan
Write-Host ""

$anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1pbHpjZHRmYmx3aGJsc3R3dXpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI1NjA4NTQsImV4cCI6MjA0ODEzNjg1NH0.lBGPTqKj0-rvQMxMdAXMfvXqXXjZQGXqGXqXXqXXqXq"
$url = "https://milzcdtfblwhblstwuzh.supabase.co/functions/v1/send-otp"

Write-Host "Test de send-otp..." -ForegroundColor Yellow
Write-Host "URL: $url" -ForegroundColor Gray
Write-Host ""

$body = @{
    email = "test@example.com"
    type = "recovery"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri $url -Method Post -Body $body -ContentType "application/json" -Headers @{
        "Authorization" = "Bearer $anonKey"
        "apikey" = $anonKey
    }
    
    Write-Host "Reponse:" -ForegroundColor Green
    $response | ConvertTo-Json
    Write-Host ""
    Write-Host "Test reussi!" -ForegroundColor Green
}
catch {
    Write-Host "Erreur:" -ForegroundColor Red
    Write-Host $_.Exception.Message
    Write-Host ""
    Write-Host "Cela peut etre normal si l'utilisateur n'existe pas" -ForegroundColor Yellow
}
