// Camera Overlay - Content Script
// 在任意网页上显示摄像头悬浮窗

(function() {
  'use strict';

  // 默认配置
  const DEFAULT_SETTINGS = {
    showOverlay: true,
    windowSize: 'medium',
    zoomLevel: 1,
    borderRadius: '10',
    mirrorMode: false
  };

  // 窗口大小映射
  const SIZE_MAP = {
    small: { width: 160, height: 120 },
    medium: { width: 200, height: 150 },
    large: { width: 280, height: 210 },
    xlarge: { width: 360, height: 270 }
  };

  let settings = { ...DEFAULT_SETTINGS };
  let overlay = null;
  let video = null;
  let stream = null;

  // 加载设置
  function loadSettings() {
    chrome.storage.sync.get(DEFAULT_SETTINGS, (stored) => {
      settings = { ...DEFAULT_SETTINGS, ...stored };
      applySettings();
    });
  }

  // 应用设置到悬浮窗
  function applySettings() {
    if (!overlay) return;

    // 显示/隐藏
    overlay.style.display = settings.showOverlay ? 'block' : 'none';

    // 窗口大小
    const size = SIZE_MAP[settings.windowSize] || SIZE_MAP.medium;
    overlay.style.width = size.width + 'px';
    overlay.style.height = size.height + 'px';

    // 圆角
    overlay.style.borderRadius = settings.borderRadius === '50'
      ? '50%'
      : settings.borderRadius + 'px';

    // 缩放（使用 transform-origin 实现裁切效果）
    if (video) {
      const scale = settings.zoomLevel;
      const origin = 50 - (50 / scale);
      video.style.transform = `scale(${scale})`;
      video.style.transformOrigin = `${origin}% ${origin}%`;

      // 镜像
      video.style.transform += settings.mirrorMode ? ' scaleX(-1)' : '';
    }
  }

  // 创建悬浮窗容器
  function createOverlay() {
    overlay = document.createElement('div');
    overlay.id = 'camera-overlay';

    video = document.createElement('video');
    video.autoplay = true;
    video.playsInline = true;
    video.muted = true;

    overlay.appendChild(video);

    // 确保 body 存在
    if (document.body) {
      document.body.appendChild(overlay);
    } else {
      document.addEventListener('DOMContentLoaded', () => {
        document.body.appendChild(overlay);
      });
    }

    // 启用拖动
    enableDrag(overlay);

    console.log('[Camera Overlay] DOM created');
    return { overlay, video };
  }

  // 获取摄像头权限并绑定视频流
  async function initCamera() {
    try {
      stream = await navigator.mediaDevices.getUserMedia({
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
    if (overlay) {
      overlay.innerHTML = `<div class="camera-error">${message}</div>`;
    }
  }

  // 拖动功能
  function enableDrag(el) {
    let isDragging = false;
    let startX, startY, initialX, initialY;

    el.addEventListener('mousedown', (e) => {
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;

      const rect = el.getBoundingClientRect();
      initialX = rect.left;
      initialY = rect.top;

      el.style.cursor = 'grabbing';
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
      const rect = el.getBoundingClientRect();

      newX = Math.max(0, Math.min(newX, viewportWidth - rect.width));
      newY = Math.max(0, Math.min(newY, viewportHeight - rect.height));

      el.style.left = newX + 'px';
      el.style.top = newY + 'px';
      el.style.right = 'auto';
      el.style.bottom = 'auto';
    });

    document.addEventListener('mouseup', () => {
      if (isDragging) {
        isDragging = false;
        el.style.cursor = 'move';
      }
    });
  }

  // 初始化
  async function init() {
    console.log('[Camera Overlay] Starting init...');

    // 避免重复初始化
    if (document.getElementById('camera-overlay')) {
      // 已存在则加载设置并应用
      overlay = document.getElementById('camera-overlay');
      video = overlay.querySelector('video');
      loadSettings();
      return;
    }

    // 确保全局摄像头权限已设置
    await new Promise((resolve) => {
      chrome.runtime.sendMessage({ action: 'ensurePermission' }, () => resolve());
    });

    // 创建 DOM
    createOverlay();

    // 加载设置
    loadSettings();

    // 启动摄像头
    const success = await initCamera();

    // 再次应用设置（确保 transform 等属性生效）
    applySettings();

    console.log('[Camera Overlay] Camera init result:', success);
  }

  // 监听来自 popup 的消息
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('[Camera Overlay] Received message:', request);
    if (request.action === 'updateSettings') {
      settings = { ...settings, ...request.settings };
      console.log('[Camera Overlay] Applying settings:', settings);
      applySettings();
      sendResponse({ success: true });
    }
  });

  // 页面加载完成后初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
