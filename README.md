# Room Designer

Converts a user-defined 2D room outline from an uploaded floor plan into an interactive, dimensionally accurate 3D room.

Stack: React + TypeScript + Vite, React Konva (2D), Three.js + React Three Fiber + Drei (3D).

## Getting Started / 运行指南

### 1. Install Node.js

1. Go to [nodejs.org](https://nodejs.org) and download the **LTS** version.
2. Open the downloaded `.pkg` file and click **Continue → Install**, then enter your computer password.
3. **Close and reopen your terminal** (including the terminal inside Cursor).
4. Check that it worked — both commands should print a version number:

```bash
node -v
npm -v
```

### 2. Clone the project

Open Terminal and run:

```bash
git clone https://github.com/champaigncoda/code-ada-team10
cd code-ada-team10
open -a Cursor .
```

> The last line opens the project in Cursor (macOS only). You can also open the folder from Cursor via **File → Open Folder**.

### 3. Install dependencies

Only needed the first time, or after someone adds a new package:

```bash
npm install
```

### 4. Run the website

```bash
npm run dev
```

You should see something like:

```
Local: http://localhost:5173/
```

Open that link in your browser. 🎉
To stop the server, press `Ctrl + C` in the terminal.

## Troubleshooting

| Problem | Fix |
|---|---|
| `command not found: node` | Restart your terminal after installing Node.js. |
| `npm install` fails | Make sure you're inside the project folder (`cd code-ada-team10`). |
| Port already in use | Vite will pick the next free port — use the link shown in the terminal. |
