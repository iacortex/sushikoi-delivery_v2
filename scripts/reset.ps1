# scripts/reset.ps1
Write-Host "Deteniendo procesos Node..." -ForegroundColor Cyan
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force

Write-Host "Borrando caches y builds..." -ForegroundColor Cyan
$paths = @(
  "node_modules","pnpm-lock.yaml",
  ".vite",".vitest",".cache",".turbo",".next","dist","build","out",
  "coverage",".eslintcache",".stylelintcache",".parcel-cache"
)
foreach ($p in $paths) { if (Test-Path $p) { Remove-Item $p -Recurse -Force -ErrorAction SilentlyContinue } }

Write-Host "Limpiando caches de TS..." -ForegroundColor Cyan
Get-ChildItem -Recurse -Filter "*.tsbuildinfo" | Remove-Item -Force -ErrorAction SilentlyContinue

Write-Host "Verificando cache de npm (requerido por pnpm)..." -ForegroundColor Cyan
npm cache verify | Out-Null

Write-Host "Instalando con pnpm..." -ForegroundColor Cyan
pnpm install

Write-Host "¡Reset listo! Ejecuta: pnpm dev" -ForegroundColor Green
