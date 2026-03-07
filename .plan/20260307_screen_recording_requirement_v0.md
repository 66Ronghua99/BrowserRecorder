# Requirement v0 - 网页录屏功能 (Phase 1: WebM 输出)

> 创建日期: 2026-03-07
> 状态: Active

---

## Feature Metadata

| 字段 | 值 |
|------|-----|
| feature_name | 网页录屏功能 |
| stage_name | Phase 1 - WebM 输出 |
| priority | P0 |

---

## 1. Scope (功能范围)

### 核心功能
- 录制浏览器当前标签页的网页内容
- 同时录制摄像头悬浮窗（人像叠加）
- 录制麦克风音频 + 网页音频（标签页混合音频）
- 输出 WebM 格式视频（1080p）
- 一键录制/停止操作

### 用户交互
- 在 popup 控制面板增加「录制」按钮
- 点击开始录制 → 显示录制状态（红点提示）
- 点击停止录制 → 自动下载视频文件到本地

---

## 2. Non-goals (非目标)

- MP4 格式输出（Phase 2 实现）
- 快捷键控制
- 窗口位置记忆
- 虚拟背景/AI 抠像
- 云端存储

---

## 3. Acceptance Criteria (验收标准)

### 功能验收
| ID | 验收条件 | 验证方式 |
|----|----------|----------|
| AC1 | 点击录制按钮后，开始录制当前标签页 | 手动测试 |
| AC2 | 录制包含网页画面 + 摄像头人像 | 录制后回放检查 |
| AC3 | 录制包含麦克风声音 + 网页声音 | 录制后回放检查 |
| AC4 | 点击停止后，自动下载 WebM 文件 | 观察下载行为 |
| AC5 | 录制期间显示录制状态提示 | UI 可见 |
| AC6 | 1080p 分辨率输出 | 用播放器查看属性 |

### 质量标准
- 视频流畅无卡顿
- 音画同步
- 录制期间不影响网页正常交互

---

## 4. Evidence Artifacts (证据工件)

| 类型 | 路径/说明 |
|------|------------|
| 代码实现 | `content.js` - 录制逻辑模块 |
| 代码实现 | `background.js` - TabCapture 桥接 |
| UI 更新 | `popup.html` - 录制按钮 |
| UI 更新 | `popup.js` - 录制控制逻辑 |
| 设计文档 | `.plan/20260307_screen_recording.md` (待创建) |
| 测试报告 | 手动测试清单 |

---

## 5. Open Risks (开放风险)

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| `chrome.tabCapture` 权限 | 用户可能需要手动授权 | 在 UI 中提供权限引导 |
| 音频混合稳定性 | 麦克风+网页音频可能不同步 | 使用单一流混合输出 |
| 大文件处理 | 长时间录制文件过大 | 暂不限制，后续优化 |

---

## 6. Technical Note

### 技术方案
- 视频来源：`chrome.tabCapture.captureTab()`
- 音频来源：麦克风 `getUserMedia` + 网页音频 → 混合
- 录制：`MediaRecorder` API
- 输出：WebM 格式 (VP8/VP9 编码)

### Chrome API 权限
```json
{
  "permissions": ["tabCapture", "desktopCapture", "microphone"]
}
```

---

## 7. P0 Next Candidate

**下一步**：进入 `drive-pm-closed-loop` 形成最小可执行闭环

### 最小闭环定义
1. 实现基础录制功能（网页+摄像头+双音频）
2. 输出 WebM 文件可播放
3. 完成popup UI 交互

---

## 8. Change Log

| 日期 | 变更 |
|------|------|
| 2026-03-07 | 初始版本 v0 |
