# PHP executable (your install — Desktop\php is XAMPP-style; php.exe is in the php\ subfolder)
$PHP = "C:\Users\KIIT0001\OneDrive\Desktop\php\php\php.exe"

if (-not (Test-Path $PHP)) {
    Write-Error "PHP not found at: $PHP"
    exit 1
}

Set-Location $PSScriptRoot
& $PHP scripts/setup.php
