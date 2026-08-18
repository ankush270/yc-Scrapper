# YC Trends Visualizer Tasks Checklist

## Task 1: Navigation Tabs in App.jsx
**Description:** Implement terminal-style tabs selector below the header in App.jsx and add active state hooks to swap views.
**Acceptance criteria:**
- [ ] User can click `[ EXPLORER_CONSOLE ]` and `[ TRENDS_DASHBOARD ]` buttons.
- [ ] Active button has a neon-cyan border, cyan text, and a glowing drop shadow.
- [ ] Swapping tabs toggles between showing the main list/filters and a placeholder view for the dashboard.
**Verification:**
- [ ] Switch tabs in browser and confirm active tab styling changes and the corresponding content toggles.
**Dependencies:** None
**Files likely touched:**
- `src/App.jsx`
**Estimated scope:** Small

---

## Task 2: Trends Dashboard Component Setup & Data Aggregation
**Description:** Create `TrendsDashboard.jsx` skeleton and write data aggregation logic using `useMemo` to group startups by batch year, industry, keywords, and team size.
**Acceptance criteria:**
- [ ] Calculate startup counts, average team size, and average funding for each YC batch year (2005 to 2026/2027) per industry and preset keywords.
- [ ] Look up real funding from `realFunding.js`, fallback to the dynamic estimation formula for other startups.
- [ ] Compute survival status ratios per industry.
- [ ] Compute team size distribution brackets (`1-10`, `11-50`, `51-200`, `201-500`, `500+`).
**Verification:**
- [ ] Render JSON strings of the computed arrays in a debug view on screen to check correctness.
**Dependencies:** Task 1
**Files likely touched:**
- `src/components/TrendsDashboard.jsx`
**Estimated scope:** Medium

---

## Task 3: Build Chart 1 (SVG Line & Area Chart for Sector Trends)
**Description:** Implement a fully interactive SVG line and area chart for sector trends over time, supporting toggles for metrics and checkboxes/search for categories.
**Acceptance criteria:**
- [ ] Render smooth line paths for each active industry or keyword with a gradient fill under each line.
- [ ] Offer metric toggle buttons (`Startup Count`, `Avg Team Size`, `Avg Funding`).
- [ ] Provide preset buttons and a text search box to add custom keywords (e.g. "SaaS", "Biotech").
- [ ] Correctly compute responsive SVG viewBox and scaling coordinates.
**Verification:**
- [ ] Verify curves change shape when toggling metrics or adding custom keywords.
**Dependencies:** Task 2
**Files likely touched:**
- `src/components/TrendsDashboard.jsx`
**Estimated scope:** Medium

---

## Task 4: Build Chart 2 (SVG Stacked Bar Chart for Survival Breakdown)
**Description:** Implement a stacked bar chart displaying the operating status proportions (Active, Acquired, Public, Inactive) for each industry.
**Acceptance criteria:**
- [ ] Render 9 horizontal bars (one per industry), each scaled to 100% width.
- [ ] Divide each bar into colored segments: Active (Emerald), Acquired (Cyan), Public (Gold), Inactive (Slate).
- [ ] Display industry names and percentage marks on the axis.
**Verification:**
- [ ] Visual verification of the status breakdown proportions in the charts section.
**Dependencies:** Task 2
**Files likely touched:**
- `src/components/TrendsDashboard.jsx`
**Estimated scope:** Small

---

## Task 5: Build Chart 3 (SVG Team Size Distribution Chart)
**Description:** Implement a vertical histogram representing the distribution of companies across team size brackets, overlaid with a distribution curve.
**Acceptance criteria:**
- [ ] Render 5 vertical bars for `1-10`, `11-50`, `51-200`, `201-500`, and `500+` brackets.
- [ ] Draw a neon curve path linking the mid-points of the bars to simulate a distribution density curve.
- [ ] Display bracket labels on the X-axis and counts/percentages on the Y-axis.
**Verification:**
- [ ] Verify the histogram columns render in correct heights and the line overlays smoothly.
**Dependencies:** Task 2
**Files likely touched:**
- `src/components/TrendsDashboard.jsx`
**Estimated scope:** Small

---

## Task 6: Add Hover Tooltips & Crosshairs
**Description:** Implement mouse-tracking overlays, crosshair guidelines, and high-fidelity tooltips for all three SVG charts.
**Acceptance criteria:**
- [ ] Moving mouse inside Chart 1 draws a vertical cyan dashed line snapping to the nearest year, opening a tooltip panel with year statistics.
- [ ] Hovering over segments in Chart 2 or bars in Chart 3 shows tooltips detailing category names, counts, and percentages.
- [ ] Tooltips are styled in retro black glass styling with a neon border.
**Verification:**
- [ ] Hover over all charts in browser and check that tooltips align correctly and show accurate data.
**Dependencies:** Task 3, Task 4, Task 5
**Files likely touched:**
- `src/components/TrendsDashboard.jsx`
**Estimated scope:** Medium

---

## Task 7: Transition Animations & Polish
**Description:** Wire up GSAP animation timelines in `App.jsx` to slide and fade panels when toggling tabs, polish responsive designs, and verify the final production build.
**Acceptance criteria:**
- [ ] Tab switches trigger a smooth GSAP exit-entry transition (opacity, slight y-displacement).
- [ ] Responsive width classes ensure the charts adapt cleanly to tablet/mobile viewports.
- [ ] Run `npm run build` to verify clean build compilations.
**Verification:**
- [ ] Run production build and test execution in browser.
**Dependencies:** Task 6
**Files likely touched:**
- `src/App.jsx`
- `src/components/TrendsDashboard.jsx`
**Estimated scope:** Small
