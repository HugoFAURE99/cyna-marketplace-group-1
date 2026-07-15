[CmdletBinding()]
param(
    [string]$Python = $env:CYNA_PYTHON,
    [string]$OutputDirectory = $env:CYNA_DOC_RENDER_DIR
)

$ErrorActionPreference = 'Stop'
$docRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
if (-not $Python) { $Python = (Get-Command python -ErrorAction Stop).Source }
if (-not $OutputDirectory) { $OutputDirectory = Join-Path $docRoot '.rendered' }
$pdfDirectory = Join-Path $OutputDirectory 'pdf'
New-Item -ItemType Directory -Force -Path $pdfDirectory | Out-Null
$profileId = [Guid]::NewGuid().ToString('N')
$profileRoot = "C:\Users\Public\cyna-lo-$profileId"
New-Item -ItemType Directory -Force -Path $profileRoot | Out-Null
$profileUri = "file:///C:/Users/Public/cyna-lo-$profileId"

function Convert-DocsToPdf {
    $files = Get-ChildItem -LiteralPath $docRoot -Filter '*.docx' |
        Sort-Object Name |
        Select-Object -ExpandProperty FullName
    & 'C:\Program Files\LibreOffice\program\soffice.com' `
        "-env:UserInstallation=$profileUri" `
        --headless --norestore --nolockcheck --nodefault --nofirststartwizard `
        --convert-to pdf --outdir $pdfDirectory @files
    if ($LASTEXITCODE -ne 0) { throw 'Conversion PDF groupée impossible.' }
}

& $Python (Join-Path $docRoot 'build_docs.py')
if ($LASTEXITCODE -ne 0) { throw 'Échec de génération DOCX (première passe).' }
Convert-DocsToPdf
& $Python (Join-Path $docRoot 'materialize_toc.py') $pdfDirectory
if ($LASTEXITCODE -ne 0) { throw 'Échec de matérialisation des sommaires.' }
& $Python (Join-Path $docRoot 'build_docs.py')
if ($LASTEXITCODE -ne 0) { throw 'Échec de génération DOCX (seconde passe).' }
Convert-DocsToPdf
Write-Host "DOCX et PDF générés. Rendus PDF : $pdfDirectory"
