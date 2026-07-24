# Meridian Web Platform Addendum

Read `dev/foundation/platforms/web-react/standards/web_platform_standard.md` first.

- Meridian supports current major Chromium, Firefox, Safari, and Edge releases.
- Product and layout documents choose exact breakpoints, but desktop, tablet, and mobile layouts must retain all core information and actions.
- Meridian ships no service worker and no PWA install surface; it targets the desktop browser (with a possible future Tauri shell), so there is no offline-cache or installability boundary to verify.
