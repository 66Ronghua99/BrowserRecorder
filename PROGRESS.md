# PROGRESS.md

## Project Overview

**Project Name**: Camera Overlay Browser Extension
**Type**: Chrome Extension (Manifest V3)
**Core Feature**: 在任意网页上显示摄像头实时画面悬浮窗，支持拖动定位

## Milestones

### Phase 1: MVP 实现 ✅

- [x] 创建插件基础结构 (manifest.json, content.js, style.css)
- [x] 实现摄像头悬浮窗显示
- [x] 实现拖动功能
- [x] 错误处理（权限拒绝提示）
- [x] 插件权限管理 (background.js)
- [x] 控制面板 (popup.html/js)
- [x] 样式调整（圆形、中心缩放）
- [x] 测试与验证
- [x] README 文档
- [x] 推送到远程仓库

## TODO

### P0-NEXT (Debug 阶段 - 视频录制)

- [ ] **Phase 1: 网页录屏功能** - Debug 调试
  - 状态: 录制功能基本可用，优化中
  - 待修复: 视频中摄像头悬浮窗重复问题已修复
  - 参考: `.plan/checklist_screen_recording.md`

### Backlog

- [ ] Phase 2: MP4 输出 (FFmpeg.wasm)
- [ ] 快捷键控制
- [ ] 录制时长限制
- [ ] 位置记忆

## DONE

- [x] Phase 1: 摄像头悬浮窗 MVP - Evidence: github.com/66Ronghua99/camera-overlay
- [x] Phase 1: 网页录屏功能 (WebM) - 代码实现完成 - Evidence:
  - popup.js: 录制按钮事件处理
  - content.js: startRecording/stopRecording/Canvas合成/音频混合/MediaRecorder
  - background.js: tabCapture 消息处理

## Reference List

- 技术栈: Chrome Extension Manifest V3
- 远程仓库: https://github.com/66Ronghua99/camera-overlay
- 设计文档:
  - `.plan/20260307_camera_overlay.md`
  - `.plan/20260307_screen_recording_closed_loop_v0.md`
  - `.plan/checklist_screen_recording.md`

---

## L1 Loading

当前阶段: Phase 1 - 网页录屏功能 (进行中)
