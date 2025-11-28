# Test manuel de l'Edge Function send-otp

$url = "https://milzcdtfblwhblstwuzh.supabase.co/functions/v1/send-otp"
$anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1pbHpjZHRmYmx3aGJsc3R3dXpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxMTIwNjQsImV4cCI6MjA3ODY4ODA2NH0.HRYmU5hWySL51sD45d16bIRusknirhrdlYNoccxIEKc"

$body = @{
    email = "infinitylivraison@gmail.com"
    type = "recovery"
} | ConvertTo-Json

Write-Host "Test de send-otp..." -ForegroundColor Cyan
Write-Host "URL: $url" -ForegroundColor Gray
Write-Host "Body: $body" -ForegroundColor Gray
Write-Host ""

try {
    $response = Invoke-WebRequest -Uri $url -Method Post -Body $body -ContentType "application/json" -Headers @{
        "Authorization" = "Bearer $anonKey"
        "apikey" = $anonKey
    }
    
    Write-Host "Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "Reponse:" -ForegroundColor Green
    $response.Content | ConvertFrom-Json | ConvertTo-Json -Depth 10
}
catch {
    Write-Host "Erreur HTTP: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
    Write-Host "Message:" -ForegroundColor Red
    $_.Exception.Message
    
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Body de l'erreur:" -ForegroundColor Yellow
        Write-Host $responseBody
    }
}
