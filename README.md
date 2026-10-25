# CDEG × Australia · 成都环境集团澳洲市场研究

Bilingual (EN/中文) report website for the **CDEG–A team, NexStar 2026 Melbourne–Chengdu Sprint**: market research, compliance guide and interactive payback models for Chengdu Environment Group entering Australia.

NexStar 2026 墨尔本–成都项目 **CDEG–A 小组**的中英双语报告网站：为成都环境集团进入澳洲市场提供市场调研、合规指南和互动回本模型。

**Live site 网站：** https://cdeg.ksmarsh.net

---

## How it works · 工作流程

```
edit .qmd → push to main → GitHub Actions runs `quarto render` → _site/ deployed to Aliyun → live at cdeg.ksmarsh.net
修改 .qmd → 推送到 main → GitHub Actions 自动构建 → 部署到阿里云 → 网站更新
```

The site is fully static (no server, no CDN, bundled JS), so it loads inside mainland China.
网站为纯静态（无服务器、无外部 CDN），中国大陆可正常访问。

## Folder layout · 目录结构

```
_quarto.yml   site config, navbar, theme        网站配置、导航栏
index.qmd     home page                         首页
part-a/       business models, one page per line 商业模式（每个业务一页）
part-b/       compliance and approvals           合规与审批
models/       interactive models (Observable JS) 互动模型
appendix/     sources, assumptions, glossary     来源、假设、术语
data/         assumptions.csv, players.csv, sources.csv — the single source of numbers 所有数据的唯一来源
assets/       language toggle, styles, vendor JS 语言切换、样式、本地 JS 库
```

## Editing · 如何编辑

**Small edits 小改动:** open the `.qmd` file on GitHub → pencil icon → edit → *Commit changes*. The site updates in ~2 minutes.
在 GitHub 网页上打开 `.qmd` 文件 → 点铅笔图标 → 修改 → *Commit changes*，约 2 分钟后网站更新。

**Bigger edits 大改动:**

```bash
git clone https://github.com/<owner>/<repo>.git
cd <repo>
quarto preview        # live preview in browser 浏览器实时预览
git pull              # always pull before pushing 推送前先 pull
git add . && git commit -m "Part A: WtE costs" && git push
```

Install Quarto from https://quarto.org/docs/get-started/ (no R or Python needed 无需 R 或 Python).

## Writing rules · 写作规则

- Write every section twice, in `::: {.en}` and `::: {.zh}` blocks. 每部分写中英两版，分别放在 `::: {.en}` 和 `::: {.zh}` 中。
- Unfinished content → `::: {.placeholder}` (yellow box). 未完成内容 → 黄色占位框。
- Unconfirmed facts → `[to verify]{.verify}` / `[待核实]{.verify}`. 未确认的数据要标注。
- Every number goes in `data/assumptions.csv` with a `source_id` from `data/sources.csv`. 所有数字须录入 `assumptions.csv` 并注明来源。
- Check `quarto preview` before pushing a large change: a broken page breaks the deploy. 大改动推送前先本地预览，构建失败会导致网站无法更新。

## ⚠️ Public repo · 公开仓库

This repository is **public**. Do not commit:
本仓库为**公开**仓库，请勿提交：

- CDEG internal documents, meeting notes, or anything shared with us in confidence 集团内部资料、会议记录或保密信息
- Contact details (phone numbers, emails, WeChat IDs) 联系方式
- Passwords, keys or server details — deploy credentials live only in GitHub *Settings → Secrets* 密码、密钥或服务器信息（部署凭证仅存于 GitHub Secrets）

## Status · 进度

- [x] Skeleton pages and language toggle 页面框架与语言切换
- [x] Hosting and auto-deploy 托管与自动部署
- [x] WtE payback model prototype (illustrative numbers) 垃圾发电回本模型原型
- [ ] Link models to `data/assumptions.csv` 模型接入数据表
- [ ] Part A / Part B content 第一、二部分内容
- [ ] Other models 其他模型

---

NexStar 2026 · CDEG–A · Draft — figures marked "to verify" are not final. 草稿：标注"待核实"的数据尚未确定。
