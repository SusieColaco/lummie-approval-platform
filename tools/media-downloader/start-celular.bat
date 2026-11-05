@echo off
REM Windows: dois cliques abrem a ferramenta no modo celular.
REM Na primeira vez o Windows pergunta sobre o firewall: permita em redes privadas.
call "%~dp0start.bat" --lan
