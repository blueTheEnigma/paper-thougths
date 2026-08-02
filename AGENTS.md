<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN: permission-key-synchronization -->
### Rule: Administrative Permission Key Synchronization
When creating or extending administrative permission keys (e.g., adding a new key in Access Control modals or API validation logic):
- **Full Trace Requirement**: You MUST audit and update all permission evaluation sites across both Server Components (`page.js` access checks/bounces) and Client Components (tab/navigation visibility filters).
- **Explicit Key Checking**: Ensure that server-side helper variables (such as `isCommunityManager`) explicitly check for `permissions.includes('<new_permission_key>')` in addition to legacy department or role checks.
<!-- END: permission-key-synchronization -->
