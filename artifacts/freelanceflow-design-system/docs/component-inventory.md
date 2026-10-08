# FreelanceFlow component inventory

This catalog focuses on the reusable families visible in the current product.
The workspace app also includes generated shadcn primitives; those are available
as general-purpose foundations in the package, but are not presented as
FreelanceFlow-specific patterns unless listed here.

| Family | Source evidence | Reusable API / behavior |
| --- | --- | --- |
| Brand mark and wordmark | `src/App.tsx` (`Brand`); `public/logo.svg` | Supplied square SVG mark plus the in-app compact wordmark treatment. |
| Buttons | `src/index.css` (`.btn-primary`, `.btn-quiet`); landing CTAs in `src/App.tsx` | Primary and quiet actions, with shared focus, disabled, and pressed behavior. |
| Surface / card | `src/index.css` (`.surface`); metric, empty-state, and invoice sections in `src/App.tsx` | Bordered warm surface with restrained shadow; compose header, content, and footer. |
| Form fields | `src/index.css` (`.field`, `.label`); `ControlledField` in `src/App.tsx`; `components/ui/form.tsx` | Label, input or textarea, helper/error text, and React Hook Form wiring. |
| Status badge | `Status` in `src/App.tsx` | Compact rounded labels for paid/accepted, overdue/declined, draft, and other statuses. |

The five families above are shown in the live preview through the Brand and
Applied Examples pages and through the component stories for buttons, cards,
badges, inputs, and textareas. The package keeps the scaffold's remaining
generic primitives and stories as optional foundations; they are not claims
about current FreelanceFlow screen usage.

## Source precedence

The app-wide semantic colors, typography, radius, and spacing come from
`artifacts/freelanceflow/src/index.css`. The landing/auth and status samples also
contain intentional screen-level hex values; these are recorded on the Brand
page rather than silently substituted for the global theme roles.
