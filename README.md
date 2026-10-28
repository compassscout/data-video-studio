# 数据视频工作室

模板化的数据动画视频生成器。浏览器内实时预览，参数可视化调节，模板可导出为 JSON。

## 当前模板

- **GDP 排行 2000–2024**：12 个经济体，世界银行现价美元数据，条形竞赛动画。

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
