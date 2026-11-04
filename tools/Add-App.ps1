<#
    Add-App.ps1
    ------------
    يحوّل أي ملف إلى تطبيق يظهر تلقائياً على سطح المكتب (نفس نظام
    "apps/" الموجود أصلاً في المشروع — انظر apps-scanner.mjs).

    طريقتين للاستخدام:
    1) اسحب ملف وأفلته فوق "إضافة-تطبيق.bat" في جذر المشروع.
    2) أو حط أي عدد من الملفات في مجلد apps-inbox/ وشغّل
       "إضافة-تطبيق.bat" بدون أي سحب (يعالج كل شيء بالمجلد مرة وحدة).

    ما يسويه بالضبط:
    - يصنع مجلد جديد تحت apps/<اسم-التطبيق>/.
    - ينسخ الملف الأصلي جواه.
    - يصنع index.html مناسب لنوع الملف (HTML كما هو، صورة/فيديو/صوت/PDF
      بعارض مخصص، نص بصفحة قراءة، وأي نوع ثاني برابط تنزيل).
    - يصنع manifest.json فيه اسم التطبيق.
    - إذا كان المصدر داخل apps-inbox/ ينقل الملف الأصلي منها (بدل
      نسخه) عشان ما يتكرر بالمرة الجاية.

    التطبيق يظهر تلقائياً بمجرد ما يشتغل السيرفر (npm start) أو
    npm run dev — بدون إعادة بناء ولا تعديل كود، بالضبط زي
    README.md يشرح.
#>

param(
    # مسار ملف وحيد (لما تسحبه فوق الـ .bat). لو ما انعطى، يعالج
    # كل الملفات الموجودة بـ apps-inbox/.
    [string]$Path
)

$ErrorActionPreference = 'Stop'

$RepoRoot  = Split-Path -Parent $PSScriptRoot
$AppsDir   = Join-Path $RepoRoot 'apps'
$InboxDir  = Join-Path $RepoRoot 'apps-inbox'

if (-not (Test-Path $AppsDir))  { New-Item -ItemType Directory -Path $AppsDir  | Out-Null }
if (-not (Test-Path $InboxDir)) { New-Item -ItemType Directory -Path $InboxDir | Out-Null }

function Get-AppSlug([string]$name) {
    $slug = $name.Trim()
    $slug = $slug -replace '[^\p{L}\p{N}]+', '-'
    $slug = $slug.Trim('-').ToLowerInvariant()
    if ([string]::IsNullOrWhiteSpace($slug)) { $slug = 'app' }
    return $slug
}

function Get-UniqueAppDir([string]$slug) {
    $candidate = Join-Path $AppsDir $slug
    $n = 2
    while (Test-Path $candidate) {
        $candidate = Join-Path $AppsDir "$slug-$n"
        $n++
    }
    return $candidate
}

function New-IndexHtml([string]$ext, [string]$fileName, [string]$displayName) {
    $esc = [System.Web.HttpUtility]::HtmlEncode($displayName)
    switch -regex ($ext.ToLowerInvariant()) {
        '\.(png|jpg|jpeg|gif|webp|svg)$' {
            return @"
<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8">
<title>$esc</title>
<style>html,body{margin:0;height:100%;background:#111;display:flex;align-items:center;justify-content:center}
img{max-width:100%;max-height:100%;object-fit:contain}</style></head>
<body><img src="./$fileName" alt="$esc"></body></html>
"@
        }
        '\.(mp4|webm|ogv)$' {
            return @"
<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8">
<title>$esc</title>
<style>html,body{margin:0;height:100%;background:#000;display:flex;align-items:center;justify-content:center}
video{max-width:100%;max-height:100%}</style></head>
<body><video src="./$fileName" controls autoplay></video></body></html>
"@
        }
        '\.(mp3|wav|ogg|m4a)$' {
            return @"
<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8">
<title>$esc</title>
<style>html,body{margin:0;height:100%;background:#1e293b;color:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:sans-serif;gap:16px}</style></head>
<body><div style="font-size:14px">$esc</div><audio src="./$fileName" controls autoplay></audio></body></html>
"@
        }
        '\.pdf$' {
            return @"
<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8">
<title>$esc</title>
<style>html,body{margin:0;height:100%}embed{width:100%;height:100%}</style></head>
<body><embed src="./$fileName" type="application/pdf"></body></html>
"@
        }
        '\.(txt|md)$' {
            return @"
<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8">
<title>$esc</title>
<style>html,body{margin:0;height:100%;background:#fff;color:#111}
pre{white-space:pre-wrap;word-wrap:break-word;padding:24px;font-family:'Segoe UI',Tahoma,sans-serif;font-size:14px;line-height:1.6;max-width:820px;margin:0 auto}</style></head>
<body><pre id="t">...جار التحميل</pre>
<script>fetch('./$fileName').then(r=>r.text()).then(t=>{document.getElementById('t').textContent=t});</script>
</body></html>
"@
        }
        default {
            return @"
<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8">
<title>$esc</title>
<style>html,body{margin:0;height:100%;background:#1e293b;color:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:sans-serif;gap:14px}
a{background:#2563eb;color:#fff;padding:10px 20px;border-radius:10px;text-decoration:none;font-size:14px}</style></head>
<body><div>$esc</div><a href="./$fileName" download>تنزيل الملف</a></body></html>
"@
        }
    }
}

function Add-OneFile([string]$sourceFile) {
    Add-Type -AssemblyName System.Web

    $fileInfo    = Get-Item -LiteralPath $sourceFile
    $ext         = $fileInfo.Extension
    $displayName = $fileInfo.BaseName -replace '[-_]', ' '
    $displayName = (Get-Culture).TextInfo.ToTitleCase($displayName.ToLowerInvariant())
    $slug        = Get-AppSlug $fileInfo.BaseName
    $appDir      = Get-UniqueAppDir $slug

    New-Item -ItemType Directory -Path $appDir | Out-Null

    if ($ext -match '^\.html?$') {
        Copy-Item -LiteralPath $fileInfo.FullName -Destination (Join-Path $appDir 'index.html')
    } else {
        Copy-Item -LiteralPath $fileInfo.FullName -Destination (Join-Path $appDir $fileInfo.Name)
        $html = New-IndexHtml -ext $ext -fileName $fileInfo.Name -displayName $displayName
        Set-Content -LiteralPath (Join-Path $appDir 'index.html') -Value $html -Encoding UTF8
    }

    $manifest = @{ name = $displayName } | ConvertTo-Json -Compress
    Set-Content -LiteralPath (Join-Path $appDir 'manifest.json') -Value $manifest -Encoding UTF8

    # لو الملف الأصلي جاي من apps-inbox، ننقله (مو ننسخه) عشان ما
    # يتعالج مرة ثانية في المرة الجاية.
    if ($fileInfo.DirectoryName -eq $InboxDir) {
        Remove-Item -LiteralPath $fileInfo.FullName -Force
    }

    Write-Host "✔ تمت إضافة التطبيق: $displayName  →  apps/$(Split-Path -Leaf $appDir)"
}

if ($Path) {
    if (-not (Test-Path -LiteralPath $Path -PathType Leaf)) {
        Write-Error "الملف غير موجود: $Path"
        exit 1
    }
    Add-OneFile -sourceFile (Resolve-Path -LiteralPath $Path).Path
} else {
    $files = Get-ChildItem -LiteralPath $InboxDir -File | Where-Object { $_.Name -notmatch '^اقرأني\.txt$' }
    if ($files.Count -eq 0) {
        Write-Host "مافيه أي ملفات جديدة بـ apps-inbox/. حط ملف فيه وشغّل هذا السكربت مرة ثانية."
    } else {
        foreach ($f in $files) { Add-OneFile -sourceFile $f.FullName }
    }
}

Write-Host ""
Write-Host "خلص. التطبيق الجديد يظهر تلقائياً على سطح المكتب بمجرد ما يكون السيرفر شغّال (npm start أو npm run dev) — بدون أي إعادة بناء."
