# Minimum Closed Loop - 网页录屏功能 Phase 1

> 创建日期: 2026-03-07
> 状态: Active

---

## 1. Requirement Summary

| 字段 | 值 |
|------|-----|
| feature_name | 网页录屏功能 |
| stage_name | Phase 1 - WebM 输出 |
| 用户目标 | 一键录制网页+人像+声音，输出可用视频 |
| 目标用户 | 普通自媒体工作者 |

---

## 2. Minimum Loop Definition

### 最小闭环范围
**一句话描述**：用户点击录制 → 录制网页画面+摄像头+麦克风+网页音频 → 自动下载 WebM

### 用户旅程
```
1. 用户打开任意网页
2. 点击插件图标打开 popup
3. 点击「开始录制」按钮
4. 录制进行中（显示红点状态）
5. 点击「停止录制」
6. 浏览器自动下载 WebM 文件
```

### 技术实现路径
| 步骤 | 技术方案 |
|------|----------|
| 网页视频 | `chrome.tabCapture.captureTab()` |
| 摄像头 | 现有 `getUserMedia` (content.js) |
| 麦克风 | `navigator.mediaDevices.getUserMedia({ audio: true })` |
| 混合录制 | Canvas 合成网页+摄像头 → `MediaRecorder` |
| 输出 | WebM 格式，自动下载 |

---

## 3. Acceptance Criteria (闭环内)

| ID | 验收条件 | 验证方式 |
|----|----------|----------|
| AC1 | 点击录制按钮开始录制 | popup 按钮点击，状态切换 |
| AC2 | 录制包含网页画面 | 回放视频确认 |
| AC3 | 录制包含摄像头人像 | 回放视频确认 |
| AC4 | 录制包含麦克风声音 | 回放音频确认 |
| AC5 | 点击停止后自动下载 WebM | 文件下载行为 |
| AC6 | 录制状态可见（红点） | UI 变化确认 |

---

## 4. Verification Steps

### 手动测试清单
- [ ] 在空白页面打开插件 popup
- [ ] 点击「开始录制」按钮
- [ ] 确认录制状态显示（红点）
- [ ] 说话并浏览网页
- [ ] 点击「停止录制」
- [ ] 检查 WebM 文件已下载
- [ ] 用播放器打开 WebM，确认：
  - [ ] 网页内容可见
  - [ ] 摄像头人像可见
  - [ ] 麦克风声音可闻
  - [ ] 1080p 分辨率

### 通过标准
- WebM 文件可正常播放
- 视频包含网页+摄像头+声音
- 文件大小合理（< 100MB/分钟）

---

## 5. Deferred Scope (闭环外)

| 功能 | 原因 |
|------|------|
| MP4 输出 | Phase 2 |
| 快捷键控制 | 非 MVP |
| 录制时长限制 | 非 MVP |
| 位置记忆 | 非 MVP |

---

## 6. P0 Next

### 完成后
1. 更新 `PROGRESS.md` - 标记 Phase 1 完成
2. 更新 `NEXT_STEP.md` - 指向 Phase 2 (MP4)
3. 同步代码到远程仓库

### 验证通过后
进入 Phase 2：FFmpeg.wasm MP4 转码
