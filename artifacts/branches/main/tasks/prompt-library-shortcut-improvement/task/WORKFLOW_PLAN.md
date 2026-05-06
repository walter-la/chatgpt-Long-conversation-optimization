# Workflow Plan: Prompt Library Shortcut Experience Improvement

## Strategy: Standard Delivery
We will implement the collapsible menu and the prompt shortcut area following a standard feature development lifecycle.

## Scope & Status
- [x] **1. 準備期 (Preparation)**: 建立 CONTEXT_PACKET、TASK_PLAN 與 WORKFLOW_PLAN。
- [x] **2. 規格定義 (Specification)**: 撰寫 `SPEC-prompt-library-shortcut.md`，定義需求與驗證條款。
- [x] **3. 實作開發 (Implementation)**: 執行 `TASK_PLAN.json` 內的 T01-T04 任務。
- [x] **4. 驗證與整合 (Verification)**: 執行 Quality Gate 檢查，確保符合 SPEC 條款。
- [ ] **5. 準備發布 (Release Readiness)**: 整理 Commit、更新說明文件。

## Current Phase: 5. 準備發布 (Release Readiness)

## Sequence Rationale
1. **Data Layer First**: Establish `state.js` (collapse/sort memory) and `i18n.js` strings so UI components can consume them immediately.
2. **UI Shell**: Implement the outer toggle mechanism (`TK-UI-001`, `TK-UI-002`, `TK-UI-003`) to create the physical space for the shortcut area.
3. **Core Logic**: Populate the shortcut area with the prompt data (`TK-PL-001`~`TK-PL-005`).
4. **Verification**: End-to-end test.

## Risks & Fallbacks
- **UI Layout Conflicts**: CSS rules might conflict with existing ChatGPT DOM. **Fallback**: Ensure strict scoping using `.chatgpt-toolkit-*` classes.
- **State Race Conditions**: Extension initialization timing. **Fallback**: Load state synchronously on init before rendering the toolbar.
