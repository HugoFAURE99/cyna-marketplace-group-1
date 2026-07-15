[CmdletBinding()]
param(
    [string]$Node = $env:CYNA_NODE,
    [string]$MermaidCli = $env:CYNA_MERMAID_CLI
)

$ErrorActionPreference = 'Stop'
$docRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$sourceRoot = Join-Path $docRoot 'diagrammes/src'
$outputRoot = Join-Path $docRoot 'diagrammes'
$config = Join-Path $outputRoot 'mermaid-config.json'

if (-not $Node) {
    $Node = (Get-Command node -ErrorAction Stop).Source
}

if (-not $MermaidCli) {
    $candidate = Join-Path $docRoot '.tools/node_modules/@mermaid-js/mermaid-cli/src/cli.js'
    if (-not (Test-Path -LiteralPath $candidate)) {
        throw 'Définissez CYNA_MERMAID_CLI ou installez @mermaid-js/mermaid-cli@11.12.0 dans documentation/.tools.'
    }
    $MermaidCli = $candidate
}

Get-ChildItem -LiteralPath $sourceRoot -Filter '*.mmd' | Sort-Object Name | ForEach-Object {
    $baseName = $_.BaseName
    foreach ($extension in @('svg', 'png')) {
        $output = Join-Path $outputRoot "$baseName.$extension"
        $arguments = @(
            $MermaidCli,
            '--input', $_.FullName,
            '--output', $output,
            '--configFile', $config,
            '--backgroundColor', 'white',
            '--width', '2200'
        )
        if ($extension -eq 'png') {
            $arguments += @('--scale', '2')
        }
        & $Node @arguments
        if ($LASTEXITCODE -ne 0) {
            throw "Échec Mermaid pour $($_.Name) vers $extension."
        }
    }
}

Write-Host 'Schémas Mermaid générés en SVG et PNG.'
