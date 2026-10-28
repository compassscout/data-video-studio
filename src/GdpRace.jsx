import React, {useMemo} from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, Easing} from 'remotion';
import data from './gdp.json';

const FONT = '"Microsoft YaHei", "PingFang SC", "Segoe UI", system-ui, sans-serif';

const easeInOut = (t) =>
  interpolate(t, [0, 1], [0, 1], {
    easing: Easing.inOut(Easing.cubic),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

export const GdpRace = ({
  kicker = '世界银行 · 现价美元',
  title = 'GDP 排行 2000–2024',
  footer = '数据来源：世界银行 NY.GDP.MKTP.CD · 单位：万亿美元',
  accent = '#5ea8ff',
  rowHeight = 56,
  barHeight = 38,
  framesPerYear = 12,
  holdFrames = 28,
  barMaxWidth = 880,
  palette = {},
  top = 212,
  visible = 8,
}) => {
  const frame = useCurrentFrame();
  const {durationInFrames, width, height} = useVideoConfig();

  const years = data.years;
  const N = years.length;
  const lastStart = (N - 1) * framesPerYear;

  const frames = useMemo(() => {
    const total = lastStart + holdFrames;
    const perFrame = [];
    for (let f = 0; f < total; f++) {
      const idx = Math.min(Math.floor(f / framesPerYear), N - 2);
      const u = f >= lastStart ? 1 : easeInOut((f - idx * framesPerYear) / framesPerYear);
      const vals = data.countries.map((c) => ({
        code: c.code,
        name: c.name,
        v: c.values[idx] + (c.values[idx + 1] - c.values[idx]) * u,
      }));
      const sorted = [...vals].sort((a, b) => b.v - a.v);
      const rank = {};
      sorted.forEach((it, i) => (rank[it.code] = i));
      perFrame.push({idx, u, vals, rank});
    }
    const smooth = {};
    data.countries.forEach((c) => (smooth[c.code] = perFrame[0].rank[c.code]));
    perFrame.forEach((fr) => {
      fr.rows = {};
      data.countries.forEach((c) => {
        smooth[c.code] += (fr.rank[c.code] - smooth[c.code]) * 0.4;
        fr.rows[c.code] = smooth[c.code];
      });
    });
    return perFrame;
  }, [framesPerYear, holdFrames, lastStart, N]);

  const st = frames[Math.min(frame, frames.length - 1)];
  const yearLabel = String(frame >= lastStart ? years[N - 1] : Math.round(years[st.idx] + st.u));
  const maxV = Math.max(...st.vals.map((v) => v.v)) * 1.05;
  const barX = 172;

  return (
    <AbsoluteFill
      style={{
        background: 'radial-gradient(120% 100% at 15% 0%, #16233c 0%, #0b1220 45%, #070b14 100%)',
        fontFamily: FONT,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          right: -180,
          top: -220,
          width: 620,
          height: 620,
          borderRadius: '50%',
          background: 'rgba(56,132,255,0.18)',
          filter: 'blur(120px)',
        }}
      />

      <div style={{position: 'absolute', left: 52, top: 40}}>
        <div style={{color: accent, fontSize: 18, letterSpacing: 6, fontWeight: 600}}>{kicker}</div>
        <div style={{color: '#e8eefc', fontSize: 40, fontWeight: 700, marginTop: 8, letterSpacing: 1}}>
          {title}
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          right: 52,
          top: 22,
          color: '#ffffff',
          fontSize: 108,
          fontWeight: 800,
          letterSpacing: -3,
          fontVariantNumeric: 'tabular-nums',
          textShadow: `0 0 50px ${accent}66`,
        }}
      >
        {yearLabel}
      </div>

      <div
        style={{
          position: 'absolute',
          left: barX - 14,
          top: top - 6,
          width: 2,
          height: visible * rowHeight,
          background: `linear-gradient(180deg, ${accent}73, ${accent}0a)`,
        }}
      />

      <div
        style={{
          position: 'absolute',
          left: 0,
          top,
          width: '100%',
          height: visible * rowHeight,
          overflow: 'hidden',
          maskImage: 'linear-gradient(180deg, black 0%, black 92%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(180deg, black 0%, black 92%, transparent 100%)',
        }}
      >
        {data.countries.map((c) => {
          const y = st.rows[c.code] * rowHeight;
          const val = st.vals.find((v) => v.code === c.code).v;
          const barWidth = Math.max(8, (val / maxV) * barMaxWidth);
          const fade = Math.min(1, Math.max(0, visible + 0.3 - st.rows[c.code]));
          if (fade <= 0.001) return null;
          const color = palette[c.name] || c.color;
          return (
            <div key={c.code} style={{position: 'absolute', left: 0, top: y, opacity: fade, width: '100%'}}>
              <div
                style={{
                  position: 'absolute',
                  left: 52,
                  top: 0,
                  width: 104,
                  textAlign: 'right',
                  color: '#dbe6fb',
                  fontSize: 24,
                  fontWeight: 600,
                  lineHeight: `${barHeight}px`,
                  whiteSpace: 'nowrap',
                  textShadow: '0 2px 10px rgba(7,11,20,0.95)',
                }}
              >
                {c.name}
              </div>
              <div
                style={{
                  position: 'absolute',
                  left: barX,
                  width: barWidth,
                  height: barHeight,
                  borderRadius: 6,
                  background: `linear-gradient(90deg, ${color}f0, ${color}88)`,
                  boxShadow: `0 0 24px ${color}33`,
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  left: barX + barWidth + 12,
                  top: 0,
                  color: '#f2f6ff',
                  fontSize: 23,
                  fontWeight: 700,
                  lineHeight: `${barHeight}px`,
                  fontVariantNumeric: 'tabular-nums',
                  whiteSpace: 'nowrap',
                  textShadow: '0 2px 10px rgba(7,11,20,0.95)',
                }}
              >
                {val.toFixed(2)}
                <span style={{fontSize: 15, color: '#8ea6cc', marginLeft: 5, fontWeight: 500}}>万亿</span>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{position: 'absolute', left: 52, bottom: 24, color: '#5c7392', fontSize: 15, letterSpacing: 1}}>
        {footer}
      </div>
      <div style={{position: 'absolute', right: 52, bottom: 24, color: '#3f5470', fontSize: 15, letterSpacing: 1}}>
        Data Video Studio
      </div>
      <div
        style={{
          position: 'absolute',
          left: 0,
          bottom: 0,
          height: 3,
          width: `${(frame / Math.max(1, durationInFrames - 1)) * 100}%`,
          background: `linear-gradient(90deg, ${accent}, #818cf8)`,
        }}
      />
      <div style={{display: 'none'}}>{width}{height}</div>
    </AbsoluteFill>
  );
};

export const buildDuration = (framesPerYear = 12, holdFrames = 28) =>
  (data.years.length - 1) * framesPerYear + holdFrames;
