param(
  [Parameter(Mandatory = $true)]
  [string]$ListPath
)

$ErrorActionPreference = 'Stop'

$root = Resolve-Path (Join-Path $PSScriptRoot '..')
$envPath = Join-Path $root '.env.ftp'
if (-not (Test-Path $envPath)) {
  throw '.env.ftp not found'
}

$cfg = @{}
Get-Content $envPath | ForEach-Object {
  if ($_ -match '^\s*([^#=]+)=(.*)$') {
    $cfg[$matches[1].Trim()] = $matches[2].Trim()
  }
}

foreach ($key in 'FTP_HOST', 'FTP_USER', 'FTP_PASS', 'FTP_ROOT') {
  if (-not $cfg.ContainsKey($key) -or [string]::IsNullOrWhiteSpace($cfg[$key])) {
    throw "Missing $key in .env.ftp"
  }
}

$listFull = Resolve-Path $ListPath
$files = Get-Content $listFull | Where-Object { $_ -and $_.Trim() } | ForEach-Object {
  $_.Trim() -replace '^[.][\\/]', ''
}

$baseUri = 'ftp://{0}/{1}' -f $cfg.FTP_HOST.TrimEnd('/'), $cfg.FTP_ROOT.Trim('/')
$user = '{0}:{1}' -f $cfg.FTP_USER, $cfg.FTP_PASS
$uploaded = 0
$failed = New-Object System.Collections.Generic.List[string]
$batchSize = 50

function Convert-ToCurlQuoted([string]$value) {
  return '"' + (($value -replace '\\', '/') -replace '"', '\"') + '"'
}

for ($offset = 0; $offset -lt $files.Count; $offset += $batchSize) {
  $batch = $files[$offset..([Math]::Min($offset + $batchSize - 1, $files.Count - 1))]
  $valid = New-Object System.Collections.Generic.List[string]
  $configPath = [System.IO.Path]::GetTempFileName()

  try {
    $lines = New-Object System.Collections.Generic.List[string]

    foreach ($relative in $batch) {
      $local = Join-Path $root $relative
      if (-not (Test-Path $local -PathType Leaf)) {
        $failed.Add("$relative :: local file missing")
        continue
      }

      $ftpPath = ($relative -replace '\\', '/').TrimStart('/')
      $uri = "$baseUri/$ftpPath"
      $localPath = (Resolve-Path $local).Path

      if ($valid.Count -gt 0) {
        $lines.Add('next')
      }
      $lines.Add('connect-timeout = 75')
      $lines.Add('max-time = 300')
      $lines.Add('ftp-create-dirs')
      $lines.Add('user = ' + (Convert-ToCurlQuoted $user))
      $lines.Add('upload-file = ' + (Convert-ToCurlQuoted $localPath))
      $lines.Add('url = ' + (Convert-ToCurlQuoted $uri))
      $valid.Add($relative)
    }

    if ($valid.Count -eq 0) {
      continue
    }

    Set-Content -Path $configPath -Value $lines -Encoding ASCII
    & curl.exe --no-progress-meter --show-error --config $configPath

    if ($LASTEXITCODE -eq 0) {
      $uploaded += $valid.Count
      Write-Output ("uploaded {0}/{1}" -f $uploaded, $files.Count)
    } else {
      foreach ($relative in $valid) {
        $failed.Add("$relative :: curl batch exit $LASTEXITCODE")
      }
    }
  } finally {
    if (Test-Path $configPath) {
      Remove-Item -LiteralPath $configPath -Force
    }
  }
}

Write-Output ("done uploaded={0} failed={1}" -f $uploaded, $failed.Count)
if ($failed.Count) {
  $failed | ForEach-Object { Write-Output $_ }
  exit 1
}
