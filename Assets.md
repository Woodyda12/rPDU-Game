# ASSETS — Optional .glb Model Hot-Swap

This project runs with **zero external assets** using Babylon primitives. If you drop models into `/public/models/`, they will be auto-loaded (TypeScript build) and used instead of placeholders.

## Supported Model Names
- `door.glb` — replaces the rectangular door at the front wall.
- `rack.glb` — replaces one placeholder rack (duplicate/position as desired in your DCC tool).
- `panel.glb` — optional: use for decorative panels.

You can change file names in `src/config/gameConfig.ts` → `assets`.

## Conventions (recommended)
- **Units:** meters.
- **Up axis:** Y-up.
- **Pivot:** at **base** center for doors/panels; at base front-center for racks.
- **Scale targets:** 1.0 = meters. Test within the scene; typical rack ~2.0m high, 0.8m wide.
- **Collision:** keep poly counts modest; add single convex collider mesh if needed (not required by default).
- **Materials:** use PBR or Standard with **emissive** accents (hex)  
  - Orange `#FF6A00` / `#FF7F2A`  
  - Accent Cyan `#00FFF0` / Green `#00FF90`  
  Keep base albedo dark (`#0E0E10` / `#1A1A1D`) for fluoro glow.

## Placement Hints
- Door position: `(0, 1.2, -3.96)` roughly (room depth = 8m).  
- Panels (placeholders) are at:
  - Keypad: `(-2.5, 1.2, -3.96)`
  - Cable: `( 2.5, 1.2, -3.96)`
  - Thermal: `( 0.0, 0.9,  3.96)`

If a model fails to load, the placeholder remains.
