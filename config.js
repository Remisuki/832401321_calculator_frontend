// 只填写公开的 API 地址；数据库密码等私密信息不能放在前端。
window.CALCULATOR_CONFIG = Object.freeze({
  apiBaseUrl: "http://localhost:5000/api",
  // Render 免费服务可能需要约一分钟唤醒；上线后改 apiBaseUrl 为 Render HTTPS 地址。
  requestTimeoutMs: 90000,
});
