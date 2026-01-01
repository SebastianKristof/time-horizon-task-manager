# Title

Text-First, Always-Editable Task Interaction with Explicit Dragging and Undo Support

## Problem Statement

The task list UX must behave primarily like text while still supporting structural actions such as reordering and moving tasks between time horizons.

Key tension:

* Users expect text to be freely selectable, editable, and copyable.
* Tasks must remain movable without interfering with text interaction.
* Editing should feel immediate and natural, without explicit mode switching.
* All edits must support reliable undo / redo behavior.

Traditional view/edit modes and full-row dragging both break the mental model of text. This PRD defines a document-like interaction model that resolves these conflicts.

## Goals

* Tasks feel like plain text blocks, not form fields
* Text is always implicitly editable on desktop
* Native text selection and copy-paste always work
* Reliable undo / redo across text edits and structural actions
* Drag-and-drop is explicit and never gesture-ambiguous
* UI remains calm, minimal, and non-intrusive

## Non-Goals

* Object-style multi-task selection via click-drag
* Gesture-based dragging from arbitrary row areas
* Real-time collaborative editing
* Rich text formatting in this iteration

## Core Interaction Philosophy

* The task list behaves like a document with structure
* There is no explicit "edit mode" on desktop
* Editing is implicit via caret placement
* Structure is manipulated explicitly via handles
* Undo / redo is the primary safety mechanism, not confirmation dialogs

## User Stories

### Primary

* As a user, I want to click into text and start typing immediately.
* As a user, I want to select and copy text across lines and tasks.
* As a user, I want to undo any accidental edit instantly.
* As a user, I want to reorder tasks without interfering with text editing.

### Secondary

* As a user, I want controls to disappear while I am typing.
* As a user, I want undo to work consistently for both text edits and task movement.

## Interaction Model

### Unified State Model (Desktop)

There is no global View or Edit mode.

Each task exists in one of two implicit states:

* Idle (no caret)
* Active (caret placed in text)

State transitions are automatic and driven by pointer and keyboard behavior.

---

### Task Row Structure

Horizontal layout:

1. Drag handle
2. Checkbox
3. Text area (primary interaction zone)
4. Secondary actions (expand, delete, etc.)

---

### Text Area Behavior

* Always selectable (`user-select: text`)
* Becomes editable when caret is placed
* Supports:

  * Single-line editing
  * Multi-line editing (wrapped or explicit line breaks)
  * Selection across multiple tasks

Caret placement rules:

* Click without drag places caret
* Mouse down + drag performs selection
* Selection never triggers drag or movement

Edits:

* Changes are applied immediately to local state
* No explicit save button

---

### Idle State

* Text behaves like static text
* Drag handle and secondary actions appear on hover
* Cursor is I-beam over text

---

### Active (Editing) State

Triggered by:

* Clicking into text
* Keyboard focus via tab or arrow navigation

While active:

* Drag handle is hidden
* Secondary action buttons are hidden
* Only text editing affordances remain

Exiting active state:

* Clicking outside text
* Pressing Escape
* Navigating away via keyboard

---

### Drag Handle

* Dedicated, subtle handle (e.g. grip dots)
* Appears on hover in idle state
* Only draggable element in the row
* Cursor changes to grab / grabbing
* Dragging moves the entire task row

Dragging is disabled while a task is active (editing).

---

### Drag-and-Drop Behavior

* Drag starts only from the handle
* Drag preview represents the entire task
* Supported drops:

  * Reordering within the same list
  * Moving between horizon sections

Text selection must never initiate drag.

---

## Undo / Redo Model

Undo / redo is a first-class requirement and replaces explicit confirmation flows.

### Scope of Undo

Undo must cover:

* Text edits within a task
* Text edits across tasks
* Task reordering
* Moving tasks between horizons
* Task deletion (soft-delete reversible via undo)

### Behavior

* Standard keyboard shortcuts:

  * Undo: Cmd/Ctrl + Z
  * Redo: Cmd/Ctrl + Shift + Z

* Undo is linear and global within the document

* Structural actions (drag, delete) create undo checkpoints

### Text Editing Integration

* While typing, native browser undo stack is used
* On blur or structural action:

  * Text changes are committed as a single undoable operation

This ensures:

* Fine-grained undo while typing
* Coarse-grained undo for completed edits

### Escape Key

* Pressing Escape while editing:

  * Reverts text to last committed state
  * Removes caret
  * Does not create an undo step

---

## Accessibility Requirements

* Text editing and selection fully keyboard-accessible
* Drag handle is keyboard-focusable
* Provide aria-labels (e.g. "Reorder task")
* Undo / redo available via keyboard only

---

## Mobile Considerations (Forward Compatibility)

* Desktop model is primary target
* On mobile:

  * Tap places caret
  * Long-press on text selects text
  * Long-press on handle initiates drag
* Explicit edit affordance may be introduced if required

---

## Technical Requirements

* No drag listeners on task row container
* No `user-select: none` on rows or text
* Drag system must support handle-only dragging
* Editing state must suppress drag behavior
* Undo stack must unify text and structural actions

---

## Edge Cases

* Selecting text across tasks must not trigger drag
* Drag handle must not appear during active selection
* Undo after drag restores original order and horizon
* Undo after delete restores task and position

---

## Success Metrics

* Users can edit without entering a mode
* Accidental edits are quickly reversible
* No reported conflicts between selection and dragging
* Undo / redo is trusted and heavily used

---

## Open Questions

* Maximum undo depth
* Visual feedback for undoable structural actions
* Whether to expose redo in UI or rely on keyboard only

---

This PRD defines a document-like task system where text is always editable, structure is explicit, and undo is the primary safety net.
