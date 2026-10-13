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
real Chrome 200% page-zoom matrix ran successfully with this safe channel. The complete safe-channel migration subsequently passed at commit
8ae5ca02380f6d10c2b29408a70346e2f8297c03: 450 unit, 199 focused browser,
979 full browser tests, watch and cold-start all passed in
[CI 38400356137](https://github.com/coffeehc/xui/actions/runs/38400356137).
These results apply to that commit, not unverified later additions. The local cloud executor still rejects Chromium socket creation before
page load, so local rendering is not claimed.
