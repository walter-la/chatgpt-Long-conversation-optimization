---
doc_type: specification
archetype: component_spec
status: active
version: 1.0.0
task_id: timeline-close-button
---

# Timeline Panel Specification

## 1. Overview
The Timeline Panel is a floating vertical navigation aid that allows users to visualize and jump to specific messages in a ChatGPT conversation. It provides a temporal overview of the dialogue and supports interactive previewing and repositioning.

## 2. UI Components

### 2.1 Timeline Container
<!-- { "id": "TIMELINE-UI-001", "level": "MUST", "statement": "The timeline container MUST be an HTML <section> element with id `chatgpt-conversation-toolkit-timeline`.", "verification": "Manual check of DOM structure." } -->
- **ID**: `chatgpt-conversation-toolkit-timeline`
- **Classes**: `.chatgpt-toolkit-timeline`

### 2.2 Timeline Panel
<!-- { "id": "TIMELINE-UI-002", "level": "MUST", "statement": "The panel MUST contain a header, a track, and a content area.", "verification": "Manual check of DOM structure." } -->
- **Header**: Contains the title and message count.
- **Track**: The scrollable area containing message nodes.

### 2.3 Close Button (New)
<!-- { "id": "TIMELINE-UI-003", "level": "MUST", "statement": "The timeline panel MUST include a close button (X) in the header area.", "verification": "Verify presence of close button in the header." } -->
<!-- { "id": "TIMELINE-UI-004", "level": "MUST", "statement": "The close button MUST be positioned at the top-right or top-left of the header, ensuring high visibility.", "verification": "Visual inspection of layout." } -->
<!-- { "id": "TIMELINE-UI-005", "level": "MUST", "statement": "Clicking the close button MUST call `setTimelineVisibility(false)` to hide the panel.", "verification": "Manual test: click button and verify panel disappears and toolbar state updates." } -->

## 3. Behavior

### 3.1 Navigation
- Clicking a node jumps to the corresponding message in the conversation.

### 3.2 Hover Preview
- Hovering over a node displays a `preview` bubble with the message text.

### 3.3 Dragging
- The panel can be dragged by its header to reposition it on the screen.

### 3.4 Persistence
- The visibility state and manual position MUST be persisted across page reloads.

## 4. Localization
<!-- { "id": "TIMELINE-L10N-001", "level": "MUST", "statement": "The close button's ARIA label MUST be localized.", "verification": "Check i18n support for 'timeline.close' key." } -->

## 5. Non-Functional Requirements
- **Performance**: Rendering updates should not block the main thread (uses `requestAnimationFrame`).
- **Aesthetics**: The design should feel premium, with smooth transitions and modern styling.
