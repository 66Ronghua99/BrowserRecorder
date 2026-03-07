# MEMORY.md

## Project Experience

### 2026-03-07 | Chrome Extension MVP

**经验沉淀**:

- Chrome Extension Manifest V3 需要使用 content script 注入
- 摄像头权限需要通过 `navigator.mediaDevices.getUserMedia()` 获取
- 悬浮窗需要使用 `position: fixed` 和高 z-index 确保覆盖网页内容
- 拖动逻辑需要计算鼠标偏移量防止跳动

### 2026-03-07 | 设置不生效问题

- **问题**: popup 控制面板的设置不生效（大小、显示/隐藏、圆角）
- **根因**: style.css 使用了 `!important`，但 JS 设置的是 inline style，被 CSS 覆盖
- **修复**: 使用 `style.setProperty(property, value, 'important')` 覆盖 CSS
- **预防**: 动态设置的样式需要用 setProperty + 'important'

### 2026-03-07 | 圆形和缩放优化

- **问题**: 圆形显示为椭圆，缩放以左上角为原点导致人像出画
- **修复**: 圆形模式下改为正方形尺寸；缩放改用 `transform-origin: center center`

---

## Global Constraints

- 插件必须在所有网站生效 (`<all_urls>`)
- MVP 不包含 AI、虚拟背景、录屏等功能
- 必须覆盖所有网页元素 (z-index: 2147483647)
