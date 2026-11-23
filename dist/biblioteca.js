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
  const chunkSize = 2 * 1024 * 1024;
  const maxSize = 100 * 1024 * 1024;
  const root = byId('bonusRoot');
  const baseRoot = root.href;
  const videoRoot = 'https://drive.google.com/drive/folders/1hntg4JuOrl22WkjaEYBYcirarydtMO9t?usp=drive_link';
  const catalogs = {};
  let kind = 'bases', catalog, limit = pageSize, busy = false, generation = 0;

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
      button.textContent = song.name.replace(/\.(mp3|avi|mp4)$/i, '') + ' · Importar';
      button.disabled = busy;
      button.onclick = () => importSong(song);
      item.append(button);
      return item;
    }));
    more.hidden = matches.length <= limit;
    status.textContent = matches.length + (kind === 'videos' ? ' vídeo(s)' : ' base(s)') + ' neste catálogo. Consulte o Drive para ver a lista completa.';
  }

  async function downloadSong(song) {
    const parts = [];
    let total;
    let offset = 0;
    do {
      const params = new URLSearchParams({ id: song.id, offset });
      const response = await fetch('/api/bonus-base?' + params, {
        signal: AbortSignal.timeout(35000),
      });
      const size = Number(response.headers.get('X-Audio-Size'));
      if (!response.ok || !Number.isSafeInteger(size) || size <= 0 || size > maxSize ||
          (total !== undefined && size !== total)) throw new Error('Download indisponível');
      total = size;
      const part = await response.blob();
      if (part.size !== Math.min(chunkSize, total - offset)) throw new Error('Download incompleto');
      parts.push(part);
      offset += part.size;
      status.textContent = 'Baixando ' + song.name + ' · ' + Math.floor(offset / total * 100) + '%';
    } while (offset < total);
    const type = kind !== 'videos' ? 'audio/mpeg' : (/\.avi$/i.test(song.name) ? 'video/x-msvideo' : 'video/mp4');
    return new File(parts, song.name, { type });
  }

  function showDriveFallback(song) {
    const link = document.createElement('a');
    link.href = 'https://drive.google.com/file/d/' + encodeURIComponent(song.id) + '/view';
    link.target = '_blank';
    link.rel = 'noopener';
    link.textContent = 'Abrir este arquivo no Google Drive';
    const importFile = document.createElement('button');
    importFile.type = 'button';
    importFile.className = 'btn btn-dark';
    importFile.textContent = 'Importar arquivo baixado';
    importFile.onclick = () => {
      dialog.close();
      byId('audioInput').click();
    };
    status.replaceChildren('Não foi possível baixar pelo app. Baixe o arquivo pelo Drive e importe aqui. ', link, ' ', importFile);
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
      const file = await downloadSong(song);
      dialog.close();
      const count = await window.addToShowSetlist([file]);
      if (count) window.showLibraryStatus('Faixa salva no aparelho. Você pode tocar offline.');
    } catch (error) {
      if (dialog.open) showDriveFallback(song);
      else window.showLibraryStatus(window.TCMediaImport.errorMessage(error));
    } finally {
      busy = false;
      songs.querySelectorAll('button').forEach(button => { button.disabled = false; });
    }
  }

  async function open(requested) {
    if (busy) return;
    const current = ++generation;
    kind = requested;
    const lyrics = requested === 'lyrics';
    const videos = requested === 'videos';
    const key = videos ? 'videos' : 'bases';
    title.textContent = lyrics ? 'Letras em TXT' : videos ? 'Biblioteca de Vídeos' : 'Biblioteca de Bases';
    root.href = videos ? videoRoot : baseRoot;
    more.textContent = videos ? 'Ver mais vídeos' : 'Ver mais bases';
    browse.hidden = lyrics;
    lyricFile.hidden = !lyrics;
    links.replaceChildren();
    songs.replaceChildren();
    more.hidden = true;
    status.textContent = 'Carregando catálogo…';
    if (!dialog.open) dialog.showModal();
    try {
      if (!catalogs[key]) {
        const response = await fetch(videos ? './biblioteca-videos.json' : './biblioteca-drive.json');
        if (!response.ok) throw new Error('Catálogo indisponível. Abra a pasta pelo Google Drive.');
        catalogs[key] = await response.json();
      }
      if (current !== generation || !dialog.open) return;
      catalog = catalogs[key];
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
        category.replaceChildren(new Option(videos ? 'Todos os vídeos' : 'Todos os estilos', ''), ...[...new Set(catalog.songs.map(song => song.category))].map(name => new Option(name, name)));
        search.value = '';
        limit = pageSize;
        render();
      }
    } catch (error) {
      if (current === generation && dialog.open) status.textContent = error.message;
    }
  }

  byId('openBonusBases').onclick = () => open('bases');
  byId('openBonusVideos').onclick = () => open('videos');
  byId('openBonusLyrics').onclick = () => open('lyrics');
  byId('closeBonus').onclick = () => dialog.close();
  lyricFile.onclick = () => { dialog.close(); window.chooseShowLyrics(); };
  search.oninput = category.onchange = () => { limit = pageSize; render(); };
  more.onclick = () => { limit += pageSize; render(); };
})();
