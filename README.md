# 数据视频工作室

模板化的数据动画视频生成器。浏览器内实时预览，参数可视化调节，模板可导出为 JSON。

## 当前模板

- **GDP 排行 2000–2024**：12 个经济体，世界银行现价美元数据，条形竞赛动画。

## 导出

页面上的「导出 MP4」按钮在**浏览器内**完成全部工作：

1. 逐帧把画面绘制到 Canvas（与预览共用同一套布局计算 `src/model.js` + `src/render.js`）；
2. 用 WebCodecs 硬件编码，Mediabunny 封装成 MP4（H.264，不支持时回退 WebM/VP9）；
3. 直接下载，不上传任何数据。

实测（i5-10210U / Chrome 155）：316 帧 720p，**约 5.6 秒**完成，成片 2.1 MB。
同等内容用无头 Chrome 渲染需要 4–5 分钟。

浏览器要求：Chrome / Edge 94+（WebCodecs）。Safari 16.4+ 部分支持，Firefox 较新版本可用。

## 本地开发

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # 产物在 dist/
npm run preview  # 预览构建结果
```

## 部署

推送到 `main` 分支后，GitHub Actions 自动构建并发布到 GitHub Pages。

首次部署需要：

1. 仓库 Settings → Pages → Source 选择 **GitHub Actions**；
2. 推送代码，等待 Actions 完成；
3. 访问 `https://<用户名>.github.io/data-video-studio/`。

## 模板结构

模板是纯 JSON，`src/GdpRace.jsx` 读取以下字段：

| 字段 | 说明 | 默认 |
|---|---|---|
| `kicker` | 眉标 | 世界银行 · 现价美元 |
| `title` | 标题 | GDP 排行 2000–2024 |
| `footer` | 页脚 | 数据来源…… |
| `accent` | 主色 | `#5ea8ff` |
| `rowHeight` | 行高（px） | 56 |
| `framesPerYear` | 每年占用帧数（速度） | 12 |
| `palette` | 国家名 → 颜色 | 内置 |

## 数据来源

世界银行 [NY.GDP.MKTP.CD](https://data.worldbank.org/indicator/NY.GDP.MKTP.CD)，现价美元，2000–2024。
数据文件 `src/gdp.json` 由 `scripts/make_gdp_data.py` 生成。

## 许可

- 本项目代码：MIT
- 预览由 [Remotion Player](https://www.remotion.dev/player) 驱动，Remotion 对个人及 3 人以下公司免费，商用请遵守 [Remotion License](https://www.remotion.dev/license)。
