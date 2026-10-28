export const ASPECTS = {
  '16:9': {width: 1280, height: 720, visible: 8, label: '横屏 16:9'},
  '9:16': {width: 1080, height: 1920, visible: 12, label: '竖屏 9:16'},
  '1:1': {width: 1080, height: 1080, visible: 9, label: '方形 1:1'},
};

/**
 * 由画幅推导排版：宽度定字号，高度定行数与行高。
 * 同一套模板在横屏 / 竖屏 / 方形下都不会挤在一起。
 */
export const layoutFor = (aspectKey, visibleOverride) => {
  const a = ASPECTS[aspectKey] || ASPECTS['16:9'];
  const {width: W, height: H, visible: defaultVisible} = a;
  const visible = visibleOverride || defaultVisible;

  const fontScale = Math.max(W / 1280, (H / 720) * 0.55);
  const padX = Math.round(W * 0.0406);
  const top = Math.round(H * (aspectKey === '9:16' ? 0.2 : 0.294));
  const bottom = Math.round(H * 0.0745);
  const rowHeight = Math.max(26, Math.round((H - top - bottom) / visible));
  const barHeight = Math.round(rowHeight * 0.68);

  return {
    width: W,
    height: H,
    visible,
    padX,
    top,
    rowHeight,
    barHeight,
    barX: Math.round(W * 0.134),
    barMaxWidth: Math.round(W * 0.6875),
    labelWidth: Math.round(W * 0.0813),
    fontScale,
    fs: {
      kicker: Math.max(10, Math.round(18 * fontScale)),
      title: Math.max(16, Math.round(40 * fontScale)),
      year: Math.max(36, Math.round(108 * fontScale)),
      label: Math.max(12, Math.round(24 * fontScale)),
      value: Math.max(12, Math.round(23 * fontScale)),
      unit: Math.max(9, Math.round(15 * fontScale)),
      footer: Math.max(9, Math.round(15 * fontScale)),
    },
  };
};
