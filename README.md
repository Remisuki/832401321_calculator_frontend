# 算页计算器 · Frontend

基于 HTML、CSS 和原生 JavaScript 的计算器前端。通过 HTTP/JSON API 调用后端完成表达式计算、历史查询和记录删除，前端不执行表达式求值。

[在线演示](http://193.112.23.200:8080/) · [后端仓库](https://github.com/Remisuki/832401321_calculator_backend) · [接口文档](https://github.com/Remisuki/832401321_calculator_backend/blob/main/API.md) · [代码规范](codestyle.md)

## 项目简介

本项目为软件工程课程“前后端分离计算器系统”作业的前端实现。前后端分别维护在独立仓库中，职责划分如下：

- **前端**：表达式输入、按钮与键盘交互、接口请求、结果与错误展示、历史列表管理。
- **后端**：输入校验、表达式解析与计算、异常处理、数据库持久化及记录删除。

作业要求：[First Assignment — Front-End and Back-End Separation Calculator System](https://bbs.csdn.net/topics/620530837)。

## 功能

- 支持按钮和键盘输入，以及括号、小数、退格和清空。
- 展示后端返回的四则运算、复合表达式和一元正负号计算结果。
- 展示非法表达式、除零、网络异常和超时提示。
- 历史记录按页加载，每页 5 条，支持刷新、表达式复用和指定删除。
- 输入变化时清除旧结果，请求期间禁止重复提交。
- 响应式布局，适配桌面与移动端；提供键盘焦点和动态状态提示。

## 技术栈

| 技术 | 用途 |
|---|---|
| HTML5 | 页面结构与语义化控件 |
| CSS | 布局、样式与响应式适配 |
| JavaScript | 交互逻辑与状态管理 |
| Fetch API | HTTP 请求与 JSON 通信 |
| AbortController | 请求超时控制 |

项目无构建步骤，不依赖前端框架或 Node.js。

## 目录结构

```text
.
├── index.html       # 页面结构
├── styles.css       # 样式与响应式布局
├── app.js           # 交互、接口调用与历史管理
├── config.js        # 本地开发配置
├── start.bat        # Windows 本地静态服务
├── codestyle.md     # 代码规范
├── LOCAL_GUIDE.md   # 本地使用补充说明
└── README.md
```

## 快速开始

### 环境要求

- 支持 Fetch API 的现代浏览器。
- Python 3.9+，用于本地静态服务和后端基础运行；推荐 Python 3.12 或 3.13。
- Git，或直接下载两个仓库的源代码压缩包。

### 获取代码

```powershell
git clone https://github.com/Remisuki/832401321_calculator_frontend.git
git clone https://github.com/Remisuki/832401321_calculator_backend.git
```

### 启动后端

在后端仓库目录执行：

```powershell
python app.py
```

默认 API 地址为 `http://localhost:5000/api`。该本地模式使用 Python 标准库，首次启动自动初始化 SQLite 数据库。

### 启动前端

在另一个终端进入前端仓库目录，执行：

```powershell
python -m http.server 5500 --bind 127.0.0.1
```

访问 <http://localhost:5500/>。前端应通过 HTTP 服务加载，不使用 `file://` 直接打开页面。

## 配置

本地配置位于 `config.js`：

```javascript
window.CALCULATOR_CONFIG = Object.freeze({
  apiBaseUrl: "http://localhost:5000/api",
  requestTimeoutMs: 90000,
});
```

| 配置项 | 含义 |
|---|---|
| `apiBaseUrl` | 后端 API 基地址，包含结尾的 `/api` |
| `requestTimeoutMs` | 请求超时时间，单位为毫秒 |

更改前端服务地址时，应同步调整后端允许的浏览器来源。来源由协议、主机和端口组成，不包含页面路径。

前端不保存数据库连接信息，也不依赖 LocalStorage 保存计算历史。数据库初始化和管理由后端负责。

## 在线部署

当前演示站部署于腾讯云 Windows Server，采用 **Flask + Waitress + SQLite**，访问地址为：

**<http://193.112.23.200:8080/>**

前端文件部署在 `C:\Calculator\frontend`，由后端的 `windows_server.py` 提供静态资源。服务器动态生成 `/config.js`，将 API 地址配置为 `window.location.origin + '/api'`，请求超时为 15000 毫秒。

因此，公网部署使用同源接口，仓库中的本地开发配置无需改为公网 IP。静态页面与 API 使用同一入口，但前端交互与后端业务逻辑仍然分离。

部署环境、数据库初始化和启动方式见[后端 README](https://github.com/Remisuki/832401321_calculator_backend/blob/main/README.md)。

## 接口概览

| 方法 | 路径 | 功能 |
|---|---|---|
| GET | `/api/health` | 服务健康检查 |
| POST | `/api/calculate` | 提交表达式并保存成功结果 |
| GET | `/api/history?limit=5&offset=0` | 分页查询历史 |
| DELETE | `/api/history/{id}` | 删除指定记录 |

计算请求示例：

```json
{"expression":"(1+2)*3"}
```

成功响应包含 `success`、`id`、`expression`、`result` 和 `created_at`。`result` 为十进制字符串，时间为 UTC ISO 8601，由前端转换为访问者本地时间。

删除完成后重新请求历史列表，确保页面反映后端数据状态。错误响应通过 `message` 展示，接口失败时前端不会自行计算结果。

## 使用与验证

| 操作 | 预期行为 |
|---|---|
| Enter 或 `=` | 提交计算 |
| Esc | 清空表达式 |
| 点击历史表达式 | 填入输入框，等待重新提交 |
| `1+2*3` | 返回 `7` |
| `(1+2)*3` | 返回 `9` |
| `3*-2` | 返回 `-6` |
| `0.1+0.2` | 返回 `0.3` |
| `1/0`、`1+` | 显示错误提示 |
| 刷新或重新打开页面 | 从后端重新读取已保存历史 |
| 删除指定记录后刷新 | 该记录不再出现 |

页面验证还应覆盖分页、移动端布局、请求失败后的按钮恢复，以及接口不可达时不能获得新计算结果。请求超时后应先查询历史，确认是否已经保存，再决定是否重新提交。

## 项目范围

当前版本用于课程演示，所有访问者共享历史记录，未实现账号登录或个人数据隔离。代码规范及参考来源见 [codestyle.md](codestyle.md)。
