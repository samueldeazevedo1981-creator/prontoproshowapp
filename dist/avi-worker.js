const base = 'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.10/dist/esm';

self.onmessage = async ({ data }) => {
  try {
    const { default: createCore } = await import(base + '/ffmpeg-core.js');
    const response = await fetch(base + '/ffmpeg-core.wasm');
    if (!response.ok) throw new Error('Conversor indisponível');
    const core = await createCore({ wasmBinary: await response.arrayBuffer() });
    core.setLogger(() => {});
    core.FS.writeFile('input.avi', new Uint8Array(data));
    core.exec('-i', 'input.avi', '-map', '0:v:0', '-map', '0:a:0?',
      '-vf', "scale='min(1280,iw)':'min(720,ih)':force_original_aspect_ratio=decrease:force_divisible_by=2",
      '-c:v', 'libx264', '-preset', 'ultrafast', '-crf', '24', '-pix_fmt', 'yuv420p',
      '-c:a', 'aac', '-b:a', '160k', '-ac', '2', '-movflags', '+faststart', 'output.mp4');
    if (core.ret !== 0) throw new Error('Conversão interrompida');
    const output = core.FS.readFile('output.mp4');
    self.postMessage({ output }, [output.buffer]);
  } catch {
    self.postMessage({ error: true });
  }
};
