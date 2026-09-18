# Reentry — refinement, 18 September 2026

Reference: the approved 12-screen light/dark mockup, `Immagine Codex 17 set 2026, 14_45_38.png`. Keep ivory, petrol, photographic architecture and strong serif display typography. Existing photos are interpretations, not the exact mockup photography.

Implemented:
- Shared `motion.js`: entrance of sections, progress drawing, interruptible numeric feedback, coordinated dialog dismissal. Never animate a financial value through invented intermediate amounts.
- Removed the numeric MutationObserver that retriggered animations on every count-up frame, and the zero-to-total count-up.
- Press/release feedback, animated native disclosures in both directions, mobile bottom sheets, reduced-motion support. Escape cannot dismiss the locked login.
- Stronger serif display figures and headings, tabular numeric spacing, sans-serif transaction figures. Transaction amounts display cents rather than rounded euros.
- Compact mobile page headings, transaction type filters combined with search, chart-led Analysis; financial detail remains available below.
- Cache version 45 includes the shared motion module.

Validation: 87 node tests pass, including overlapping animation cancellation, exact value preservation, reduced motion, deferred dialog removal, and combined filters. Browser checked light/dark Home, movement filters, Analysis, Plan at 320 px, Home at 390/1280 px, movement sheet, disclosure expansion, settings and dismissal. No JavaScript errors observed. Preview uses isolated fictional data and a mock cloud provider; no real wallet was edited. This pass is not a pixel-identical reproduction of all six mockup screens: goals remain in Plan and profile remains the existing settings flow. Office prototype is unchanged and paused.
