# Lightweight built-in HTTP Server using .NET for Windows PowerShell
$port = 8000
$prefix = "http://localhost:$port/"
$folder = "$PSScriptRoot\frontend"

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add($prefix)
$listener.Start()

Write-Host "==========================================================" -ForegroundColor Green
Write-Host " Digital Visitor Management System - Local Web Server" -ForegroundColor Cyan
Write-Host " Server running at: $prefix" -ForegroundColor Yellow
Write-Host " Press Ctrl+C in this terminal to stop the server" -ForegroundColor Gray
Write-Host "==========================================================" -ForegroundColor Green

Start-Process $prefix

try {
    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response

        $path = $request.Url.LocalPath.TrimStart('/')
        if ([string]::IsNullOrWhiteSpace($path) -or $path -eq "/") {
            $path = "index.html"
        }

        $filePath = Join-Path $folder $path

        if (Test-Path $filePath -PathType Leaf) {
            $content = [System.IO.File]::ReadAllBytes($filePath)
            
            # Content Type Mapping
            $ext = [System.IO.Path]::GetExtension($filePath).ToLower()
            $contentType = switch ($ext) {
                ".html" { "text/html; charset=utf-8" }
                ".css"  { "text/css; charset=utf-8" }
                ".js"   { "application/javascript; charset=utf-8" }
                ".svg"  { "image/svg+xml" }
                ".png"  { "image/png" }
                ".jpg"  { "image/jpeg" }
                ".json" { "application/json" }
                Default { "application/octet-stream" }
            }

            $response.ContentType = $contentType
            $response.ContentLength64 = $content.Length
            $response.OutputStream.Write($content, 0, $content.Length)
        } else {
            $response.StatusCode = 404
            $buffer = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found")
            $response.OutputStream.Write($buffer, 0, $buffer.Length)
        }

        $response.OutputStream.Close()
    }
} finally {
    $listener.Stop()
}
