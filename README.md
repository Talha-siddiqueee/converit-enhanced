# ConvertIt Enhanced

A browser-first conversion workspace for everyday files, media and data. ConvertIt brings common image, document, text, code, QR, unit, number, currency, colour and calculator tools into one responsive interface.

## Highlights

- **12 tool categories:** image, document, text, code, QR, unit, number, currency, colour, calculator, audio/video and AI text tools.
- **Local-first file handling:** image, document, text and media conversion is performed in the browser wherever the selected tool supports it.
- **Audio/video processing:** Web Audio APIs handle supported audio tasks; FFmpeg WebAssembly powers video conversion when the browser supports `SharedArrayBuffer`.
- **AI writing tools:** rewrite, summarise, brainstorm, explain, translate and grammar correction, streamed through the NVIDIA NIM server endpoint.
- **Activity history:** recent actions are stored locally in browser `localStorage`.
- **Responsive interface:** dark/light themes, keyboard-friendly controls, searchable tools and drag-and-drop routing to the matching converter (select the file in that converter to process it).

## Privacy and data handling

ConvertIt is local-first, not an unconditional offline or zero-network service:

| Feature | Data handling |
| --- | --- |
| Image, document, text, code, QR, unit, number, colour and calculator tools | Inputs are processed in the browser for the supported operations. |
| Audio/video tools | Files are processed in the browser using Web Audio APIs and/or FFmpeg WebAssembly. |
| AI text tools | The text submitted by the user is sent to the configured AI provider through the app's server route. Do not submit confidential or sensitive content. |
| Currency converter | Exchange-rate data is requested from the public open.er-api.com rates endpoint. |
| Recent activity | Action labels and timestamps are stored in the browser's local storage. |

AI provider keys must be configured as server environment variables. Never use `VITE_` prefixes for secrets; Vite exposes `VITE_` variables to client-side code.

## Tech stack

- React 19 and TypeScript
- TanStack Start and TanStack Router
- Vite 7
- Tailwind CSS 4
- Lucide React icons
- FFmpeg WebAssembly, `pdf-lib`, Mammoth, SheetJS, Papa Parse, Marked, Turndown and other focused conversion libraries
- Netlify's TanStack Start Vite plugin for full-stack deployment

## Requirements

- Node.js 20.19+ or 22.12+
- npm
- A modern browser. Audio/video conversion support depends on browser codec support; FFmpeg video conversion requires cross-origin isolation (`COOP` and `COEP` headers).

## Getting started

```bash
git clone https://github.com/Talha-siddiqueee/converit-enhanced.git
cd converit-enhanced
npm ci
```

Create a local `.env` file when you want to enable AI tools:

```env
NVIDIA_API_KEY=your_nvidia_api_key
# Optional; the Gemini API route is available for future provider selection.
GEMINI_API_KEY=your_gemini_api_key
```

Start the development server:

```bash
npm run dev
```

Open `http://localhost:3000`.

## Useful scripts

```bash
npm run dev        # Start the local development server
npm run typecheck  # Run the TypeScript checker
npm run build      # Create a production build
npm run preview    # Preview the production client build
```

## Deploying to Netlify

This project uses `@netlify/vite-plugin-tanstack-start` in `vite.config.ts`. Connect the GitHub repository to Netlify and use:

- Build command: `npm run build`
- Publish directory: `dist/client`

Configure `NVIDIA_API_KEY` (and optionally `GEMINI_API_KEY`) in the Netlify site's environment-variable settings. Do not commit `.env` files or secrets. The Netlify adapter deploys TanStack Start server routes as serverless functions; the AI endpoints therefore require a full-stack host such as the configured Netlify deployment, not a static-only host.

The Netlify headers in `netlify.toml` set Cross-Origin-Opener-Policy and Cross-Origin-Embedder-Policy for FFmpeg/WebAssembly support. Keep these headers in place unless the media converter is changed to no longer require cross-origin isolation.

## Project structure

```text
src/
├── components/
│   ├── converters/       # Feature-specific converter interfaces and logic
│   ├── Calculator.tsx
│   ├── Header.tsx
│   └── RecentActivity.tsx
├── config/
│   └── tools.tsx         # Tool catalogue and metadata
├── routes/
│   ├── __root.tsx        # App shell, metadata, footer and global drop handling
│   ├── index.tsx         # Home page and searchable tool catalogue
│   ├── tools.$toolId.tsx # Lazy-loaded converter route
│   └── api.*.ts          # Server-side AI provider endpoints
├── server/
│   └── aiRequest.ts      # Bounded request parsing and provider stream proxy
└── styles.css            # Design tokens, themes, motion and accessibility styles
```

## Security notes

- Keep provider keys in server-side environment variables only.
- The AI endpoints validate JSON payloads and enforce a prompt-size limit, but deployments should also apply provider usage limits and platform-level rate limiting.
- Do not expose API keys in screenshots, issue reports or committed configuration files.
- Treat uploaded files and AI prompts as user data; only submit content to external providers when the relevant feature requires it.

## License

No license file is currently included. Add a license before inviting others to reuse or redistribute the project.
