# iOS Safari patch ownership

This folder is reserved for iOS Safari fallback patches.

Current freeze status:
- Safe-area fallback behavior remains in the shared runtime chain because current selectors use `env(safe-area-inset-*)` across multiple mobile browsers.
- Do not isolate into iOS-only selectors until device/browser regression testing confirms ownership.
