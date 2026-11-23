(() => {
  const select = document.getElementById('showRepertoire');
  if (!select || window.parent === window) return;
  const refresh = () => {
    const chosen = new Set([...select.selectedOptions].map(option => option.value));
    const entries = window.parent.listShowAudio?.() || [];
    select.replaceChildren(...entries.map(({ id, name, setlist }) => {
      const option = new Option(setlist + ' · ' + name, id);
      option.selected = chosen.has(id);
      return option;
    }));
    if (!select.multiple && !chosen.size) select.selectedIndex = -1;
  };
  select.addEventListener('focus', refresh);
  window.refreshShowRepertoire = refresh;
  refresh();
})();
