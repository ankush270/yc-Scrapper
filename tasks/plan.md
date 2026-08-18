# Implementation Plan: YC Trends & Saturation Visualizer

## Overview
This plan details the implementation of Feature D: Interactive YC Trends & Saturation Visualizer using custom SVG charting in React.

## Architecture Decisions
- **ADR-001 (Custom SVG Charting)**: Use native React SVG components for charts to guarantee React 19 compatibility and achieve cyberpunk visual aesthetics.
- **ADR-002 (Hybrid Funding Logic)**: Match real-world funding for 145 famous/CSV startups and dynamically estimate the rest using team size, exit status, and top company status.

## Task List

### Phase 1: Foundation
- **[ ] Task 1**: Introduce Tab bar navigation in `App.jsx` and handle active tab state transitions.
- **[ ] Task 2**: Set up and export funding matching data helpers.

### Checkpoint: Foundation
- Tabs can switch without compilation errors.
- Real funding data matches key records correctly.

### Phase 2: Core Components & SVG Charts
- **[ ] Task 3**: Create the `TrendsDashboard.jsx` base component and data aggregation calculations.
- **[ ] Task 4**: Build Chart 1: SVG Sector Trends Line/Area Chart with dynamic metric selector and custom keyword filters.
- **[ ] Task 5**: Build Chart 2: SVG Stacked Bar Chart for Survival Breakdown by Industry.
- **[ ] Task 6**: Build Chart 3: SVG Team Size Distribution Histogram and curve overlay.
- **[ ] Task 7**: Add hover tooltips, vertical tracking crosshairs, and dynamic stats labels.

### Checkpoint: Core Features
- Trends Dashboard displays all three charts.
- Interaction with presets and hover tooltips functions correctly.

### Phase 3: Polish & Integration
- **[ ] Task 8**: Integrate tab switching GSAP animations in `App.jsx`.
- **[ ] Task 9**: Review Tailwind CSS styling, ensure responsive dimensions, and run full production builds.

### Checkpoint: Complete
- Dashboard fits mobile and desktop screens.
- Build compiles with zero errors.
- Verification walkthrough complete.

## Risks and Mitigations
| Risk | Impact | Mitigation |
| :--- | :--- | :--- |
| Coordinate layout offset bugs | Medium | Implement standard scaling margins (padding inside SVG canvas). |
| Dynamic text rendering issues in SVG | Low-Medium | Use responsive sizes and hide text labels on small screen dimensions. |
