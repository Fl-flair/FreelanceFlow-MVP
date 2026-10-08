# Form fields

## Source

- `artifacts/freelanceflow/src/index.css`, `.field` and `.label` at lines 274–275
- `ControlledField` in `artifacts/freelanceflow/src/App.tsx` at lines 288–299
- `artifacts/freelanceflow/src/components/ui/form.tsx`
- Visual capture: `docs/references/sign-in.jpg`

## Extracted family

Labels are compact, semibold, and muted. Inputs and textareas use a warm
background, neutral border, generous horizontal padding, and a sage focus ring.
Validation text appears directly below the field. The source form wrappers keep
React Hook Form state and accessible descriptions connected to the control.
