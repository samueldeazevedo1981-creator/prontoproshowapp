const { songs } = require('../dist/biblioteca-drive.json');
const { songs: videos } = require('../dist/biblioteca-videos.json');
const media = new Map(songs.map(song => [song.id, 'audio/mpeg']));
for (const video of videos) media.set(video.id, /\.avi$/i.test(video.name) ? 'video/x-msvideo' : 'video/mp4');
const chunkSize = 2 * 1024 * 1024;
const maxSize = 100 * 1024 * 1024;

module.exports = async function downloadBase(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).end();
  }
  const { id, offset } = req.query;
  const mime = media.get(id);
  if (!mime) return res.status(404).end();
  if (typeof offset !== 'string' || !/^\d{1,9}$/.test(offset)) return res.status(400).end();
  const start = Number(offset);
  if (start >= maxSize || start % chunkSize !== 0) return res.status(416).end();

  const url = new URL('https://drive.usercontent.google.com/download');
  url.search = new URLSearchParams({ id, export: 'download', confirm: 't' });
  try {
    const upstream = await fetch(url, {
      headers: { Range: 'bytes=' + start + '-' + (start + chunkSize - 1) },
      signal: AbortSignal.timeout(25000),
    });
    const range = /^bytes (\d+)-(\d+)\/(\d+)$/.exec(upstream.headers.get('content-range') || '');
    const type = upstream.headers.get('content-type') || '';
    if (upstream.status !== 206 || !range || !(type.startsWith(mime.split('/')[0] + '/') || type === 'application/octet-stream')) {
      await upstream.body?.cancel();
      return res.status(502).end();
    }
    const [, first, last, length] = range.map(Number);
    if (first !== start || last !== Math.min(start + chunkSize, length) - 1 || length > maxSize) {
      await upstream.body?.cancel();
      return res.status(502).end();
    }
    const audio = Buffer.from(await upstream.arrayBuffer());
    if (audio.length !== last - first + 1) return res.status(502).end();
    res.setHeader('Content-Type', mime);
    res.setHeader('X-Audio-Size', String(length));
    return res.status(200).send(audio);
  } catch {
    return res.status(502).end();
  }
};
