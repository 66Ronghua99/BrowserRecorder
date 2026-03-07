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

  // Tab capture 相关
  if (request.action === 'getTabCaptureStatus') {
    chrome.tabCapture.getCapturedTabs((capturedTabs) => {
      const isCaptured = capturedTabs.some(tab => tab.id === sender.tab.id);
      sendResponse({ captured: isCaptured });
    });
    return true;
  }

  // 获取当前活动 tab ID
  if (request.action === 'getCurrentTabId') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      sendResponse({ tabId: tabs[0]?.id });
    });
    return true;
  }

  // Tab capture - 必须在 background script 中调用
  if (request.action === 'startTabCapture') {
    const { tabId } = request;

    chrome.tabCapture.capture({
      tabId: tabId,
      audioCapturingEnabled: true,
      videoConstraints: {
        mandatory: {
          minWidth: 1920,
          maxWidth: 1920,
          minHeight: 1080,
          maxHeight: 1080,
          maxFrameRate: 30
        }
      }
    }, (stream) => {
      if (chrome.runtime.lastError) {
        sendResponse({ success: false, error: chrome.runtime.lastError.message });
      } else if (!stream) {
        sendResponse({ success: false, error: 'Stream is null' });
      } else {
        // 将 stream 转换为可传递的数据 URL
        // 注意：MediaStream 不能直接在消息中传递
        // 我们需要保持 capture 的引用
        sendResponse({ success: true, streamId: stream.id });
      }
    });
    return true;
  }
});
