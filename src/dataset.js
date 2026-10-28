import gdp from './gdp.json';

export const PALETTE_POOL = [
  '#4f8ef7', '#f2554d', '#f0a733', '#2ecc8f', '#9b6cf0', '#22c3d6',
  '#ef5da8', '#a3d635', '#f97b3d', '#8b96a8', '#19b8a6', '#b07cf5',
];

export const DEFAULT_DATASET = {
  ...gdp,
  unit: '万亿',
  source: '世界银行 NY.GDP.MKTP.CD · 现价美元',
};

/** 补齐空值：先向后沿用，再向前沿用 */
const fill = (values) => {
  const out = [...values];
  for (let i = 1; i < out.length; i++) if (out[i] === null || out[i] === undefined) out[i] = out[i - 1];
  for (let i = out.length - 2; i >= 0; i--) if (out[i] === null || out[i] === undefined) out[i] = out[i + 1];
  return out.map((v) => (Number.isFinite(v) ? Number(v) : 0));
};

/**
 * 解析 CSV / TSV：
 *   第一行表头 = 年份（第一列可以写“名称”），每一行 = 一个对象。
 * 例：
 *   名称,2000,2001
 *   中国,1.21,1.34
 */
export const parseCsv = (text) => {
  const raw = text.replace(/^\uFEFF/, '').trim();
  if (!raw) throw new Error('文件是空的');

  const lines = raw.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) throw new Error('至少需要表头 + 一行数据');

  const delimiter = lines[0].includes('\t') ? '\t' : ',';
  const header = lines[0].split(delimiter).map((s) => s.trim());
  const yearCells = header.slice(1);

  if (yearCells.length < 2) throw new Error('表头至少要有两个年份列');
  const years = yearCells.map((y) => Number(y.replace(/[^\d.-]/g, '')));
  if (years.some((y) => !Number.isFinite(y))) {
    throw new Error('表头第一行必须是年份，例如：名称,2000,2001,2002');
  }

  const countries = lines.slice(1).map((line, i) => {
    const cells = line.split(delimiter).map((s) => s.trim());
    const name = cells[0] || `对象 ${i + 1}`;
    const values = fill(
      years.map((_, j) => {
        const cell = cells[j + 1];
        if (cell === undefined || cell === '') return null;
        const v = Number(String(cell).replace(/[,\s]/g, '').replace(/[^\d.eE+-]/g, ''));
        return Number.isFinite(v) ? v : null;
      })
    );
    return {
      code: `c${i}`,
      name,
      color: PALETTE_POOL[i % PALETTE_POOL.length],
      values: values.map((v) => Number(v.toFixed(3))),
    };
  });

  if (countries.length < 2) throw new Error('至少要有两个对象才能做排行');

  return {
    years,
    countries,
    unit: '',
    source: '自定义数据',
    fileName: '',
  };
};

export const summarize = (dataset) => {
  const years = dataset.years;
  return {
    count: dataset.countries.length,
    from: years[0],
    to: years[years.length - 1],
    span: years.length,
  };
};
