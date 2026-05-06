# Clause Change Plan - SPEC-prompt-library-shortcut

## 1. Change Information
- **Source**: User Requirement Change ("Prompt Library 關閉後，要更新 Prompt Shortcut Area 的 Title list")
- **Target Document**: `docs/02-spec/SPEC-prompt-library-shortcut.md`
- **Change Type**: Amend (Add new behavior clause)

## 2. Decision Tree (G14)
- Ready for canonical publication? → Amend
- Impact ≤ 3 clauses? → Amend (1 new clause)
- Existing canonical location? → Amend in-place

## 3. Proposed Changes

### New Clause: TK-PL-006
- **ID**: TK-PL-006
- **Level**: MUST
- **Statement**: When the full Prompt Library modal is closed, the Prompt Shortcut Area MUST refresh its title list to ensure synchronization with any additions, deletions, or modifications made within the modal.
- **Verification**: 
  1. Open the full Prompt Library.
  2. Perform an action (e.g., add a new prompt or delete an existing one).
  3. Close the modal.
  4. Verify the Prompt Shortcut Area list updates immediately without requiring a manual refresh or state change.

## 4. Impact Analysis
- **Dependencies**: Depends on `TK-PL-001` (Shared Data Source).
- **Implementation**: Will be implemented in `impl-ui-shortcut` (TK-PL-001/002/003/004/005/006).

## 5. Traceability
- Updates `SPEC-prompt-library-shortcut.md` section 3.
