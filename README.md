# Room Designer

Converts a user-defined 2D room outline from an uploaded floor plan into an interactive, dimensionally accurate 3D room.

Stack: React + TypeScript + Vite, React Konva (2D), Three.js + React Three Fiber + Drei (3D).

## Scripts

| Command             | Description                    |
| ------------------- | ------------------------------ |
| `npm run dev`       | Start the dev server           |
| `npm run build`     | Type check and production build |
| `npm run typecheck` | TypeScript checks only         |
| `npm run lint`      | ESLint                         |
| `npm run preview`   | Serve the production build     |

## Coordinate conventions

- 2D points are stored in original image pixel coordinates (origin top-left, +y down).
- Real-world dimensions are in meters.
- Pixel-to-meter conversion is derived from a `ScaleCalibration`, never stored on points.
