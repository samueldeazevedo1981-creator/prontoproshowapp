# PRONTO PRO SHOW - O APLICATIVO DO MÚSICO AO VIVO

## Rodar com separação por IA

Extraia o ZIP e abra a pasta que contém o Dockerfile. Rode:

```sh
docker build -t pronto-pro-show .
docker run --rm -p 3000:3000 pronto-pro-show
```

Acesse http://localhost:3000. Para produção, publique esse contêiner em um serviço com HTTPS e encaminhe a porta 3000. O servidor atende a interface e a rota de separação no mesmo endereço. A pasta dist também funciona em hospedagem estática para Palco, Setlist e Igualar Áudio.

## Abas e dados

- Palco e Setlist usam o armazenamento do navegador. Abra o app no endereço antigo para reutilizar os dados guardados naquele endereço. Em outro domínio, os dados ficam no endereço de origem e as bases e letras precisam ser importadas no novo app.
- Separar Faixas usa o motor ONNX incluído. Aceita MP3 de até 4,4 MB e 10 minutos, processa um pedido por vez e oferece guitarra isolada, sem guitarra e sem guitarra e voz. O botão de adicionar envia a faixa escolhida para a setlist ativa no player.
- Igualar Áudio trabalha no navegador. No próprio player, abra a setlist e toque em Igualar volume das bases. O app guarda as versões preparadas no aparelho e permite voltar aos volumes originais. Reserve espaço local para essas versões.
- Para o modo offline, carregue o app com conexão e aguarde a confirmação do cache. A separação de uma música nova precisa do servidor. Os áudios já importados no player podem tocar offline.

O pacote não publica nem altera a hospedagem existente.
