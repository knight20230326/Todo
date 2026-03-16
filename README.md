# OmniPlan - 全能任务管理系统

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-18+-green.svg" alt="Node.js 18+">
  <img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="License: MIT">
  <img src="https://img.shields.io/badge/Platform-Windows%20%7C%20Linux%20%7C%20macOS-lightgrey.svg" alt="Platform">
</p>

OmniPlan 是一个基于 **GTD + PARA + 敏捷** 思想的复杂事务管理系统，提供多维度任务模型、层级结构、条件依赖等核心设计。支持 CLI 命令行和 Web 界面双模式。

![OmniPlan Screenshot](screenshot.png)

## ✨ 核心特性

### 🎯 多维度任务模型
- **时间维度**：单次任务、周期任务、条件触发、习惯打卡
- **紧急维度**：优先级（紧急/高/中/低/无）、精力消耗
- **类别维度**：领域分类（工作/生活/学习/财务/创意）、标签系统
- **状态维度**：收集/处理/执行/等待/回顾/归档
- **资源维度**：预算、检查清单、阻塞原因

### 🏗️ 层级与依赖
- 支持父子任务层级结构
- 任务间依赖关系管理
- 依赖网络可视化

### 🖥️ 现代化 Web 界面
- **深色/浅色主题**：支持一键切换
- **多视图模式**：列表、看板、紧急矩阵、依赖网络、今日建议、习惯打卡
- **富文本编辑**：支持加粗、颜色、表格、代码块、链接等
- **拖拽排序**：任务顺序跨浏览器同步
- **实时搜索**：支持标题、描述、标签、领域等多字段搜索

### ⌨️ CLI 命令行
- 完整的命令行操作支持
- 快速添加、查看、更新任务
- 本地 JSON 文件存储

## 🚀 快速开始

### 安装

```bash
# 克隆仓库
git clone https://github.com/yourusername/omni-plan.git
cd omni-plan

# 安装依赖
npm install
```

### Web 界面（推荐）

```bash
npm start
```

然后在浏览器中打开：http://localhost:3030

### CLI 命令行

```bash
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

## 📖 使用指南

### Web 界面功能

1. **任务管理**
   - 点击"新建任务"创建任务
   - 拖拽任务调整顺序（自动同步）
   - 点击任务查看详情
   - 富文本编辑器支持 Markdown 和 HTML

2. **视图切换**
   - **列表视图**：传统列表展示
   - **看板视图**：按状态分栏展示
   - **紧急矩阵**：四象限优先级管理
   - **依赖网络**：任务关系可视化
   - **今日建议**：AI 智能推荐今日任务
   - **习惯打卡**：习惯养成追踪

3. **筛选与搜索**
   - 左侧边栏支持按领域、状态筛选
   - 搜索框支持全文搜索

4. **个性化**
   - 点击 🌙/☀️ 切换深色/浅色主题
   - 拖拽分隔线调整面板宽度

### CLI 命令参考

```bash
# 任务操作
npx omni-plan add <title> [options]    # 添加任务
npx omni-plan list [options]           # 列出任务
npx omni-plan show <id>                # 查看详情
npx omni-plan update <id> [options]    # 更新任务
npx omni-plan done <id>                # 完成任务
npx omni-plan delete <id>              # 删除任务

# 选项
--due=DATE          # 截止日期 (YYYY-MM-DD)
--priority=LEVEL    # 优先级: urgent/high/medium/low/none
--area=AREA         # 领域: work/life/study/finance/creativity/general
--type=TYPE         # 类型: single/recurring/condition/habit
--recurrence=RULE   # 重复规则: daily/weekly/monthly
--parent=ID         # 父任务ID
```

## 🛠️ 技术栈

- **后端**：Node.js + 原生 HTTP 模块
- **前端**：原生 JavaScript + CSS3
- **存储**：本地 JSON 文件
- **打包**：pkg（支持多平台可执行文件）

## 📦 构建可执行文件

```bash
# Windows x64
npm run build:win

# Linux x64
npm run build:linux

# macOS x64
npm run build:macos

# Linux ARM64
npm run build:arm64
```

构建后的文件位于 `dist/` 目录。

## 🗂️ 项目结构

```
omni-plan/
├── src/
│   ├── server.js          # Web 服务器
│   ├── cli.js             # CLI 入口
│   ├── store.js           # 数据存储
│   ├── models/
│   │   └── task.js        # 任务模型
│   └── web/               # 前端文件
│       ├── index.html
│       ├── styles.css
│       └── app.js
├── bin/
│   └── omni-plan.js       # CLI 脚本
├── dist/                  # 构建输出
├── .omni-plan/            # 数据存储目录
│   ├── tasks.json
│   └── order.json
└── package.json
```

## ⚙️ 配置

### 自定义数据存储路径

```bash
# 环境变量方式
OMNIPLAN_DATA=/path/to/tasks.json npm start

# 或创建 .env 文件
OMNIPLAN_DATA=/path/to/tasks.json
```

### 自定义端口

```bash
npm start -- --port 8080
```

## 📝 数据备份

任务数据存储在 `.omni-plan/` 目录：
- `tasks.json` - 任务数据
- `order.json` - 任务排序

建议定期备份此目录。

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License

---

<p align="center">
  用 ❤️ 和 ☕ 构建
</p>
