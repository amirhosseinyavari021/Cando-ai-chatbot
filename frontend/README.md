# Cando Chatbot – Frontend

Vite + React + TypeScript + Tailwind implementation of the redesigned chat UI.

## Install

```bash
npm i
```

If you serve the backend elsewhere, set `VITE_API_BASE_URL` in a `.env` file:

```
VITE_API_BASE_URL=http://localhost:3000
```

## Run

```bash
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

## Notes

- New deps: `zustand lucide-react react-hot-toast react-textarea-autosize uuid date-fns`
- UI is RTL-first (Persian). If message text is Latin-first, bubble switches to LTR automatically.
- Supports message streaming via `/api/chat/stream` (SSE) with JSON fallback.
- Session reset, regenerate, copy, offline/online toasts included.
