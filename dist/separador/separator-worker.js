import * as ort from './vendor/ort/ort.wasm.min.mjs';
import { inferenceThreads, MODEL_WINDOW } from './audio-utils.js';

const modelOrder = ['drums', 'bass', 'other', 'vocals', 'guitar', 'piano'];
ort.env.wasm.numThreads = inferenceThreads(globalThis.crossOriginIsolated, globalThis.navigator?.hardwareConcurrency);
ort.env.wasm.proxy = false;
ort.env.wasm.wasmPaths = new URL('./vendor/ort/', import.meta.url).href;
let session;

async function separate(left, right) {
  const size = left.length;
  if (!size || size !== right.length || size > MODEL_WINDOW) throw new Error('Bloco de áudio inválido.');
  const waveform = new Float32Array(MODEL_WINDOW * 2);
  waveform.set(left);
  waveform.set(right, MODEL_WINDOW);
  const input = new ort.Tensor('float32', waveform, [1, 2, MODEL_WINDOW]);
  const outputs = await session.run({ [session.inputNames[0]]: input });
  const output = outputs[session.outputNames[0]];
  try {
    if (output.dims.join(',') !== [1, modelOrder.length, 2, MODEL_WINDOW].join(',')) {
      throw new Error('Formato de saída incompatível com o modelo de seis faixas.');
    }
    return Object.fromEntries(modelOrder.map((name, index) => {
      const start = index * 2 * MODEL_WINDOW;
      return [name, {
        left: output.data.slice(start, start + size),
        right: output.data.slice(start + MODEL_WINDOW, start + MODEL_WINDOW + size)
      }];
    }));
  } finally {
    input.dispose();
    output.dispose();
  }
}

self.onmessage = async ({ data }) => {
  try {
    if (data.type === 'load') {
      await session?.release();
      session = await ort.InferenceSession.create(data.buffer, {
        executionProviders: ['wasm'],
        graphOptimizationLevel: 'basic'
      });
      self.postMessage({ type: 'ready', threads: ort.env.wasm.numThreads });
    } else if (data.type === 'separate') {
      if (!session) throw new Error('Prepare a IA antes de separar.');
      const result = await separate(data.left, data.right);
      const transfers = Object.values(result).flatMap(track => [track.left.buffer, track.right.buffer]);
      self.postMessage({ type: 'result', result }, transfers);
    }
  } catch (error) {
    self.postMessage({ type: 'error', message: error.message || String(error) });
  }
};
