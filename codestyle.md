# 前端代码规范

规范来源：
- [Google JavaScript Style Guide](https://google.github.io/styleguide/jsguide.html)
- [Google HTML/CSS Style Guide](https://google.github.io/styleguide/htmlcssguide.html)
- [MDN：可访问性](https://developer.mozilla.org/en-US/docs/Web/Accessibility)

本项目参考以上规范，结合无构建工具的教学项目做如下约定；并非宣称完全遵循所有 Google 风格细节。

## JavaScript

- 使用两个空格缩进、双引号、分号；默认 const，需要重新赋值才使用 let。
- 变量和函数使用 camelCase，公开配置键保持统一命名。
- 使用原生 DOM API、Fetch、async/await，保持函数职责单一。
- 所有计算结果都来自 API，前端不使用 eval、Function 或表达式求值代码。
- 请求必须处理非成功状态、网络错误和超时，并恢复按钮状态。
- 来自用户或接口的文字使用 textContent，不拼接到 innerHTML。
- 列表刷新丢弃过期请求结果，避免旧响应覆盖新记录。
- 不把数据库密码等信息写进公开配置或仓库。

## HTML 与 CSS

- HTML 使用语义元素、明确的 label、button type 和可访问名称。
- 状态提示使用 role=status / aria-live；动态加载提供 aria-busy。
- 样式使用 class、CSS 变量及媒体查询；简短声明可合写一行。
- 文件采用 UTF-8；CSS 属性使用标准 kebab-case，class 使用 kebab-case。
- 保留可见键盘焦点，手机布局不得产生页面水平溢出。
- 动画应遵从 prefers-reduced-motion。

## 注释与检查

- 注释解释设计原因和输入边界，避免只复述代码。
- 修改页面后用浏览器验证输入、键盘、错误状态、历史和手机布局。
- 如已安装 Node.js，执行 node --check app.js 和 node --check config.js。
- 接口变动必须同步更新 README、后端 API 文档及相关调用。
