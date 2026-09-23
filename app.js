/* 前端只编辑与显示表达式；所有结果均来自后端。 */
"use strict";

const config = window.CALCULATOR_CONFIG;
const apiBaseUrl = config.apiBaseUrl.replace(/\/$/, "");
const pageSize = 5;
const form = document.querySelector("#calculator-form");
const input = document.querySelector("#expression");
const resultElement = document.querySelector("#result");
const resultLabel = document.querySelector("#result-label");
const message = document.querySelector("#message");
const connection = document.querySelector("#connection");
const keypad = document.querySelector("#keypad");
const historyList = document.querySelector("#history-list");
const historyStatus = document.querySelector("#history-status");
const historyCount = document.querySelector("#history-count");
const pageLabel = document.querySelector("#page-label");
const previousPage = document.querySelector("#previous-page");
const nextPage = document.querySelector("#next-page");
const refreshButton = document.querySelector("#refresh-history");
let calculating = false;
let offset = 0;
let total = 0;
let historyRequest = 0;
let historyLoading = false;

function showMessage(text, kind = "info") {
  message.textContent = text;
  message.dataset.kind = kind;
}

function setConnection(online) {
  connection.dataset.state = online ? "online" : "offline";
  connection.textContent = online ? "已连接" : "连接失败";
}

async function requestApi(path, options = {}) {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), config.requestTimeoutMs);
  try {
    const response = await fetch(apiBaseUrl + path, {
      ...options,
      signal: controller.signal,
      cache: "no-store",
    });
    setConnection(true);
    let data;
    try {
      data = await response.json();
    } catch {
      throw new Error("服务响应格式不正确，请检查后端是否已更新。");
    }
    if (!response.ok) {
      throw new Error(data.message || "请求失败，请稍后重试。");
    }
    return data;
  } catch (error) {
    if (error.name === "AbortError" || error instanceof TypeError) {
      setConnection(false);
      throw new Error(error.name === "AbortError"
        ? "等待超时，请稍后再试。计算请求可能已保存，请先刷新记录。"
        : "无法连接计算服务，请检查后端是否启动和连接地址是否正确。");
    }
    throw error;
  } finally {
    window.clearTimeout(timeout);
  }
}

function resetResult() {
  resultElement.textContent = "—";
  resultElement.classList.remove("long-result");
  resultLabel.textContent = "等待计算";
}

function edited() {
  resetResult();
  showMessage("表达式已更新，按 Enter 或 = 计算。");
}

function editInput(value, backspace = false) {
  if (calculating) return;
  const start = input.selectionStart ?? input.value.length;
  const end = input.selectionEnd ?? input.value.length;
  const from = backspace && start === end ? Math.max(0, start - 1) : start;
  if (input.value.length - (end - from) + value.length > input.maxLength) {
    showMessage("表达式最多支持 200 个字符。", "error");
    return;
  }
  input.setRangeText(value, from, end, "end");
  input.focus();
  edited();
}

function clearInput() {
  if (calculating) return;
  input.value = "";
  resetResult();
  showMessage("已清空，可以开始新的计算。");
  input.focus();
}

function setCalculating(value) {
  calculating = value;
  input.readOnly = value;
  form.setAttribute("aria-busy", String(value));
  keypad.querySelectorAll("button").forEach((button) => {
    button.disabled = value;
  });
  historyList.querySelectorAll(".reuse-button").forEach((button) => {
    button.disabled = value;
  });
}

function makeElement(tag, className, text) {
  const element = document.createElement(tag);
  element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

function showEmpty(title, description, symbol = "=") {
  const empty = makeElement("div", "empty-state");
  const icon = makeElement("span", "empty-icon", symbol);
  icon.setAttribute("aria-hidden", "true");
  empty.append(icon, makeElement("p", "", title), makeElement("small", "", description));
  historyList.replaceChildren(empty);
}

function renderHistory(records) {
  if (!records.length) {
    showEmpty("还没有计算记录", "完成第一次计算后，它会出现在这里。");
    return;
  }
  const fragment = document.createDocumentFragment();
  records.forEach((record, index) => {
    const article = makeElement("article", "history-item");
    const content = makeElement("div", "record-content");
    const reuse = makeElement("button", "reuse-button", record.expression);
    reuse.type = "button";
    reuse.title = "点击再次使用这个表达式";
    reuse.setAttribute("aria-label", "再次使用 " + record.expression);
    reuse.disabled = calculating;
    reuse.addEventListener("click", () => {
      if (calculating) return;
      input.value = record.expression;
      input.focus();
      input.setSelectionRange(input.value.length, input.value.length);
      edited();
      showMessage("已填入历史表达式，按 Enter 或 = 重新计算。");
    });
    const date = new Date(record.created_at);
    const time = makeElement("time", "record-time", date.toLocaleString("zh-CN", {
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false,
    }));
    time.dateTime = record.created_at;
    content.append(reuse, makeElement("div", "record-result", "= " + record.result), time);
    const remove = makeElement("button", "delete-button", "删除");
    remove.type = "button";
    remove.setAttribute("aria-label", "删除记录 " + record.expression + " = " + record.result);
    remove.addEventListener("click", () => deleteRecord(record.id, remove));
    article.append(
      makeElement("span", "record-number", String(offset + index + 1).padStart(2, "0")),
      content, remove,
    );
    fragment.append(article);
  });
  // 记录均通过 textContent 写入，历史表达式不会被当作 HTML 执行。
  historyList.replaceChildren(fragment);
}

function updatePagination() {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  pageLabel.textContent = "第 " + (Math.floor(offset / pageSize) + 1) + " / " + pages + " 页";
  previousPage.disabled = historyLoading || offset === 0;
  nextPage.disabled = historyLoading || offset + pageSize >= total;
  refreshButton.disabled = historyLoading;
}

async function loadHistory() {
  const requestId = ++historyRequest;
  historyLoading = true;
  historyList.setAttribute("aria-busy", "true");
  updatePagination();
  historyStatus.textContent = "正在读取记录…";
  historyStatus.dataset.kind = "info";
  try {
    const data = await requestApi("/history?limit=" + pageSize + "&offset=" + offset);
    if (requestId !== historyRequest) return;
    if (!Array.isArray(data.records) || !Number.isInteger(data.total)) {
      throw new Error("历史接口版本不匹配，请重启更新后的后端。");
    }
    total = data.total;
    historyCount.textContent = String(total);
    if (offset > 0 && offset >= total) {
      offset = Math.max(0, Math.ceil(total / pageSize) - 1) * pageSize;
      await loadHistory();
      return;
    }
    renderHistory(data.records);
    historyStatus.textContent = total ? "按时间倒序 · 每页 " + pageSize + " 条" : "";
  } catch (error) {
    if (requestId !== historyRequest) return;
    historyCount.textContent = "—";
    historyStatus.textContent = error.message;
    historyStatus.dataset.kind = "error";
    showEmpty("记录暂时无法加载", "恢复连接后，点击右上角刷新。", "!");
  } finally {
    if (requestId === historyRequest) {
      historyLoading = false;
      historyList.setAttribute("aria-busy", "false");
      updatePagination();
    }
  }
}

async function deleteRecord(id, button) {
  button.disabled = true;
  button.textContent = "删除中";
  try {
    await requestApi("/history/" + encodeURIComponent(id), { method: "DELETE" });
    showMessage("记录已从历史中删除。", "success");
    await loadHistory();
  } catch (error) {
    showMessage(error.message, "error");
  } finally {
    button.disabled = false;
    button.textContent = "删除";
  }
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (calculating) return;
  const expression = input.value.trim();
  resetResult();
  if (!expression) {
    showMessage("请输入表达式后再计算。", "error");
    input.focus();
    return;
  }
  setCalculating(true);
  resultLabel.textContent = "正在计算";
  showMessage("正在计算并保存记录…");
  try {
    const data = await requestApi("/calculate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ expression }),
    });
    resultElement.textContent = data.result;
    resultElement.classList.toggle("long-result", String(data.result).length > 14);
    resultLabel.textContent = "计算结果";
    showMessage("计算完成，已保存到历史记录。", "success");
    offset = 0;
    await loadHistory();
  } catch (error) {
    resetResult();
    resultLabel.textContent = "未完成计算";
    showMessage(error.message, "error");
  } finally {
    setCalculating(false);
  }
});

input.addEventListener("input", edited);
input.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    event.preventDefault();
    clearInput();
  } else if (event.key === "=" && !event.isComposing) {
    event.preventDefault();
    form.requestSubmit();
  }
});
keypad.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button || button.disabled) return;
  if (button.dataset.action === "clear") clearInput();
  else if (button.dataset.action === "backspace") editInput("", true);
  else if (button.dataset.value !== undefined) editInput(button.dataset.value);
});
refreshButton.addEventListener("click", loadHistory);
previousPage.addEventListener("click", () => {
  offset = Math.max(0, offset - pageSize);
  loadHistory();
});
nextPage.addEventListener("click", () => {
  offset += pageSize;
  loadHistory();
});
loadHistory();
