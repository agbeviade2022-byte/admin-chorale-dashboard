# Installation simple de Supabase CLI

$installPath = "$env:LOCALAPPDATA\supabase"
$zipPath = "$env:TEMP\supabase.zip"
$url = "https://github.com/supabase/cli/releases/latest/download/supabase_windows_amd64.zip"

Write-Host "Telechargement de Supabase CLI..."
New-Item -ItemType Directory -Path $installPath -Force | Out-Null
Invoke-WebRequest -Uri $url -OutFile $zipPath -UseBasicParsing

Write-Host "Extraction..."
Expand-Archive -Path $zipPath -DestinationPath $installPath -Force
Remove-Item $zipPath -Force

Write-Host "Ajout au PATH..."
$currentPath = [Environment]::GetEnvironmentVariable("Path", "User")
if ($currentPath -notlike "*$installPath*") {
    [Environment]::SetEnvironmentVariable("Path", "$currentPath;$installPath", "User")
}

Write-Host ""
Write-Host "Installation terminee !" -ForegroundColor Green
Write-Host "Fermez et rouvrez votre terminal, puis tapez: supabase --version" -ForegroundColor Yellow
