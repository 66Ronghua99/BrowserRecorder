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

  // 录制相关变量
  let isRecording = false;
  let mediaRecorder = null;
  let recordedChunks = [];
  let canvas = null;
  let canvasCtx = null;
  let animationId = null;
  let tabCaptureStream = null;
  let micStream = null;
  let audioContext = null;
  let audioDestination = null;

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

    console.log('[Camera Overlay] applySettings called with:', settings);

    // 显示/隐藏
    overlay.style.setProperty('display', settings.showOverlay ? 'block' : 'none', 'important');

    // 窗口大小
    let size = SIZE_MAP[settings.windowSize] || SIZE_MAP.medium;

    // 圆形模式下改为正方形
    if (settings.borderRadius === '50') {
      const maxSize = Math.max(size.width, size.height);
      size = { width: maxSize, height: maxSize };
    }

    overlay.style.setProperty('width', size.width + 'px', 'important');
    overlay.style.setProperty('height', size.height + 'px', 'important');

    // 圆角
    const radius = settings.borderRadius === '50' ? '50%' : settings.borderRadius + 'px';
    overlay.style.setProperty('border-radius', radius, 'important');

    // 缩放 - 始终以中心放大
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

  // 开始录制
  async function startRecording() {
    console.log('[Camera Overlay] startRecording called, current isRecording:', isRecording);

    if (isRecording) {
      throw new Error('Already recording');
    }

    console.log('[Camera Overlay] Starting recording...');
    recordedChunks = [];

    try {
      // 使用 getDisplayMedia 捕获当前标签页（在 content script 中可用）
      console.log('[Camera Overlay] Calling getDisplayMedia...');
      const tabCaptureStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          width: 1920,
          height: 1080,
          frameRate: 30
        },
        audio: true // 捕获标签页音频
      });

      console.log('[Camera Overlay] Tab capture stream obtained:', tabCaptureStream.id);

      // 监听用户停止共享
      tabCaptureStream.getVideoTracks()[0].onended = () => {
        console.log('[Camera Overlay] User stopped sharing via browser UI');
        stopRecording();
      };

      // 2. 获取麦克风
      console.log('[Camera Overlay] Getting microphone...');
      const micStream = await navigator.mediaDevices.getUserMedia({
        audio: true
      });
      console.log('[Camera Overlay] Microphone obtained');

      // 3. 创建 Canvas 用于合成
      canvas = document.createElement('canvas');
      canvas.width = 1920;
      canvas.height = 1080;
      canvasCtx = canvas.getContext('2d');

      // 4. 设置音频混合 (Web Audio API)
      audioContext = new AudioContext();
      audioDestination = audioContext.createMediaStreamDestination();

      // 混合 Tab 音频
      if (tabCaptureStream.getAudioTracks().length > 0) {
        const tabAudioSource = audioContext.createMediaStreamSource(tabCaptureStream);
        tabAudioSource.connect(audioDestination);
      }

      // 混合麦克风音频
      const micAudioSource = audioContext.createMediaStreamSource(micStream);
      micAudioSource.connect(audioDestination);

      // 5. 创建混合视频流
      const combinedStream = new MediaStream([
        ...canvas.captureStream(30).getVideoTracks(),
        ...audioDestination.stream.getAudioTracks()
      ]);

      // 6. 创建 MediaRecorder
      mediaRecorder = new MediaRecorder(combinedStream, {
        mimeType: 'video/webm;codecs=vp9'
      });

      mediaRecorder.ondataavailable = (event) => {
        console.log('[Camera Overlay] Data available:', event.data.size);
        if (event.data.size > 0) {
          recordedChunks.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        console.log('[Camera Overlay] Recording stopped, chunks:', recordedChunks.length);
        downloadRecording();
      };

      // 7. 开始录制和渲染
      mediaRecorder.start(1000); // 每秒收集一次数据
      isRecording = true;
      console.log('[Camera Overlay] MediaRecorder started, isRecording:', isRecording);

      // 8. 开始渲染画面
      await renderRecording(tabCaptureStream);

      console.log('[Camera Overlay] Recording started successfully');
    } catch (error) {
      console.error('[Camera Overlay] Failed to start recording:', error);
      isRecording = false;
      cleanupRecording();
      throw error;
    }
  }

  // 渲染录制画面（Tab + 摄像头）
  async function renderRecording(tabStream) {
    const tabVideo = document.createElement('video');
    tabVideo.srcObject = tabStream;
    tabVideo.muted = true;
    await tabVideo.play();

    // 摄像头视频（如果存在）
    let cameraVideo = null;
    if (video && video.srcObject && video.srcObject.getVideoTracks().length > 0) {
      cameraVideo = video;
    }

    function drawFrame() {
      if (!isRecording) return;

      // 绘制 Tab 画面（全屏填充，保持比例裁剪）
      const canvasAspect = canvas.width / canvas.height;
      const tabAspect = tabVideo.videoWidth / tabVideo.videoHeight;

      let sx = 0, sy = 0, sw = tabVideo.videoWidth, sh = tabVideo.videoHeight;

      if (tabAspect > canvasAspect) {
        sw = tabVideo.videoHeight * canvasAspect;
        sx = (tabVideo.videoWidth - sw) / 2;
      } else {
        sh = tabVideo.videoWidth / canvasAspect;
        sy = (tabVideo.videoHeight - sh) / 2;
      }

      canvasCtx.drawImage(tabVideo, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);

      // 绘制摄像头悬浮窗（右下角）
      if (cameraVideo && overlay && settings.showOverlay) {
        const rect = overlay.getBoundingClientRect();
        const size = SIZE_MAP[settings.windowSize] || SIZE_MAP.medium;
        let camWidth = size.width * 2;
        let camHeight = size.height * 2;

        // 圆形模式
        if (settings.borderRadius === '50') {
          camWidth = camHeight = Math.max(camWidth, camHeight);
        }

        const camX = canvas.width - camWidth - 40;
        const camY = canvas.height - camHeight - 40;

        // 绘制摄像头区域背景
        canvasCtx.fillStyle = 'black';
        canvasCtx.fillRect(camX - 4, camY - 4, camWidth + 8, camHeight + 8);

        // 绘制摄像头视频
        canvasCtx.save();
        canvasCtx.beginPath();
        if (settings.borderRadius === '50') {
          canvasCtx.arc(camX + camWidth / 2, camY + camHeight / 2, camWidth / 2, 0, Math.PI * 2);
        } else {
          canvasCtx.rect(camX, camY, camWidth, camHeight);
        }
        canvasCtx.clip();

        const scale = settings.zoomLevel;
        canvasCtx.translate(camX + camWidth / 2, camY + camHeight / 2);
        if (settings.mirrorMode) {
          canvasCtx.scale(-scale, scale);
        } else {
          canvasCtx.scale(scale, scale);
        }
        canvasCtx.drawImage(cameraVideo, -camWidth / 2, -camHeight / 2, camWidth, camHeight);
        canvasCtx.restore();
      }

      animationId = requestAnimationFrame(drawFrame);
    }

    drawFrame();
  }

  // 停止录制
  async function stopRecording() {
    if (!isRecording) {
      throw new Error('Not recording');
    }

    console.log('[Camera Overlay] Stopping recording...');
    isRecording = false;

    if (animationId) {
      cancelAnimationFrame(animationId);
      animationId = null;
    }

    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
    }

    // 等待数据收集完成
    await new Promise(resolve => setTimeout(resolve, 500));

    cleanupRecording();
    console.log('[Camera Overlay] Recording cleanup done');
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

    const blob = new Blob(recordedChunks, { type: 'video/webm' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `recording_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    URL.revokeObjectURL(url);
    recordedChunks = [];

    console.log('[Camera Overlay] Recording downloaded');
  }

  // 页面加载完成后初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
