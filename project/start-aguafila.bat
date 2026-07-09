@echo off
setlocal enabledelayedexpansion

REM --- Caminho base do projeto ---
set "PROJECT_ROOT=%~dp0"
set "BACKEND_DIR=%PROJECT_ROOT%backend"

echo.
echo ==============================
echo Aguafila: inicializando serviços
echo ==============================
echo.

REM --- Tenta iniciar MariaDB como serviço ---
set "MYSQL_SERVICE=MariaDB"
set "MYSQL_SERVICE_ALT=MySQL"

sc query "%MYSQL_SERVICE%" >nul 2>&1
if %errorlevel%==0 (
  echo Iniciando serviço %MYSQL_SERVICE%...
  net start "%MYSQL_SERVICE%" >nul 2>&1
  if %errorlevel%==0 (
    echo Serviço %MYSQL_SERVICE% iniciado com sucesso.
  ) else (
    echo Serviço %MYSQL_SERVICE% já está em execução ou falhou ao iniciar.
  )
) else (
  sc query "%MYSQL_SERVICE_ALT%" >nul 2>&1
  if %errorlevel%==0 (
    echo Iniciando serviço %MYSQL_SERVICE_ALT%...
    net start "%MYSQL_SERVICE_ALT%" >nul 2>&1
    if %errorlevel%==0 (
      echo Serviço %MYSQL_SERVICE_ALT% iniciado com sucesso.
    ) else (
      echo Serviço %MYSQL_SERVICE_ALT% já está em execução ou falhou ao iniciar.
    )
  ) else (
    echo Serviço MariaDB não encontrado. Tentando iniciar mysqld.exe diretamente...
    where mysqld >nul 2>&1
    if %errorlevel%==0 (
      start "MariaDB" cmd /k "mysqld"
      echo MariaDB iniciado em nova janela de terminal.
    ) else (
      echo ERRO: MariaDB não foi encontrado como serviço nem como mysqld em PATH.
      echo Verifique a instalação do MariaDB ou configure a variável PATH.
    )
  )
)

REM --- Inicia o backend Node ---
set "PORT=3000"
set "SERVER_PORT=%PORT%"
if exist "%BACKEND_DIR%" (
  pushd "%BACKEND_DIR%"
  echo.
  echo Iniciando backend Node na porta %SERVER_PORT%...
  start "Aguafila Backend" cmd /k "npm start"
  popd

  REM --- Aguarda o servidor inicializar e abre as telas no navegador ---
  timeout /t 3 /nobreak >nul
  echo.
  echo Abrindo telas no navegador...
  start "Terminal" "http://localhost:%SERVER_PORT%/terminal"
  start "Operador" "http://localhost:%SERVER_PORT%/operador"
  start "Painel" "http://localhost:%SERVER_PORT%/painel"
) else (
  echo ERRO: pasta backend não encontrada em %BACKEND_DIR%
)

echo.
echo Aguafila: inicialização concluída.
echo Use as janelas abertas para ver logs e erros.
pause
