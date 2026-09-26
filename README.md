# 算页计算器前端

软件工程作业前端，使用 HTML、CSS 和原生 JavaScript。页面只负责输入、请求和展示；计算、历史保存与删除均由后端完成。

后端仓库：https://github.com/Remisuki/832401321_calculator_backend

## 功能与文件

支持键盘和按钮输入、括号、小数、退格和清空；Enter /= 提交，Esc 清空。编辑表达式后清除旧结果；请求期间禁用重复提交。历史可分页、复用和删除，复用仍需后端计算。布局适配手机，历史使用 textContent 显示。

```text
index.html / styles.css   页面与样式
app.js                   交互和接口请求，不计算表达式
config.js                后端地址和等待时间
start.bat                Windows 本地 HTTP 服务
.nojekyll                GitHub Pages 以静态文件发布
.gitignore / codestyle.md / LOCAL_GUIDE.md
```

## 本地运行

先启动配套后端。在本仓库根目录执行 `python -m http.server 5500`，或双击 start.bat；打开 http://localhost:5500 。不要双击 index.html 以 file:// 打开。

本地接口地址为 `http://localhost:5000/api`。更详细的本地使用和键盘说明见 [LOCAL_GUIDE.md](LOCAL_GUIDE.md)；本部署包将请求等待时间调整为 90 秒。

## 公网部署

完整步骤见后端仓库 [DEPLOY.md](https://github.com/Remisuki/832401321_calculator_backend/blob/main/DEPLOY.md)。先部署后端，确认它的 /api/health 返回 ok，再编辑 config.js：

```javascript
window.CALCULATOR_CONFIG = Object.freeze({
  apiBaseUrl: "https://你的真实Render服务名.onrender.com/api",
  requestTimeoutMs: 90000,
});
```

用 Render 实际分配的 HTTPS 域名替换示例，保留结尾 /api。数据库密码不能放进前端。90 秒等待用于容纳免费服务唤醒；计算超时后先刷新历史，避免不确定时重复提交。

GitHub 仓库 Settings → Pages：选择 Deploy from a branch → main → / (root) → Save，等待 Actions 发布成功。

没有自定义域名时，预计网址为 https://remisuki.github.io/832401321_calculator_frontend/ ，以 Pages 显示的实际地址为准。

后端环境变量 ALLOWED_ORIGINS 应为 `https://remisuki.github.io`，不带仓库路径。浏览器来源仅含协议、域名和可选端口。

## 接口约定

- POST /api/calculate：发送 expression；成功返回 id、expression、result、created_at。result 是字符串。
- GET /api/history：使用 limit、offset 分页，返回 records、total、limit、offset。
- DELETE /api/history/{id}：成功删除后重新读取历史。

本次前端兼容本地 app.py 和云端 wsgi.py 的相同 JSON 接口。

## 验证和排错

测试 1+2*3=7、(1+2)*3=9、-(2+3)=-5、0.1+0.2=0.3；除零或非法输入应报错。检查刷新保留、指定删除，以及后端重新部署后历史仍在。

停掉电脑上的本地后端，用手机流量访问 Pages 才能验证真正公网运行。页面有界面但不能计算时，先检查后端健康地址、HTTPS 域名及 /api；403 检查来源白名单；配置仍旧时等 Pages 发布完成后 Ctrl+F5。

所有访问者共享历史，该作业版本没有登录与个人历史隔离。代码规范见 [codestyle.md](codestyle.md)。

