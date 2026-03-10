// Camera Overlay - Content Script
// 在任意网页上显示摄像头悬浮窗

(function() {
  'use strict';

  // 默认配置（其他设置存储在 chrome.storage，showOverlay 每页独立）
  const STORED_SETTINGS_KEYS = [
    'windowSize',
    'zoomLevel',
    'borderRadius',
    'mirrorMode',
    'recordingResolution',
    'recordingFormat'
  ];
  const DEFAULT_STORED_SETTINGS = {
    windowSize: 'medium',
    zoomLevel: 1,
    borderRadius: '10',
    mirrorMode: false,
    recordingResolution: '1080p',
    recordingFormat: 'mp4'
  };

  // 每页独立的运行时设置
  let pageSettings = {
    showOverlay: false // 每个页面默认关闭悬浮窗
  };

  // 窗口大小映射
  const SIZE_MAP = {
    small: { width: 160, height: 120 },
    medium: { width: 200, height: 150 },
    large: { width: 280, height: 210 },
    xlarge: { width: 360, height: 270 }
  };

  // 录制尺寸映射
  const RECORDING_SIZE_MAP = {
    '1080p': { width: 1920, height: 1080 },
    '900p': { width: 1600, height: 900 },
    '720p': { width: 1280, height: 720 },
    '1080p-3:4': { width: 1080, height: 1440 }
  };

  let settings = { ...DEFAULT_STORED_SETTINGS };
  let overlay = null;
  let video = null;
  let stream = null;
  let cameraInitialized = false; // 标记摄像头是否已初始化权限

  // 录制相关变量
  let isRecording = false;
  let mediaRecorder = null;
  let recordedChunks = [];
  let canvas = null;
  let canvasCtx = null;
  let animationId = null;
  let tabVideoElement = null;
  let tabCaptureStream = null;
  let micStream = null;
  let recordingStream = null;
  let recordingMimeType = 'video/webm';
  let recordingExtension = 'webm';
  let audioContext = null;
  let audioDestination = null;
  let originalWindowSize = null;

  // 加载设置（从存储中加载所有设置）
  function loadSettings() {
    // 从 chrome.storage 加载所有设置
    chrome.storage.sync.get({ ...DEFAULT_STORED_SETTINGS, showOverlay: false }, (stored) => {
      // 恢复页面级别的 showOverlay
      const shouldShowOverlay = stored.showOverlay || false;
      pageSettings.showOverlay = shouldShowOverlay;
      // 合并存储的设置
      settings = { ...DEFAULT_STORED_SETTINGS, ...stored };
      applySettings();

      // 如果页面刷新后 showOverlay 为 true，需要初始化摄像头
      if (shouldShowOverlay && !cameraInitialized) {
        console.log('[Camera Overlay] Restoring camera after page refresh');
        ensureCameraRunning();
      }
    });
  }

  // 应用设置到悬浮窗
  function applySettings() {
    if (!overlay) return;

    console.log('[Camera Overlay] applySettings called with:', settings);

    // 显示/隐藏（使用页面级别的 pageSettings.showOverlay）
    overlay.style.setProperty('display', pageSettings.showOverlay ? 'block' : 'none', 'important');

    // 窗口大小（使用存储的设置）
    let size = SIZE_MAP[settings.windowSize] || SIZE_MAP.medium;

    // 圆形模式下改为正方形
    if (settings.borderRadius === '50') {
      const maxSize = Math.max(size.width, size.height);
      size = { width: maxSize, height: maxSize };
    }

    overlay.style.setProperty('width', size.width + 'px', 'important');
    overlay.style.setProperty('height', size.height + 'px', 'important');

    // 圆角（使用存储的设置）
    const radius = settings.borderRadius === '50' ? '50%' : settings.borderRadius + 'px';
    overlay.style.setProperty('border-radius', radius, 'important');

    // 缩放 - 始终以中心放大（使用存储的设置）
    if (video) {
      const scale = settings.zoomLevel;

      // 镜像 + 缩放，始终以中心为原点
      if (settings.mirrorMode) {
        video.style.transform = `scaleX(-1) scale(${scale})`;
      } else {
        video.style.transform = `scale(${scale})`;
      }
      // 始终以中心为变换原点
      video.style.transformOrigin = 'center center';
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
      // 用户点击悬浮窗时，如果摄像头还未初始化，则请求权限
      if (!cameraInitialized && pageSettings.showOverlay) {
        ensureCameraRunning();
      }

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
      // 只在用户点击悬浮窗时才请求摄像头权限，不在页面加载时自动请求
      return;
    }

    // 创建 DOM（初始隐藏，等待用户启用）
    createOverlay();

    // 加载设置
    loadSettings();

    // 监听标签页切换：当用户切换到其他标签时，自动关闭悬浮窗
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && pageSettings.showOverlay) {
        console.log('[Camera Overlay] Tab hidden, disabling overlay');
        pageSettings.showOverlay = false;
        // 更新存储
        chrome.storage.sync.set({ showOverlay: false });
        // 停止摄像头
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
          stream = null;
        }
        cameraInitialized = false;
        // 隐藏悬浮窗
        if (overlay) {
          overlay.style.display = 'none';
        }
      }
    });

    console.log('[Camera Overlay] Init complete');
  }

  // 确保摄像头已启动（懒加载）
  async function ensureCameraRunning() {
    if (stream && stream.active) {
      console.log('[Camera Overlay] Camera already running');
      return;
    }

    console.log('[Camera Overlay] Starting camera on user request...');

    // 创建 video 元素（如果还没有）
    if (!video) {
      video = document.createElement('video');
      video.autoplay = true;
      video.playsInline = true;
      video.muted = true;
      if (overlay) {
        overlay.appendChild(video);
      }
    }

    // 启动摄像头
    const success = await initCamera();
    if (success) {
      cameraInitialized = true; // 标记摄像头已初始化
      applySettings();
    }
  }

  // 监听来自 popup 的消息
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('[Camera Overlay] Received message:', request);
    if (request.action === 'updateSettings') {
      // 分离页面级别设置和存储设置
      const showOverlay = request.settings.showOverlay;
      const wasEnabled = pageSettings.showOverlay;

      // 更新页面级别设置并保存到存储
      if (showOverlay !== undefined) {
        pageSettings.showOverlay = showOverlay;
        // 保存 showOverlay 到存储（用于切换回来时恢复）
        chrome.storage.sync.set({ showOverlay: showOverlay });
      }

      // 分离需要存储的设置（跨页面共享）
      const settingsToStore = {};
      STORED_SETTINGS_KEYS.forEach(key => {
        if (request.settings[key] !== undefined) {
          settingsToStore[key] = request.settings[key];
          settings[key] = request.settings[key];
        }
      });

      // 保存其他设置到 chrome.storage
      if (Object.keys(settingsToStore).length > 0) {
        chrome.storage.sync.set(settingsToStore);
      }

      console.log('[Camera Overlay] Applying settings:', { pageSettings, settings });

      // 用户启用悬浮窗时，启动摄像头
      if (showOverlay && !wasEnabled) {
        ensureCameraRunning().then(() => {
          applySettings();
          sendResponse({ success: true });
        });
        return true; // 异步响应
      }

      // 用户关闭悬浮窗时，停止摄像头
      if (!showOverlay && wasEnabled) {
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
          stream = null;
        }
        cameraInitialized = false; // 重置标志，允许下次重新请求权限
      }

      applySettings();
      sendResponse({ success: true });
    }

    if (request.action === 'startRecording') {
      startRecording()
        .then(() => sendResponse({ success: true }))
        .catch(err => sendResponse({ success: false, error: err.message }));
      return true; // 异步响应
    }

    if (request.action === 'stopRecording') {
      stopRecording()
        .then(() => sendResponse({ success: true }))
        .catch(err => sendResponse({ success: false, error: err.message }));
      return true; // 异步响应
    }
  });

  function getRecordingSize() {
    return RECORDING_SIZE_MAP[settings.recordingResolution] || RECORDING_SIZE_MAP['1080p'];
  }

  function isVerticalRecording() {
    const size = getRecordingSize();
    return size.height > size.width;
  }

  async function adjustWindowForVerticalRecording() {
    if (!isVerticalRecording()) {
      return null;
    }

    const size = getRecordingSize();
    const screenWidth = screen.width;
    const screenHeight = screen.height;

    const aspectRatio = size.width / size.height; // 3:4 = 0.75
    const targetHeight = Math.floor(screenHeight * 0.9);
    const targetWidth = Math.floor(targetHeight * aspectRatio);

    console.log('[Camera Overlay] Adjusting window to vertical:', { targetWidth, targetHeight, aspectRatio });

    try {
      await chrome.runtime.sendMessage({
        action: 'resizeWindow',
        width: targetWidth,
        height: targetHeight
      });
      await new Promise(resolve => setTimeout(resolve, 500));
      console.log('[Camera Overlay] Window adjusted');
      return { width: targetWidth, height: targetHeight };
    } catch (error) {
      console.warn('[Camera Overlay] Failed to adjust window:', error);
      return null;
    }
  }

  async function restoreWindowSize(originalSize) {
    if (!originalSize) return;

    try {
      await chrome.runtime.sendMessage({
        action: 'resizeWindow',
        width: originalSize.width,
        height: originalSize.height
      });
      console.log('[Camera Overlay] Window restored');
    } catch (error) {
      console.warn('[Camera Overlay] Failed to restore window:', error);
    }
  }

  function chooseRecorderMimeType() {
    const mp4Types = [
      'video/mp4;codecs=avc1.42E01E,mp4a.40.2',
      'video/mp4;codecs=h264,aac',
      'video/mp4'
    ];
    const webmTypes = [
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm'
    ];

    const preferredTypes = settings.recordingFormat === 'webm'
      ? [...webmTypes, ...mp4Types]
      : [...mp4Types, ...webmTypes];

    for (const type of preferredTypes) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }
    return null;
  }

  async function setupTabRenderCanvas(width, height) {
    canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    canvasCtx = canvas.getContext('2d');

    tabVideoElement = document.createElement('video');
    tabVideoElement.srcObject = tabCaptureStream;
    tabVideoElement.muted = true;
    tabVideoElement.playsInline = true;
    tabVideoElement.preload = 'auto';

    await new Promise(resolve => {
      if (tabVideoElement.readyState >= 1) {
        resolve();
      } else {
        tabVideoElement.onloadedmetadata = resolve;
      }
    });
    await tabVideoElement.play();
  }

  function startCanvasRenderLoop() {
    function drawFrame() {
      if (!isRecording || !canvasCtx || !canvas || !tabVideoElement) return;

      if (tabVideoElement.readyState >= 2) {
        const canvasAspect = canvas.width / canvas.height;
        const tabAspect = tabVideoElement.videoWidth / tabVideoElement.videoHeight;
        
        // 填充背景色
        canvasCtx.fillStyle = '#000000';
        canvasCtx.fillRect(0, 0, canvas.width, canvas.height);

        let dx, dy, dWidth, dHeight;

        if (tabAspect > canvasAspect) {
          // 网页内容更宽，保持高度，缩放宽度（contain 模式）
          dHeight = canvas.height;
          dWidth = canvas.height * tabAspect;
          dx = (canvas.width - dWidth) / 2;
          dy = 0;
        } else {
          // 网页内容更高，保持宽度，缩放高度（contain 模式）
          dWidth = canvas.width;
          dHeight = canvas.width / tabAspect;
          dx = 0;
          dy = (canvas.height - dHeight) / 2;
        }

        canvasCtx.drawImage(tabVideoElement, dx, dy, dWidth, dHeight);
      }

      animationId = requestAnimationFrame(drawFrame);
    }

    animationId = requestAnimationFrame(drawFrame);
  }

  // 开始录制
  async function startRecording() {
    if (isRecording) {
      throw new Error('Already recording');
    }

    recordedChunks = [];
    const recordingSize = getRecordingSize();

    let originalWindowSize = null;

    try {
      if (isVerticalRecording()) {
        const size = await adjustWindowForVerticalRecording();
        originalWindowSize = size;
        
        const confirmed = confirm('窗口已调整为竖版。请重新选择要共享的标签页，然后点击确定继续录制。');
        if (!confirmed) {
          throw new Error('User cancelled');
        }
      }

      // 保存原始窗口尺寸用于后续恢复
      window.originalWindowSize = originalWindowSize;

      tabCaptureStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          frameRate: 30
        },
        audio: true
      });

      tabCaptureStream.getVideoTracks()[0].onended = () => {
        if (isRecording) {
          stopRecording().catch(error => {
            console.error('[Camera Overlay] Failed to stop after user ended sharing:', error);
          });
        }
      };

      try {
        micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch (error) {
        micStream = null;
        console.warn('[Camera Overlay] Microphone unavailable, continue without mic:', error);
      }
      await setupTabRenderCanvas(recordingSize.width, recordingSize.height);

      audioContext = new AudioContext();
      audioDestination = audioContext.createMediaStreamDestination();

      if (tabCaptureStream.getAudioTracks().length > 0) {
        const tabAudioSource = audioContext.createMediaStreamSource(tabCaptureStream);
        tabAudioSource.connect(audioDestination);
      }

      if (micStream && micStream.getAudioTracks().length > 0) {
        const micAudioSource = audioContext.createMediaStreamSource(micStream);
        micAudioSource.connect(audioDestination);
      }

      const canvasStream = canvas.captureStream(30);
      const canvasVideoTrack = canvasStream.getVideoTracks()[0];
      if (canvasVideoTrack?.applyConstraints) {
        try {
          await canvasVideoTrack.applyConstraints({ frameRate: 30 });
        } catch (error) {
          console.warn('[Camera Overlay] Failed to apply canvas frameRate constraints:', error);
        }
      }

      recordingStream = new MediaStream([
        ...canvasStream.getVideoTracks(),
        ...audioDestination.stream.getAudioTracks()
      ]);

      recordingMimeType = chooseRecorderMimeType();
      if (!recordingMimeType) {
        throw new Error('No supported recording format');
      }
      recordingExtension = recordingMimeType.includes('mp4') ? 'mp4' : 'webm';
      if (settings.recordingFormat === 'mp4' && recordingExtension !== 'mp4') {
        console.warn('[Camera Overlay] MP4 not supported on this browser, fallback to WebM');
      }

      mediaRecorder = new MediaRecorder(recordingStream, {
        mimeType: recordingMimeType,
        videoBitsPerSecond: 6000000,
        audioBitsPerSecond: 128000
      });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunks.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        chrome.storage.local.set({ isRecording: false });
        chrome.storage.sync.set({ isRecording: false });
        downloadRecording();
      };

      isRecording = true;
      chrome.storage.local.set({ isRecording: true });
      chrome.storage.sync.set({ isRecording: true });
      startCanvasRenderLoop();
      mediaRecorder.start(1000);
      console.log('[Camera Overlay] Recording started:', {
        size: recordingSize,
        format: recordingMimeType
      });
    } catch (error) {
      isRecording = false;
      chrome.storage.local.set({ isRecording: false });
      chrome.storage.sync.set({ isRecording: false });
      cleanupRecording();
      throw error;
    }
  }

  // 停止录制
  async function stopRecording() {
    if (!isRecording) {
      throw new Error('Not recording');
    }

    isRecording = false;
    chrome.storage.local.set({ isRecording: false });
    chrome.storage.sync.set({ isRecording: false });

    let recorderStopPromise = Promise.resolve();
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      recorderStopPromise = new Promise(resolve => {
        mediaRecorder.addEventListener('stop', resolve, { once: true });
      });
      mediaRecorder.stop();
    }

    await recorderStopPromise;

    // 恢复窗口尺寸
    if (window.originalWindowSize) {
      await restoreWindowSize(window.originalWindowSize);
      window.originalWindowSize = null;
    }

    cleanupRecording();

    // 恢复悬浮窗显示
    if (overlay && pageSettings.showOverlay) {
      overlay.style.display = 'block';
    }
  }

  // 清理录制资源
  function cleanupRecording() {
    if (tabCaptureStream) {
      tabCaptureStream.getTracks().forEach(track => track.stop());
      tabCaptureStream = null;
    }

    if (micStream) {
      micStream.getTracks().forEach(track => track.stop());
      micStream = null;
    }

    if (recordingStream) {
      recordingStream.getTracks().forEach(track => track.stop());
      recordingStream = null;
    }

    if (animationId) {
      cancelAnimationFrame(animationId);
      animationId = null;
    }

    if (tabVideoElement) {
      tabVideoElement.pause();
      tabVideoElement.srcObject = null;
      tabVideoElement = null;
    }

    if (audioContext) {
      audioContext.close();
      audioContext = null;
    }

    mediaRecorder = null;
    canvas = null;
    canvasCtx = null;
  }

  // 下载录制文件
  function downloadRecording() {
    if (recordedChunks.length === 0) {
      console.error('[Camera Overlay] No recorded data');
      return;
    }

    const blob = new Blob(recordedChunks, { type: recordingMimeType || 'video/webm' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `recording_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.${recordingExtension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    URL.revokeObjectURL(url);
    recordedChunks = [];
    console.log('[Camera Overlay] Recording downloaded:', a.download);
  }

  // 页面加载完成后初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
