# Clause Change Plan - Category Persistence

## 1. Change Information
- **Source**: User Requirement Change ("選擇 Category 後，Category 也要儲存記憶... 必須要載入儲存選項後，才可以做 Prompt Filtering")
- **Target Document**: `docs/02-spec/SPEC-prompt-library-shortcut.md`
- **Change Type**: Amend (Add 1 new clause, Update 1 existing clause)

## 2. Decision Tree (G14)
- Ready for canonical publication? → Amend
- Impact ≤ 3 clauses? → Amend
- Existing canonical location? → Amend in-place

## 3. Proposed Changes

### Modified Clause: TK-PL-003
- **ID**: TK-PL-003
- **Level**: MUST
- **Statement**: Selecting a category MUST filter the prompt title list to only show prompts belonging to that category. **The first filtering operation after page load MUST wait until the persisted category selection (if any) is fully loaded.**
- **Verification**: 
  1. Open the panel.
  2. Verify that no filtering occurs until the stored category state is retrieved.
  3. Verify the final filtered list matches the stored category.

### New Clause: TK-ST-003
- **ID**: TK-ST-003
- **Level**: MUST
- **Statement**: The last selected Category in the shortcut area MUST be persisted (e.g., in `chrome.storage` or `localStorage`). Upon next load, this category MUST be automatically selected and used for filtering.
- **Verification**: 
  1. Select a category (e.g., "Work").
  2. Refresh the page.
  3. Verify "Work" is selected in the dropdown and only "Work" prompts are listed.

## 4. Impact Analysis
- **Dependencies**: Depends on `TK-ST-001` (Persistence infrastructure).
- **Implementation**: Will require updates to `impl-state-persistence` (to handle the new key) and `impl-ui-shortcut` (to implement the loading guard).

## 5. Traceability
- Updates `docs/02-spec/SPEC-prompt-library-shortcut.md` sections 3 and 4.
