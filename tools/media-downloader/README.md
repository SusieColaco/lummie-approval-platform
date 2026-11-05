# LUMMIE Media Downloader

Ferramenta interna para baixar vídeos do **Instagram, YouTube e TikTok** em MP4 na melhor qualidade,
extrair **só o áudio**, baixar **só um trecho** e **transcrever** o áudio (texto + legenda SRT).

Roda no seu computador (Mac, Windows ou Linux). Não roda na Vercel junto com a plataforma,
porque precisa do `ffmpeg` e de processamento local.

## Instalação

1. Instale o **Python 3.10+** e o **ffmpeg**:
   - Mac: `brew install python ffmpeg`
   - Windows: `winget install Python.Python.3.12 Gyan.FFmpeg`
   - Ubuntu: `sudo apt install python3 python3-venv ffmpeg`
2. Dê dois cliques em `start.bat` (Windows) ou rode `./start.sh` (Mac/Linux).
   Na primeira vez ele cria o ambiente e instala as dependências. Depois abre
   `http://127.0.0.1:8765` no navegador.

Os arquivos vão para `~/Downloads/Lummie Downloads` (mude com a variável de ambiente `LUMMIE_DL_OUT`).

## Interface web

1. Cole o link e clique em **Analisar**: aparece título, duração, miniatura e resoluções disponíveis.
2. Escolha **Vídeo · MP4** (com limite de resolução) ou **Só o áudio** (MP3, WAV ou M4A).
3. Marque **Baixar só um trecho**. A ferramenta baixa uma prévia leve (até 480p) e abre um **mini player**
   com linha do tempo de miniaturas, no estilo de um editor:
   - arraste as **alças douradas** para escolher início e fim (funciona com o dedo no celular);
   - clique ou arraste na linha do tempo para mover o ponto de reprodução;
   - **Marcar início** e **Marcar fim** usam o ponto atual (teclas `I` e `O`);
   - **Ver trecho** toca só o que você escolheu e **Repetir** fica em loop;
   - setas andam quadro a quadro, `Shift` + seta anda 1 segundo, espaço toca e pausa;
   - também dá para digitar início e fim (`1:30`, `00:01:30.5`, `90`).

   A prévia serve só para escolher. O arquivo final é baixado na qualidade escolhida e o corte é exato no frame.
   Selecionar o vídeo inteiro não corta nem re-codifica. As prévias ficam na pasta temporária e são apagadas depois de 24 horas.
4. Marque **Transcrever o áudio** para gerar `.minutagem.txt` (cada fala com `[hh:mm:ss]`),
   `.txt` (só o texto), `.srt` (legenda) e `.json`. O texto aparece na tela com botão de copiar
   e um seletor "Com minutagem / Só o texto".
5. **Baixar**. A barra mostra o andamento e no fim aparecem os links dos arquivos.

## Usar no celular

Dá para usar a ferramenta pelo navegador do celular, na mesma rede Wi-Fi do computador. O computador faz todo o
trabalho (download, corte, transcrição) e o celular só controla e recebe o arquivo.

1. Abra no **modo celular**: Mac, dois cliques em `start-celular.command`; Windows, dois cliques em
   `start-celular.bat`; terminal, `./start.sh --lan`. A janela mostra um **QR code** e o endereço.
   Na primeira vez, o Mac ou o Windows pergunta sobre rede/firewall: permita.
2. No celular, escaneie o QR code com a câmera. No Safari, use Compartilhar → **Adicionar à Tela de Início**
   para ter o ícone da ferramenta.
3. Cole o link, escolha o trecho no player (com o dedo) e baixe. No resultado, **Baixar** salva o arquivo
   e **Abrir** toca o vídeo, onde você usa o botão de compartilhar para **Salvar vídeo** no Rolo da Câmera.
   O arquivo também fica salvo na pasta do computador.

### Atalho de compartilhar do iPhone

Para mandar um Reel direto do Instagram (ou TikTok, YouTube) para a ferramenta, sem copiar o link, crie um
Atalho. O passo a passo, com o endereço certo do seu computador, está na ferramenta: no rodapé da página,
**Usar no celular**. Resumo:

1. App **Atalhos**, atalho novo "Baixar no Lummie", com **Mostrar na Folha de Compartilhamento** ligado
   (tipos URLs e Texto).
2. Ações, nesta ordem: **Codificar URL** (entrada: Entrada de Atalho), **Texto** (o endereço do atalho mais a
   variável do passo anterior no final) e **Abrir URLs** (o Texto).
3. No app do Instagram: Compartilhar → Mais → **Baixar no Lummie**. A ferramenta abre já com o vídeo analisado.

Não dá para entregar o Atalho pronto em arquivo porque o iOS só importa atalhos assinados pela Apple.

### Segurança e cuidados

- No modo celular, quem está na mesma rede só entra com a **chave** (vai no QR code e no endereço). O próprio
  computador não precisa de chave. Sem `--lan`, a ferramenta só aceita o próprio computador.
- A chave fica em `~/.lummie-dl/key` e não muda entre execuções. Para trocar, apague o arquivo e reinicie.
- A conexão é HTTP, sem criptografia. Use em rede de casa ou do estúdio, não em Wi-Fi público.
- O computador precisa ficar ligado e sem suspender. No Mac, o `start.sh` já impede a suspensão.
- Se o IP do computador mudar, o QR code muda. O endereço com `.local` (por exemplo `meu-mac.local`) continua valendo.
- Android: escaneie o QR code e use o menu do Chrome → Adicionar à tela inicial. O atalho de compartilhar é só iPhone.

## Linha de comando

```bash
source .venv/bin/activate          # Windows: .venv\Scripts\activate

lummie-dl "https://www.youtube.com/watch?v=..."            # MP4 na melhor qualidade
lummie-dl URL --quality 1080                               # limita a 1080p
lummie-dl URL --audio --audio-format wav                   # só o áudio
lummie-dl URL --start 01:10 --end 02:30                    # só um trecho
lummie-dl URL --transcribe --language pt                   # baixa e transcreve
lummie-dl URL --transcribe --timestamps                    # mostra na tela com minutagem
lummie-dl URL --start 10:00 --end 12:00 --audio --transcribe
lummie-dl URL --info                                       # só mostra os dados
lummie-dl URL --out ~/Projetos/Cliente                     # pasta de saída
```

Todas as opções: `lummie-dl --help`.

## Instagram e conteúdo que pede login

O Instagram costuma exigir uma sessão logada. Use os cookies do seu navegador:

- Interface web: abra **Avançado** e escolha o navegador (Chrome, Firefox, Safari…).
- CLI: `lummie-dl URL --cookies-browser chrome`

Feche o navegador antes, senão o banco de cookies pode estar travado. Alternativa: exporte um
`cookies.txt` com uma extensão do navegador e use `--cookies-file cookies.txt`.

## Transcrição

Usa o [faster-whisper](https://github.com/SYSTRAN/faster-whisper) rodando localmente (nada sai do
seu computador). Modelos:

| Modelo     | Velocidade | Precisão | Download |
|------------|-----------|----------|----------|
| `base`     | muito rápida | ok     | ~150 MB  |
| `small`    | rápida    | boa (padrão) | ~500 MB |
| `medium`   | lenta     | alta     | ~1,5 GB  |
| `large-v3` | muito lenta | máxima | ~3 GB   |

O modelo é baixado na primeira vez que é usado. Para português, `small` já funciona bem;
para entrevistas longas com qualidade de áudio ruim, `medium`.

## Qualidade do vídeo

A ferramenta prefere **H.264 em MP4**, que abre direto no Premiere, DaVinci, CapCut e Final Cut.
No YouTube isso vai até 1080p; acima disso (1440p/4K) o YouTube só serve VP9/AV1, e nesse caso
o arquivo ainda sai como `.mp4`, mas com esse codec. Se o editor reclamar, baixe com `--quality 1080`.

## Mantendo atualizado

As plataformas mudam com frequência. Se algum link parar de funcionar, atualize o yt-dlp:

```bash
.venv/bin/pip install -U yt-dlp
```

## Estrutura

```
tools/media-downloader/
  lummie_dl/core.py        # análise, download, prévia, recorte (ffmpeg), transcrição
  lummie_dl/cli.py         # comando lummie-dl
  lummie_dl/server.py      # comando lummie-dl-web (FastAPI)
  lummie_dl/static/index.html
  lummie_dl/static/icon.png  # ícone da tela inicial do celular
  start.sh / start.bat     # instala e abre a interface
  start-celular.command / .bat  # idem, no modo celular
```

Uso responsável: baixe apenas conteúdo seu, de clientes ou com autorização de quem publicou.
