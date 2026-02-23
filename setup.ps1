# Setup script for SwipeList Laravel
$ErrorActionPreference = "Stop"

# Refresh PATH
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

# Check PHP
Write-Host "Checking PHP..." -ForegroundColor Cyan
$phpPath = (Get-Command php -ErrorAction SilentlyContinue).Source
if ($phpPath) {
    Write-Host "PHP found at: $phpPath" -ForegroundColor Green
    php --version
} else {
    Write-Host "PHP not in PATH, searching..." -ForegroundColor Yellow
    $phpExe = Get-ChildItem -Path "C:\Program Files","C:\php","$env:LOCALAPPDATA\Microsoft\WinGet" -Filter "php.exe" -Recurse -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($phpExe) {
        $phpPath = $phpExe.FullName
        Write-Host "Found PHP at: $phpPath" -ForegroundColor Green
    } else {
        Write-Host "ERROR: PHP not found!" -ForegroundColor Red
        exit 1
    }
}

# Download and install Composer if not present
Write-Host "`nChecking Composer..." -ForegroundColor Cyan
$composerPath = (Get-Command composer -ErrorAction SilentlyContinue).Source
if (-not $composerPath) {
    Write-Host "Installing Composer..." -ForegroundColor Yellow

    # Download installer
    Invoke-WebRequest -Uri "https://getcomposer.org/installer" -OutFile "composer-setup.php"

    # Get PHP directory
    $phpDir = Split-Path $phpPath

    # Install composer
    & $phpPath composer-setup.php --install-dir=$phpDir --filename=composer.phar

    # Create batch wrapper
    $composerBat = Join-Path $phpDir "composer.bat"
    "@echo off`nphp `"%~dp0composer.phar`" %*" | Out-File -FilePath $composerBat -Encoding ASCII

    Remove-Item composer-setup.php -ErrorAction SilentlyContinue

    $composerPath = $composerBat
    Write-Host "Composer installed at: $composerPath" -ForegroundColor Green
} else {
    Write-Host "Composer found at: $composerPath" -ForegroundColor Green
}

# Navigate to project
Set-Location "C:\Users\sam\Desktop\swipe ads\swipelist-laravel"

Write-Host "`n=== Setting up SwipeList ===" -ForegroundColor Cyan

# Install dependencies
Write-Host "`nInstalling dependencies..." -ForegroundColor Yellow
& $phpPath $composerPath install --no-interaction

# Copy .env
if (-not (Test-Path ".env")) {
    Copy-Item ".env.example" ".env"
    Write-Host ".env file created" -ForegroundColor Green
}

# Generate app key
Write-Host "`nGenerating app key..." -ForegroundColor Yellow
& $phpPath artisan key:generate

Write-Host "`n=== Setup Complete ===" -ForegroundColor Green
Write-Host "PHP and Composer are installed."
Write-Host "Next: Configure database in .env and run 'php artisan migrate --seed'"
Write-Host "Then: 'php artisan serve' to start the server"
