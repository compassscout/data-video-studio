import {
  Output,
  Mp4OutputFormat,
  WebMOutputFormat,
  BufferTarget,
  CanvasSource,
  Quality,
} from 'mediabunny';
import {buildFrames, FPS, LAYOUT} from './model.js';
import {drawFrame} from './render.js';

export const isExportSupported = () =>
  typeof window !== 'undefined' && typeof window.VideoEncoder !== 'undefined';

const CANDIDATES = [
  {codec: 'avc', makeFormat: () => new Mp4OutputFormat(), ext: 'mp4', mime: 'video/mp4'},
  {codec: 'vp9', makeFormat: () => new WebMOutputFormat(), ext: 'webm', mime: 'video/webm'},
];

/**
 * 在浏览器里逐帧绘制 → WebCodecs 编码 → 封装成 MP4。
 * 不经过服务端，也不启动无头浏览器，通常 10 秒视频在 10 秒内完成。
 */
export const exportVideo = async ({cfg, palette, onProgress}) => {
  if (!isExportSupported()) {
    throw new Error('当前浏览器不支持 WebCodecs，请用 Chrome / Edge 打开');
  }

  if (document.fonts?.ready) {
    await document.fonts.ready;
  }

  const frames = buildFrames(cfg.framesPerYear, 28);
  const canvas = document.createElement('canvas');
  canvas.width = LAYOUT.width;
  canvas.height = LAYOUT.height;
  const ctx = canvas.getContext('2d', {willReadFrequently: false});

  const started = performance.now();
  let lastError = null;

  for (const candidate of CANDIDATES) {
    const target = new BufferTarget();
    const output = new Output({format: candidate.makeFormat(), target});
    let source;

    try {
      source = new CanvasSource(canvas, {
        codec: candidate.codec,
        quality: new Quality(0.92),
      });
      output.addVideoTrack(source, {frameRate: FPS});
      await output.start();
    } catch (err) {
      lastError = err;
      try {
        await output.cancel();
      } catch {
        /* 忽略 */
      }
      continue;
    }

    for (let f = 0; f < frames.length; f++) {
      drawFrame(ctx, frames[f], cfg, palette);
      await source.add(f / FPS, 1 / FPS);
      if (onProgress) onProgress((f + 1) / frames.length);
    }

    source.close();
    await output.finalize();

    const buffer = target.buffer;
    if (!buffer) throw lastError || new Error('编码失败：没有产生数据');

    return {
      blob: new Blob([buffer], {type: candidate.mime}),
      ext: candidate.ext,
      frames: frames.length,
      ms: Math.round(performance.now() - started),
    };
  }

  throw lastError || new Error('当前浏览器无法编码视频');
};

export const downloadBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
};
