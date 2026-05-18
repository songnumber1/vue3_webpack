# Android WebView patch ownership

This folder is reserved for Android WebView only patches.

Current freeze status:
- Android WebView viewport/keyboard behavior is preserved by the shared runtime chain in `mobile-runtime/keyboard/responsive-keyboard.css`, `mobile-runtime/viewport/session-mobile-browser-fixes.css`, and `mobile-runtime/mobile-layout/chat-mobile.css`.
- No selector was moved into WebView-only CSS in this step because existing selectors are shared with Chrome/Samsung/Firefox mobile runtime behavior.
