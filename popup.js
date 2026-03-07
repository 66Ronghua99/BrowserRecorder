// Camera Overlay - Popup Script
// 处理用户设置界面

document.addEventListener('DOMContentLoaded', () => {
  // 加载保存的设置
  loadSettings();

  // 缩放滑块显示当前值
  document.getElementById('zoomLevel').addEventListener('input', (e) => {
    document.getElementById('zoomValue').textContent = e.target.value + 'x';
  });

  // 保存按钮
  document.getElementById('saveBtn').addEventListener('click', saveSettings);
});

// 加载设置
function loadSettings() {
  chrome.storage.sync.get([
    'showOverlay',
    'windowSize',
    'zoomLevel',
    'borderRadius',
    'mirrorMode'
  ], (settings) => {
    document.getElementById('showOverlay').checked = settings.showOverlay !== false;
    document.getElementById('windowSize').value = settings.windowSize || 'medium';
    document.getElementById('zoomLevel').value = settings.zoomLevel || 1;
    document.getElementById('zoomValue').textContent = (settings.zoomLevel || 1) + 'x';
    document.getElementById('borderRadius').value = settings.borderRadius || '10';
    document.getElementById('mirrorMode').checked = settings.mirrorMode || false;
  });
}

// 保存设置
function saveSettings() {
  const settings = {
    showOverlay: document.getElementById('showOverlay').checked,
    windowSize: document.getElementById('windowSize').value,
    zoomLevel: parseFloat(document.getElementById('zoomLevel').value),
    borderRadius: document.getElementById('borderRadius').value,
    mirrorMode: document.getElementById('mirrorMode').checked
  };

  console.log('[Popup] Saving settings:', settings);

  chrome.storage.sync.set(settings, () => {
    console.log('[Popup] Settings saved to storage');

    // 通知当前活动标签页更新设置
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      console.log('[Popup] Active tab:', tabs[0]);
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, {
          action: 'updateSettings',
          settings: settings
        }, (response) => {
          console.log('[Popup] Message response:', response);
        });
      }
    });

    // 显示保存成功反馈
    const btn = document.getElementById('saveBtn');
    btn.textContent = '已保存!';
    setTimeout(() => {
      btn.textContent = '保存设置';
    }, 1500);
  });
}
