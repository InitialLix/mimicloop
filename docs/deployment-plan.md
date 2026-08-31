# MimicLoop 评委体验链接与部署计划

- 状态：比赛模式与自动验证已在本地完成；等待创建 GitHub private repository 并连接 Railway
- 更新时间：2026-08-31
- 当前目标：提交一个供评委短期、异步体验的稳定 HTTPS 链接，不等同于正式公开运营
- 推荐架构：**私有 GitHub 仓库 → Railway 单实例 Node.js 服务 → 持久卷 SQLite → DeepSeek 官方 HTTPS API**

---

## 1. 先澄清“部署到 GitHub”

GitHub 在本方案中负责保存经过清理的代码和正式内容 seed、保留版本历史、运行 CI，并在测试通过后触发 Railway 部署。

GitHub Pages 只提供静态网站托管。MimicLoop 依赖 Next.js 服务端渲染、Route Handlers、SQLite 写入、DeepSeek 请求、cookies 和动态学习状态，不能直接改成 GitHub Pages 而不丢失核心功能。

因此评委打开的最终链接应当是 Railway 生成的 HTTPS 域名，而不是 `github.io` 地址。GitHub 仓库可以保持 private；Railway 官方支持从 private GitHub repository 部署并在指定分支 push 后自动构建。

官方依据：

- GitHub Pages 是静态站点托管：https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages
- Next.js Node.js server 支持完整功能，static export 功能有限：项目本地 `node_modules/next/dist/docs/01-app/01-getting-started/17-deploying.md`
- Railway GitHub 部署：https://docs.railway.com/guides/nextjs
- Railway GitHub 自动部署：https://docs.railway.com/deployments/github-autodeploys

---

## 2. 当前仓库审计结果

### 2.1 Git 状态

- 已存在 `.git`；
- 当前分支名为 `master`；
- 当前没有任何 commit；
- 当前没有 GitHub remote；
- 所有项目文件仍显示为 untracked。

因此上线前不是简单执行一次 push，而是需要先完成一次“可部署的初始版本冻结”。建议最终主分支统一为 `main`。

### 2.2 当前忽略规则

已经正确忽略 `.env.local` 等真实环境变量文件、`data/mimicloop.db`、WAL/SHM、`node_modules`、`.next`、测试报告和备份。

仍需修正：

- `sources/raw/` 下的 Simon、IELTS、教材 PDF 当前没有被忽略；
- `artifacts/` 与 `tsconfig.tsbuildinfo` 当前未被忽略；
- `data/source_essays.json` 和 approved seed 需要部署运行，但 candidate、统计与原始处理中间文件不应无选择地全部进入评委版本。

不能把本机 `.env.local`、个人数据库、备份、原始 PDF 或个人学习记录提交到 GitHub。

### 2.3 应用状态

- 当前是完整 Node.js Web 应用，不是静态站；
- `MIMICLOOP_DB_PATH` 已支持把数据库放到外部绝对路径；
- 应用打开数据库时会自动执行 migration；
- 空数据库不会自动导入全部 approved 内容，部署启动时仍需要幂等 bootstrap；
- `/candidates`、候选修改 API 和 `/settings` 当前没有公开访问保护；
- learner 仍固定为 `local-default` / `local-default-learner`，不同访客会共享 Today、进度和 Guided Writing 状态；
- DeepSeek Key 保持在服务端环境变量中，没有进入浏览器或数据库。

---

## 3. 两种部署目标必须分开

### 3.1 本次：评委短期体验链接

- 访问人数少，但评委可能在不同时间打开；
- 需要真实体验 DeepSeek 和写作流程；
- 不要求账号、跨设备同步或长期运营；
- 应当在评审期后关闭或更换访问入口。

本次可以继续使用单实例 SQLite，但必须使用独立比赛数据、隐藏内部维护能力，并解决不同评委互相看到学习状态的问题。

### 3.2 以后：同学长期使用或公开 Beta

未来多人版本才考虑正式账号或匿名用户身份、PostgreSQL、多实例部署、用户数据隔离与删除、隐私政策、长期成本和正式内容授权。不要为了本次短期链接提前重做完整 SaaS 架构。

---

## 4. 本次推荐的最小架构

```text
private GitHub repository
        ↓ push to main after CI
Railway persistent Node.js service
        ├─ Next.js 16 server
        ├─ DeepSeek server-side adapter
        └─ /app/data persistent volume
              └─ sessions/<signed-id>.db
```

### 4.1 为什么选择 Railway

- 支持完整 Next.js Node.js 服务；
- 可以连接 private GitHub repository；
- 支持服务端变量与 sealed secret；
- 支持持久卷，SQLite 可写入 `/app/data`；
- 可以生成 HTTPS 公网域名；
- 支持部署 healthcheck；
- 卷可以手动或定时备份，官方明确支持 SQLite 文件；
- 当前 Hobby 为 5 美元/月并包含等额资源用量；新账号可使用一次性试用额度，但受账号验证和网络限制影响，DeepSeek 外网调用不应押注 limited trial。

官方资料：

- Railway volume：https://docs.railway.com/volumes
- Railway volume backups：https://docs.railway.com/volumes/backups
- Railway healthcheck：https://docs.railway.com/deployments/healthchecks
- Railway variables：https://docs.railway.com/variables
- Railway pricing：https://docs.railway.com/pricing/plans

### 4.2 为什么不优先选择 Vercel / GitHub Pages

- GitHub Pages 不支持服务器端写入与 Route Handlers；
- Vercel 普通运行实例不适合当前 SQLite 持久写入模型；
- 若迁移 Vercel，需要先迁移数据库与运行架构，超出本次最小目标；
- Railway 单实例 + volume 与当前代码距离最近。

---

## 5. 评委之间的状态隔离方案

### 5.1 具体失败场景

当前所有访问者都是同一个 learner。若直接部署：

- 评委 B 会看到评委 A 已完成的 Today；
- 评委 B 可能进入评委 A 写到一半的 Guided Writing；
- 一个人的自评会改变另一个人的复习队列；
- 两个人同时操作同一写作 session 可能产生冲突。

这不是理论上的未来扩展，而是评审链接的直接可靠性问题，因此上线前必须处理。

### 5.2 推荐：每个浏览器一个短期 SQLite 副本

本次不为所有表增加正式账号字段，而是使用轻量 judge session：

1. 首次访问生成随机、签名的 `judge_session_id`，保存在 HttpOnly cookie；
2. 从仓库中的正式 source / approved seeds 幂等初始化独立数据库，不导入候选或个人历史；
3. 当前浏览器的页面和 API 通过统一 connection resolver 使用自己的 DB 文件；
4. DeepSeek Key、正式语料和服务端规则仍由共享代码提供；
5. session DB 在评审期保留，超过设定天数后清理；
6. 单个 session 支持“重新开始体验”，只重建自己的副本。

正式实现前应生成更小的 approved-only 模板，并设置最大 session 数、路径白名单和清理策略。

### 5.3 最快但不推荐的退路

若提交时间极紧，可以只部署一份共享 competition DB，并在页面说明环境会重置。这适合本人远程演示，不适合评委异步自由使用；除非无法按时完成 session 隔离，否则不采用。

---

## 6. 部署前 P0 必做项

### P0-1 Git 与内容清理

- 扩充 `.gitignore`：忽略 `sources/raw/`、原始 PDF、`artifacts/`、`tsconfig.tsbuildinfo`；
- 确认 `.env.local` 和所有 Key 没有进入 Git；
- 确认比赛会话只读取现有 source / approved seeds，不读取候选或本机数据库；
- 不携带个人 attempts、progress、guided-writing draft、trace 或备份；
- 复核提交文件列表和大文件；
- 创建 initial commit 后再创建 private GitHub repository；
- 主分支使用 `main`。

### P0-2 比赛模式与公开表面

新增服务端环境开关，例如 `MIMICLOOP_COMPETITION_MODE=true`：

- `/candidates`、候选修改 API 返回 404；
- 隐藏设置与内部维护入口；
- 页面显示“评审体验环境”而不是“所有数据只在这台电脑”；
- 保留“独立学习工具，与 IELTS 官方无隶属或合作关系”；
- 增加 `robots: noindex, nofollow, noarchive`；
- 不在错误页、日志或响应中泄露绝对路径与 secret。

### P0-3 独立 judge session

- 实现签名 cookie 与统一数据库连接解析；
- 从 template DB 幂等创建 session DB；
- 只允许安全格式的 session ID，不能把 cookie 内容直接拼成任意路径；
- 设置过期与容量上限；
- 浏览器刷新后回到自己的状态；
- 两个无痕窗口必须互不影响。

### P0-4 Railway 启动与持久卷

- Railway volume 挂载到 `/app/data`；
- competition DB root 指向 volume；
- 首次会话请求执行 migration 与 approved-only seed，因为 Railway volume 在 build 阶段不可用；
- 初始化必须幂等：空会话创建，有记录的会话只 migration / 核对 seed，不清空评委状态；
- 应用监听 Railway 注入的 `PORT`；
- 增加 `/api/health`，只检查应用与数据库可读写，不调用 DeepSeek；
- Railway healthcheck 指向 `/api/health`。

### P0-5 DeepSeek 成本与滥用保护

- Railway 中设置 sealed `DEEPSEEK_API_KEY`；
- 开启 Use Evaluator、Guided Writing 与 Adaptive Next Step 所需 feature flags；
- 对 AI API 增加请求体大小限制、session 限额和时间窗口限流；
- 超限、超时或 provider 失败时保留输入并显示确定性 fallback；
- 不把 Key 写入 GitHub Actions、前端变量或备份；
- 评审结束后轮换或撤销本次部署使用的 Key。

### P0-6 内容展示边界

- private GitHub repository 不包含原始 PDF；
- 公开链接只部署比赛需要的正式内容；
- 复核 Simon 完整范文和教材全文在临时评委链接中的展示范围；
- 若无法确认完整公开展示，缩减为代表性文章或使用只有提交链接持有者可进入的访问门；
- 不使用 IELTS 官方 Logo 暗示合作；保留独立工具声明。

---

## 7. P1 建议项

- GitHub Actions：`npm ci → validate content → unit → integration → typecheck → build`；
- Railway 打开 “Wait for CI”，测试失败不自动部署；
- 首页增加一条 3–5 分钟“从这里开始体验”路线；
- AI 关闭或失败时仍能演示 Recall、参考答案、自评和定位；
- 提交前手动备份 Railway volume；
- 使用外部 uptime monitor，因为 Railway healthcheck 只在部署切换时检查；
- 准备录屏或本地正式构建作为链接失效的补充材料；
- 若比赛允许，附 60–90 秒产品演示视频。

---

## 8. 推荐实施顺序

### 阶段 A：冻结可提交仓库

1. 清理 Git 跟踪范围和 secret；
2. 生成 approved-only competition seed；
3. 跑全量测试与生产构建；
4. 创建 initial commit；
5. 创建 private GitHub repo 并 push `main`。

完成标准：从 GitHub clone 到新目录后，不依赖本机文件即可测试、构建和生成干净比赛数据库。

### 阶段 B：完成评审模式

1. competition mode 路由保护；
2. judge session 与独立 DB；
3. AI 限流；
4. health endpoint；
5. noindex、部署文案与体验入口；
6. 自动测试和两个无痕窗口隔离测试。

完成标准：两个浏览器同时学习和写作互不影响；内部审核页面不可访问。

### 阶段 C：Railway 首次部署

1. 连接 private GitHub repo；
2. 添加 volume `/app/data`；
3. 配置环境变量与 sealed secret；
4. 配置 start command 和 healthcheck；
5. 生成 Railway HTTPS domain；
6. 打开 Wait for CI；
7. 首次初始化并检查日志。

完成标准：冷启动、重启和重新部署后数据仍在，页面与日志不泄露 Key 或本机路径。

### 阶段 D：提交前验收

- 桌面 Chrome/Edge与手机窄屏；
- 无痕窗口 A/B 隔离；
- 首页与六页导览；
- 原文 → 句子卡 → 原文定位；
- Sentence / Collocation Recall、Use、DeepSeek；
- 导入自己的 Task 2 新题；
- Guided Writing 至少一个真实 AI 反馈节点；
- 刷新恢复和 AI fallback；
- `/candidates` 与维护 API 不可访问；
- volume 备份与一次恢复；
- 校外网络打开最终链接。

完成标准：没有 Blocker / Major，评委无需阅读额外文档即可完成推荐体验路线。

---

## 9. Railway 环境变量草案

```text
NODE_ENV=production
MIMICLOOP_COMPETITION_MODE=true
MIMICLOOP_COMPETITION_DATA_ROOT=/app/data
MIMICLOOP_USE_EVALUATOR_ENABLED=true
MIMICLOOP_GUIDED_WRITING_ENABLED=true
MIMICLOOP_ADAPTIVE_NEXT_STEP_ENABLED=true
MIMICLOOP_DEEPSEEK_MODEL=deepseek-v4-flash
MIMICLOOP_AI_TIMEOUT_MS=8000
MIMICLOOP_USE_EVALUATOR_CONFIDENCE=0.65
DEEPSEEK_API_KEY=<Railway sealed secret>
MIMICLOOP_SESSION_SIGNING_SECRET=<Railway sealed secret>
```

实际变量名在实现时冻结。Secret 只能在 Railway Variables 中填写，不写入仓库、报名材料或聊天。

---

## 10. 成本与范围判断

- GitHub 使用 private repository；
- Railway 可先检查 Trial 是否具备完整 outbound network；为了 DeepSeek 稳定访问，优先准备 Hobby，当前官方价格 5 美元/月并包含等额资源用量；
- 自定义域名不是必须，Railway 自动 HTTPS 域名可以提交；
- 真正工作量不在“点 Deploy”，而在初次 Git 清理、可复现 seed、评委状态隔离、内部路由保护、AI 限流和云端验收。

本次不迁移账号系统或 PostgreSQL，不做 GitHub Pages 静态阉割版，不公开审核台和 GitHub source，不新增 Band 评分或全文代写，也不以本机 Cloudflare Quick Tunnel 作为最终提交链接。

---

## 11. 当前下一步

实施前只需确认两项外部信息：

1. 报名链接最晚提交时间；
2. 比赛表单是否允许同时填写访问密码/体验说明。

如果只能提交一个 URL，优先使用无需手动输入密码的 judge session + noindex；如果允许附说明，可以再增加访问门。

确认后先执行“阶段 A：冻结可提交仓库”，再进入 competition mode。创建 GitHub repo、推送代码、开通 Railway或产生费用都属于外部状态变更，应在用户明确授权后执行。

---

## 12. 2026-08-31 实施结果

- 已新增 `MIMICLOOP_COMPETITION_MODE`，比赛模式下隐藏设置入口，并让候选页面、候选修改 API 返回 404；
- 首次访问由服务端签发随机 UUID 与 HMAC 签名的 HttpOnly cookie；cookie 不能直接决定文件路径；
- 每个浏览器会话在 `MIMICLOOP_COMPETITION_DATA_ROOT/sessions/` 下使用独立 SQLite 数据库，只自动导入 source、approved cards 与 approved collocations；候选内容和个人本机数据库不进入该会话；
- 会话数据库首次请求自动 migration + 幂等 seed，不再额外生成或发布一份容易失配的 template DB；
- 新增 `/api/health`，只检查服务与比赛数据目录，不调用 DeepSeek；
- 新增每会话与全局小时级 AI 调用上限；超限进入既有模型失败回退，不改变确定性学习进度；
- 比赛模式首页与侧栏明确标注“评审体验 · 独立进度”，并设置 noindex / nofollow / noarchive；
- 新增 GitHub Actions：安装依赖后运行内容校验、单元测试、集成测试、类型检查和生产构建；
- `.env.local`、数据库、原始 PDF、`sources/raw/`、产物目录和本机编译缓存均保持 Git 忽略；
- 自动验证：18 项内容 fixtures、187 个单元测试、49 个集成测试、普通/比赛两种生产构建全部通过；
- 浏览器最小验收：首页能生成干净的 15 项今日队列，设置与候选 API 为 404，健康检查 200，学习入口可进入正式卡，控制台无错误；独立数据库集成测试确认 A 会话修改进度不会改变 B 会话。

Railway 现已不建议新服务使用 `railway.toml` Config as Code，且新服务不能再选择该旧方案；因此 start command、healthcheck 和 volume 将在首次创建服务时直接在 Railway Dashboard 设置，避免提交一个即将失效的配置文件。
