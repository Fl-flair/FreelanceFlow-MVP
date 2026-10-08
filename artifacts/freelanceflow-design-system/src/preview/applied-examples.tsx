import desktopCapture from '../../docs/references/home-desktop.jpg';
import mobileCapture from '../../docs/references/home-mobile.jpg';
import signInCapture from '../../docs/references/sign-in.jpg';

const CAPTURES = [
  {
    title: 'Landing page · desktop',
    detail: 'Wide hero, workbench preview, and warm neutral page canvas.',
    src: desktopCapture,
    className: 'max-h-[500px] object-contain object-top',
  },
  {
    title: 'Landing page · mobile',
    detail: 'Narrow layout and stacked content from the same source page.',
    src: mobileCapture,
    className: 'max-h-[520px] object-contain object-top',
  },
  {
    title: 'Sign-in page',
    detail: 'Authentication card using the sage action and warm surface palette.',
    src: signInCapture,
    className: 'max-h-[420px] object-contain object-top',
  },
] as const;

export function SourceExamplesPage() {
  return (
    <div className="space-y-5">
      <section className="rounded-2xl border bg-card p-5 sm:p-6">
        <h2 className="font-serif text-xl font-bold">Reference captures</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
          These captures preserve the current FreelanceFlow visual source used
          for extraction. They are references only; this design-system work did
          not change application screens. Signed-in pages were not available in
          the preview session.
        </p>
      </section>
      <div className="grid gap-5 xl:grid-cols-2">
        {CAPTURES.map((capture) => (
          <figure key={capture.title} className="overflow-hidden rounded-2xl border bg-card">
            <div className="grid min-h-56 place-items-center bg-muted/60 p-3 sm:p-5">
              <img
                src={capture.src}
                alt={capture.title}
                loading="lazy"
                className={`w-full rounded-lg ${capture.className}`}
              />
            </div>
            <figcaption className="p-4">
              <p className="text-sm font-semibold">{capture.title}</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">{capture.detail}</p>
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  );
}
