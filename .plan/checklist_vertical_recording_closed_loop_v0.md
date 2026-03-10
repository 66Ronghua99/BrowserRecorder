# Checklist: 竖屏录制 MVP 闭环

## Loop: 竖屏录制 MVP

### Implementation

- [x] **FR-1**: popup.html 添加 "1080p (3:4)" 选项到分辨率下拉框
- [x] **FR-1**: popup.js 同步新选项值到 storage
- [x] **FR-2**: content.js 添加 3:4 尺寸到 RECORDING_SIZE_MAP
- [x] **FR-3**: content.js startRecording() 中检测竖屏尺寸，调用窗口调整
- [x] **FR-4**: 确认 MP4 导出逻辑（已有，验证即可）

### Evidence

- [ ] **E1**: 打开 popup.html，分辨率下拉框显示 "1080p (3:4)"
- [ ] **E2**: 选择该选项后，settings 正确保存 `recordingResolution: '1080p-3:4'`
- [ ] **E3**: 开始录制时 console 输出 Canvas 尺寸为 1080x1440
- [ ] **E4**: 录制前后浏览器窗口从横屏变为竖屏
- [ ] **E5**: 停止录制后下载文件为 .mp4
- [ ] **E6**: 视频属性显示 1080x1440 分辨率

### Quality Gates

- [ ] **Q1**: 质量门禁 - typecheck/build (如有)
- [ ] **Q2**: 功能回归 - 横屏录制 (1920x1080) 仍正常工作

### Docs Sync

- [x] **D1**: PROGRESS.md 更新 TODO/DONE
- [x] **D2**: NEXT_STEP.md 写入 p0_next
- [ ] **D3**: MEMORY.md 沉淀经验（如有）

---

## Verification Steps

| # | Step | Pass Criteria |
|---|------|---------------|
| 1 | 加载插件，打开任意网页 | 插件正常工作 |
| 2 | 点击插件图标，查看 popup | 看到 "1080p (3:4)" 选项 |
| 3 | 选择 "1080p (3:4)"，点击保存 | 设置成功保存 |
| 4 | 点击"开始录制" | 浏览器窗口自动变为竖屏 |
| 5 | 录制 5 秒，点击"停止录制" | 自动下载 .mp4 文件 |
| 6 | 右键文件 → 属性 → 详情 | 显示 1080x1440 |

---

## Deferred Scope

- 720p (3:4) 选项
- 9:16 支持
- 竖屏 slides 布局优化
