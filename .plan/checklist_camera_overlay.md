# Checklist: Camera Overlay MVP

## Implementation

- [x] manifest.json - 插件配置 (Manifest V3, permissions: camera/activeTab, content_scripts: <all_urls>)
- [x] content.js - 摄像头获取逻辑
- [x] content.js - DOM 容器创建 (div#camera-overlay + video)
- [x] content.js - 拖动逻辑 (mousedown/mousemove/mouseup)
- [x] content.js - 错误处理 (权限拒绝提示)
- [x] style.css - 悬浮窗样式 (fixed, z-index: 999999, 200x150, border-radius: 10px)
- [x] icons/ - 插件图标 (16x16, 48x48, 128x128)

## Evidence

- [ ] chrome://extensions 可加载插件
- [ ] 任意网页显示摄像头悬浮窗
- [ ] 悬浮窗可拖动
- [ ] 权限拒绝时显示错误提示

## Quality Gates

- [ ] manifest.json 符合 Manifest V3 规范
- [ ] 代码无语法错误
- [ ] 悬浮窗 z-index 确保覆盖所有页面元素

## Docs Sync

- [ ] PROGRESS.md 更新 DONE 状态
- [ ] MEMORY.md 沉淀经验
- [ ] NEXT_STEP.md 指向下一阶段
