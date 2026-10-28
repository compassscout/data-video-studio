import React, {useMemo} from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {buildFrames} from './model.js';
import {layoutFor} from './layout.js';

const FONT = '"Microsoft YaHei", "PingFang SC", "Segoe UI", system-ui, sans-serif';

export const GdpRace = ({
  dataset,
  aspect = '16:9',
  visible,
  kicker = '世界银行 · 现价美元',
  title = 'GDP 排行 2000–2024',
  footer = '',
  accent = '#5ea8ff',
  framesPerYear = 12,
  holdFrames = 28,
  palette = {},
}) => {
  const frame = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();

  const layout = useMemo(() => layoutFor(aspect, visible), [aspect, visible]);
  const frames = useMemo(
    () => buildFrames(dataset, framesPerYear, holdFrames),
    [dataset, framesPerYear, holdFrames]
  );
  const st = frames[Math.min(frame, frames.length - 1)];

  const {width: W, height: H, padX, top, rowHeight, barHeight, barX, barMaxWidth, labelWidth, fs} = layout;
  const unit = dataset.unit || '';

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
          right: -W * 0.14,
          top: -H * 0.3,
          width: W * 0.48,
          height: W * 0.48,
          borderRadius: '50%',
          background: 'rgba(56,132,255,0.18)',
          filter: `blur(${Math.round(W * 0.09)}px)`,
        }}
      />

      <div style={{position: 'absolute', left: padX, top: H * 0.055}}>
        <div style={{color: accent, fontSize: fs.kicker, letterSpacing: fs.kicker * 0.33, fontWeight: 600}}>
          {kicker}
        </div>
        <div
          style={{
            color: '#e8eefc',
            fontSize: fs.title,
            fontWeight: 700,
            marginTop: Math.round(H * 0.011),
            letterSpacing: 1,
          }}
        >
          {title}
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          right: padX,
          top: H * 0.03,
          color: '#ffffff',
          fontSize: fs.year,
          fontWeight: 800,
          letterSpacing: -3,
          fontVariantNumeric: 'tabular-nums',
          textShadow: `0 0 ${Math.round(fs.year * 0.45)}px ${accent}66`,
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
          height: layout.visible * rowHeight,
          background: `linear-gradient(180deg, ${accent}73, ${accent}0a)`,
        }}
      />

      <div
        style={{
          position: 'absolute',
          left: 0,
          top,
          width: '100%',
          height: layout.visible * rowHeight,
          overflow: 'hidden',
          maskImage: 'linear-gradient(180deg, black 0%, black 90%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(180deg, black 0%, black 90%, transparent 100%)',
        }}
      >
        {dataset.countries.map((c) => {
          const row = st.rows[c.code];
          const y = row * rowHeight;
          const val = st.vals.find((v) => v.code === c.code).v;
          const barWidth = Math.max(8, (val / st.maxV) * barMaxWidth);
          const fade = Math.min(1, Math.max(0, layout.visible + 0.3 - row));
          if (fade <= 0.001) return null;
          const color = palette[c.name] || c.color;
          return (
            <div key={c.code} style={{position: 'absolute', left: 0, top: y, opacity: fade, width: '100%'}}>
              <div
                style={{
                  position: 'absolute',
                  left: padX,
                  top: 0,
                  width: labelWidth,
                  textAlign: 'right',
                  color: '#dbe6fb',
                  fontSize: fs.label,
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
                  fontSize: fs.value,
                  fontWeight: 700,
                  lineHeight: `${barHeight}px`,
                  fontVariantNumeric: 'tabular-nums',
                  whiteSpace: 'nowrap',
                  textShadow: '0 2px 10px rgba(7,11,20,0.95)',
                }}
              >
                {val.toFixed(2)}
                {unit && (
                  <span style={{fontSize: fs.unit, color: '#8ea6cc', marginLeft: 5, fontWeight: 500}}>{unit}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div
        style={{
          position: 'absolute',
          left: padX,
          bottom: H * 0.033,
          color: '#5c7392',
          fontSize: fs.footer,
          letterSpacing: 1,
        }}
      >
        {footer}
      </div>
      <div
        style={{
          position: 'absolute',
          right: padX,
          bottom: H * 0.033,
          color: '#3f5470',
          fontSize: fs.footer,
          letterSpacing: 1,
        }}
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
