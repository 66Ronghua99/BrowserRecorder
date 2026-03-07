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
  - 状态: 已确认 Chrome 内播放正常，优化本地播放器兼容性中
  - 当前目标: 固定 16:9 录制尺寸 + MP4 优先导出
  - 参考: `.plan/checklist_screen_recording.md`

### Backlog

- [ ] Phase 2: WebM 强制转 MP4 (FFmpeg.wasm)
- [ ] 快捷键控制
- [ ] 录制时长限制
- [ ] 位置记忆

## DONE

- [x] Phase 1: 摄像头悬浮窗 MVP - Evidence: github.com/66Ronghua99/camera-overlay
- [x] Phase 1: 网页录屏功能 (WebM) - 代码实现完成 - Evidence:
  - popup.js: 录制按钮事件处理
  - content.js: startRecording/stopRecording/Canvas合成/音频混合/MediaRecorder
  - background.js: tabCapture 消息处理
- [x] Debug: 修复慢放与音频拖长高风险点 - Evidence:
  - 结论: 录制文件在 Chrome 内回放正常，慢放来自部分本地播放器对 WebM 兼容性
  - content.js: 录制链路回归为 16:9 Canvas 固定输出
  - content.js: 导出格式改为 MP4 优先（浏览器不支持时自动回退 WebM）
  - popup.html/js: 新增录制尺寸与导出格式设置
  - content.js: 录制开始/停止时主动同步 `isRecording`，确保 popup 正确显示“停止录制”
  - content.js: 麦克风获取失败时自动降级为无麦克风录制，避免启动即回滚
  - popup.js: 录制状态改用 `storage.local` 并监听变化，提升“停止录制”按钮一致性

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
