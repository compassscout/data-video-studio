export const TEMPLATES = [
  {
    id: 'classic',
    name: '经典深蓝',
    config: {
      kicker: '世界银行 · 现价美元',
      title: 'GDP 排行 2000–2024',
      footer: '数据来源：世界银行 NY.GDP.MKTP.CD · 单位：万亿美元',
      accent: '#5ea8ff',
      framesPerYear: 12,
      visible: 8,
    },
    palette: {},
  },
  {
    id: 'red',
    name: '中国红',
    config: {
      kicker: '数据排行',
      title: '谁在领跑',
      footer: '数据为示意，可替换为自有 CSV',
      accent: '#ff5a4d',
      framesPerYear: 10,
      visible: 8,
    },
    palette: {'中国': '#e23b2e', '美国': '#3b6fd4', '日本': '#c9922e', '德国': '#2f9e6f'},
  },
  {
    id: 'business',
    name: '商务蓝',
    config: {
      kicker: 'Business Review',
      title: '年度排行',
      footer: '单位见数据表',
      accent: '#3b82f6',
      framesPerYear: 14,
      visible: 8,
    },
    palette: {'美国': '#2563eb', '中国': '#0ea5e9', '日本': '#6366f1', '德国': '#14b8a6'},
  },
  {
    id: 'violet',
    name: '荧光紫',
    config: {
      kicker: 'Data Story',
      title: '趋势与排名',
      footer: 'Data Video Studio',
      accent: '#a78bfa',
      framesPerYear: 16,
      visible: 8,
    },
    palette: {'美国': '#8b5cf6', '中国': '#d946ef', '日本': '#6366f1', '德国': '#22d3ee'},
  },
  {
    id: 'dense',
    name: '紧凑版',
    config: {
      kicker: '快速浏览',
      title: 'Top 10 变化',
      footer: '紧凑排版，适合条目较多的数据',
      accent: '#38bdf8',
      framesPerYear: 8,
      visible: 10,
    },
    palette: {},
  },
];

export const findTemplate = (id) => TEMPLATES.find((t) => t.id === id) || TEMPLATES[0];
