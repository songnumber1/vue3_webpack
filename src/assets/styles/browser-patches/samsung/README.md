# Samsung Browser patch ownership

This folder is reserved for Samsung Internet only patches.

Current freeze status:
- Samsung-specific viewport/keyboard behavior is still preserved inside `mobile-runtime/viewport/session-mobile-browser-fixes.css` and `mobile-runtime/mobile-layout/chat-mobile.css` because the existing selectors are cross-browser runtime guards.
- Do not split those selectors until visual regression testing is completed on Samsung Internet.
