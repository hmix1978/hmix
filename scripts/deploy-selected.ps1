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

$credential = New-Object System.Net.NetworkCredential($cfg.FTP_USER, $cfg.FTP_PASS)
$baseUri = 'ftp://{0}/{1}' -f $cfg.FTP_HOST.TrimEnd('/'), $cfg.FTP_ROOT.Trim('/')

function Convert-ToFtpPath([string]$relativePath) {
  return ($relativePath -replace '\\', '/').TrimStart('/')
}

function Ensure-FtpDirectory([string]$relativeDirectory) {
  if ([string]::IsNullOrWhiteSpace($relativeDirectory)) { return }
  $parts = (Convert-ToFtpPath $relativeDirectory).Split('/') | Where-Object { $_ }
  $current = ''
  foreach ($part in $parts) {
    $current = if ($current) { "$current/$part" } else { $part }
    $uri = "$baseUri/$current"
    try {
      $request = [System.Net.FtpWebRequest]::Create($uri)
      $request.Credentials = $credential
      $request.Method = [System.Net.WebRequestMethods+Ftp]::MakeDirectory
      $request.UseBinary = $true
      $request.UsePassive = $true
      $request.KeepAlive = $false
      $request.Timeout = 20000
      $request.ReadWriteTimeout = 20000
      $response = $request.GetResponse()
      $response.Close()
    } catch [System.Net.WebException] {
      if ($_.Exception.Response) { $_.Exception.Response.Close() }
    }
  }
}

$uploaded = 0
$failed = New-Object System.Collections.Generic.List[string]

foreach ($relative in $files) {
  $local = Join-Path $root $relative
  if (-not (Test-Path $local -PathType Leaf)) {
    $failed.Add("$relative :: local file missing")
    continue
  }

  $ftpPath = Convert-ToFtpPath $relative
  $dir = Split-Path $ftpPath -Parent
  Ensure-FtpDirectory $dir
  $uri = "$baseUri/$ftpPath"

  try {
    $request = [System.Net.FtpWebRequest]::Create($uri)
    $request.Credentials = $credential
    $request.Method = [System.Net.WebRequestMethods+Ftp]::UploadFile
    $request.UseBinary = $true
    $request.UsePassive = $true
    $request.KeepAlive = $false
    $request.Timeout = 20000
    $request.ReadWriteTimeout = 20000
    $bytes = [System.IO.File]::ReadAllBytes((Resolve-Path $local))
    $request.ContentLength = $bytes.Length
    $stream = $request.GetRequestStream()
    $stream.Write($bytes, 0, $bytes.Length)
    $stream.Close()
    $response = $request.GetResponse()
    $response.Close()
    $uploaded++
    if (($uploaded % 25) -eq 0 -or $uploaded -eq $files.Count) {
      Write-Output ("uploaded {0}/{1}" -f $uploaded, $files.Count)
    }
  } catch {
    $failed.Add("$relative :: $($_.Exception.Message)")
  }
}

Write-Output ("done uploaded={0} failed={1}" -f $uploaded, $failed.Count)
if ($failed.Count) {
  $failed | ForEach-Object { Write-Output $_ }
  exit 1
}
