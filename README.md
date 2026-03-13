# OmniPlan (Prototype)

这是一个基于 **GTD + PARA + 敏捷** 思想的复杂事务管理 CLI 原型，提供多维度任务模型、层级结构、条件依赖等核心设计。

## ✅ 特性

- 任务实体支持多维度字段：时间、紧急度、类别、状态、资源、文稿内容等
- 支持层级任务（父/子任务）和折叠结构
- 内置本地存储（默认为 `.omni-plan/tasks.json`）
- 简易命令行交互：添加 / 列表 / 查看 / 更新 / 完成 / 删除

## 🚀 快速开始（CLI）

```bash
# 安装依赖（仅需 Node.js 环境）
npm install

# 初始化本地存储
npx omni-plan init

# 添加普通任务
npx omni-plan add "写周报" --due=2026-03-13 --priority=high --area=work

# 添加周期任务（每日）
npx omni-plan add "晨间回顾" --type=recurring --recurrence=daily --priority=medium

# 添加习惯打卡任务
npx omni-plan add "每日阅读" --type=habit --window=07:00-09:00 --priority=low

# 列出任务
npx omni-plan list

# 查看任务详情
npx omni-plan show <taskId>
```

## 🖥️ 运行 Web 界面（推荐）

```bash
npm start
```

然后在浏览器中打开：

```
http://localhost:3030
```

Web 界面支持任务列表、看板、紧急矩阵、依赖图、今日建议、习惯打卡、搜索、筛选、详情查看、编辑与删除。
> 如果你希望存储文件在自定义位置，可设置环境变量：
> `OMNIPLAN_DATA=/path/to/tasks.json npx omni-plan list`

## 🧩 目录结构 

- `src/` - 代码逻辑
- `bin/` - 可执行脚本入口
- `.omni-plan/tasks.json` - 默认存储位置（会在第一次 `init` 时自动创建）

---

## 🛠 可拓展方向

- 增加多视图（紧急矩阵、看板、依赖网络等）
- 添加周期任务与条件触发的调度引擎
- 支持插件/自动化 Webhook
- 提供图形化或 Web UI 版本
