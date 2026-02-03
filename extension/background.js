// Dify Sync Tool - Background Service Worker
// 使用 chrome.alarms 轮询 CLI 服务器

const SERVER_URL = "http://127.0.0.1:8765";
const ALARM_NAME = "dify-sync-poll";

let lastSentTime = 0;

// 使用 alarms 保持 service worker 活跃
chrome.alarms.create(ALARM_NAME, { periodInMinutes: 0.05 }); // 3秒

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === ALARM_NAME) poll();
});

async function poll() {
  try {
    const configRes = await fetch(`${SERVER_URL}/config`, { 
      method: "GET",
      signal: AbortSignal.timeout(1000) 
    });
    
    if (configRes.ok) {
      const { url } = await configRes.json();
      const now = Date.now();
      
      if (now - lastSentTime >= 3000) {
        if (await fetchAndSendCookies(url)) {
          lastSentTime = now;
        }
      }
    }
  } catch (e) {}
}

async function fetchAndSendCookies(url) {
  try {
    const urlObj = new URL(url);
    const cookies = await chrome.cookies.getAll({ domain: urlObj.hostname });
    const urlCookies = await chrome.cookies.getAll({ url });
    const allCookies = [...cookies, ...urlCookies];

    const tokens = { accessToken: "", refreshToken: "", csrfToken: "" };

    for (const cookie of allCookies) {
      if (cookie.name === "access_token" || cookie.name === "access_token_v2") {
        tokens.accessToken = cookie.value;
      }
      if (cookie.name === "refresh_token" || cookie.name === "refresh_token_v2") {
        tokens.refreshToken = cookie.value;
      }
      if (cookie.name === "csrf_token") {
        tokens.csrfToken = cookie.value;
      }
    }

    if (!tokens.accessToken || !tokens.refreshToken) return false;

    const response = await fetch(`${SERVER_URL}/submit-tokens`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(tokens),
    });

    const result = await response.json();
    return result.success;
  } catch (e) {
    return false;
  }
}

// 启动时立即执行一次
poll();


