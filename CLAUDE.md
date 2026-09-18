@AGENTS.md

# my-app

Next.js 16 app with TypeScript and Tailwind CSS.

## Commands

```bash
npm run dev      # start local dev server at http://localhost:3000
npm run build    # production build
npm run lint     # run ESLint
```

## Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Package manager:** npm

## Project structure

- `app/` — pages and layouts. Each folder = a route. `page.tsx` = the page, `layout.tsx` = shared wrapper.
- `app/globals.css` — global styles
- `public/` — static assets served at `/filename`

## Key conventions

- All new pages go in `app/` as `page.tsx` files
- Use Tailwind classes for styling. No separate CSS files unless necessary
- Keep components in `app/components/` (create this folder when needed)
- API routes go in `app/api/`
- Environment variables go in `.env.local`. Never commit this file

## Design principles

- Make everything look good. Prioritize clean, aesthetic UI over getting something on screen fast
- Simple over complex. If there are two ways to do something, pick the easier one
- Write like a human. Use plain, clear language in comments, labels, error messages, and UI copy
- No em dashes anywhere (not in code, comments, or UI text). Use a comma or period instead
