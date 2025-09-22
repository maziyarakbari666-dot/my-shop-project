$ErrorActionPreference = 'Stop'

# Paths
$root = Split-Path -Parent $PSScriptRoot
$docsDir = Join-Path $root 'docs'
$inPath = Resolve-Path (Join-Path $docsDir 'deployment-guide.html')
$outPath = Join-Path $docsDir 'deployment-guide.pdf'

# Find Edge
$edgeCandidates = @(
  (Join-Path $Env:ProgramFiles 'Microsoft\Edge\Application\msedge.exe'),
  (Join-Path ${Env:ProgramFiles(x86)} 'Microsoft\Edge\Application\msedge.exe')
)
$edge = $edgeCandidates | Where-Object { Test-Path $_ } | Select-Object -First 1
if (-not $edge) { throw 'Edge not found. Please install Microsoft Edge.' }

# Normalize file URL
$inUrl = 'file:///' + ($inPath -replace '\\','/')

# Run headless print
& $edge --headless --disable-gpu ("--print-to-pdf=$outPath") $inUrl

if (-not (Test-Path $outPath)) { throw 'PDF not created' }
Write-Host "PDF created: $outPath"


