import React, {useEffect, useMemo, useRef, useState} from 'react';
import {Player} from '@remotion/player';
import {GdpRace} from './GdpRace.jsx';
import {buildDuration} from './model.js';
import {layoutFor, ASPECTS} from './layout.js';
import {DEFAULT_DATASET, parseCsv, summarize} from './dataset.js';
import {TEMPLATES, findTemplate} from './templates.js';
import {exportVideo, downloadBlob, isExportSupported} from './export.js';

const fmt = (f, fps) => {
  const s = f / fps;
  return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
};

export default function App() {
  const [dataset, setDataset] = useState(DEFAULT_DATASET);
  const [aspect, setAspect] = useState('16:9');
  const [templateId, setTemplateId] = useState('classic');
  const [cfg, setCfg] = useState(() => ({...findTemplate('classic').config}));
  const [palette, setPalette] = useState(() => ({...findTemplate('classic').palette}));
  const [playing, setPlaying] = useState(true);
  const [frame, setFrame] = useState(0);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState({kind: 'idle', text: ''});
  const [dataNote, setDataNote] = useState({kind: 'idle', text: ''});
  const playerRef = useRef(null);
  const rafRef = useRef(0);
  const fileRef = useRef(null);

  const layout = useMemo(() => layoutFor(aspect, cfg.visible), [aspect, cfg.visible]);
  const duration = useMemo(() => buildDuration(dataset, cfg.framesPerYear, 28), [dataset, cfg.framesPerYear]);
  const supported = useMemo(() => isExportSupported(), []);
  const info = useMemo(() => summarize(dataset), [dataset]);

  const inputProps = useMemo(
    () => ({dataset, aspect, palette, ...cfg}),
    [dataset, aspect, palette, cfg]
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

  const applyTemplate = (id) => {
    const t = findTemplate(id);
    setTemplateId(id);
    setCfg((c) => ({...c, ...t.config}));
    setPalette({...t.palette});
  };

  const onCsv = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = parseCsv(text);
      setDataset({...parsed, fileName: file.name});
      setDataNote({kind: 'done', text: `已载入 ${file.name}`});
    } catch (err) {
      setDataNote({kind: 'error', text: `解析失败：${err.message}`});
    } finally {
      e.target.value = '';
    }
  };

  const resetData = () => {
    setDataset(DEFAULT_DATASET);
    setDataNote({kind: 'idle', text: '已恢复内置数据'});
  };

  const runExport = async () => {
    if (busy) return;
    setBusy(true);
    setProgress(0);
    setStatus({kind: 'progress', text: '正在逐帧绘制并编码…'});
    try {
      const res = await exportVideo({cfg, dataset, aspect, palette, onProgress: setProgress});
      downloadBlob(res.blob, `data-video-${aspect.replace(':', 'x')}.${res.ext}`);
      setStatus({
        kind: 'done',
        text: `导出完成 · ${(res.blob.size / 1048576).toFixed(2)} MB · ${res.frames} 帧 · ${(
          res.ms / 1000
        ).toFixed(1)} 秒`,
      });
    } catch (err) {
      setStatus({kind: 'error', text: `导出失败：${err?.message || err}`});
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (!new URLSearchParams(window.location.search).has('export')) return;
    const t = setTimeout(runExport, 600);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const set = (key) => (e) => {
    const raw = e.target.value;
    const num = Number(raw);
    setCfg((c) => ({...c, [key]: key === 'visible' || key === 'framesPerYear' ? num : raw}));
  };

  const seek = (e) => {
    const p = playerRef.current;
    if (!p) return;
    const f = Number(e.target.value);
    p.seekTo(f);
    setFrame(f);
  };

  const downloadTemplate = () => {
    const tpl = {name: templateId, aspect, config: cfg, palette};
    const blob = new Blob([JSON.stringify(tpl, null, 2)], {type: 'application/json'});
    downloadBlob(blob, `${templateId}.template.json`);
  };

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="dot" />
          数据视频工作室
          <span className="tag">beta</span>
        </div>
        <div className="meta">
          {dataset.fileName || '内置数据'} · {info.count} 个对象 · {info.from}–{info.to}
        </div>
      </header>

      <main className="layout">
        <section className="stage">
          <div className="player-wrap" style={{display: 'flex', justifyContent: 'center', background: '#000'}}>
            <Player
              ref={playerRef}
              component={GdpRace}
              inputProps={inputProps}
              durationInFrames={duration}
              fps={30}
              compositionWidth={layout.width}
              compositionHeight={layout.height}
              style={{
                width: '100%',
                maxHeight: '58vh',
                aspectRatio: `${layout.width} / ${layout.height}`,
                display: 'block',
              }}
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

          <p className="hint">
            {layout.width}×{layout.height} · {duration} 帧 · 导出由 WebCodecs 在本地完成
          </p>
        </section>

        <aside className="panel">
          <h2>模板</h2>
          <div className="chips">
            {TEMPLATES.map((t) => (
              <button
                key={t.id}
                className={templateId === t.id ? 'chip active' : 'chip'}
                onClick={() => applyTemplate(t.id)}
              >
                {t.name}
              </button>
            ))}
          </div>

          <h2>画幅</h2>
          <div className="chips">
            {Object.entries(ASPECTS).map(([k, v]) => (
              <button
                key={k}
                className={aspect === k ? 'chip active' : 'chip'}
                onClick={() => { setAspect(k); setCfg((c) => ({...c, visible: ASPECTS[k].visible})); }}
              >
                {v.label}
              </button>
            ))}
          </div>

          <h2>数据</h2>
          <div className="row">
            <button className="ghost" onClick={() => fileRef.current?.click()}>
              导入 CSV
            </button>
            <button className="ghost" onClick={resetData}>
              恢复默认
            </button>
          </div>
          <input ref={fileRef} type="file" accept=".csv,.tsv,.txt" onChange={onCsv} hidden />
          <p className={`status ${dataNote.kind}`}>
            {dataNote.text || `格式：第一行年份，第一列名称。共 ${info.count} 行 × ${info.span} 年`}
          </p>
          <a className="link" href="sample-data.csv" download>
            下载示例 CSV
          </a>

          <h2>文字</h2>
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

          <h2>样式</h2>
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
            显示条数
            <span className="row">
              <input type="range" min="5" max="12" step="1" value={cfg.visible} onChange={set('visible')} />
              <code>{cfg.visible} 条</code>
            </span>
          </label>

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
        </aside>
      </main>

      <footer className="foot">
        数据：{dataset.source || '自定义'} · 预览 Remotion Player · 导出 WebCodecs
      </footer>
    </div>
  );
}
