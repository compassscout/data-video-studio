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

const spacing = (ctx, value) => {
  try {
    ctx.letterSpacing = value;
  } catch {
    /* 旧浏览器忽略 */
  }
};

/**
 * 把某一帧画到 canvas 上，布局由 layoutFor(aspect) 推导，与 DOM 版共用同一套数值。
 */
export const drawFrame = (ctx, st, cfg, layout, dataset, palette = {}) => {
  const {width: W, height: H, padX, top, visible, rowHeight, barHeight, barX, barMaxWidth, labelWidth, fs} =
    layout;

  const accent = cfg.accent || '#5ea8ff';
  const unit = dataset.unit || '';

  ctx.save();
  ctx.clearRect(0, 0, W, H);

  const bg = ctx.createRadialGradient(W * 0.15, 0, 0, W * 0.15, 0, Math.max(W, H) * 1.25);
  bg.addColorStop(0, '#16233c');
  bg.addColorStop(0.45, '#0b1220');
  bg.addColorStop(1, '#070b14');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  const glow = ctx.createRadialGradient(W * 0.9, H * 0.12, 0, W * 0.9, H * 0.12, W * 0.34);
  glow.addColorStop(0, 'rgba(56,132,255,0.18)');
  glow.addColorStop(1, 'rgba(56,132,255,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  // 眉标
  ctx.textBaseline = 'top';
  ctx.textAlign = 'left';
  ctx.fillStyle = accent;
  ctx.font = font(600, fs.kicker);
  spacing(ctx, `${Math.round(fs.kicker * 0.33)}px`);
  ctx.fillText(cfg.kicker || '', padX, Math.round(H * 0.058));
  spacing(ctx, '0px');

  // 标题
  ctx.fillStyle = '#e8eefc';
  ctx.font = font(700, fs.title);
  ctx.fillText(cfg.title || '', padX, Math.round(H * 0.1));

  // 年份
  ctx.textAlign = 'right';
  ctx.fillStyle = '#ffffff';
  ctx.font = font(800, fs.year);
  ctx.shadowColor = `${accent}80`;
  ctx.shadowBlur = Math.round(fs.year * 0.45);
  ctx.fillText(st.yearLabel, W - padX, Math.round(H * 0.036));
  ctx.shadowBlur = 0;
  ctx.shadowColor = 'transparent';

  // 纵轴
  const axis = ctx.createLinearGradient(0, top - 6, 0, top + visible * rowHeight);
  axis.addColorStop(0, `${accent}73`);
  axis.addColorStop(1, `${accent}0a`);
  ctx.fillStyle = axis;
  ctx.fillRect(barX - 14, top - 6, 2, visible * rowHeight);

  // 条形区
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

    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#dbe6fb';
    ctx.font = font(600, fs.label);
    ctx.fillText(c.name, padX + labelWidth, y + barHeight / 2);

    const grad = ctx.createLinearGradient(barX, 0, barX + barWidth, 0);
    grad.addColorStop(0, `${color}f0`);
    grad.addColorStop(1, `${color}88`);
    ctx.fillStyle = grad;
    roundRect(ctx, barX, y, barWidth, barHeight, 6);
    ctx.fill();

    ctx.textAlign = 'left';
    ctx.fillStyle = '#f2f6ff';
    ctx.font = font(700, fs.value);
    const valText = c.v.toFixed(2);
    ctx.fillText(valText, barX + barWidth + 12, y + barHeight / 2);

    if (unit) {
      const valWidth = ctx.measureText(valText).width;
      ctx.fillStyle = '#8ea6cc';
      ctx.font = font(500, fs.unit);
      ctx.fillText(unit, barX + barWidth + 12 + valWidth + 5, y + barHeight / 2);
    }

    ctx.globalAlpha = 1;
  }

  // 底部渐隐
  const maskTop = top + visible * rowHeight * 0.9;
  const mask = ctx.createLinearGradient(0, maskTop, 0, top + visible * rowHeight);
  mask.addColorStop(0, 'rgba(7,11,20,0)');
  mask.addColorStop(1, 'rgba(7,11,20,0.95)');
  ctx.fillStyle = mask;
  ctx.fillRect(0, maskTop, W, top + visible * rowHeight - maskTop);

  ctx.restore();

  // 页脚
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left';
  ctx.fillStyle = '#5c7392';
  ctx.font = font(400, fs.footer);
  ctx.fillText(cfg.footer || '', padX, H - Math.round(H * 0.033));
  ctx.textAlign = 'right';
  ctx.fillStyle = '#3f5470';
  ctx.fillText('Data Video Studio', W - padX, H - Math.round(H * 0.033));

  const pg = ctx.createLinearGradient(0, 0, W, 0);
  pg.addColorStop(0, accent);
  pg.addColorStop(1, '#818cf8');
  ctx.fillStyle = pg;
  ctx.fillRect(0, H - 3, W * Math.min(1, st.progress), 3);

  ctx.restore();
};
