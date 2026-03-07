// Camera Overlay - Background Script
// 统一管理摄像头权限

// 安装时设置全局摄像头权限
chrome.runtime.onInstalled.addListener(() => {
  console.log('[Camera Overlay] Extension installed, setting camera permission...');
  setGlobalCameraPermission();
});

// 浏览器启动时也设置
chrome.runtime.onStartup.addListener(() => {
  setGlobalCameraPermission();
});

// 设置全局摄像头权限，允许所有网站使用摄像头
function setGlobalCameraPermission() {
  chrome.contentSettings.camera.set({
    primaryPattern: '<all_urls>',
    setting: 'allow'
  }, () => {
    if (chrome.runtime.lastError) {
      console.error('[Camera Overlay] Failed to set camera permission:', chrome.runtime.lastError);
    } else {
      console.log('[Camera Overlay] Camera permission set to allow for all sites');
    }
  });
}

// 监听来自 content script 的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'ensurePermission') {
    // 确保全局摄像头权限已设置
    chrome.contentSettings.camera.set({
      primaryPattern: '<all_urls>',
      setting: 'allow'
    }, () => {
      sendResponse({ success: !chrome.runtime.lastError });
    });
    return true; // 异步响应
  }

  if (request.action === 'checkPermission') {
    chrome.contentSettings.camera.get({ primaryUrl: sender.tab.url }, (details) => {
      sendResponse({ setting: details.setting });
    });
    return true; // 异步响应
  }
});
