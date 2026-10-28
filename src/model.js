export const FPS = 30;

export const easeInOut = (t) =>
  t <= 0 ? 0 : t >= 1 ? 1 : t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

export const buildDuration = (dataset, framesPerYear = 12, holdFrames = 28) =>
  Math.max(2, (dataset.years.length - 1) * framesPerYear + holdFrames);

/**
 * 预计算每一帧：数值、名次平滑后的行位置、当前最大值、年份标签。
 * 预览（DOM）与导出（Canvas）共用这一份结果，保证画面一致。
 */
export const buildFrames = (dataset, framesPerYear = 12, holdFrames = 28) => {
  const {years, countries} = dataset;
  const N = years.length;
  const total = buildDuration(dataset, framesPerYear, holdFrames);
  const lastStart = (N - 1) * framesPerYear;
  const perFrame = [];

  for (let f = 0; f < total; f++) {
    const idx = Math.min(Math.floor(f / framesPerYear), N - 2);
    const u = f >= lastStart ? 1 : easeInOut((f - idx * framesPerYear) / framesPerYear);
    const vals = countries.map((c) => ({
      code: c.code,
      name: c.name,
      baseColor: c.color,
      v: c.values[idx] + (c.values[idx + 1] - c.values[idx]) * u,
    }));
    const sorted = [...vals].sort((a, b) => b.v - a.v);
    const rank = {};
    sorted.forEach((it, i) => (rank[it.code] = i));
    const yearLabel = String(f >= lastStart ? years[N - 1] : Math.round(years[idx] + u));
    perFrame.push({idx, u, vals, rank, yearLabel, progress: f / Math.max(1, total - 1)});
  }

  const smooth = {};
  countries.forEach((c) => (smooth[c.code] = perFrame[0].rank[c.code]));

  perFrame.forEach((fr) => {
    fr.rows = {};
    countries.forEach((c) => {
      smooth[c.code] += (fr.rank[c.code] - smooth[c.code]) * 0.4;
      fr.rows[c.code] = smooth[c.code];
    });
    fr.maxV = Math.max(...fr.vals.map((v) => v.v), 0.0001) * 1.05;
  });

  return perFrame;
};
