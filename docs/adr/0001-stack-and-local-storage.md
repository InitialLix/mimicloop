# ADR 0001：技术栈与本地持久化

- 状态：Accepted
- 日期：2026-08-16

## 决策

第一阶段采用 Next.js App Router + TypeScript、SQLite + Drizzle ORM、Zod/JSON Schema、Vitest 和 Playwright。应用本地运行，不依赖 API Key，所有正式语料、尝试记录和复习状态持久化到 SQLite。

## 理由

该组合能覆盖中文本地 Web 应用、严格数据边界、可重复 migration、规则测试和关键闭环 E2E，同时不引入账户、云服务或运行时模型依赖。

## 后果

- 数据迁移、导入导出和恢复必须从第一阶段开始测试；
- 不为未来云同步或多用户提前设计复杂基础设施；
- 如需变更技术栈，必须新增 ADR 并证明不会扩大 MVP 范围。
