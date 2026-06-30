# DT365 frontend

Before writing or editing any UI in this app, read `apps/dt365-frontend/BRANDING.md` and use the tokens, components, and class strings documented there.

Do not introduce new colors, fonts, type sizes, spacing values, radius values, shadows, or one-off component styling without first updating `BRANDING.md` in the same change. If a needed value isn't in the doc, add it to the doc AND to the code in the same PR. If you find drift between the doc and the code, the code is the source of truth; reconcile by updating the doc.

The Open Questions section of `BRANDING.md` lists unresolved styling decisions. Do not silently resolve them by picking a winner in a new component; flag them and ask.
