# Camera Overlay

[English](#english) | [中文](#中文)

A browser extension that displays your camera feed as a floating overlay on any webpage.

## Features

- 📹 Real-time camera preview as floating overlay
- 🖱️ Draggable window - position anywhere on screen
- 📐 Multiple window sizes: Small, Medium, Large, Extra Large
- 🔍 Zoom control: 1x to 3x magnification (center-focused)
- ⭕ Window styles: Square, Rounded, Circle
- 🔄 Mirror mode support
- 🔒 Privacy-focused: Global camera permission managed by extension

## Installation

### From Source

1. Open Chrome and navigate to `chrome://extensions`
2. Enable "Developer mode" (top right corner)
3. Click "Load unpacked"
4. Select the extension directory
5. Grant camera permission when prompted

## Usage

1. The overlay appears automatically on any webpage
2. Click the extension icon to open settings
3. Adjust settings and click "Save"
4. Drag the overlay to reposition

### Settings

| Setting | Options |
|---------|---------|
| Show Overlay | On/Off |
| Window Size | Small (160×120) / Medium (200×150) / Large (280×210) / Extra Large (360×270) |
| Zoom | 1x - 3x |
| Window Style | Square / Rounded (10px) / Circle |
| Mirror Mode | On/Off |

## Permissions

- `camera`: Access webcam for video stream
- `activeTab`: Communicate with current tab
- `contentSettings`: Manage global camera permissions
- `storage`: Save user preferences
- `tabs`: Send messages to tabs

## Files

```
├── manifest.json     # Extension configuration
├── background.js     # Background service worker
├── content.js        # Content script (injected into pages)
├── popup.html        # Settings popup UI
├── popup.js          # Settings logic
├── style.css         # Overlay styles
└── icons/            # Extension icons
```

## Browser Support

- Chrome (recommended)
- Edge (Chromium-based)

---

## 中文

浏览器插件，在任意网页上显示摄像头实时画面悬浮窗。

## 功能特性

- 📹 摄像头实时画面悬浮窗
- 🖱️ 可拖动到任意位置
- 📐 多种窗口尺寸：小/中/大/特大
- 🔍 画面缩放：1x-3x（中心放大）
- ⭕ 窗口样式：方形/圆角/圆形
- 🔄 镜像模式
- 🔒 隐私优先：插件统一管理摄像头权限

## 安装

1. 打开 Chrome，访问 `chrome://extensions`
2. 启用右上角"开发者模式"
3. 点击"加载已解压的扩展程序"
4. 选择本插件目录
5. 授权摄像头权限（首次）

## 使用方法

1. 任意网页自动显示悬浮窗
2. 点击插件图标打开设置面板
3. 调整设置后点击"保存设置"
4. 拖动悬浮窗调整位置

### 设置选项

| 设置 | 选项 |
|------|------|
| 显示悬浮窗 | 开/关 |
| 窗口大小 | 小(160×120) / 中(200×150) / 大(280×210) / 特大(360×270) |
| 画面缩放 | 1x - 3x |
| 窗口样式 | 方形 / 圆角(10px) / 圆形 |
| 镜像模式 | 开/关 |

## 权限说明

- `camera`: 访问摄像头获取视频流
- `activeTab`: 与当前标签页通信
- `contentSettings`: 管理全局摄像头权限
- `storage`: 保存用户设置
- `tabs`: 向标签页发送消息

## 文件结构

```
├── manifest.json     # 插件配置
├── background.js    # 后台服务脚本
├── content.js       # 内容脚本（注入到页面）
├── popup.html       # 设置弹窗界面
├── popup.js         # 设置逻辑
├── style.css        # 悬浮窗样式
└── icons/          # 插件图标
```

## 浏览器支持

- Chrome（推荐）
- Edge（Chromium 内核）
