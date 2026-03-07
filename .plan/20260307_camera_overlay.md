# Design: Camera Overlay Browser Extension

> [!NOTE]
> **归档文档** | 归档日期：2026-03-07
> 本文档作为历史参考保留，已被实际实现替代。
> 完整实现: https://github.com/66Ronghua99/camera-overlay

---

**Date**: 2026-03-07
**Feature**: 摄像头悬浮窗插件 MVP

## Problem Statement

用户需要在浏览任意网页时能看到自己摄像头画面，用于：
- 在线会议查看画面
- 录屏/做教程
- 直播演示
- 远程面试
- 自我姿态检查

## Scope & Non-goals

### MVP 包含
- 摄像头实时画面显示
- 悬浮窗拖动定位
- 自动播放
- 权限拒绝错误处理

### Non-goals (不包含)
- 窗口大小调整
- 快捷键开关
- 镜像模式
- AI 抠像/虚拟背景
- 录屏功能

## Technical Design

### 架构
- 插件类型: Chrome Extension Manifest V3
- 注入方式: content_scripts (所有页面)
- 权限: camera, activeTab

### 文件结构
```
camera-overlay-extension/
├── manifest.json    # 插件配置
├── content.js       # 核心逻辑
├── style.css        # 样式
└── icons/           # 图标
```

### DOM 结构
```html
<body>
  <div id="camera-overlay">
    <video autoplay playsinline></video>
  </div>
</body>
```

### 悬浮窗样式
- position: fixed
- bottom: 20px, right: 20px
- width: 200px, height: 150px
- border-radius: 10px
- z-index: 999999
- background: black
- cursor: move

### 拖动逻辑
1. mousedown: 记录鼠标偏移量 + 标记拖动中
2. mousemove: 更新位置 (限制在视口内)
3. mouseup: 取消拖动标记

### 摄像头获取
```javascript
navigator.mediaDevices.getUserMedia({
  video: true,
  audio: false
})
```

## Test Strategy

1. 加载插件到 chrome://extensions
2. 打开任意网页
3. 确认悬浮窗显示在右下角
4. 拖动悬浮窗到不同位置
5. 验证权限拒绝时的错误提示

## Migration Plan

无迁移需求，这是全新 MVP 项目。
