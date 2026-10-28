import {LAYOUT} from './model.js';

const FONT = '"Microsoft YaHei", "PingFang SC", "Segoe UI", system-ui, sans-serif';

const font = (weight, size) => `${weight} ${size}px ${FONT}`;

const roundRect = (ctx, x, y, w, h, r) => {
  const radius = Math.min(r, h / 2, w / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
};

const setSpacing = (ctx, value) => {
  try {
    ctx.letterSpacing = value;
  } catch {
    /* 老浏览器忽略即可 */
  }
};

/**
 * 把某一帧画到 canvas 上。布局常量与 DOM 版保持一致。
 */
export const drawFrame = (ctx, st, cfg, palette = {}) => {
  const {width: W, height: H, barX, barMaxWidth, top, visible, labelX, labelWidth} = LAYOUT;
  const rowHeight = cfg.rowHeight ?? 56;
  const barHeight = Math.round(rowHeight * 0.68);
  const accent = cfg.accent || '#5ea8ff';

  ctx.save();
  ctx.clearRect(0, 0, W, H);

  // 背景
  const bg = ctx.createRadialGradient(W * 0.15, 0, 0, W * 0.15, 0, Math.max(W, H) * 1.25);
  bg.addColorStop(0, '#16233c');
  bg.addColorStop(0.45, '#0b1220');
  bg.addColorStop(1, '#070b14');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // 右上角光晕
  const glow = ctx.createRadialGradient(1150, 90, 0, 1150, 90, 430);
  glow.addColorStop(0, 'rgba(56,132,255,0.18)');
  glow.addColorStop(1, 'rgba(56,132,255,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  // 眉标
  ctx.textBaseline = 'top';
  ctx.textAlign = 'left';
  ctx.fillStyle = accent;
  ctx.font = font(600, 18);
  setSpacing(ctx, '6px');
  ctx.fillText(cfg.kicker || '', 52, 42);
  setSpacing(ctx, '0px');

  // 标题
  ctx.fillStyle = '#e8eefc';
  ctx.font = font(700, 40);
  ctx.fillText(cfg.title || '', 52, 72);

  // 年份
  ctx.textAlign = 'right';
  ctx.fillStyle = '#ffffff';
  ctx.font = font(800, 108);
  ctx.shadowColor = 'rgba(94,168,255,0.45)';
  ctx.shadowBlur = 50;
  ctx.fillText(st.yearLabel, W - 52, 26);
  ctx.shadowBlur = 0;
  ctx.shadowColor = 'transparent';

  // 纵轴基线
  const axisGrad = ctx.createLinearGradient(0, top - 6, 0, top + visible * rowHeight);
  axisGrad.addColorStop(0, `${accent}73`);
  axisGrad.addColorStop(1, `${accent}0a`);
  ctx.fillStyle = axisGrad;
  ctx.fillRect(barX - 14, top - 6, 2, visible * rowHeight);

  // 条形区（裁切 + 底部渐隐）
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, top, W, visible * rowHeight);
  ctx.clip();

  for (const c of st.vals) {
    const row = st.rows[c.code];
    const y = top + row * rowHeight;
    const fade = Math.min(1, Math.max(0, visible + 0.3 - row));
    if (fade <= 0.001) continue;

    const color = palette[c.name] || c.baseColor;
    const barWidth = Math.max(8, (c.v / st.maxV) * barMaxWidth);

    ctx.globalAlpha = fade;

    // 国家名
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#dbe6fb';
    ctx.font = font(600, 24);
    ctx.fillText(c.name, labelX + labelWidth, y + barHeight / 2);

    // 条形
    const barGrad = ctx.createLinearGradient(barX, 0, barX + barWidth, 0);
    barGrad.addColorStop(0, `${color}f0`);
    barGrad.addColorStop(1, `${color}88`);
    ctx.fillStyle = barGrad;
    roundRect(ctx, barX, y, barWidth, barHeight, 6);
    ctx.fill();

    // 数值
    ctx.textAlign = 'left';
    ctx.fillStyle = '#f2f6ff';
    ctx.font = font(700, 23);
    const valText = c.v.toFixed(2);
    ctx.fillText(valText, barX + barWidth + 12, y + barHeight / 2);
    const valWidth = ctx.measureText(valText).width;
    ctx.fillStyle = '#8ea6cc';
    ctx.font = font(500, 15);
    ctx.fillText('万亿', barX + barWidth + 12 + valWidth + 5, y + barHeight / 2);

    ctx.globalAlpha = 1;
  }

  // 底部柔和渐隐
  const mask = ctx.createLinearGradient(0, top + visible * rowHeight * 0.88, 0, top + visible * rowHeight);
  mask.addColorStop(0, 'rgba(7,11,20,0)');
  mask.addColorStop(1, 'rgba(7,11,20,0.95)');
  ctx.fillStyle = mask;
  ctx.fillRect(0, top + visible * rowHeight * 0.88, W, visible * rowHeight * 0.12);

  ctx.restore();

  // 页脚
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left';
  ctx.fillStyle = '#5c7392';
  ctx.font = font(400, 15);
  setSpacing(ctx, '1px');
  ctx.fillText(cfg.footer || '', 52, H - 24);
  setSpacing(ctx, '0px');

  ctx.textAlign = 'right';
  ctx.fillStyle = '#3f5470';
  ctx.fillText('Data Video Studio', W - 52, H - 24);

  // 进度线
  const pg = ctx.createLinearGradient(0, 0, W, 0);
  pg.addColorStop(0, accent);
  pg.addColorStop(1, '#818cf8');
  ctx.fillStyle = pg;
  ctx.fillRect(0, H - 3, W * Math.min(1, st.progress), 3);

  ctx.restore();
};
