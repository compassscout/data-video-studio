import React, {useMemo} from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {COUNTRIES, LAYOUT, buildFrames, buildDuration} from './model.js';

const FONT = '"Microsoft YaHei", "PingFang SC", "Segoe UI", system-ui, sans-serif';

export {buildDuration};

export const GdpRace = ({
  kicker = '世界银行 · 现价美元',
  title = 'GDP 排行 2000–2024',
  footer = '数据来源：世界银行 NY.GDP.MKTP.CD · 单位：万亿美元',
  accent = '#5ea8ff',
  rowHeight = 56,
  barHeight = Math.round(rowHeight * 0.68),
  framesPerYear = 12,
  holdFrames = 28,
  palette = {},
}) => {
  const frame = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();
  const {barX, barMaxWidth, top, visible, labelX, labelWidth} = LAYOUT;

  const frames = useMemo(() => buildFrames(framesPerYear, holdFrames), [framesPerYear, holdFrames]);
  const st = frames[Math.min(frame, frames.length - 1)];

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
        {st.yearLabel}
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
        {COUNTRIES.map((c) => {
          const row = st.rows[c.code];
          const y = row * rowHeight;
          const val = st.vals.find((v) => v.code === c.code).v;
          const barWidth = Math.max(8, (val / st.maxV) * barMaxWidth);
          const fade = Math.min(1, Math.max(0, visible + 0.3 - row));
          if (fade <= 0.001) return null;
          const color = palette[c.name] || c.color;
          return (
            <div key={c.code} style={{position: 'absolute', left: 0, top: y, opacity: fade, width: '100%'}}>
              <div
                style={{
                  position: 'absolute',
                  left: labelX,
                  top: 0,
                  width: labelWidth,
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
      <div
        style={{position: 'absolute', right: 52, bottom: 24, color: '#3f5470', fontSize: 15, letterSpacing: 1}}
      >
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
    </AbsoluteFill>
  );
};
