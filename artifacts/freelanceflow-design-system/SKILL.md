# FreelanceFlow design-system usage

Use this package as the source of truth for FreelanceFlow's shared colors,
typography, radius, spacing, logo references, and component families.

- Edit `tokens.json`, then regenerate outputs with `pnpm tokens`; do not hand-edit
  generated theme files.
- Import `@workspace/freelanceflow-design-system/styles.css` and package
  components in consuming web apps rather than copying token values.
- Use DM Sans for interface text, Manrope for display headings, and IBM Plex
  Mono for short metadata.
- Prefer warm neutral surfaces, fine borders, restrained shadows, and sage
  primary actions. Keep screen-specific brand accents distinct from semantic
  theme roles.
- Keep product data, navigation, feature logic, and product-specific layouts in
  the app. Use the component inventory and source references when extracting or
  adapting shared visual patterns.
