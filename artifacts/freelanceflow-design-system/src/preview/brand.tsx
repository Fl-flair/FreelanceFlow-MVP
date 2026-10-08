import { Guidelines } from './parts';

const SCREEN_ACCENTS = [
  { name: 'Landing canvas', value: '#f4f1e8', use: 'Warm page background' },
  { name: 'Soft surface', value: '#fbfaf6', use: 'Elevated panels and sign-in' },
  { name: 'Brand ink', value: '#26343a', use: 'Logo tile and strong text' },
  { name: 'Action sage', value: '#397d63', use: 'Primary marketing action' },
  { name: 'Mark sage', value: '#b9d7bf', use: 'Supplied SVG mark' },
  { name: 'Mist', value: '#eaf0e7', use: 'Soft brand highlight' },
  { name: 'Clay', value: '#d49a63', use: 'Small warm status accent' },
  { name: 'Muted text', value: '#758078', use: 'Secondary interface text' },
] as const;

export function BrandPage() {
  return (
    <div className="space-y-5">
      <section className="rounded-2xl border bg-card p-6 sm:p-8">
        <p className="font-mono text-[10px] uppercase tracking-[.18em] text-muted-foreground">
          Source brand marks
        </p>
        <div className="mt-6 grid gap-8 sm:grid-cols-2">
          <div className="flex min-h-36 items-center gap-4 rounded-2xl border bg-background p-5">
            <img
              src={`${import.meta.env.BASE_URL}logo.svg`}
              alt="FreelanceFlow mark: pale sage lowercase f on a charcoal rounded square"
              className="h-16 w-16 rounded-[15px]"
            />
            <div>
              <p className="font-serif text-lg font-extrabold tracking-tight">FreelanceFlow</p>
              <p className="mt-1 text-xs text-muted-foreground">Supplied logo asset</p>
            </div>
          </div>
          <div className="flex min-h-36 items-center gap-4 rounded-2xl border bg-sidebar p-5 text-sidebar-foreground">
            <span className="grid h-8 w-8 place-items-center rounded-[10px] bg-[#6ab08d] text-[#1b3029]">
              <span className="font-serif text-lg font-black">f</span>
            </span>
            <div>
              <p className="font-serif text-[17px] font-extrabold tracking-[-.04em]">FreelanceFlow</p>
              <p className="mt-1 text-xs text-sidebar-foreground/70">In-app wordmark lockup</p>
            </div>
          </div>
        </div>
        <p className="mt-5 max-w-3xl text-sm leading-6 text-muted-foreground">
          The supplied SVG uses a charcoal tile and pale sage letter. The in-app
          wordmark uses a separate, brighter sage tile with a dark letter. Keep
          the two source treatments distinct when choosing the mark for a surface.
        </p>
      </section>

      <section className="rounded-2xl border bg-card p-6">
        <div className="mb-5">
          <h2 className="font-serif text-xl font-bold">Screen-specific accents</h2>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-muted-foreground">
            These hex values are used directly by the landing, sign-in, and
            status treatments. They complement the shared light/dark semantic
            roles; they are not additional theme roles in the source stylesheet.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {SCREEN_ACCENTS.map((accent) => (
            <div key={accent.name} className="rounded-xl border p-3">
              <div
                className="h-14 rounded-lg border border-black/5"
                style={{ backgroundColor: accent.value }}
                aria-label={`${accent.name}: ${accent.value}`}
              />
              <p className="mt-2 text-xs font-semibold">{accent.name}</p>
              <p className="font-mono text-[10px] text-muted-foreground">{accent.value}</p>
              <p className="mt-1 text-[10px] text-muted-foreground">{accent.use}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border bg-card p-6">
        <h2 className="font-serif text-xl font-bold">Observed usage</h2>
        <div className="mt-4">
          <Guidelines
            items={[
              { kind: 'do', text: 'Use the logo asset as supplied; preserve its square proportions and rounded corners.' },
              { kind: 'do', text: 'Pair the mark with the FreelanceFlow wordmark where there is room; the brand component uses Manrope.' },
              { kind: 'do', text: 'Use the in-app sage tile with a dark letter for the compact wordmark, and the charcoal tile with pale sage letter for the supplied SVG.' },
              { kind: 'dont', text: 'Do not assume the SVG mark and the in-app mark use the same fill colors.' },
            ]}
          />
        </div>
      </section>
    </div>
  );
}
