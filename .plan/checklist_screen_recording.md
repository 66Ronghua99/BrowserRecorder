# Checklist - 网页录屏功能 Phase 1

> 创建日期: 2026-03-07

---

## Implementation Tasks

### 1. Manifest 权限配置
- [x] 添加 `tabCapture` 权限
- [x] 添加 `desktopCapture` 权限
- [x] 添加 `microphone` 权限

### 2. Popup UI 更新
- [x] 在 popup.html 添加录制按钮
- [x] 添加录制状态显示（红点）
- [x] 在 popup.js 添加录制/停止事件处理

### 3. Content Script 录制逻辑
- [x] 添加 `startRecording()` 函数
- [x] 添加 `stopRecording()` 函数
- [x] 实现 Canvas 合成（网页+摄像头）
- [x] 实现音频混合（麦克风+网页音频）
- [x] 实现 MediaRecorder 录制
- [x] 实现自动下载 WebM

### 4. Background Script
- [x] 添加 `chrome.tabCapture` 相关消息处理

### 5. 测试验证
- [ ] 手动测试完整录制流程
- [ ] 验证 WebM 文件可播放

---

## Quality Gates

- [x] 代码无语法错误
- [ ] 手动测试通过

---

## Evidence Paths

| 证据 | 路径 |
|------|------|
| Manifest 权限 | manifest.json:12-14 |
| Popup 录制UI | popup.html:272-279 |
| Popup 录制逻辑 | popup.js:18-85 |
| Content 录制逻辑 | content.js:238-423 |
| Background 处理 | background.js:47-57 |
| 设计文档 | .plan/20260307_screen_recording_closed_loop_v0.md |
