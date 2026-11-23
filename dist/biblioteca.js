(() => {
  const byId = id => document.getElementById(id);
  const dialog = byId('bonusLibrary');
  const title = byId('bonusTitle');
  const status = byId('bonusStatus');
  const browse = byId('bonusBrowse');
  const search = byId('bonusSearch');
  const category = byId('bonusCategory');
  const more = byId('bonusMore');
  const links = byId('bonusLinks');
  const songs = byId('bonusSongs');
  const lyricFile = byId('bonusLyricFile');
  const pageSize = 40;
  let catalog, limit = pageSize, busy = false, generation = 0;

  const folderUrl = id => 'https://drive.google.com/drive/folders/' + encodeURIComponent(id);
  const searchKey = value => value.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();

  function render() {
    const term = searchKey(search.value.trim());
    const matches = catalog.songs.filter(song =>
      (!category.value || song.category === category.value) && searchKey(song.name).includes(term));
    songs.replaceChildren(...matches.slice(0, limit).map(song => {
      const item = document.createElement('li');
      const button = document.createElement('button');
      button.className = 'btn btn-dark bonus-song';
      button.type = 'button';
      button.textContent = song.name.replace(/\.mp3$/i, '') + ' · Importar';
      button.disabled = busy;
      button.onclick = () => importSong(song);
      item.append(button);
      return item;
    }));
    more.hidden = matches.length <= limit;
    status.textContent = matches.length + ' base(s) neste catálogo. Consulte o Drive para ver a lista completa.';
  }

  async function importSong(song) {
    if (busy) return;
    if (!navigator.onLine) {
      status.textContent = 'Conecte-se à internet para importar esta base.';
      return;
    }
    busy = true;
    render();
    status.textContent = 'Baixando ' + song.name + '…';
    try {
      const url = new URL('https://drive.usercontent.google.com/download');
      url.searchParams.set('id', song.id);
      url.searchParams.set('export', 'download');
      const response = await fetch(url, { mode: 'cors', credentials: 'omit', signal: AbortSignal.timeout(120000) });
      const type = response.headers.get('Content-Type') || '';
      if (!response.ok || !/^(audio\/|application\/octet-stream)/i.test(type)) {
        throw new Error('O Drive não liberou o arquivo. Abra a pasta no Drive e escolha o MP3.');
      }
      const contents = await response.blob();
      if (!contents.size) throw new Error('O Drive devolveu um arquivo vazio.');
      dialog.close();
      const count = await window.addToShowSetlist([new File([contents], song.name, { type: 'audio/mpeg' })]);
      if (count) window.showLibraryStatus('Faixa salva no aparelho. Você pode tocar offline.');
    } catch (error) {
      if (dialog.open) status.textContent = error.message;
      else window.showLibraryStatus(error.message);
    } finally {
      busy = false;
      songs.querySelectorAll('button').forEach(button => { button.disabled = false; });
    }
  }

  async function open(kind) {
    if (busy) return;
    const current = ++generation;
    const lyrics = kind === 'lyrics';
    title.textContent = lyrics ? 'Letras em TXT' : 'Biblioteca de Bases';
    browse.hidden = lyrics;
    lyricFile.hidden = !lyrics;
    links.replaceChildren();
    songs.replaceChildren();
    more.hidden = true;
    status.textContent = 'Carregando catálogo…';
    if (!dialog.open) dialog.showModal();
    try {
      if (!catalog) {
        const response = await fetch('./biblioteca-drive.json');
        if (!response.ok) throw new Error('Catálogo indisponível. Abra a pasta pelo Google Drive.');
        catalog = await response.json();
      }
      if (current !== generation || !dialog.open) return;
      const folders = lyrics ? catalog.lyrics : catalog.folders;
      for (const folder of folders) {
        const anchor = document.createElement('a');
        anchor.href = folderUrl(folder.id);
        anchor.target = '_blank';
        anchor.rel = 'noopener';
        anchor.textContent = folder.name;
        links.append(anchor);
      }
      if (lyrics) {
        status.textContent = 'Escolha uma letra no Drive, baixe o TXT e toque em Vincular TXT à música atual.';
      } else {
        category.replaceChildren(new Option('Todos os estilos', ''), ...[...new Set(catalog.songs.map(song => song.category))].map(name => new Option(name, name)));
        search.value = '';
        limit = pageSize;
        render();
      }
    } catch (error) {
      if (current === generation && dialog.open) status.textContent = error.message;
    }
  }

  byId('openBonusBases').onclick = () => open('bases');
  byId('openBonusLyrics').onclick = () => open('lyrics');
  byId('closeBonus').onclick = () => dialog.close();
  lyricFile.onclick = () => { dialog.close(); window.chooseShowLyrics(); };
  search.oninput = category.onchange = () => { limit = pageSize; render(); };
  more.onclick = () => { limit += pageSize; render(); };
})();
