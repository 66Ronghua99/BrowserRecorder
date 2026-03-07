// Camera Overlay - Content Script
// 在任意网页上显示摄像头悬浮窗

(function() {
  'use strict';

  // 配置
  const CONFIG = {
    width: 200,
    height: 150,
    defaultPosition: { right: 20, bottom: 20 },
    zIndex: 999999
  };

  // 创建悬浮窗容器
  function createOverlay() {
    const overlay = document.createElement('div');
    overlay.id = 'camera-overlay';

    const video = document.createElement('video');
    video.autoplay = true;
    video.playsInline = true;
    video.muted = true;

    overlay.appendChild(video);

    // 确保 body 存在
    if (document.body) {
      document.body.appendChild(overlay);
    } else {
      // 如果 body 不存在，等待
      document.addEventListener('DOMContentLoaded', () => {
        document.body.appendChild(overlay);
      });
    }

    console.log('[Camera Overlay] DOM created, element:', overlay);
    return { overlay, video };
  }

  // 获取摄像头权限并绑定视频流
  async function initCamera(video) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false
      });

      video.srcObject = stream;
      return true;
    } catch (error) {
      console.error('Camera permission denied:', error);
      showError('Camera permission denied');
      return false;
    }
  }

  // 显示错误信息
  function showError(message) {
    const overlay = document.getElementById('camera-overlay');
    if (overlay) {
      overlay.innerHTML = `<div class="camera-error">${message}</div>`;
    }
  }

  // 拖动功能
  function enableDrag(overlay) {
    let isDragging = false;
    let startX, startY, initialX, initialY;

    overlay.addEventListener('mousedown', (e) => {
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;

      const rect = overlay.getBoundingClientRect();
      initialX = rect.left;
      initialY = rect.top;

      overlay.style.cursor = 'grabbing';
    });

    document.addEventListener('mousemove', (e) => {
      if (!isDragging) return;

      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;

      let newX = initialX + deltaX;
      let newY = initialY + deltaY;

      // 限制在视口内
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const overlayRect = overlay.getBoundingClientRect();

      newX = Math.max(0, Math.min(newX, viewportWidth - overlayRect.width));
      newY = Math.max(0, Math.min(newY, viewportHeight - overlayRect.height));

      overlay.style.left = newX + 'px';
      overlay.style.top = newY + 'px';
      overlay.style.right = 'auto';
      overlay.style.bottom = 'auto';
    });

    document.addEventListener('mouseup', () => {
      if (isDragging) {
        isDragging = false;
        overlay.style.cursor = 'move';
      }
    });
  }

  // 初始化
  async function init() {
    console.log('[Camera Overlay] Starting init...');

    // 避免重复初始化
    if (document.getElementById('camera-overlay')) {
      console.log('[Camera Overlay] Already initialized');
      return;
    }

    // 确保全局摄像头权限已设置
    console.log('[Camera Overlay] Requesting global camera permission...');
    await new Promise((resolve) => {
      chrome.runtime.sendMessage({ action: 'ensurePermission' }, (response) => {
        console.log('[Camera Overlay] Permission response:', response);
        resolve();
      });
    });

    console.log('[Camera Overlay] Creating overlay...');
    const { overlay, video } = createOverlay();

    // 启用拖动
    enableDrag(overlay);

    console.log('[Camera Overlay] Requesting camera...');
    // 获取摄像头
    const success = await initCamera(video);
    console.log('[Camera Overlay] Camera init result:', success);
  }

  // 页面加载完成后初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
