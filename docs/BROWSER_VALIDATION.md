# Browser validation environment

All browser entry points retain Chromium's sandbox. GitHub-hosted Ubuntu uses
its installed official Chrome channel (with the distribution-supported sandbox
profile). Local execution uses the installed Chromium where configured; an
executor that denies process sockets or sandbox setup is an execution blocker,
not a reason to disable browser isolation.

The shared Playwright configuration and independent Vite cold-start launch use
`chromiumSandbox:true` and no sandbox-disabling arguments. The genuine page-zoom
profile and non-secure HTTP origin tests inherit or explicitly retain the same
protection. Test assertions, isolation and full-suite scope are unchanged.

On 2026-10-13, six non-secure HTTP cross-page Auth/Key tests and the SearchToolbar
real Chrome 200% page-zoom matrix ran successfully with this safe channel. The
migration of all remaining browser tests and cold-start to this configuration
requires its own complete CI result; these targeted results do not substitute
for it. The local cloud executor still rejects Chromium socket creation before
page load, so local rendering is not claimed.
