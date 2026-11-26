@echo off
set DIR=%~dp0
cd /d "%DIR%backend"
echo ========================================================
echo Iniciando BarberFlow Backend (Spring Boot + MySQL)
echo ========================================================
mvn spring-boot:run
pause
