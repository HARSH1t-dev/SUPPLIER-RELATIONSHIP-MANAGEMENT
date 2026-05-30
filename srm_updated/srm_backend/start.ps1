# PHP executable (your install)
$PHP = "C:\Users\KIIT0001\OneDrive\Desktop\php\php\php.exe"

if (-not (Test-Path $PHP)) {
    Write-Error "PHP not found at: $PHP"
    exit 1
}

Set-Location $PSScriptRoot
Write-Host "SRM RFQ API (PHP) -> http://127.0.0.1:3001"
& $PHP -S 127.0.0.1:3001 -t public public/router.php
