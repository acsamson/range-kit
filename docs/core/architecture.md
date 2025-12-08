# Architecture

The `range-kit` core architecture is designed around three main pillars: **Locator**, **Highlighter**, and **Interaction**. These are orchestrated by the **SelectionManager**.

## Module Overview

### 1. Locator (Algorithm Layer)
The Locator is responsible for the pure calculation of range positions. It handles the conversion between DOM `Range` objects and serializable JSON data.

- **Serialization**: Converts a DOM Range into a robust JSON object containing multiple fallback strategies (ID, Path, Context, Fingerprint).
- **Restoration**: Takes a serialized JSON object and attempts to reconstruct the DOM Range, trying strategies from most precise to most robust.
- **Independence**: This layer is designed to be as pure as possible, making it potentially usable in non-browser environments (e.g., for server-side validation).

### 2. Highlighter (Rendering Layer)
The Highlighter is responsible for visually representing selections on the screen.

- **Painters**: It uses a strategy pattern for "Painters".
  - `CSSPainter`: Uses the CSS Custom Highlight API (Level 1) for high performance and zero DOM mutation.
  - `DOMPainter` (Internal fallback): Wraps text nodes in span elements when the CSS API is unavailable.
- **Style Registry**: Manages unique styles for different types of highlights (e.g., user selection vs. search result).

### 3. Interaction (Event Layer)
The Interaction module bridges user actions with the underlying data.

- **Event Normalization**: It abstracts the differences between clicking on a real DOM element (DOM wrapping) and a virtual highlight (CSS Highlight API).
- **Hit Testing**: It performs geometric calculations to determine if a mouse event intersects with a highlight range.

## Orchestration

### SelectionManager
The `SelectionManager` acts as the main entry point and facade. It:
- Initializes the subsystems.
- Manages the lifecycle of `SelectionSession`.
- Exposes a unified API for consumers.

### SelectionSession
Represents a user's active engagement with the text. It coordinates:
- The current selection state.
- Overlap detection logic.
- Interaction events routing.
