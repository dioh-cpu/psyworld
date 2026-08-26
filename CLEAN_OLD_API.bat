@echo off
setlocal
cd /d "%~dp0"
echo Limpando rotas API antigas do PSYWORLD...
for %%D in ("api\economy" "api\market" "api\player" "api\health" "api\_lib") do (
  if exist %%D rmdir /s /q %%D
)
echo.
echo Pronto. As rotas antigas foram removidas.
echo Agora o projeto usa apenas api\config.js, api\player.js, api\economy.js e api\market.js.
pause
