---
id: SPEC-PL-001
title: Prompt Library Shortcut & Collapsible Panel Specification
status: draft
doc_type: specification
version: 1.0.0
---

# Prompt Library Shortcut & Collapsible Panel Specification

## 1. Executive Summary
This specification defines the behavior and UI requirements for adding a collapsible main panel to the ChatGPT Toolkit and a "Prompt Shortcut" area visible in the collapsed state. The goal is to provide quick access to frequently used prompts without opening the full Prompt Library popup.

## 2. UI Components & Layout

<!-- { "id": "TK-UI-001", "level": "MUST", "owner": "frontend", "status": "draft" } -->
### TK-UI-001: Collapsible Toggle Button
- **Statement**: The Toolkit main panel MUST include a toggle button at the top header to switch between "Expanded" and "Collapsed" states.
- **Verification**: UI inspection; state transition on click.

<!-- { "id": "TK-UI-002", "level": "MUST", "owner": "frontend", "status": "draft" } -->
### TK-UI-002: Expanded State Visibility
- **Statement**: In the "Expanded" state, the panel MUST display all existing toolkit features (Optimize, Export, Settings, etc.) as currently implemented.
- **Verification**: Visual comparison with current baseline.

<!-- { "id": "TK-UI-003", "level": "MUST", "owner": "frontend", "status": "draft" } -->
### TK-UI-003: Collapsed State Visibility
- **Statement**: In the "Collapsed" state, the panel MUST hide most main features (actions, search) AND extraneous UI elements (subtitle, status text, tips, CTA rows), and ONLY display:
  1. Panel Header (Title + Toggle Button, excluding subtitle)
  2. Prompt Shortcut Area (Prompt Library Button, Category selector, Title list)
- **Verification**: Visual inspection of hidden/visible elements.

<!-- { "id": "TK-UI-004", "level": "MUST", "owner": "frontend", "status": "draft" } -->
### TK-UI-004: Visual Consistency
- **Statement**: Elements in the shortcut area MUST follow the toolkit's design system:
  1. The **Prompt Library button** MUST use the "Primary" button style (Green background, similar to "Export JSON").
  2. **Prompt Shortcut items** MUST use the "Secondary" button style (Bordered, adapting to Light/Dark theme, similar to "Settings" button).
  3. All text MUST be clearly legible in both Light and Dark modes.
- **Verification**: Visual inspection in both Light and Dark modes.

## 3. Prompt Shortcut Area Behavior

<!-- { "id": "TK-PL-001", "level": "MUST", "owner": "logic", "status": "draft" } -->
### TK-PL-001: Shared Data Source
- **Statement**: The shortcut area MUST use the same data source as the full Prompt Library. Any changes (Add/Delete/Import) MUST be reflected in both places.
- **Verification**: Add a prompt in full library -> verify it appears in shortcut area.

<!-- { "id": "TK-PL-002", "level": "MUST", "owner": "frontend", "status": "draft" } -->
### TK-PL-002: Category Selector
- **Statement**: The shortcut area MUST include a category dropdown containing "All categories" and all unique categories defined in the stored prompts.
- **Verification**: Verify dropdown options match unique categories in data.

<!-- { "id": "TK-PL-003", "level": "MUST", "owner": "logic", "status": "draft" } -->
### TK-PL-003: Prompt Filtering
- **Statement**: Selecting a category MUST filter the prompt title list to only show prompts belonging to that category.
- **Verification**: Select category -> verify only matching prompts are listed.

<!-- { "id": "TK-PL-004", "level": "MUST", "owner": "logic", "status": "draft" } -->
### TK-PL-004: Copy on Click
- **Statement**: Clicking a prompt title in the shortcut list MUST copy the prompt's `content` to the clipboard. It MUST NOT auto-fill or auto-submit to ChatGPT.
- **Verification**: Click title -> verify clipboard content matches prompt content; verify input box is unchanged.

<!-- { "id": "TK-PL-005", "level": "MUST", "owner": "frontend", "status": "draft" } -->
### TK-PL-005: Scrollable List
- **Statement**: The prompt title list MUST have a `max-height` (e.g., 220px) and a vertical scrollbar if the content exceeds this height.
- **Verification**: Add >20 prompts -> verify scrollbar appears and panel height remains stable.

## 4. State Persistence

<!-- { "id": "TK-ST-001", "level": "MUST", "owner": "storage", "status": "draft" } -->
### TK-ST-001: Persistence of Collapse State
- **Statement**: The Expanded/Collapsed state MUST be persisted (e.g., in `chrome.storage` or `localStorage`). The default state MUST be "Collapsed" if no persistent state exists. The state MUST remain consistent across page refreshes and browser restarts.
- **Verification**: Open the Toolkit without previous state -> Verify panel is collapsed by default. Collapse/Expand panel -> Refresh page -> Verify panel state is restored.

<!-- { "id": "TK-ST-002", "level": "MUST", "owner": "storage", "status": "draft" } -->
### TK-ST-002: Persistence of Sort Preference
- **Statement**: The sort preference selected in the full Prompt Library MUST be persisted and applied to the shortcut list.
- **Verification**: Change sort to "Title A-Z" in popup -> Verify shortcut list follows the same order after refresh.

## 5. Internationalization (i18n)

<!-- { "id": "TK-I18N-001", "level": "MUST", "owner": "i18n", "status": "draft" } -->
### TK-I18N-001: Multi-language Support
- **Statement**: All new UI strings MUST support English and Traditional Chinese.
- **Verification**: Change browser language -> Verify toolkit UI strings update accordingly.
