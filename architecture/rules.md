---
title: 'Architecture & Constraints'
description: 'The immutable rules and patterns for this Next.js 16 project.'
---

## 1. The "Hard" Stack
*Deviating from these versions will cause build failures or hydration errors.*

| Technology | Version | Constraint |
| :--- | :--- | :--- |
| **Framework** | Next.js 16 (App Router) | **Strict SSR.** No `pages/` directory. |
| **Library** | React 19 | Use `useActionState` for form states. |
| **Styling** | Tailwind CSS v4 | **CSS-first config.** No `tailwind.config.js`. |
| **Language** | TypeScript v5 | **Strict Mode.** No `any` types. |
| **Deploy** | Netlify | Requires **Essential Next.js** Plugin. |

---

## 2. Core Patterns (The "Rules of the Road")

### Data Mutation & Forms
**❌ DO NOT:**
* Use `fetch('/api/...')` from client components.
* Create REST API routes in `app/api/` for form submissions.

**✅ MUST DO:**
* Use **Server Actions** (`'use server'`) for all mutations.
* Invoke actions directly in `<form action={action}>`.
* Validate all inputs using **Zod** inside the Server Action before processing.

### GoHighLevel (GHL) Integration
* **Pattern:** The "Secure Proxy."
* **Flow:** Client Form $\to$ Server Action $\to$ GHL Webhook.
* **Security:** `GHL_API_KEY` and Webhook URLs must **never** be exposed to the client. They live in Netlify Environment Variables only.

### Styling (Tailwind v4)
* Do not look for a config file.
* Theme variables are defined in `globals.css` using the `@theme` directive.
* Use CSS variables for dynamic values, not inline styles.

---

## 3. Development Environment (AntiGravity)

This project uses Google AntiGravity and the Gemini 3 Agent.

### Tooling Setup
To enable the AI agent to see the file system and browser, the CLI must be initialized with the MCP configuration:

```bash
gemini chat --mcp-config=confidence.ig
Required MCP Servers
GitHub: For repo management.

Chrome DevTools: For visual verification (headless or debugging port).

4. Known "Bottlenecks" & Gotchas
Netlify Adapter
Issue: Next.js 16 caching features can conflict with Netlify's edge caching.

Fix: Ensure netlify.toml is configured to specific cache headers if you see stale data.

Hydration Errors
Issue: AntiGravity often generates random IDs that mismatch server/client.

Fix: Use the React 19 useId hook for accessibility attributes, never Math.random().

Third-Party Scripts
Constraint: All tracking scripts (GTM, Pixels) must be loaded via next/script with strategy="afterInteractive" to prevent blocking the hydration.


## 5. Performance Standards

This project adheres to the **Vercel React Best Practices** for performance optimization. 

- **Eliminate Waterfalls**: Avoid sequential data fetching.
- **Bundle Size**: Minimize JS payload by avoiding barrel file imports and using direct sub-module imports.
- **Server-Side**: Prioritize Server Components and Server Actions.

[Read the full React Best Practices guide](file:///Users/mauriciovalencia/Library/CloudStorage/GoogleDrive-mauricio@stokeleads.com/My%20Drive/StokeLeads/Code/00%20-%20DEVELOPMENT/docs/architecture/react-best-practices.mdx) for detailed rules and implementation examples.

***

### How to use this with Gemini 3
When you start a new chat session to work on a feature, you can "prime" the agent with this single instruction:

> *"Read `architecture/rules.mdx` and `architecture/react-best-practices.mdx` before generating any code. Ensure you strictly follow the constraints regarding Server Actions, Tailwind v4 syntax, and React performance standards."*

This prevents 90% of the "cleanup" work where the AI writes outdated or unoptimized code.