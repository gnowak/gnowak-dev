# gnowak.dev

Source for [gnowak.dev](https://gnowak.dev) — the personal portfolio of
Geoff Nowak.

**Status:** WIP / under construction.

## What this is

A static portfolio site. Headline work is the curated Project collection;
the rest of the work lives on the [GitHub profile](https://github.com/gnowak)
under "Deeper Cuts."

## Planned stack

- **SSG:** Astro (content-collections, TypeScript)
- **Hosting:** Cloudflare Pages (auto-deploy on push to `main`)
- **Content:** Standardized Markdown files under `/content/`
- **Update flow:** paste Markdown from an LLM, run `npm run publish`,
  push to trigger deploy

## Local development

```bash
npm install
npm run dev      # local dev server
npm run build    # production build
npm run preview  # preview the production build
```

## Publishing a content change

```bash
# 1. Edit or add a Markdown file under /content/
# 2. Run the publish command (validates + builds + prepares commit)
npm run publish
# 3. Push to trigger Cloudflare Pages deploy
git push
```
