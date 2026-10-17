<a id="readme-top"></a>

[![License: MIT][license-shield]][license-url]
[![Nuxt][nuxt-shield]][nuxt-url]
[![Vue][vue-shield]][vue-url]
[![Nuxt UI][nuxtui-shield]][nuxtui-url]
[![pnpm][pnpm-shield]][pnpm-url]

<br />

<div align="center">
  <h3 align="center">DeepSeek 搜索交互工具</h3>
  <p align="center">
    用自己填写的 API Key，在浏览器里直接调用 DeepSeek Search API 并查看结构化结果。
    <br />
    <a href="https://github.com/tangge233/ds-search-interface/issues/new">报告问题</a>
    ·
    <a href="https://github.com/tangge233/ds-search-interface/issues/new">请求功能</a>
  </p>
</div>

## 目录

- [功能特性](#功能特性)
- [快速开始](#快速开始)
- [使用说明](#使用说明)
- [配置](#配置)
- [注意事项](#注意事项)
- [部署](#部署)
- [参与开发](#参与开发)
- [许可证](#许可证)

## 功能特性

- **自带 API Key**：Key 只保存在浏览器 `localStorage`，不经过任何自建服务端。
- **浏览器直连**：搜索请求从当前浏览器直接发往你填写的 API 地址，默认是 DeepSeek 官方接口。
- **语法补全**：输入 `site:`、`lang:`、`after:`、`-"…"` 这类语法时给出候选；↑↓ 选择，Tab 或 Enter 插入，Esc 关闭。
- **高级语法生成器**：结构化填写关键词、精确短语、排除项、站点、语言与时间，预览生成的搜索词后一键写入并搜索；也能把搜索框里的现有查询反解析回表单。
- **结果阅读**：显示相关度得分与权威性评级；长摘要在浮动面板中查看并可复制；可原地展开网页正文并复制；一键复制链接或在新标签打开。
- **本地筛选与排序**：只看优质结果（相关度 ≥ 1.5）、按权威性或发布时间排序；这些都在本地进行，不额外计费。
- **三种结果布局**：居中单列、靠左单列、宽屏多列（≥1024px 并排两列）。
- **中英双语**：简体中文与英文可即时切换，选择保存在本机，首次访问跟随浏览器语言。
- **主题**：浅色 / 深色，首次访问跟随系统，手动切换后记住选择。
- **搜索记录**：保留最近 12 条，可一键清除，也可在配置里关闭记录功能。
- **可分享链接**：查询词写入地址栏的 `?q=`，刷新或分享该链接会自动重跑这次搜索。
- **纯静态**：构建产物是一组静态文件，不需要 Node 运行时。

## 快速开始

### 前置要求

| 依赖 | 版本 |
| --- | --- |
| Node.js | `^22.22.3 \|\| ^24.15.0 \|\| >=26` |
| pnpm | 12 或更高 |
| DeepSeek API Key | 在 [platform.deepseek.com](https://platform.deepseek.com/api_keys) 创建 |

### 安装

```bash
git clone git@github.com:tangge233/ds-search-interface.git
cd ds-search-interface
pnpm install
```

### 启动

```bash
pnpm dev        # http://localhost:3000
```

## 使用说明

1. 打开页面，点右上角「设置 API Key」，填入 Key 后点「保存连接设置」。
   想先确认 Key 可用，点「校验凭据」——它只验证凭据，不产生搜索计费。
2. 在搜索框输入关键词或搜索语法，回车开始搜索。
3. 需要组合条件时，点工具栏的「高级语法」：在浮动面板里填写条件，确认「生成的搜索词」无误后点「写入并搜索」。
   若搜索框里已有查询，点「从搜索框解析」可以把它拆进表单。
4. 结果左侧数字是当前排序下的展示序号；每行可查看长摘要、展开正文、复制链接或直接打开。

### 支持的搜索语法

| 语法 | 示例 | 作用 |
| --- | --- | --- |
| `site:` | `vLLM 部署 site:github.com` | 只在这些站点内搜索，多个站点用 OR 连接 |
| `-site:` | `DeepSeek -site:example.com` | 排除这些站点 |
| `"…"` | `DeepSeek "精确短语"` | 精确匹配短语 |
| `-…` | `DeepSeek -广告` | 排除包含该关键词的网页 |
| `-"…"` | `DeepSeek -"release notes"` | 排除包含该短语的网页 |
| `lang:` | `模型 发布 lang:zh,en` | 限定语言，多种语言用逗号分隔 |
| `after:` | `DeepSeek 发布 after:2025-01-01` | 只保留该日期之后发布的网页 |
| `before:` | `DeepSeek 发布 before:2026` | 只保留该日期之前发布的网页 |

语法细节以 [DeepSeek 官方文档](https://api-docs.deepseek.com/zh-cn/guides/search) 为准。

## 配置

顶栏「设置」里分为三个可修改的分区：

| 分区 | 项目 | 生效方式 |
| --- | --- | --- |
| 连接 | API Key、API 地址、校验凭据、清除本机 Key | 填好后点「保存连接设置」 |
| 默认搜索参数 | 返回条数、排序方式、本地化 IP、返回网页正文、只看优质结果 | 立即生效 |
| 界面与记录 | 结果布局、界面语言、保留搜索记录 | 立即生效 |

「默认搜索参数」与结果页工具栏是同一份配置：在弹窗里改，工具栏会同步显示；工具栏的「恢复默认参数」只重置这一组。

配置只保存在当前浏览器，换浏览器或清除站点数据后需要重新填写。

## 注意事项

- **计费**：Search 按请求次数计费——每 1000 次成功请求 5 元，只有返回了结果的请求才计费；`count` 只控制条数，不影响单价。DeepSeek 保留调整价格的权利，具体价格与扣费规则以
  [官方计费文档](https://api-docs.deepseek.com/zh-cn/quick_start/pricing#%E7%BD%91%E9%A1%B5%E6%90%9C%E7%B4%A2%E4%B8%8E%E6%8A%93%E5%8F%96%E4%BB%B7%E6%A0%BC) 为准。
- **限速**：账号级 5 QPS。触发限速时页面会提示，稍后重试即可；限速细节见
  [官方接口指南](https://api-docs.deepseek.com/zh-cn/guides/search)。
- **数据流向**：本工具不经过任何自建服务端。除按你的配置把 API Key 与搜索词发送给你填写的 API 地址之外，不会把数据发往别处；配置与搜索记录只存在本机 `localStorage`。
- **Key 安全**：Key 以明文存放在 `localStorage`，同源的脚本都能读到。请勿在仓库或代码里写死 Key；公共电脑上用完后点「清除本机 Key」。
- **结果使用**：搜索内容由 DeepSeek Search API 返回，本工具只负责展示，不对内容准确性负责；API 费用与使用方式由使用者自行判断和承担。
- **界面语言**：支持简体中文与英文，在「设置 → 界面与记录 → 界面语言」切换，选择保存在本机；首次访问按浏览器语言自动选择。搜索语法（`site:`、`lang:` 等）与返回内容不受界面语言影响。

## 部署

```bash
pnpm generate     # 产物在 .output/public
```

把 `.output/public` 交给任意静态托管即可。若要部署在子路径下（例如 `https://example.com/search/`），在 `nuxt.config.ts` 里补上 `app.baseURL`：

```ts
export default defineNuxtConfig({
  app: { baseURL: '/search/' }
})
```

## 参与开发

欢迎提交 Issue 和 PR。

### 常用脚本

| 命令 | 作用 |
| --- | --- |
| `pnpm dev` | 启动开发服务器 |
| `pnpm lint` | ESLint 检查 |
| `pnpm typecheck` | 类型检查（vue-tsc） |
| `pnpm test` | 单元测试（vitest，覆盖查询语法、参数校验、响应归一化等纯函数） |
| `pnpm build` | 构建为 Node 运行时产物（`.output/server`） |
| `pnpm generate` | 构建为静态产物（`.output/public`） |
| `pnpm preview` | 预览 `pnpm build` 的产物 |

提交前请先跑通：

```bash
pnpm lint && pnpm typecheck && pnpm test
```

### 约定

- 代码注释使用中文；界面文案放在 `i18n/locales/`，不要在组件里写死中文。
- 注释只写代码本身说不清的部分（约束、取舍、容易踩的坑），不要复述代码。
- 界面文案要说清下一步能做什么，不写营销腔。
- 面向用户的改动请在 PR 里附上验证方式（复现步骤或截图）。
- 一个 PR 只解决一件事。

### 新增界面语言

界面文案全部在 `i18n/locales/`，两种语言的 key 必须完全一致（`tests/locales.spec.ts` 会校验 key 集合、插值占位符与解析结果）。新增语言需要三步：

1. 复制 `i18n/locales/en.json` 为 `<code>.json` 并翻译，不要增删 key。
2. 在 `nuxt.config.ts` 的 `i18n.locales` 里登记语言代码与文件名。
3. 在 `app/utils/locales.ts` 的 `APP_LOCALES` 里补上语言代码与它的本地名称（语言切换器用），再跑 `pnpm test`。

### 反馈问题

请附上浏览器版本、复现步骤和报错文本。与 API 返回内容或计费有关的问题，请一并说明你填写的是官方地址还是自建地址。

## 许可证

以 MIT 许可证发布，详见 [LICENSE](LICENSE)。

<p align="right">(<a href="#readme-top">回到顶部</a>)</p>

<!-- 链接 -->

[license-shield]: https://img.shields.io/badge/License-MIT-blue.svg
[license-url]: https://github.com/tangge233/ds-search-interface/blob/main/LICENSE
[nuxt-shield]: https://img.shields.io/badge/Nuxt-4-00DC82?logo=nuxt&logoColor=white
[nuxt-url]: https://nuxt.com
[vue-shield]: https://img.shields.io/badge/Vue-3-4FC08D?logo=vuedotjs&logoColor=white
[vue-url]: https://vuejs.org
[nuxtui-shield]: https://img.shields.io/badge/Nuxt%20UI-4-00DC82
[nuxtui-url]: https://ui.nuxt.com
[pnpm-shield]: https://img.shields.io/badge/pnpm-12-F69220?logo=pnpm&logoColor=white
[pnpm-url]: https://pnpm.io
