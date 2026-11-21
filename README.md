# HORIZON KARTS — WORLD TOUR

An original 3D arcade kart racer inspired by open-world kart racing games. Built with **Three.js**, WebGL shaders, HTML and CSS. All track geometry, vehicles, scenery, UI, effects and sound synthesis are generated in code. No Nintendo assets, copyrighted music or external 3D models are included.

## Play modes

- **Grand Prix** — race against five AI drivers across three laps.
- **Time Trial** — race the clock, aim for your best time.
- **Free Drive** — explore the coastal island, practice corners and gather boost energy.

## Features

- 3D island environment: beach, ocean shaders, moving clouds, city skyline, mountains, forest, ferris wheel, lighthouse, and track-side scenery.
- Dynamic lighting, physically based clearcoat car materials, smooth shadows, ACES filmic tone mapping, optional bloom, fog and procedural road textures.
- Three karts with distinct speed, acceleration and steering characteristics.
- Arcade driving, drifting, charged drift boosts, turbo pads, floating pickups, rival collisions and lap detection.
- Three camera angles, animated dashboards, minimap, lap timer, leaderboards, countdown, results screen, mobile/touch controls, and original synthesized engine/pickup sounds.
- Zero build dependencies. 100% static Cloudflare Pages compatible.

## Controls

| Action | Keyboard | Touch |
| --- | --- | --- |
| Accelerate | W / ↑ | GO |
| Brake / reverse | S / ↓ | BRAKE |
| Steer | A / D or ← / → | ◀ / ▶ |
| Drift | Hold SPACE while turning | DRIFT |
| Boost | SHIFT | Automatic via turbo pads (keyboard boost is additional) |
| Camera | C | — |
| Reset to road | R | — |
| Pause | P / ESC | Pause button |
| Sound | M | Music button in main menu |

## Deploy with Cloudflare Pages

1. Visit [Cloudflare dashboard](https://dash.cloudflare.com/) and select **Workers & Pages**.
2. Create a **Pages** project using **Git integration** and connect GitHub.
3. Select the **XNullForm/Mario-Kart-World** repository.
4. Use production branch **main**, framework **None**.
5. Leave the **Build command** blank.
6. Set the **Build output directory** to **public**.
7. Deploy. Cloudflare will give you a public `*.pages.dev` link. Future pushes to `main` redeploy automatically.

The repository root is NOT the deployment directory — it is specifically the `public` folder containing `index.html`.

If you already have a Cloudflare Pages project, update its Git source/build configuration instead of creating a duplicate.

## Local development

Run a local HTTP server from the repository root:

```bash
python -m http.server 8000 --directory public
```

Then open http://localhost:8000 . Because the game uses browser ES modules, opening `index.html` with `file://` will not work reliably. An internet connection is required to fetch Three.js from jsDelivr.

## Repository layout

- `public/index.html` — pages, menus, HUD and on-screen controls.
- `public/style.css` — responsive visual design, glass panels and overlays.
- `public/world.js` — island, road mesh, props, shader materials, pickups and boost pads.
- `public/game.js` — renderer, karts, AI, driving physics, game modes, HUD, audio and cameras.

## Notes

This is an original browser kart racer, not the commercial *Mario Kart World* game or a port of Nintendo's assets. Its visual style and game mechanics can be expanded freely. Real-time shadows and bloom depend on device performance. A modern WebGL 2 browser is recommended.
