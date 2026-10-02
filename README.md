# 算页计算器前端

软件工程第一次作业：前后端分离计算器。前端负责输入、发送 HTTP 请求、展示结果和历史记录；表达式解析、计算与数据库操作均由后端完成。

- 在线演示：<http://193.112.23.200:8080/>
- 后端仓库：<https://github.com/Remisuki/832401321_calculator_backend>
- 前端代码规范：[codestyle.md](codestyle.md)
- 作业要求：<https://bbs.csdn.net/topics/620530837>

## 功能

- 按钮和键盘输入；Enter 或 `=` 提交，Esc 清空，支持退格、括号和小数。
- 展示后端返回的四则运算、复合表达式和一元正负号计算结果。
- 展示非法表达式、除零、网络中断和超时提示。
- 历史记录每页 5 条，可翻页、刷新、复用表达式和删除指定记录。
- 编辑表达式后清除旧结果；提交期间禁止重复操作。
- 适配手机布局，提供键盘焦点与动态状态提示。

所有访问者共享计算历史，没有账号和个人历史隔离。复用记录只填入表达式，仍需调用后端重新计算。

## 技术与目录

使用 HTML5、CSS、原生 JavaScript、Fetch API，无需 Node.js 构建。运行环境为现代浏览器；本地静态服务可以使用 Python 3。

```text
index.html       页面和控件
styles.css       样式与响应式布局
app.js           输入、接口调用、历史与错误展示
config.js        本地开发 API 地址与请求超时
start.bat        Windows 本地静态服务
codestyle.md     代码规范及来源
LOCAL_GUIDE.md   本地操作补充说明
```

## 本地安装与启动

1. 下载前端与后端两个仓库，分别解压。
2. 按后端 README 运行 `python app.py`，后端默认监听 `127.0.0.1:5000`。
3. 在前端仓库目录打开终端，执行：

```powershell
python -m http.server 5500 --bind 127.0.0.1
```

4. 在浏览器打开 <http://localhost:5500/>。不要直接双击 `index.html`。

仓库中的 `config.js` 默认连接 `http://localhost:5000/api`，请求超时为 90000 毫秒。本地前端无需安装数据库；后端在首次启动时自动创建 SQLite 文件和表。

## 当前公网部署：腾讯云 Windows Server

当前演示使用 **Windows Server + Python 3.13 + Flask + Waitress + SQLite**，入口为 <http://193.112.23.200:8080/>。80 端口由服务器已有的 Nginx 使用，计算器独立监听 8080。

部署目录如下：

```text
C:\Calculator\
├── frontend\       本仓库的页面文件
├── backend\        后端代码及 windows_server.py
├── data\           后端 SQLite 数据库
├── logs\           服务日志
├── venv\           Python 虚拟环境
└── settings.json   服务器地址和监听端口
```

`windows_server.py` 提供首页、JS/CSS 和 API，并动态返回 `/config.js`：

```javascript
window.CALCULATOR_CONFIG = Object.freeze({
  apiBaseUrl: window.location.origin + '/api',
  requestTimeoutMs: 15000
});
```

因此，公网浏览器访问的是服务器的同源 `/api`，不会使用仓库 `config.js` 中的 localhost 地址。前后端分别维护在两个仓库，通过 HTTP/JSON 通信；使用同一公网地址不改变它们的职责分离。

本部署入口无需 GitHub Pages、Render 或 Neon。仓库里的旧平台相关说明不代表当前演示环境。不要将 HTTPS 的 Pages 页面直接连接到当前 HTTP 接口，浏览器会限制这种混合内容请求。

完整安装、初始化、后台运行和排错见[后端 README](https://github.com/Remisuki/832401321_calculator_backend/blob/main/README.md)。首次安装脚本下载两个仓库；之后在 GitHub 更新文件不会自动同步到正在运行的服务器。

## API 约定

| 方法 | 路径 | 作用 |
|---|---|---|
| GET | `/api/health` | 检查 API 是否响应 |
| POST | `/api/calculate` | 发送 `{"expression":"(1+2)*3"}`，计算并保存 |
| GET | `/api/history?limit=5&offset=0` | 查询分页历史 |
| DELETE | `/api/history/{id}` | 删除指定历史，再重新读取列表 |

计算成功返回 HTTP 201，含 `success`、`id`、`expression`、`result`、`created_at`。`result` 为字符串；时间使用 UTC ISO 8601，由前端按访问者本地时区显示。失败通过 `message` 展示错误，前端不自行补算结果。

## 验证与排错

2026-10-02 对上述公网地址完成了真实浏览器验证：加减乘除、小数、优先级、括号、正负号、非法输入和除零；新浏览器会话读取历史；删除指定测试记录后刷新和重新查询；分页；API 请求被阻断时不产生新结果；390px 手机宽度无横向溢出。验证后仅清理本次新增的测试记录。

这次浏览器验证没有重启远程服务器，不能据此宣称远程重启验收完成。

| 现象 | 检查方法 |
|---|---|
| 无法打开公网网页 | 地址须含 `http://` 和 `:8080`；检查服务、腾讯云入站规则及服务器防火墙状态 |
| 页面可见但接口不通 | 打开 `/api/health`；查看浏览器 Network 中实际请求地址 |
| HTTP 403 | 检查后端 `public_origin`，协议、IP 和端口必须匹配 |
| 请求超时 | 先刷新历史，确认原请求是否已保存，再决定是否重试 |
| 本地页面打不开历史 | 确认后端已启动，前端使用 HTTP 5500，而不是 `file://` |

数据库、日志和服务器私密配置不应上传到前端仓库。演示服务应在作业评阅期间保持运行。
