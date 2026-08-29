# Canvas, controls, and game-loop foundation audit

## Scope and existing architecture

The React `GameCanvas` owns the canvas, HUD overlays, pause/game-over presentation, resize observation, and the existing custom touch joystick. `GameEngine` remains the simulation owner: one `requestAnimationFrame` loop updates the player, automatic weapons and targeting, projectiles, enemy spawning/AI/collisions, drops, particles, camera, and stats. Pause cancels the scheduled frame and resume resets the timestamp before scheduling one new frame. Projectiles and particles already use reverse-loop lifetime cleanup and particles have a hard cap. Keyboard and touch both feed movement while automatic fire remains engine-controlled.

The Web Audio synthesizer already has separate master/SFX/music gain paths, overlapping oscillator effects, lazy gesture-time context creation/unlock, and explicit music stop. Firebase remains optional for gameplay; its auth observer, duplicate-sign-in guard, local sync warning, profile subscription, and guest state were reviewed and left unchanged. Leaderboard writes remain client-originated and should receive a separate security-model review rather than being expanded in this foundation change.

## External repository evaluation

The requested repositories were evaluated as candidates, but the execution environment returned HTTP 401/403 for GitHub pages, API requests, and clones. Consequently their current licenses, activity, dependency trees, and exact source could not be independently verified during this run. **No source code or assets from any candidate were copied or materially adapted.** This change uses small, original TypeScript utilities based on standard Canvas, Pointer/Touch, and animation-frame browser APIs.

| Repository | Candidate area | Result |
| --- | --- | --- |
| `forinda/canvas-games` | loop/entity patterns | Not reused: current license and source could not be verified; Viper already had frame-independent updates and bounded cleanup. |
| `FreeeeZ/tank-game` | entity separation | Not reused: current license could not be verified; a broad engine split was not justified for this focused change. |
| `daniel-black/react-mini-games` | DPR/resizing | Not reused: current license could not be verified. Viper now uses an original CSS/backing-store sizing utility. |
| `yoannmoinet/nipplejs` | joystick | Dependency not added. License/health/bundle could not be reverified, and the existing identifier-tracked touch control already provides dead zone, centering, cancellation, and fallback without bundle cost. |
| `htlin222/web-gamepad-starter` | gamepad | Not reused and gamepad was deferred: license could not be verified and adding another input surface was unnecessary risk in the DPR/input normalization phase. |
| `VBeatDead/ReEnd-Components` | HUD | Not reused: license could not be verified and unrelated UI redesign was explicitly out of scope. |
| `IgorBayerl/react-vite-tailwind-typescript-firebase-auth-template` | auth | Not reused: license could not be verified and the current auth lifecycle already includes the relevant safeguards. |
| `goldfire/howler.js` | audio | Dependency not added. The existing zero-dependency Web Audio engine meets the immediate overlapping-effects, volume separation, and lazy unlock needs; any migration should be proposed separately. |

No third-party notices are required because no third-party implementation was used. A future pass with GitHub access should reverify licenses from repository license files before drawing deeper implementation comparisons.

## Implemented changes and observations

- Canvas CSS dimensions and logical gameplay dimensions are separated from the backing buffer. DPR is clamped to `[1, 2]`, resize observation reapplies both dimensions, and the engine renders through a DPR transform while camera/spawn math continues to use CSS-pixel coordinates. This prevents Retina blur without allowing 3x/4x mobile backing buffers to multiply fill cost.
- Keyboard and touch now resolve through one normalized control-intent function. Diagonal keyboard input is bounded, touch takes precedence only while active, and analog touch magnitude is preserved rather than being promoted to full speed. Auto Fire and targeting are untouched.
- Delta calculation is isolated and tested. Invalid/non-forward timestamps produce no simulation step and background restoration is capped at 50 ms. Pause/resume still prevents duplicate animation loops.
- A development-only, once-per-second performance snapshot records approximate FPS/frame time and active enemy, player projectile, enemy projectile, and particle counts. It has no production update cost because Vite removes the `import.meta.env.DEV` branch.
- No runtime dependency was added. No balance, art, progression, targeting, Firebase rules, or GitHub Pages base-path changes were made.

## Validation and follow-up

Automated checks cover dead-zone and release behavior, normalized diagonal input, touch precedence/analog strength, DPR/backing-buffer calculations, and large-delta clamping. Existing projectile lifetime cleanup remains covered by code inspection; a future engine test harness could exercise projectile cleanup and high-entity stress without relying on DOM/Audio globals. Recommended follow-ups are real-device iOS/Android control testing, opt-in native Gamepad API support after the requested reference license is verified, a repeatable engine stress harness, and server-authoritative leaderboard validation. The production bundle warning also suggests future Firebase/UI route code splitting, separate from gameplay foundations.
