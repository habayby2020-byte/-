@echo off
chcp 65001 >nul
setlocal

rem إضافة-تطبيق.bat
rem ----------------
rem طريقة ١ (الأسهل): اسحب أي ملف من جهازك وأفلته فوق هذا الملف مباشرة
rem                    — يتحول تلقائياً لتطبيق على سطح المكتب.
rem طريقة ٢: حط أي عدد من الملفات داخل مجلد apps-inbox\ ثم شغّل هذا
rem           الملف بدبل كليك عادي (بدون سحب) — يعالج كل الملفات دفعة وحدة.

if "%~1"=="" (
    powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0tools\Add-App.ps1"
) else (
    powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0tools\Add-App.ps1" -Path "%~1"
)

echo.
pause
