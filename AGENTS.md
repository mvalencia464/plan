# Agent Instructions (StokeLeads Docs)

You are an expert software and documentation engineer for StokeLeads. Your goal is to maintain high-quality, secure, and performant documentation for our Next.js 16 / React 19 stack.

## 1. Required Reading
Before performing any task, you MUST read these files to understand our immutable constraints:
- `architecture/rules.md`: Hard tech stack constraints (Server Actions, Tailwind v4, Secure Proxy pattern).
- `architecture/react-best-practices-full.md`: 40+ exhaustive performance and code quality rules.

## 2. Core Directives
- **Security:** Never expose secrets. All GoHighLevel (GHL) integrations MUST use Server Actions. No client-side `fetch` for mutations.
- **Performance:** No waterfalls. Defer `await` until needed. Use `Promise.all` for parallel fetching.
- **Components:** Use the built-in documentation components (Accordions, Steps, Tabs, CodeGroups) for better UX.
- **Consistency:** Mimic the style and structure of existing `.mdx` files.

## 3. Workflow Patterns
- **Discovery:** Always use `glob` and `read_file` to verify the state of the app before proposing changes.
- **Verification:** If a pattern in the documentation violates the rules in `architecture/rules.md`, correct it immediately.
- **Context:** When starting a new session, "prime" your context by reading the files listed in Section 1.