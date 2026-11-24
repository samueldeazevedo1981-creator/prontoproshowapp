(() => {
  const byId = id => document.getElementById(id);
  const dialog = byId('lyricsSearchDialog');
  const search = byId('lyricsSearchInput');
  const status = byId('lyricsSearchStatus');
  const results = byId('lyricsSearchResults');
  const more = byId('lyricsSearchMore');
  const preview = byId('lyricsSearchPreview');
  const link = byId('lyricsSearchLink');
  const pageSize = 30;
  const normalize = value => value.normalize('NFKD').toLowerCase().replace(/\p{M}/gu, '').replace(/[^a-z0-9]+/g, ' ').trim();
  let catalog, matches = [], shown = 0, selection, request = 0;

  async function getJson(file) {
    const response = await fetch('./acervo-letras/' + file);
    if (!response.ok) throw new Error('Acervo indisponível');
    return response.json();
  }

  async function showPreview(row, variant) {
    const version = ++request;
    selection = undefined;
    preview.hidden = true;
    status.textContent = 'Carregando ' + variant + '…';
    try {
      const shard = await getJson(Math.floor(row.index / 100) + '.json');
      const text = shard[row.index % 100]?.[variant];
      if (!text) throw new Error('Sem conteúdo');
      if (version !== request || !dialog.open) return;
      selection = { text, name: row.title };
      byId('lyricsPreviewTitle').textContent = row.title + ' · ' + row.artist;
      byId('lyricsPreviewText').textContent = text;
      preview.hidden = false;
      const track = window.currentLyricsTrack();
      link.disabled = !track;
      status.textContent = track ? 'Faixa selecionada: ' + track : 'Selecione uma faixa de áudio na setlist para vincular.';
      preview.scrollIntoView({ block: 'nearest' });
    } catch {
      if (version === request) status.textContent = 'Não foi possível abrir o arquivo. Verifique a conexão e tente novamente.';
    }
  }

  function addPage() {
    const next = matches.slice(shown, shown + pageSize);
    for (const row of next) {
      const li = document.createElement('li');
      const name = document.createElement('span');
      name.textContent = row.title + ' · ' + row.artist;
      li.append(name);
      for (const [code, variant, caption] of [['L', 'letra', 'Letra'], ['C', 'cifra', 'Cifra']]) {
        if (!row.variants.includes(code)) continue;
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'btn btn-dark';
        button.textContent = caption;
        button.onclick = () => showPreview(row, variant);
        li.append(button);
      }
      results.append(li);
    }
    shown += next.length;
    more.hidden = shown >= matches.length;
  }

  function find() {
    request++;
    selection = undefined;
    preview.hidden = true;
    results.replaceChildren();
    shown = 0;
    if (!catalog) return;
    const query = normalize(search.value);
    const terms = query.split(' ');
    matches = query.length >= 2 ? catalog.filter(row => terms.every(term => row.key.includes(term))) : [];
    status.textContent = query.length < 2 ? 'Digite pelo menos dois caracteres.' :
      matches.length ? matches.length + ' resultado(s).' : 'Nenhuma música encontrada.';
    addPage();
  }

  byId('openLyricsSearch').onclick = async () => {
    dialog.showModal();
    status.textContent = 'Carregando acervo…';
    try {
      if (!catalog) catalog = (await getJson('indice.json')).map(([title, artist, variants], index) =>
        ({ title, artist, variants, index, key: normalize(title + ' ' + artist) }));
      if (dialog.open) {
        find();
        search.focus();
      }
    } catch {
      status.textContent = 'Não foi possível carregar o acervo. Verifique a conexão e reabra a busca.';
    }
  };
  search.oninput = find;
  more.onclick = addPage;
  link.onclick = async () => {
    if (!selection) return;
    link.disabled = true;
    try {
      if (await window.linkSearchedLyrics(selection.text, selection.name)) dialog.close();
    } catch (error) {
      status.textContent = error.message;
    } finally {
      link.disabled = !window.currentLyricsTrack();
    }
  };
})();
