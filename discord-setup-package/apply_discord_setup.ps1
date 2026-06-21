param(
  [switch]$ApplyBranding
)

$ErrorActionPreference = "Stop"
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$node = "C:\Users\ryanh\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"

if (!(Test-Path $node)) {
  Write-Error "Bundled Node runtime not found: $node"
}

Set-Location $scriptDir

Write-Host "The Trap House Discord setup" -ForegroundColor Red
Write-Host "This edits the live Discord server connected to the guild/server ID you provide." -ForegroundColor Yellow
Write-Host "It does not publish the website." -ForegroundColor Yellow
Write-Host ""

$defaultGuildId = "1515763346790420680"
$guildId = Read-Host "Paste Discord server/guild ID [$defaultGuildId]"
if ([string]::IsNullOrWhiteSpace($guildId)) {
  $guildId = $defaultGuildId
}
$secureToken = Read-Host "Paste Discord bot token" -AsSecureString
$plainToken = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
  [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureToken)
)

if ([string]::IsNullOrWhiteSpace($guildId) -or [string]::IsNullOrWhiteSpace($plainToken)) {
  Write-Error "Missing guild ID or bot token."
}

if ($plainToken.Trim() -match '^[a-f0-9]{64}$') {
  Write-Error "That looks like a Discord application public key, not a bot token. In the Developer Portal, open the Bot page, click Reset Token, and paste that token here instead."
}

$env:DISCORD_GUILD_ID = $guildId.Trim()
$env:DISCORD_BOT_TOKEN = $plainToken.Trim()
$env:APPLY_SERVER_BRANDING = if ($ApplyBranding) { "true" } else { "false" }

try {
  & $node check_discord_package.js
  if ($LASTEXITCODE -ne 0) { throw "Preflight failed." }

  & $node setup_discord_rest.mjs
  if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "Discord setup did not apply yet." -ForegroundColor Yellow
    Write-Host "If the message above says the bot is not in the server, open the printed Bot invite URL, authorize it into The Trap House, then run this script again." -ForegroundColor Yellow
    throw "Discord setup failed."
  }

  Write-Host ""
  Write-Host "Setup finished. Now check Discord visually before sharing the invite wider." -ForegroundColor Green
} finally {
  Remove-Item Env:\DISCORD_BOT_TOKEN -ErrorAction SilentlyContinue
  Remove-Item Env:\DISCORD_GUILD_ID -ErrorAction SilentlyContinue
  Remove-Item Env:\APPLY_SERVER_BRANDING -ErrorAction SilentlyContinue
}
