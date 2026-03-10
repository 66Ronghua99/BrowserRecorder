# PRD: 竖屏录制支持

## 1) Context

- **Background**: weeber 目前仅支持 16:9 横屏录制，无法满足短视频平台（小红书、抖音）发布需求
- **Problem statement**: 用户使用 frontend-slides 生成演示文稿后，录制视频只能得到横屏文件，发布到竖屏平台需要二次处理
- **Why now**: 自媒体创作工作流已跑通，亟需补齐竖屏录制能力形成闭环

## 2) Objective

- **Business objective**: 支持 3:4 竖屏录制，适配小红书笔记/抖音视频
- **User objective**: 一键录制竖屏视频，直接导出可用
- **Non-goals**:
  - 其他竖屏比例 (9:16, 9:19)
  - FFmpeg 客户端转码
  - 竖屏下的 slides 布局优化

## 3) Scope

- **In scope**:
  - 添加 1080p (3:4) 尺寸选项 → Canvas 1080x1440
  - 录制时自动调整浏览器窗口为竖屏 (宽 < 高)
  - MP4 优先导出格式

- **Out of scope**:
  - 其他分辨率选项
  - 竖屏布局优化
  - 手动尺寸自定义

- **Assumptions**:
  - Chrome getDisplayMedia 支持捕获竖屏网页
  - 用户授予窗口调整权限

- **Constraints**:
  - 仅 Chrome/Edge (Manifest V3)
  - 依赖 MediaRecorder API 能力

## 4) Functional Requirements

| ID | Requirement | Rule | Priority |
| --- | --- | --- | --- |
| FR-1 | 添加竖屏录制尺寸选项 | 在 popup 分辨率下拉框增加 "1080p (3:4)" | P0 |
| FR-2 | 自动调整浏览器窗口 | 检测到竖屏尺寸时，调整 window.innerWidth/Height | P0 |
| FR-3 | Canvas 竖屏渲染 | RECORDING_SIZE_MAP 新增 1080x1440 尺寸 | P0 |
| FR-4 | MP4 优先导出 | 复用现有 MP4 优先逻辑 | P0 |

## 5) Acceptance Criteria

| ID | Scenario | Input | Expected Output | Evidence |
| --- | --- | --- | --- | --- |
| AC-1 | 用户选择竖屏尺寸 | popup 选择 "1080p (3:4)" | 选项可见且可选择 | UI 截图 |
| AC-2 | 竖屏录制 Canvas 尺寸 | 开始录制 | Canvas.width=1080, Canvas.height=1440 | console.log |
| AC-3 | 浏览器窗口自动调整 | 点击开始录制 | window.innerWidth < window.innerHeight | 窗口变化 |
| AC-4 | 导出视频格式 | 停止录制 | .mp4 文件下载 | 文件属性 |
| AC-5 | 视频分辨率正确 | 用播放器打开视频 | 1080x1440 | 视频属性 |

## 6) Risks and Mitigations

| Risk | Impact | Mitigation |
| --- | --- | --- |
| 浏览器拒绝调整窗口大小 | 录制尺寸与预期不符 | 回退提示用户手动调整 |
| MP4 不被当前浏览器支持 | 导出 WebM | 自动回退机制已存在 |

## 7) Delivery Plan

- **Milestone 1 (MVP)**: 1080p (3:4) 录制 + 自动窗口调整 + MP4 导出
- **Milestone 2**: 720p (3:4) 选项
- **Milestone 3**: 9:16 支持

## 8) Open Questions

- Q1: 用户有多个显示器时，调整哪个窗口？
  - A: 调整当前活动标签页所在浏览器窗口
- Q2: 竖屏录制时，摄像头悬浮窗如何处理？
  - A: 保持现有行为，不做特殊处理
