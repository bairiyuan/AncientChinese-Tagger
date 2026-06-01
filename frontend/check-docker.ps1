Write-Host "Checking Docker in PATH..."
$dockerInPath = $false
try {
    $dockerPath = Get-Command docker -ErrorAction Stop
    Write-Host "Docker found in PATH: $($dockerPath.Source)"
    $dockerInPath = $true
} catch {
    Write-Host "Docker NOT found in PATH"
}

Write-Host "`nChecking common Docker Desktop install locations..."
$locations = @(
    "C:\Program Files\Docker\Docker\resources\bin\docker.exe",
    "C:\Program Files\Docker\docker.exe",
    "$env:LOCALAPPDATA\Docker\resources\bin\docker.exe",
    "$env:APPDATA\Docker\resources\bin\docker.exe"
)

$foundDocker = $dockerInPath
$foundPath = $null

foreach ($loc in $locations) {
    if (Test-Path $loc) {
        Write-Host "`nFound Docker at: $loc"
        $foundDocker = $true
        $foundPath = $loc
        break
    }
}

if ($foundDocker) {
    Write-Host "`n✅ Docker is available on your system."
    if (-not $dockerInPath -and $foundPath) {
        Write-Host "   It's installed at: $foundPath"
        Write-Host "   You may need to: 1) Restart your IDE 2) Or open a fresh terminal after Docker Desktop finishes starting"
    }
    exit 0
} else {
    Write-Host "`n❌ Docker NOT found in PATH or common install locations."
    Write-Host "   Please confirm:"
    Write-Host "   1. Docker Desktop is actually installed"
    Write-Host "   2. Docker Desktop is currently running (check your system tray)"
    Write-Host "   3. You've restarted this IDE/terminal after installing Docker"
    exit 1
}
