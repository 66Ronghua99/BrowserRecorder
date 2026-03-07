# MEMORY.md

## Project Experience

### 2026-03-07 | Chrome Extension MVP

**经验沉淀**:

- Chrome Extension Manifest V3 需要使用 content script 注入
- 摄像头权限需要通过 `navigator.mediaDevices.getUserMedia()` 获取
- 悬浮窗需要使用 `position: fixed` 和高 z-index 确保覆盖网页内容
- 拖动逻辑需要计算鼠标偏移量防止跳动

---

## Global Constraints

- 插件必须在所有网站生效 (`<all_urls>`)
- MVP 不包含 AI、虚拟背景、录屏等功能
- 必须覆盖所有网页元素 (z-index: 999999)
