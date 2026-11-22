# ConvertIt Enhanced — Agent Notes

## Product overview

ConvertIt is a browser-first file and data conversion workspace. It contains 12 tool categories: image, document, text, code, QR, unit, number, currency, colour, calculator, media and AI text tools.

## Stack

- React 19 + TypeScript (strict mode)
- TanStack Start + TanStack Router file-based routes
- Vite 7
- Tailwind CSS 4 + custom CSS design tokens
- Lucide React
- Netlify TanStack Start Vite plugin

## Source layout

- `src/routes/index.tsx`: homepage, tool search and category catalogue.
- `src/routes/tools.$toolId.tsx`: lazy-loaded tool pages.
- `src/routes/__root.tsx`: shared application shell, metadata, history panel and drag-and-drop routing.
- `src/routes/api.ai-nvidia.ts` and `src/routes/api.ai-gemini.ts`: server-only AI provider routes.
- `src/server/aiRequest.ts`: bounded JSON prompt validation and server-sent-event stream proxy.
- `src/components/converters/`: converter feature components.
- `src/config/tools.tsx`: the shared category catalogue.
- `src/styles.css`: global theme tokens, motion and accessibility styles.

## Development commands

```bash
npm ci
npm run dev
npm run typecheck
npm run build
npm run preview
```

## Important implementation constraints

1. **Never expose secrets in browser code.** Provider keys must be read from server-side `process.env` only. Never introduce `VITE_*_API_KEY` or other `VITE_*` secrets.
2. **Be accurate about data flow.** File/media conversions are browser-local where implemented. AI prompts go to the configured provider. Currency rates are fetched from an external service. Do not claim that every feature is fully offline or that no data ever leaves the browser.
3. **Preserve cross-origin isolation headers.** `Cross-Origin-Opener-Policy` and `Cross-Origin-Embedder-Policy` are needed by the current FFmpeg WebAssembly implementation.
4. **Use the Netlify Start adapter.** The project uses `@netlify/vite-plugin-tanstack-start` and `dist/client`. Do not switch the app to a static-only server preset while server API routes are part of the product.
5. **Keep converter components lazy-loaded** from `src/routes/tools.$toolId.tsx` to avoid shipping every heavy dependency on the initial page.
6. **Respect reduced-motion preferences** and maintain visible keyboard focus styles.
7. Keep tool labels, descriptions and route keys in sync in `src/config/tools.tsx` and the tool component map.
