# Workflow Plan - Timeline Close Button

## Objective
Add a close button (X) to the Timeline Panel to allow users to hide it easily, matching the behavior of the "Hide Timeline" option in the toolbar.

## Strategy
- **Type**: New Feature (Workflow A)
- **Governance**: Lite
- **Approach**: 
  1. Formalize the Timeline component specification.
  2. Implement the UI change in `features/timeline.js`.
  3. Style the button in `styles.css`.

## Stages

### Stage 1: Specification
- **Skill**: S02 Spec & Clause Authoring
- **Tasks**:
  - Create `docs/02-spec/SPEC-timeline.md`.
  - Define the layout and behavior of the Timeline Panel.
  - Add the requirement for the close button.

### Stage 2: Implementation
- **Skill**: S05 Implementation
- **Tasks**:
  - Update `ensureTimeline` in `features/timeline.js` to include the close button HTML.
  - Bind a click event to the close button that triggers `setTimelineVisibility(false)`.
  - Add CSS rules to `styles.css` for the close button positioning and aesthetics (vibrant, modern).

### Stage 3: Quality Gate
- **Skill**: S06 Quality Gate & Triage
- **Tasks**:
  - Verify that the close button appears correctly.
  - Verify that clicking the button hides the Timeline Panel.
  - Verify that the "Show Timeline" button in the toolbar still works as expected.

## Risks & Mitigations
- **UI Conflict**: Ensure the close button doesn't overlap with the title or count.
- **State Sync**: Ensure `setTimelineVisibility(false)` correctly updates the toolbar button state and persists preference.
