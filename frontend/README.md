# AskMyDocs — Neural Codex Frontend

A 3D motion-driven web client for the AskMyDocs RAG API, built on an **Executive
Titanium Slate & Electric Gold** design system. Documents, retrieval and citations
are rendered as a living **Quantum Codex**: a floating sphere of golden metallic
wireframes, orbiting gold dust and doc-nodes that reacts to what the pipeline is
doing.

## Stack

| Concern | Choice |
| --- | --- |
| Build | Vite 5 + React 18 + TypeScript (strict) |
| 3D | Three.js via `@react-three/fiber` + `@react-three/drei` |
| Motion | Framer Motion |
| Styling | TailwindCSS 3 with a custom titanium / gold / champagne palette |
| State | Zustand |
| HTTP | Axios |

## Running it

The backend must be running first:

```bash
python scripts/run_api_server.py
```

Then, from this directory:

```bash
npm install
npm run dev
```

The app opens on <http://localhost:5173> and talks to `http://127.0.0.1:8000` by
default. Point it elsewhere with `frontend/.env`:

```bash
VITE_API_BASE_URL=http://127.0.0.1:8000
```

Other scripts: `npm run build` (typecheck + production bundle), `npm run preview`,
`npm run typecheck`.

## Design system

| Role | Token | Value |
| --- | --- | --- |
| Background | `titanium-900` / `titanium-800` | `#08090D` / `#11141F`, under a warm amber radial ambience |
| Primary accent | `gold-400` / `gold-500` | `#F59E0B` / `#D97706` |
| Secondary accent | `champagne-300` / `champagne-200` | `#FDE68A` / `#FFFBEB` |
| Card surface | `.glass` | `rgba(17, 20, 31, 0.75)`, `backdrop-blur-xl`, `border-gold-500/20` |
| Headings | `font-display` | Space Grotesk 700, uppercase, `tracking-wider` |
| Body & inputs | `font-sans` | Inter 400/500 |
| Readouts | `.text-data` | Inter with tabular figures — no monospace face |

There is no purple, cyan or flat black anywhere in the system, and the scene
colours live in `src/three/palette.ts` so the WebGL materials and the Tailwind
tokens stay in step.

## Layout

**Left — Document repository.** Drag-and-drop PDF ingestion with a scanning laser
line and live transfer/indexing metrics, the indexed repository (pages, chunks,
words, delete), and the session switcher.

**Centre — Codex stage and chat.** The 3D viewport, the system-health badge
(MongoDB, Chroma vector count, Groq live vs. mock), the chat stream with a
client-side typing reveal, and a composer that exposes `n_chunks` and
`max_history`.

**Right — Source inspector.** Clicking a citation tag slides in a drawer with the
similarity score, document, page range, chunk id and the raw chunk text returned
by Chroma — and pins the matching node in the 3D scene.

## How the 3D scene maps to the pipeline

| Pipeline event | Scene response |
| --- | --- |
| Idle | Codex rotates slowly inside a golden dust field; one doc-node orbits per indexed PDF |
| PDF upload | An electric-gold laser blade sweeps the codex while champagne particles stream from the upload card into the core |
| Question asked | `n_chunks` chunk nodes detangle from the core along tethers; stronger matches settle closer in |
| Citation clicked | That node scales up, turns champagne and labels itself with its match score. The codex switches to the clicked message's chunk set, so the label and the drawer always report the same score |

Everything degrades safely: without WebGL (or if the context is lost) the stage
falls back to a static CSS codex, and `prefers-reduced-motion` disables
auto-rotation and the typing reveal.

## Source map

```
src/
  three/          CodexCanvas · QuantumCodex · ChunkNodes · Ingestion · textures · palette
  components/
    layout/       TopBar · HealthBadge
    sidebar/      Sidebar · UploadZone · DocumentList · SessionList
    chat/         ChatFeed · MessageBubble · ChatComposer · StreamingText
    inspector/    CitationDrawer
    ui/           Primitives · Toasts
  store/          useAppStore (zustand)
  lib/            api (axios client) · storage (localStorage) · utils
  types/          mirrors app/api/schemas.py
```

## Backend endpoints used

```
GET    /health
GET    /api/v1/documents
POST   /api/v1/documents/upload          multipart/form-data (file)
DELETE /api/v1/documents/{doc_name}
POST   /api/v1/chat/ask
GET    /api/v1/chat/history/{session_id}?user_id=…
DELETE /api/v1/chat/history/{session_id}?user_id=…
```

## Client-side state

The API stores message text but not per-answer citations, and it has no notion of
a session list. Both live in `localStorage`:

- `askmydocs.user_id` — a generated identity, sent as `user_id`
- `askmydocs.sessions` / `askmydocs.active_session` — the session switcher
- `askmydocs.citations` — citations keyed by a hash of the answer, so they are
  re-attached when a past session is replayed

Every read and write is wrapped in `try/catch`, so private windows and blocked
site data degrade to a working app that simply forgets between reloads.
