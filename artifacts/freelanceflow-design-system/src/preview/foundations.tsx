import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../components/ui/card';
import { tokens } from '../generated/tokens';
import { Guidelines } from './parts';

const CORE_SWATCHES = [
  { name: 'Primary', className: 'bg-primary' },
  { name: 'Secondary', className: 'bg-secondary' },
  { name: 'Accent', className: 'bg-accent' },
] as const;

const TYPE_SCALE = [
  { label: 'Display', className: 'font-serif text-4xl font-extrabold tracking-tight' },
  { label: 'Section', className: 'font-serif text-2xl font-bold tracking-tight' },
  { label: 'Body', className: 'text-base leading-7' },
  { label: 'Field label', className: 'text-xs font-semibold tracking-wide' },
  { label: 'Metadata', className: 'font-mono text-xs text-muted-foreground' },
] as const;

const SPACING_SCALE = [
  { label: '4 px', className: 'w-1' },
  { label: '8 px', className: 'w-2' },
  { label: '12 px', className: 'w-3' },
  { label: '16 px', className: 'w-4' },
  { label: '24 px', className: 'w-6' },
] as const;

function Swatch({
  name,
  className,
}: {
  name: string;
  className: string;
}) {
  return (
    <div className="space-y-2">
      <div className={`h-16 rounded-lg ${className}`} />
      <p className="text-sm font-medium">{name}</p>
    </div>
  );
}

export function OverviewPage() {
  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-2xl border bg-card p-6 sm:p-8">
        <div className="grid items-center gap-8 lg:grid-cols-[1.1fr_.9fr]">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[.2em] text-primary">
              The quiet side of doing great work
            </p>
            <h2 className="mt-4 max-w-xl font-serif text-4xl font-extrabold leading-[1.02] tracking-[-.055em] sm:text-5xl">
              More making.
              <br />
              <span className="text-primary">Less managing.</span>
            </h2>
            <p className="mt-4 max-w-lg text-sm leading-7 text-muted-foreground">
              FreelanceFlow pairs a warm, paper-like canvas with a clear workbench,
              confident headings, and calm sage actions.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button>Build your workbench</Button>
              <Button variant="outline">See how it works</Button>
            </div>
          </div>
          <Card className="rotate-[.5deg]">
            <CardHeader className="border-b border-border">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[.16em] text-muted-foreground">
                    Workbench snapshot
                  </p>
                  <CardTitle className="mt-2 font-serif text-xl tracking-tight">
                    A clear view of your work.
                  </CardTitle>
                </div>
                <img
                  src={`${import.meta.env.BASE_URL}logo.svg`}
                  alt=""
                  className="h-9 w-9 rounded-[10px]"
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-accent bg-accent/50 p-4">
                  <p className="text-xs font-semibold text-muted-foreground">In progress</p>
                  <p className="mt-2 font-serif text-2xl font-bold">04</p>
                  <p className="mt-1 text-xs text-muted-foreground">proposals</p>
                </div>
                <div className="rounded-2xl border border-secondary bg-secondary/70 p-4">
                  <p className="text-xs font-semibold text-muted-foreground">On the way</p>
                  <p className="mt-2 font-serif text-2xl font-bold">$8,420</p>
                  <p className="mt-1 text-xs text-muted-foreground">outstanding</p>
                </div>
              </div>
              <div className="flex items-center justify-between border-t border-border pt-3">
                <div>
                  <p className="text-sm font-semibold">Brand identity · Alder &amp; Ash</p>
                  <p className="mt-1 text-xs text-muted-foreground">Invoice · due Jun 24</p>
                </div>
                <Badge variant="warning">Due soon</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="rounded-2xl border bg-card p-6">
          <p className="font-mono text-[10px] uppercase tracking-[.18em] text-muted-foreground">
            Foundations
          </p>
          <div className="mt-5 space-y-4">
            {TYPE_SCALE.map((entry) => (
              <div key={entry.label} className="grid gap-2 sm:grid-cols-[100px_1fr]">
                <span className="pt-1 text-xs text-muted-foreground">{entry.label}</span>
                <p className={entry.className}>Build products people understand.</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border bg-card p-6">
          <p className="font-mono text-[10px] uppercase tracking-[.18em] text-muted-foreground">
            Use the system this way
          </p>
          <div className="mt-5">
            <Guidelines
              items={[
                { kind: 'do', text: 'Use sage for the primary action and active emphasis; keep supporting actions quiet.' },
                { kind: 'do', text: 'Keep surfaces warm, borders fine, and shadows barely visible.' },
                { kind: 'do', text: 'Use Manrope for large display lines, DM Sans for interface copy, and IBM Plex Mono for small metadata.' },
                { kind: 'dont', text: 'Stack several saturated colors or heavy shadows in the same surface.' },
              ]}
            />
          </div>
        </section>
      </div>

      <section className="rounded-2xl border bg-card p-6">
        <p className="font-mono text-[10px] uppercase tracking-[.18em] text-muted-foreground">
          Core roles
        </p>
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
          {CORE_SWATCHES.map((swatch) => (
            <Swatch key={swatch.name} {...swatch} />
          ))}
        </div>
      </section>
    </div>
  );
}

function PaletteGroup({
  name,
  colors,
  dark = false,
}: {
  name: string;
  colors: typeof tokens.color.light | typeof tokens.color.dark;
  dark?: boolean;
}) {
  return (
    <section className={`rounded-2xl border p-5 sm:p-6 ${dark ? 'border-sidebar-border bg-sidebar text-sidebar-foreground' : 'bg-card text-card-foreground'}`}>
      <div className="mb-5">
        <h2 className="font-serif text-xl font-bold">{name}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Semantic role names are shared by components and theme consumers.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
        {Object.entries(colors).map(([role, value]) => (
          <div key={role} className="min-w-0 rounded-xl border border-border/60 p-2.5">
            <div
              className="h-12 rounded-lg border border-black/5"
              style={{ backgroundColor: value }}
              aria-label={`${role}: ${value}`}
            />
            <p className="mt-2 truncate text-xs font-semibold">{role}</p>
            <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">{value}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export function ColorsPage() {
  return (
    <div className="space-y-5">
      <PaletteGroup name="Light theme" colors={tokens.color.light} />
      <PaletteGroup name="Dark theme" colors={tokens.color.dark} dark />
      <p className="text-sm leading-6 text-muted-foreground">
        Marketing and sign-in surfaces also use a small set of screen-specific
        accents. See Brand → Logo and usage for those source values.
      </p>
    </div>
  );
}

export function FontsPage() {
  return (
    <div className="space-y-5">
      <section className="rounded-2xl border bg-card p-6 sm:p-8">
        <p className="font-mono text-[10px] uppercase tracking-[.18em] text-muted-foreground">Display · Manrope</p>
        <h2 className="mt-3 max-w-3xl font-serif text-5xl font-extrabold leading-[1.02] tracking-[-.06em] sm:text-6xl">
          More making.
          <br />
          <span className="text-primary">Less managing.</span>
        </h2>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground">
          Manrope gives product headlines a compact, confident shape without introducing a traditional serif.
        </p>
      </section>
      <div className="grid gap-5 lg:grid-cols-2">
        <section className="rounded-2xl border bg-card p-6">
          <p className="font-mono text-[10px] uppercase tracking-[.18em] text-muted-foreground">Interface · DM Sans</p>
          <p className="mt-4 text-lg leading-8">
            Keep client details, context, and history close to the work.
          </p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Use regular-weight body text for longer descriptions and medium-to-semibold weight for controls and headings.
          </p>
        </section>
        <section className="rounded-2xl border bg-card p-6">
          <p className="font-mono text-[10px] uppercase tracking-[.18em] text-muted-foreground">Metadata · IBM Plex Mono</p>
          <p className="mt-4 font-mono text-xs uppercase tracking-[.18em] text-primary">01—04 · inquiry → paid</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Reserve mono for short labels, dates, and process markers rather than paragraph copy.
          </p>
        </section>
      </div>
      <section className="space-y-4 rounded-2xl border bg-card p-6">
        <h2 className="font-serif text-xl font-bold">Type scale</h2>
        {TYPE_SCALE.map((entry) => (
          <div key={entry.label} className="grid gap-2 border-t border-border pt-4 sm:grid-cols-[100px_1fr]">
            <span className="pt-1 text-xs text-muted-foreground">{entry.label}</span>
            <p className={entry.className}>Build products people understand.</p>
          </div>
        ))}
      </section>
    </div>
  );
}

export function LayoutPage() {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <section className="rounded-xl border bg-card p-6 text-card-foreground">
            <h2 className="font-serif font-semibold">Spacing</h2>
        <p className="mt-1 text-sm text-muted-foreground">
              A 4 px base step; repeated spacing stays predictable across layouts.
        </p>
        <div className="mt-6 space-y-4">
          {SPACING_SCALE.map((space) => (
            <div key={space.label} className="flex items-center gap-4">
              <span className="w-8 text-xs text-muted-foreground">
                {space.label}
              </span>
              <div className={`h-3 rounded-full bg-primary ${space.className}`} />
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-xl border bg-card p-6 text-card-foreground">
            <h2 className="font-serif font-semibold">Radius</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Corner treatments derive from the base radius token.
        </p>
        <div className="mt-6 grid grid-cols-2 gap-4">
          {[
            { label: 'Small', className: 'rounded-sm' },
            { label: 'Medium', className: 'rounded-md' },
            { label: 'Large', className: 'rounded-lg' },
            { label: 'Extra large', className: 'rounded-xl' },
          ].map((radius) => (
            <div
              key={radius.label}
              className={`flex h-24 items-end border bg-muted p-3 ${radius.className}`}
            >
              <span className="text-xs font-medium">{radius.label}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
