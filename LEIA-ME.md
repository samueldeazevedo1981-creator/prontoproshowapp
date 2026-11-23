# PRONTO PRO SHOW - O APLICATIVO DO MÚSICO AO VIVO

## Hospedagem
A pasta `dist` contém o app estático. Na Vercel, importe o repositório com `vercel.json` na raiz e `dist` como saída. Em outra hospedagem, sirva `dist` por HTTPS. O modelo de IA é baixado pelo navegador e o áudio do músico é processado no próprio aparelho. Esta versão dispensa o servidor Python/Docker da versão anterior.

## Uso
- Igualar Áudio: importe os arquivos, normalize o lote e toque em **Enviar lote para setlist**. Selecione uma existente ou escolha **Criar nova setlist** e digite o nome. Também é possível enviar uma faixa por vez.
- Separar Faixas: toque em **Preparar IA** para baixar o modelo HTDemucs de aproximadamente 246 MB, ou selecione manualmente o arquivo ONNX compatível. O modelo de seis faixas entrega voz, bateria, baixo, guitarra, piano e outros. Em Qualidade, usa as mesmas janelas e sobreposição do teste em Rua Ramalhete. Silencie Guitarra e envie a mix para uma setlist para usar a base. Órgãos e sintetizadores podem permanecer em Outros. O mixer tem solo, mute, volume, pan e click. Use **Enviar mix para setlist** para guardar a mixagem.
- Palco: as faixas importadas e as setlists ficam no navegador. Para recuperar repertório de uma instalação, use o mesmo endereço e perfil de navegador. Em outro domínio, importe novamente seus arquivos.
- O navegador pode liberar espaço ocupado pelo cache. Antes do show, confira a reprodução e os arquivos necessários no aparelho que será usado.

## Biblioteca de Bases e Letras em TXT
O catálogo incluído é um recorte da listagem pública do Drive (1.581 MP3s). Para arquivos fora do catálogo, abra a pasta no Drive, baixe a base e use Carregar Áudio/Vídeo. O botão Letras em TXT abre as pastas de letras. Baixe um TXT e use Vincular TXT à música atual. É necessário estar online para buscar arquivos no Drive. Áudios importados e letras vinculadas ficam disponíveis no aparelho para uso offline.

Em Separar Faixas ou Igualar Áudio, use o seletor de músicas das setlists para trabalhar com áudio já salvo. Em Igualar Áudio, é possível selecionar várias faixas. Envie a mixagem ou o lote tratado para uma setlist existente ou nova.
