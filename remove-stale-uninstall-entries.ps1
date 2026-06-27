$ErrorActionPreference = "Stop"

$keys = @(
  "HKLM:\Software\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall\Clair Obscur: Expedition 33_is1",
  "HKLM:\Software\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall\DataSpell 2025.1.1",
  "HKLM:\Software\Microsoft\Windows\CurrentVersion\Uninstall\IntelliJ IDEA 2026.1",
  "HKLM:\Software\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall\Resident Evil 2_is1",
  "HKLM:\Software\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall\PyCharm 2025.1.2",
  "HKLM:\Software\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall\Super Mario Party Jamboree_is1",
  "HKLM:\Software\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall\Super Smash Bros. Ultimate_is1",
  "HKLM:\Software\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall\WebStorm 2025.1.3",
  "HKLM:\Software\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall\{b72d4013-dd88-405a-9f9d-e88c278dcefe}",
  "HKLM:\Software\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall\{d6a76ead-c762-4d93-9c24-1fa3efa1e12d}",
  "HKLM:\Software\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall\{50106ec5-d0ec-4ea1-9e01-e9899676ba3f}"
)

$backupFile = Join-Path $PSScriptRoot ("stale-uninstall-entries-backup-admin-" + (Get-Date -Format "yyyyMMdd-HHmmss") + ".reg")
Set-Content -LiteralPath $backupFile -Value "Windows Registry Editor Version 5.00" -Encoding ASCII

foreach ($key in $keys) {
  $regPath = $key -replace "^HKLM:", "HKLM"
  $tempFile = Join-Path $env:TEMP "codex-reg-export.tmp"

  if (Test-Path -LiteralPath $key) {
    & reg.exe export $regPath $tempFile /y | Out-Null
    if (Test-Path -LiteralPath $tempFile) {
      Add-Content -LiteralPath $backupFile -Value "" -Encoding ASCII
      Get-Content -LiteralPath $tempFile | Select-Object -Skip 1 | Add-Content -LiteralPath $backupFile -Encoding Unicode
      Remove-Item -LiteralPath $tempFile -Force
    }
  }
}

foreach ($key in $keys) {
  if (Test-Path -LiteralPath $key) {
    Remove-Item -LiteralPath $key -Recurse -Force
    Write-Host "Removed $key"
  } else {
    Write-Host "Already missing $key"
  }
}

Write-Host "Backup saved to $backupFile"
