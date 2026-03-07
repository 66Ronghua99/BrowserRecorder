// Camera Overlay - Popup Script
// 处理用户设置界面

document.addEventListener('DOMContentLoaded', async () => {
  // 加载保存的设置
  loadSettings();

  // 加载录制状态
  const { isRecording: savedRecording } = await chrome.storage.sync.get('isRecording');
  updateRecordingUI(savedRecording || false);

  // 缩放滑块显示当前值
  document.getElementById('zoomLevel').addEventListener('input', (e) => {
    document.getElementById('zoomValue').textContent = e.target.value + 'x';
  });

  // 保存按钮
  document.getElementById('saveBtn').addEventListener('click', saveSettings);

  // 录制按钮
  document.getElementById('recordBtn').addEventListener('click', toggleRecording);
});

// 更新录制 UI 状态
function updateRecordingUI(recording) {
  const recordBtn = document.getElementById('recordBtn');
  const recordingDot = document.getElementById('recordingDot');
  const statusText = document.getElementById('recordingStatusText');

  if (recording) {
    recordBtn.textContent = '停止录制';
    recordBtn.classList.remove('btn-record');
    recordBtn.classList.add('btn-stop');
    recordingDot.classList.add('active');
    statusText.textContent = '录制中...';
  } else {
    recordBtn.textContent = '开始录制';
    recordBtn.classList.remove('btn-stop');
    recordBtn.classList.add('btn-record');
    recordingDot.classList.remove('active');
    statusText.textContent = '';
  }
}

// 切换录制状态
async function toggleRecording() {
  // 获取当前录制状态
  const { isRecording } = await chrome.storage.sync.get('isRecording');
  const currentlyRecording = isRecording || false;

  if (!currentlyRecording) {
    // 开始录制
    try {
      // 获取当前活动标签页
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab) {
        console.error('[Popup] No active tab found');
        return;
      }

      // 发送开始录制消息到 content script
      const response = await chrome.tabs.sendMessage(tab.id, { action: 'startRecording' });

      if (response && response.success) {
        // 保存录制状态
        await chrome.storage.sync.set({ isRecording: true });
        updateRecordingUI(true);
        console.log('[Popup] Recording started');
      } else {
        console.error('[Popup] Failed to start recording:', response?.error);
        document.getElementById('recordingStatusText').textContent = '录制失败: ' + (response?.error || '未知错误');
      }
    } catch (error) {
      console.error('[Popup] Error starting recording:', error);
      document.getElementById('recordingStatusText').textContent = '录制失败: ' + error.message;
    }
  } else {
    // 停止录制
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab) return;

      const response = await chrome.tabs.sendMessage(tab.id, { action: 'stopRecording' });

      // 清除录制状态
      await chrome.storage.sync.set({ isRecording: false });
      updateRecordingUI(false);
      document.getElementById('recordingStatusText').textContent = response?.success ? '录制完成！' : '录制已停止';
      console.log('[Popup] Recording stopped');
    } catch (error) {
      console.error('[Popup] Error stopping recording:', error);
      // 即使出错也清除状态
      await chrome.storage.sync.set({ isRecording: false });
      updateRecordingUI(false);
    }
  }
}

// 加载设置
function loadSettings() {
  // 读取所有设置（包括 showOverlay 用于恢复页面状态）
  chrome.storage.sync.get([
    'showOverlay',
    'windowSize',
    'zoomLevel',
    'borderRadius',
    'mirrorMode'
  ], (settings) => {
    // 恢复 showOverlay 状态（用于刷新后恢复）
    document.getElementById('showOverlay').checked = settings.showOverlay || false;
    document.getElementById('windowSize').value = settings.windowSize || 'medium';
    document.getElementById('zoomLevel').value = settings.zoomLevel || 1;
    document.getElementById('zoomValue').textContent = (settings.zoomLevel || 1) + 'x';
    document.getElementById('borderRadius').value = settings.borderRadius || '10';
    document.getElementById('mirrorMode').checked = settings.mirrorMode || false;
  });
}

// 保存设置
function saveSettings() {
  const showOverlay = document.getElementById('showOverlay').checked;

  // 存储所有设置（包括 showOverlay，用于刷新后恢复）
  const settingsToStore = {
    showOverlay: showOverlay,
    windowSize: document.getElementById('windowSize').value,
    zoomLevel: parseFloat(document.getElementById('zoomLevel').value),
    borderRadius: document.getElementById('borderRadius').value,
    mirrorMode: document.getElementById('mirrorMode').checked
  };

  console.log('[Popup] Saving settings:', settingsToStore);

  // 保存所有设置到存储
  chrome.storage.sync.set(settingsToStore, () => {
    console.log('[Popup] Settings saved to storage');

    // 通知当前活动标签页更新所有设置
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      console.log('[Popup] Active tab:', tabs[0]);
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, {
          action: 'updateSettings',
          settings: settingsToStore
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
