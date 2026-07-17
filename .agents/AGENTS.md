# Workspace Rules

<!-- BEGIN: 3d-card-flips -->
### Invariant: 3D Flip Card presentation
When creating card-flip animations or 3D rotations, do not rely on Tailwind utility classes for 3D properties (e.g., `preserve-3d` or `backface-hidden`). Instead, define standard vendor-prefixed properties inline using React `style` objects to ensure cross-browser consistency:
- Parent: `style={{ perspective: '1200px', WebkitPerspective: '1200px' }}`
- Wrapper: `style={{ transformStyle: 'preserve-3d', WebkitTransformStyle: 'preserve-3d' }}`
- Card Faces: `style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}`
<!-- END: 3d-card-flips -->

<!-- BEGIN: whatsapp-nigerian-formatting -->
### Rule: Nigerian WhatsApp wa.me Link Generation
When generating external links to WhatsApp chat threads using user-submitted phone numbers:
- If a number is formatted as a standard 11-digit Nigerian mobile number starting with `0` (e.g. `08031234567`), strip the leading `0` and prepend the country code `234` (e.g. `2348031234567`).
- Always clean any non-digit characters (`\D` regex) from the number before rendering the URL parameter.
<!-- END: whatsapp-nigerian-formatting -->
