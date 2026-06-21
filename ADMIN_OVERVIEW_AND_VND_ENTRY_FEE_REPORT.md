# Admin Overview and VND Entry Fee Report

## Files changed

- `frontend/src/components/admin/AdminOverview.jsx`
- `frontend/src/components/admin/events/wizard/TournamentInfoStep.jsx`
- `frontend/src/components/admin/events/wizard/ReviewStep.jsx`
- `frontend/src/components/admin/events/workspace/TournamentDetails.jsx`
- `frontend/src/data/tournamentPrototype.js`
- `frontend/src/lib/eventFormatters.js`

## Admin Overview improvements

- Strengthened the overview header hierarchy and added compact live system indicators.
- Improved KPI card loading feedback and retained the existing metric meanings.
- Improved work-queue count loading, text wrapping, spacing, and responsive behavior.
- Added a dedicated loading skeleton for upcoming tournaments instead of showing a premature empty state.
- Improved upcoming tournament rows with clearer date, status, and interaction treatment.
- Refined quick-action and lifecycle cards with clearer grouping and visual depth.
- Standardized overview status and operational copy in Vietnamese.
- Preserved all existing API calls, parallel loading, navigation callbacks, and admin behavior.

## Entry fee updates

- Tournament entry fee input now uses VND labeling.
- Input remains numeric with `min="0"` and now uses `step="1000000"`.
- New tournament default entry fee is `1000000` VND.
- Added the shared `formatVndCurrency` formatter.
- Wizard review and tournament details now use the same VND display format.
- Chosen display format: `1.000.000 ₫`.
- Tournament adapters continue to read and send the raw numeric VND amount without division or cent conversion.
- Existing frontend and backend validation both reject negative entry fees.

## Backend compatibility

- No backend files were changed.
- The current backend uses `BigDecimal` and MySQL `DECIMAL(12,2)` with a non-negative constraint, which accepts the selected VND default and increment.

## Verification

- `npm run build`: PASS
- Vite transformed 2,257 modules and completed the production build.
- Existing advisory remains for a JavaScript chunk larger than 500 kB.

## Remaining limitations

- Race prize amounts still use their existing THB presentation because this task standardizes Tournament entry fee only.
- Browser-based authenticated visual checks at desktop, tablet, and mobile widths remain recommended.
