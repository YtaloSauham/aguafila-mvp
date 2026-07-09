# Áudios pré-gravados (modo "arquivo")

Esta pasta é usada apenas quando `AUDIO_MODE=arquivo` no `.env` do backend.

Por padrão o sistema usa `AUDIO_MODE=tts` (síntese de voz via Web Speech API
no navegador do Painel Público) e **não** depende de nenhum arquivo aqui.

Se desejar usar áudios pré-gravados e concatenados no lugar do TTS, adicione
arquivos `.mp3` com os nomes dos segmentos falados, por exemplo:

```
senha.mp3
A.mp3
0.mp3
1.mp3
2.mp3
dirigir-se-a.mp3
esteira-1.mp3
esteira-2.mp3
```

O `AudioService` (backend) monta a sequência de segmentos para cada chamada
e o `AudioPlayer` (frontend do Painel) reproduz os arquivos em sequência.
