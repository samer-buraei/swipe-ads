# SwipeList Local Development Setup Script (Windows PowerShell)
# Run this script to set up everything for local development

Write-Host "===========================================" -ForegroundColor Cyan
Write-Host "   SwipeList Local Development Setup" -ForegroundColor Cyan
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Docker is installed
$dockerInstalled = Get-Command docker -ErrorAction SilentlyContinue
if (-not $dockerInstalled) {
    Write-Host "[ERROR] Docker is not installed. Please install Docker Desktop first." -ForegroundColor Red
    Write-Host "Download from: https://www.docker.com/products/docker-desktop" -ForegroundColor Yellow
    exit 1
}

# Check if Docker is running
$dockerRunning = docker info 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Docker is not running. Please start Docker Desktop." -ForegroundColor Red
    exit 1
}

Write-Host "[OK] Docker is installed and running" -ForegroundColor Green

# Step 1: Start PostgreSQL container
Write-Host ""
Write-Host "Step 1: Starting PostgreSQL database..." -ForegroundColor Yellow

$containerExists = docker ps -a --filter "name=swipelist-db" --format "{{.Names}}"
if ($containerExists -eq "swipelist-db") {
    Write-Host "  Container 'swipelist-db' already exists. Starting it..." -ForegroundColor Gray
    docker start swipelist-db
} else {
    Write-Host "  Creating new PostgreSQL container..." -ForegroundColor Gray
    docker run --name swipelist-db `
        -e POSTGRES_USER=swipelist `
        -e POSTGRES_PASSWORD=swipelist123 `
        -e POSTGRES_DB=swipelist `
        -p 5432:5432 `
        -d postgres:16
}

# Wait for PostgreSQL to be ready
Write-Host "  Waiting for PostgreSQL to be ready..." -ForegroundColor Gray
Start-Sleep -Seconds 5

Write-Host "[OK] PostgreSQL is running on localhost:5432" -ForegroundColor Green

# Step 2: Install dependencies
Write-Host ""
Write-Host "Step 2: Installing dependencies..." -ForegroundColor Yellow
pnpm install

Write-Host "[OK] Dependencies installed" -ForegroundColor Green

# Step 3: Generate Prisma client
Write-Host ""
Write-Host "Step 3: Generating Prisma client..." -ForegroundColor Yellow
pnpm db:generate

Write-Host "[OK] Prisma client generated" -ForegroundColor Green

# Step 4: Push database schema
Write-Host ""
Write-Host "Step 4: Pushing database schema..." -ForegroundColor Yellow
pnpm db:push

Write-Host "[OK] Database schema created" -ForegroundColor Green

# Step 5: Seed the database
Write-Host ""
Write-Host "Step 5: Seeding database with test data..." -ForegroundColor Yellow
pnpm db:seed

Write-Host "[OK] Database seeded with test data" -ForegroundColor Green

# Step 6: Create uploads directory
Write-Host ""
Write-Host "Step 6: Creating uploads directory..." -ForegroundColor Yellow
New-Item -ItemType Directory -Force -Path "public/uploads" | Out-Null

Write-Host "[OK] Uploads directory created" -ForegroundColor Green

# Done!
Write-Host ""
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host "   Setup Complete!" -ForegroundColor Green
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "To start the development server, run:" -ForegroundColor Yellow
Write-Host "  pnpm dev" -ForegroundColor White
Write-Host ""
Write-Host "Then open: http://localhost:3000" -ForegroundColor Yellow
Write-Host ""
Write-Host "Database connection:" -ForegroundColor Yellow
Write-Host "  Host: localhost" -ForegroundColor White
Write-Host "  Port: 5432" -ForegroundColor White
Write-Host "  User: swipelist" -ForegroundColor White
Write-Host "  Password: swipelist123" -ForegroundColor White
Write-Host "  Database: swipelist" -ForegroundColor White
Write-Host ""
Write-Host "To view the database:" -ForegroundColor Yellow
Write-Host "  pnpm db:studio" -ForegroundColor White
Write-Host ""

# Resource usage note
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host "   Resource Usage (for hosting planning)" -ForegroundColor Cyan
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "PostgreSQL container:" -ForegroundColor Yellow
docker stats --no-stream swipelist-db --format "  CPU: {{.CPUPerc}} | Memory: {{.MemUsage}}"
Write-Host ""
