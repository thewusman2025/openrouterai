# Fork notes — openrouterai-mcp (thewusman2025)

Forked from `heltonteixeira/openrouterai` v2.3.0 on 2026-05-16.

## Why

The upstream package rebuilds `choices[0].message` manually in `src/tool-handlers/chat-completion.ts`, copying only `role`, `content`, and `tool_calls`. This silently drops the `annotations[].url_citation[]` array that Perplexity Sonar models return — making the MCP unusable for citation-grounded research.

## What changed

- `src/tool-handlers/chat-completion.ts`
  - Response builder now preserves the entire upstream `message` object (so `annotations` survive).
  - Added Perplexity Sonar passthrough params on the request: `search_recency_filter`, `search_domain_filter`, `web_search_options.search_context_size`.
  - Request typed as `any` to bypass the OpenAI SDK type checker for non-standard Sonar fields.

- `src/tool-handlers.ts`
  - Added the three Sonar params to the `chat_completion` input schema.

- `scripts/test-citations.mjs` — end-to-end MCP-protocol test that asserts `annotations[].url_citation` survives.

- `Dockerfile` — added for VPS deploy as Docker container if/when needed.

## Verification

Run `OPENROUTER_API_KEY=... node scripts/test-citations.mjs` against the built `dist/`. Test passes when at least one annotation with `url_citation.url` comes through.
