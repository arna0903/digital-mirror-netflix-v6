# Digital Mirror — Netflix V6

A browser-based calm-computing prototype that turns viewing time into an illustrated reflection. At episode boundaries, a student-like bear changes posture and expression as session strain rises. Viewers can continue watching or choose to take a break; the prototype does not shut itself down.

## Run the prototype

1. Download or clone this repository.
2. Open `index.html` in a modern desktop browser.
3. Select **Start Netflix Simulation**.

The simulation uses local episode clips in `netflix/assets/`. The p5.js library is included locally, so no package installation or build step is required. Browser storage keeps the bear's strain and recovery state on the current device.

## Interaction notes

- The 20-minute viewing reminder is accelerated for demonstration.
- A selected 20-second eye-rest pauses the episode and asks the viewer to resume when ready.
- The bear scene and strain meter appear between episodes.
- Ambient sound and the short reminder chime are generated in the browser and can be disabled with the ambient sound control.
- After episode 3, continuing leads to a blank screen for demonstration.

## Project layout

- `index.html`, `app.js`, `style.css` — prototype entry page.
- `netflix/` — player, reflection card, styles, and episode videos.
- `mirror/` — p5.js bear scene, strain bridge, styles, and bundled p5.js library.

## Notes

This is a student demonstration prototype, not a production streaming service. The episode videos are included as demo media; confirm you have permission to redistribute them before making the repository public.
