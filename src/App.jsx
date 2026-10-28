import React, {useEffect, useMemo, useRef, useState} from 'react';
import {Player} from '@remotion/player';
import {GdpRace, buildDuration} from './GdpRace.jsx';
import {exportVideo, downloadBlob, isExportSupported} from './export.js';

const PRESETS = {
  默认: {},
  中国红: {'中国': '#e23b2e', '美国': '#3b6fd4', '日本': '#c9922e'},
  商务蓝: {'美国': '#2563eb', '中国': '#0ea5e9', '日本': '#6366f1', '德国': '#14b8a6'},
};

const DEFAULTS = {
  kicker: '世界银行 · 现价美元',
  title: 'GDP 排行 2000–2024',
  footer: '数据来源：世界银行 NY.GDP.MKTP.CD · 单位：万亿美元',
  accent: '#5ea8ff',
  rowHeight: 56,
  framesPerYear: 12,
};

const fmt = (f, fps) => {
  const s = f / fps;
  return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
};

export default function App() {
  const [cfg, setCfg] = useState(DEFAULTS);
  const [preset, setPreset] = useState('默认');
  const [palette, setPalette] = useState(PRESETS['默认']);
  const [playing, setPlaying] = useState(true);
  const [frame, setFrame] = useState(0);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState({kind: 'idle', text: ''});
  const playerRef = useRef(null);
  const rafRef = useRef(0);

  const duration = useMemo(() => buildDuration(cfg.framesPerYear, 28), [cfg.framesPerYear]);
  const supported = useMemo(() => isExportSupported(), []);

  const inputProps = useMemo(
    () => ({...cfg, palette, barHeight: Math.round(cfg.rowHeight * 0.68)}),
    [cfg, palette]
  );

  useEffect(() => {
    const tick = () => {
      const p = playerRef.current;
      if (p) {
        try {
          setFrame(p.getCurrentFrame());
        } catch {
          /* 尚未就绪 */
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  useEffect(() => {
    const p = playerRef.current;
    if (!p) return;
    if (playing && !busy) p.play();
    else p.pause();
  }, [playing, busy]);

  const runExport = async () => {
    if (busy) return;
    setBusy(true);
    setProgress(0);
    setStatus({kind: 'progress', text: '正在逐帧绘制并编码…'});
    try {
      const res = await exportVideo({
        cfg,
        palette,
        onProgress: (p) => setProgress(p),
      });
      downloadBlob(res.blob, `gdp-race.${res.ext}`);
      setStatus({
        kind: 'done',
        text: `导出完成 · ${(res.blob.size / 1048576).toFixed(2)} MB · ${res.frames} 帧 · 耗时 ${(
          res.ms / 1000
        ).toFixed(1)} 秒`,
      });
    } catch (err) {
      setStatus({kind: 'error', text: `导出失败：${err?.message || err}`});
    } finally {
      setBusy(false);
    }
  };

  // 自动化测试入口：?export=1 打开即导出，结果写入 #export-status
  useEffect(() => {
    if (!new URLSearchParams(window.location.search).has('export')) return;
    const t = setTimeout(runExport, 600);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const set = (key) => (e) => {
    const raw = e.target.value;
    const num = Number(raw);
    setCfg((c) => ({...c, [key]: key === 'rowHeight' || key === 'framesPerYear' ? num : raw}));
  };

  const seek = (e) => {
    const p = playerRef.current;
    if (!p) return;
    const f = Number(e.target.value);
    p.seekTo(f);
    setFrame(f);
  };

  const downloadTemplate = () => {
    const tpl = {name: 'gdp-race', config: cfg, palette};
    const blob = new Blob([JSON.stringify(tpl, null, 2)], {type: 'application/json'});
    downloadBlob(blob, 'gdp-race.template.json');
  };

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="dot" />
          数据视频工作室
          <span className="tag">beta</span>
        </div>
        <div className="meta">模板 · GDP 排行 2000–2024 · 12 个经济体</div>
      </header>

      <main className="layout">
        <section className="stage">
          <div className="player-wrap">
            <Player
              ref={playerRef}
              component={GdpRace}
              inputProps={inputProps}
              durationInFrames={duration}
              fps={30}
              compositionWidth={1280}
              compositionHeight={720}
              style={{width: '100%', aspectRatio: '16 / 9', display: 'block'}}
              controls={false}
              loop
              clickToPlay={false}
              acknowledgeRemotionLicense
            />
          </div>

          <div className="transport">
            <button className="play" onClick={() => setPlaying((v) => !v)} aria-label="播放/暂停">
              {playing ? '❚❚' : '▶'}
            </button>
            <input
              className="scrub"
              type="range"
              min="0"
              max={String(duration - 1)}
              value={Math.round(frame)}
              onChange={seek}
            />
            <code className="time">
              {fmt(frame, 30)} / {fmt(duration, 30)}
            </code>
          </div>

          <p className="hint">浏览器内实时预览。导出时逐帧绘制到 Canvas，由 WebCodecs 直接编码成 MP4。</p>
        </section>

        <aside className="panel">
          <h2>模板参数</h2>

          <label>
            眉标
            <input value={cfg.kicker} onChange={set('kicker')} />
          </label>
          <label>
            标题
            <input value={cfg.title} onChange={set('title')} />
          </label>
          <label>
            页脚
            <input value={cfg.footer} onChange={set('footer')} />
          </label>

          <label>
            主色
            <span className="row">
              <input type="color" value={cfg.accent} onChange={set('accent')} />
              <code>{cfg.accent}</code>
            </span>
          </label>

          <label>
            动画速度
            <span className="row">
              <input
                type="range"
                min="6"
                max="24"
                step="1"
                value={cfg.framesPerYear}
                onChange={set('framesPerYear')}
              />
              <code>{cfg.framesPerYear} 帧/年</code>
            </span>
          </label>

          <label>
            行高
            <span className="row">
              <input
                type="range"
                min="40"
                max="76"
                step="2"
                value={cfg.rowHeight}
                onChange={set('rowHeight')}
              />
              <code>{cfg.rowHeight}px</code>
            </span>
          </label>

          <div className="presets">
            <span>配色方案</span>
            {Object.keys(PRESETS).map((k) => (
              <button
                key={k}
                className={preset === k ? 'chip active' : 'chip'}
                onClick={() => {
                  setPreset(k);
                  setPalette(PRESETS[k]);
                }}
              >
                {k}
              </button>
            ))}
          </div>

          <button className="primary" onClick={runExport} disabled={busy || !supported}>
            {busy ? `导出中 ${Math.round(progress * 100)}%` : '导出 MP4'}
          </button>

          {busy && (
            <div className="progress">
              <div style={{width: `${progress * 100}%`}} />
            </div>
          )}

          <p id="export-status" className={`status ${status.kind}`}>
            {status.text ||
              (supported ? '导出在本地完成，不上传任何数据' : '当前浏览器不支持 WebCodecs，请用 Chrome / Edge')}
          </p>

          <button className="ghost" onClick={downloadTemplate}>
            下载模板 JSON
          </button>
          <p className="note">
            时长 {(duration / 30).toFixed(1)} 秒 · {duration} 帧 · 1280×720 · 30fps
          </p>
        </aside>
      </main>

      <footer className="foot">
        数据：世界银行 NY.GDP.MKTP.CD（现价美元）· 预览 Remotion Player · 导出 WebCodecs
      </footer>
    </div>
  );
}
