# NEXT_STEP.md

## P0-NEXT

**阶段**: Phase 1 - 网页录屏功能 - Debug 调试

**动作**: 手动测试发现问题，定位并修复

**测试步骤**:
1. 在 Chrome 加载插件 (`chrome://extensions` → `加载已解压的扩展程序`)
2. 打开任意网页
3. 点击插件图标打开 popup
4. 点击「开始录制」按钮
5. 观察控制台日志，定位问题
6. 修复后重新测试

**预期问题**:
- `chrome.tabCapture.captureTab()` 可能在某些场景返回 null
- 音频混合可能需要调整
- Canvas 渲染可能需要优化

**输出物**: 修复后的代码

---

## 通过后

更新 checklist 标记验收完成，进入 Phase 2：FFmpeg.wasm MP4 转码
