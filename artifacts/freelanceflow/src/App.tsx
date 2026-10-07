import { useEffect, useState } from 'react';
import { useForm, type Control, type FieldValues, type Path } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { ClerkProvider, SignIn, SignUp, Show, useClerk, useUser } from '@clerk/react';
import { publishableKeyFromHost } from '@clerk/react/internal';
import { shadcn } from '@clerk/themes';
import {
  useGetFreelanceOverview, getGetFreelanceOverviewQueryKey,
  useListClients, getListClientsQueryKey, useCreateClient, useUpdateClient, useDeleteClient,
  useListProposals, getListProposalsQueryKey, useCreateProposal, useUpdateProposal, useDeleteProposal, useConvertProposalToInvoice,
  useListInvoices, getListInvoicesQueryKey, useCreateInvoice, useUpdateInvoice, useDeleteInvoice,
  useCreateReminderDraft, useListReminders, getListRemindersQueryKey, useUpdateReminder,
  type Client, type Proposal, type Invoice, type Reminder,
} from '@workspace/api-client-react';
import { ArrowDownRight, ArrowRight, ArrowUpRight, BriefcaseBusiness, Check, CheckCheck, CircleHelp, Clipboard, Clock3, FileText, HandCoins, LayoutDashboard, LogOut, Mail, Menu, Plus, Printer, ReceiptText, Sparkles, Users, WalletCards, X, Trash2, Pencil } from 'lucide-react';
import { Route, Switch, Router as WouterRouter, Link, Redirect, useLocation } from 'wouter';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import NotFound from '@/pages/not-found';
import { toast } from 'sonner';

const queryClient = new QueryClient();
const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');
const clerkPubKey = publishableKeyFromHost(window.location.hostname, import.meta.env.VITE_CLERK_PUBLISHABLE_KEY);
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;
function stripBase(path: string) { return basePath && path.startsWith(basePath) ? path.slice(basePath.length) || '/' : path; }
const clerkAppearance = {
  theme: shadcn, cssLayerName: 'clerk',
  options: { logoPlacement: 'inside' as const, logoLinkUrl: basePath || '/', logoImageUrl: `${window.location.origin}${basePath}/logo.svg` },
  variables: { colorPrimary: '#397d63', colorForeground: '#26333c', colorMutedForeground: '#758078', colorDanger: '#b8473d', colorBackground: '#fbfaf6', colorInput: '#f7f5ef', colorInputForeground: '#26333c', colorNeutral: '#dcd9d0', fontFamily: 'DM Sans', borderRadius: '0.75rem' },
  elements: {
    rootBox: 'w-full flex justify-center', cardBox: 'bg-[#fbfaf6] rounded-2xl w-[440px] max-w-full overflow-hidden border border-[#e1ded4]',
    card: '!shadow-none !border-0 !bg-transparent !rounded-none', footer: '!shadow-none !border-0 !bg-transparent !rounded-none',
    headerTitle: 'text-[#26333c] font-semibold', headerSubtitle: 'text-[#758078]', socialButtonsBlockButtonText: 'text-[#26333c]',
    formFieldLabel: 'text-[#43514b]', footerActionLink: 'text-[#397d63]', footerActionText: 'text-[#758078]', dividerText: 'text-[#758078]',
    identityPreviewEditButton: 'text-[#397d63]', formFieldSuccessText: 'text-[#397d63]', alertText: 'text-[#26333c]',
    logoBox: 'rounded-xl', logoImage: 'rounded-lg', socialButtonsBlockButton: 'border-[#dcd9d0] bg-[#f7f5ef]',
    formButtonPrimary: 'bg-[#397d63] hover:bg-[#306d56]', formFieldInput: 'border-[#dcd9d0] bg-[#f7f5ef] text-[#26333c]',
    footerAction: 'text-[#758078]', dividerLine: 'bg-[#e1ded4]', alert: 'border-[#e1ded4]', otpCodeFieldInput: 'border-[#dcd9d0]',
    formFieldRow: 'text-[#26333c]', main: 'text-[#26333c]',
  },
};
if (!clerkPubKey) throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY in .env file');

const money = (value?: number | null) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value || 0);
const shortDate = (date?: string | null) => date ? new Date(`${date.slice(0, 10)}T12:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';
const clientSchema = z.object({
  name: z.string().trim().min(1, 'Add a client name.'),
  email: z.string().email('Enter a valid email address.').or(z.literal('')),
  company: z.string(),
  notes: z.string(),
});
const proposalSchema = z.object({
  clientId: z.string(),
  clientName: z.string().trim().min(1, 'Add a client name.'),
  title: z.string().trim().min(1, 'Add a proposal title.'),
  sourceText: z.string(),
  content: z.string().min(1, 'Add proposal content.'),
  amount: z.string().min(1, 'Add an amount.').refine(value => Number.isFinite(Number(value)) && Number(value) >= 0, 'Enter a valid non-negative amount.'),
  timeline: z.string().trim().min(1, 'Add a timeline.'),
});
const invoiceSchema = z.object({
  clientId: z.string(),
  clientName: z.string().trim().min(1, 'Add a client name.'),
  email: z.string().email('Enter a valid email address.').or(z.literal('')),
  description: z.string().min(1, 'Add an invoice description.'),
  amount: z.string().min(1, 'Add an amount.').refine(value => Number.isFinite(Number(value)) && Number(value) >= 0, 'Enter a valid non-negative amount.'),
  dueDate: z.string().min(1, 'Choose a due date.'),
});
const reminderSchema = z.object({ message: z.string().min(1, 'Add reminder text before saving.') });
const reminderCreateSchema = z.object({
  invoiceId: z.string().min(1, 'Choose an invoice.'),
  timing: z.enum(['before_due', 'on_due', 'late']),
});
type ClientFormValues = z.infer<typeof clientSchema>;
type ProposalFormValues = z.infer<typeof proposalSchema>;
type InvoiceFormValues = z.infer<typeof invoiceSchema>;
type ReminderFormValues = z.infer<typeof reminderSchema>;
type ReminderCreateFormValues = z.infer<typeof reminderCreateSchema>;
function Brand({ light = false }: { light?: boolean }) {
  return <Link href="/" className={`flex items-center gap-2.5 font-[var(--app-font-serif)] text-[17px] font-extrabold tracking-[-.04em] ${light ? 'text-[#f3f0e8]' : 'text-foreground'}`} data-testid="link-brand">
    <span className="grid h-8 w-8 place-items-center rounded-[10px] bg-[#6ab08d] text-[#1b3029]"><span className="text-lg font-black">f</span></span>
    FreelanceFlow
  </Link>;
}
function ClerkCacheInvalidator() {
  const { addListener } = useClerk();
  const qc = useQueryClient();
  useEffect(() => {
    let previous: string | null | undefined;
    const off = addListener(({ user }) => {
      const next = user?.id ?? null;
      if (previous !== undefined && previous !== next) qc.clear();
      previous = next;
    });
    return () => off();
  }, [addListener, qc]);
  return null;
}
function AuthRoutes() {
  const [, setLocation] = useLocation();
  return <ClerkProvider publishableKey={clerkPubKey} proxyUrl={clerkProxyUrl} appearance={clerkAppearance}
    signInUrl={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`}
    localization={{ signIn: { start: { title: 'Welcome back', subtitle: 'Your workbench is ready.' } }, signUp: { start: { title: 'Make room for the work', subtitle: 'A clearer day starts here.' } } }}
    routerPush={(to) => setLocation(stripBase(to))} routerReplace={(to) => setLocation(stripBase(to), { replace: true })}>
    <QueryClientProvider client={queryClient}>
      <ClerkCacheInvalidator />
      <Switch>
        <Route path="/" component={HomeRedirect} />
        <Route path="/sign-in/*?" component={() => <AuthPage kind="in" />} />
        <Route path="/sign-up/*?" component={() => <AuthPage kind="up" />} />
        <Route path="/app" component={ProtectedDashboard} />
        <Route path="/clients" component={() => <Protected><ClientsPage /></Protected>} />
        <Route path="/proposals" component={() => <Protected><ProposalsPage /></Protected>} />
        <Route path="/invoices" component={() => <Protected><InvoicesPage /></Protected>} />
        <Route path="/reminders" component={() => <Protected><RemindersPage /></Protected>} />
        <Route component={NotFound} />
      </Switch>
    </QueryClientProvider>
  </ClerkProvider>;
}
function HomeRedirect() {
  return <><Show when="signed-in"><Redirect to="/app" /></Show><Show when="signed-out"><Landing /></Show></>;
}
function Protected({ children }: { children: React.ReactNode }) {
  return <><Show when="signed-in">{children}</Show><Show when="signed-out"><Redirect to="/sign-in" /></Show></>;
}
function ProtectedDashboard() { return <Protected><DashboardPage /></Protected>; }
function AuthPage({ kind }: { kind: 'in' | 'up' }) {
  return <main className="grain flex min-h-[100dvh] items-center justify-center bg-[#f4f1e8] px-4 py-12">
    <div className="absolute left-8 top-8"><Brand /></div>
    <div className="animate-enter w-full max-w-[460px]">
      <div className="mb-7 text-center"><div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-[#dfece3] text-[#397d63]"><BriefcaseBusiness size={22} /></div>
        <p className="font-mono text-[10px] uppercase tracking-[.22em] text-[#758078]">Your private workbench</p>
      </div>
      {kind === 'in' ? <SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} /> : <SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} />}
    </div>
  </main>;
}
function Landing() {
  return <div className="grain min-h-[100dvh] overflow-hidden bg-[#f4f1e8] text-[#29383c]">
    <header className="relative z-10 mx-auto flex max-w-[1320px] items-center justify-between px-6 py-6 md:px-10">
      <Brand />
      <nav className="flex items-center gap-3"><a href="#how-it-works" className="hidden text-sm font-medium text-[#67736e] hover:text-[#26333c] md:block">How it works</a>
        <Link href="/sign-in" className="whitespace-nowrap rounded-xl px-3 py-2.5 text-sm font-semibold text-[#37453f] hover:bg-[#e8e5da]" data-testid="link-sign-in">Sign in</Link>
        <Link href="/sign-up" className="btn-primary whitespace-nowrap px-3 shadow-sm sm:px-4" data-testid="link-get-started"><span className="sm:hidden">Get started</span><span className="hidden sm:inline">Start your workspace</span><ArrowRight size={16} /></Link>
      </nav>
    </header>
    <section className="mx-auto grid max-w-[1320px] gap-12 px-6 pb-24 pt-12 md:grid-cols-[1.05fr_.95fr] md:items-center md:px-10 md:pb-32 md:pt-16">
      <div className="animate-enter">
        <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-[#d7ded4] bg-[#eaf0e7] px-3.5 py-2 text-xs font-semibold text-[#397d63]"><span className="h-1.5 w-1.5 rounded-full bg-[#397d63]" />The quiet side of doing great work</div>
        <h1 className="max-w-[680px] font-[var(--app-font-serif)] text-[clamp(3.25rem,7vw,6.4rem)] font-extrabold leading-[.98] tracking-[-.075em]">More making.<br /><span className="text-[#397d63]">Less managing.</span></h1>
        <p className="mt-7 max-w-[510px] text-lg leading-8 text-[#65716c]">A private, thoughtfully organized place to move from first hello to paid invoice—without letting admin take over your day.</p>
        <div className="mt-9 flex flex-wrap items-center gap-4">
          <Link href="/sign-up" className="btn-primary px-5 py-3.5" data-testid="link-build-workspace">Build your workbench <ArrowRight size={17} /></Link>
          <span className="text-xs text-[#78827c]">Free to start · Just for you</span>
        </div>
        <div className="mt-12 flex items-center gap-4 border-t border-[#dedbd1] pt-6 text-xs text-[#77817b]"><span className="font-mono text-[#397d63]">01—04</span><span>Inquiry</span><ArrowRight size={13} /><span>Proposal</span><ArrowRight size={13} /><span>Invoice</span><ArrowRight size={13} /><span>Paid</span></div>
      </div>
      <div className="relative mx-auto w-full max-w-[570px] animate-enter [animation-delay:120ms]">
        <div className="absolute -right-9 -top-8 h-48 w-48 rounded-full bg-[#d9e9dc] blur-3xl" />
        <div className="relative rotate-[1.5deg] rounded-[28px] border border-[#d9d7cc] bg-[#fbfaf6] p-3 shadow-[0_32px_80px_rgba(55,66,60,.12)]">
          <div className="rounded-[20px] border border-[#e8e5dc] bg-[#f7f5ef] p-5 sm:p-7">
            <div className="flex items-center justify-between border-b border-[#e2dfd6] pb-5"><div><p className="font-mono text-[10px] uppercase tracking-[.18em] text-[#828a83]">Tuesday, June 18</p><h2 className="mt-2 font-[var(--app-font-serif)] text-2xl font-bold tracking-tight">A clear view of your work.</h2></div><div className="grid h-10 w-10 place-items-center rounded-xl bg-[#dfece3] text-[#397d63]"><LayoutDashboard size={19} /></div></div>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <MockStat label="In progress" value="04" detail="proposals" tone="sage" />
              <MockStat label="On the way" value="$8,420" detail="outstanding" tone="clay" />
            </div>
            <div className="mt-4 rounded-2xl border border-[#e4e1d8] bg-[#fbfaf6] p-4">
              <div className="mb-4 flex items-center justify-between"><div><p className="text-xs font-bold">Recent invoices</p><p className="mt-1 text-[10px] text-[#89918a]">The little things, handled.</p></div><ArrowUpRight size={15} className="text-[#397d63]" /></div>
              <MockRow title="Brand identity · Alder & Ash" price="$2,400" status="Due Jun 24" />
              <MockRow title="Spring campaign · Fieldnotes" price="$1,850" status="Paid" />
              <MockRow title="Web refresh · Morrow Studio" price="$3,200" status="Due Jul 02" />
            </div>
            <div className="mt-4 flex items-center gap-3 rounded-xl bg-[#eaf0e7] px-4 py-3 text-xs text-[#466756]"><CheckCheck size={16} /> A little more room for the work you love.</div>
          </div>
        </div>
        <div className="absolute -bottom-5 -left-8 rounded-2xl border border-[#dedbd1] bg-[#fbfaf6] px-4 py-3 shadow-lg"><p className="font-mono text-[9px] uppercase tracking-[.16em] text-[#89918a]">Your next follow-up</p><p className="mt-1 flex items-center gap-2 text-xs font-semibold"><span className="h-2 w-2 rounded-full bg-[#d49a63]" /> 1 draft to review</p></div>
      </div>
    </section>
    <section id="how-it-works" className="border-y border-[#dfdcd2] bg-[#ebe9df] px-6 py-20 md:px-10 md:py-24">
      <div className="mx-auto max-w-[1320px]">
        <div className="mb-12 grid gap-5 md:grid-cols-[.72fr_1fr] md:items-end"><div><p className="font-mono text-[10px] uppercase tracking-[.2em] text-[#397d63]">A simpler rhythm</p><h2 className="mt-4 max-w-lg font-[var(--app-font-serif)] text-4xl font-bold leading-tight tracking-[-.05em] md:text-5xl">One considered place<br />for the business bits.</h2></div><p className="max-w-lg text-sm leading-7 text-[#69746d]">The work is already yours. FreelanceFlow keeps the details around it from scattering across tabs, inboxes, and half-finished notes.</p></div>
        <div className="grid gap-4 md:grid-cols-4">
          <Feature n="01" icon={<Users size={18} />} title="Know your people" copy="Keep client details, context, and history close to the work." />
          <Feature n="02" icon={<FileText size={18} />} title="Shape the scope" copy="Write and manage clear proposals, on your own terms." />
          <Feature n="03" icon={<ReceiptText size={18} />} title="Keep cash moving" copy="Turn accepted work into invoices, then track what's paid." />
          <Feature n="04" icon={<Mail size={18} />} title="Follow up, kindly" copy="Prepare a personal reminder. You decide when it goes out." />
        </div>
      </div>
    </section>
    <section className="mx-auto flex max-w-[1320px] flex-col gap-10 px-6 py-20 md:flex-row md:items-center md:justify-between md:px-10 md:py-24">
      <div><p className="font-mono text-[10px] uppercase tracking-[.2em] text-[#397d63]">Made for your own way of working</p><h2 className="mt-4 max-w-2xl font-[var(--app-font-serif)] text-4xl font-bold tracking-[-.055em] md:text-5xl">Small business, with a little more breathing room.</h2></div>
      <Link href="/sign-up" className="btn-primary w-fit shrink-0 px-5 py-3.5">Make it yours <ArrowRight size={16} /></Link>
    </section>
    <footer className="border-t border-[#dfdcd2] px-6 py-6 md:px-10"><div className="mx-auto flex max-w-[1320px] items-center justify-between"><Brand /><p className="text-xs text-[#838c85]">A calmer kind of business admin.</p></div></footer>
  </div>;
}
function MockStat({ label, value, detail, tone }: { label: string; value: string; detail: string; tone: string }) {
  return <div className={`rounded-2xl border p-4 ${tone === 'sage' ? 'border-[#d8e4d8] bg-[#edf3eb]' : 'border-[#eadfd2] bg-[#f5eee5]'}`}><p className="text-[10px] font-medium text-[#7c877e]">{label}</p><p className="mt-2 font-[var(--app-font-serif)] text-2xl font-bold tracking-tight">{value}</p><p className="mt-1 text-[10px] text-[#879087]">{detail}</p></div>;
}
function MockRow({ title, price, status }: { title: string; price: string; status: string }) {
  return <div className="flex items-center justify-between border-t border-[#efede6] py-3"><p className="truncate pr-3 text-[11px] font-medium">{title}</p><div className="shrink-0 text-right"><p className="text-[11px] font-semibold">{price}</p><p className={`mt-1 text-[9px] ${status === 'Paid' ? 'text-[#397d63]' : 'text-[#89918a]'}`}>{status}</p></div></div>;
}
function Feature({ n, icon, title, copy }: { n: string; icon: React.ReactNode; title: string; copy: string }) {
  return <article className="rounded-2xl border border-[#dcd9ce] bg-[#f5f3ec] p-5"><div className="flex items-center justify-between text-[#397d63]"><span>{icon}</span><span className="font-mono text-[10px] text-[#a0a69e]">{n}</span></div><h3 className="mt-8 font-[var(--app-font-serif)] text-lg font-bold">{title}</h3><p className="mt-2 text-sm leading-6 text-[#737d75]">{copy}</p></article>;
}
const navItems = [
  { href: '/app', label: 'Overview', icon: LayoutDashboard },
  { href: '/clients', label: 'Clients', icon: Users },
  { href: '/proposals', label: 'Proposals', icon: FileText },
  { href: '/invoices', label: 'Invoices', icon: ReceiptText },
  { href: '/reminders', label: 'Reminders', icon: Mail },
];
function Workspace({ title, subtitle, action, children }: { title: string; subtitle: string; action?: React.ReactNode; children: React.ReactNode }) {
  const [location] = useLocation();
  const [open, setOpen] = useState(false);
  const { user } = useUser();
  const { signOut } = useClerk();
  const active = navItems.find(i => i.href === location)?.label || 'Overview';
  return <div className="min-h-[100dvh] bg-background">
    <aside className="no-print fixed inset-y-0 left-0 z-30 hidden w-[250px] flex-col bg-[#26343a] px-4 py-6 text-[#f4f1e8] md:flex">
      <div className="px-3"><Brand light /></div>
      <div className="mt-12 px-3 font-mono text-[9px] uppercase tracking-[.2em] text-[#96a29c]">Your workspace</div>
      <nav className="mt-3 space-y-1">{navItems.map(item => { const Icon = item.icon; return <Link key={item.href} href={item.href} className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm transition ${location === item.href ? 'bg-[#35474a] font-semibold text-[#b3dfc1]' : 'text-[#c4cbc5] hover:bg-[#303f44]'}`} data-testid={`nav-${item.label.toLowerCase()}`}><Icon size={17} strokeWidth={1.8} />{item.label}{item.label === 'Reminders' && <span className="ml-auto rounded-md bg-[#d39a62]/20 px-1.5 py-0.5 text-[10px] text-[#e5b783]">Review</span>}</Link>; })}</nav>
      <div className="mt-auto rounded-2xl border border-[#425156] bg-[#2c3a40] p-4"><div className="flex items-center gap-2 text-[#b3dfc1]"><CircleHelp size={15} /><span className="text-xs font-semibold">A small note</span></div><p className="mt-2 text-[11px] leading-5 text-[#b7c1bb]">Your reminders are drafts. You choose what to send, and when.</p></div>
      <button onClick={() => signOut({ redirectUrl: basePath || '/' })} className="mt-4 flex items-center gap-3 rounded-xl px-3 py-3 text-left text-xs text-[#bfc7c2] transition hover:bg-[#303f44]" data-testid="button-sign-out"><LogOut size={16} /> Sign out</button>
    </aside>
    <div className="md:pl-[250px]">
      <header className="no-print sticky top-0 z-20 flex h-[68px] items-center justify-between border-b border-border bg-background/95 px-5 backdrop-blur md:px-9">
        <div className="flex items-center gap-3"><button className="rounded-lg p-2 text-muted-foreground md:hidden" onClick={() => setOpen(!open)} aria-label="Toggle navigation" data-testid="button-mobile-menu"><Menu size={19} /></button><span className="text-xs text-muted-foreground">Workspace <span className="mx-1.5">/</span> <span className="font-semibold text-foreground">{active}</span></span></div>
        <div className="flex items-center gap-3"><span className="hidden text-xs text-muted-foreground sm:block">{user?.firstName || 'Your workspace'}</span><div className="grid h-8 w-8 place-items-center rounded-full bg-[#dce9de] text-xs font-bold text-[#397d63]">{(user?.firstName || user?.emailAddresses?.[0]?.emailAddress || 'F').slice(0,1).toUpperCase()}</div></div>
      </header>
      {open && <div className="no-print fixed inset-0 z-40 bg-black/25 md:hidden" onClick={() => setOpen(false)}><div className="h-full w-[290px] bg-[#26343a] p-5 text-white" onClick={e => e.stopPropagation()}><div className="flex items-center justify-between"><Brand light /><button onClick={() => setOpen(false)} aria-label="Close navigation"><X /></button></div><nav className="mt-8 space-y-2">{navItems.map(i => <Link key={i.href} href={i.href} onClick={() => setOpen(false)} className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm hover:bg-[#35474a]"><i.icon size={17} />{i.label}</Link>)}</nav></div></div>}
      <main className="page-wrap animate-enter"><div className="mb-8 flex flex-wrap items-end justify-between gap-4"><div><p className="font-mono text-[10px] uppercase tracking-[.2em] text-primary">{active} · FreelanceFlow</p><h1 className="mt-2 font-[var(--app-font-serif)] text-3xl font-bold tracking-[-.055em] md:text-[2.35rem]">{title}</h1><p className="mt-2 max-w-xl text-sm text-muted-foreground">{subtitle}</p></div>{action}</div>{children}</main>
    </div>
  </div>;
}
function useRefresh(...keys: (() => readonly unknown[])[]) {
  const qc = useQueryClient();
  return () => { keys.forEach(getKey => qc.invalidateQueries({ queryKey: getKey() })); qc.invalidateQueries({ queryKey: getGetFreelanceOverviewQueryKey() }); };
}
function LoadingRows({ count = 3 }: { count?: number }) { return <div className="space-y-3">{Array.from({ length: count }, (_, i) => <div key={i} className="h-[68px] animate-pulse rounded-xl bg-muted/70" />)}</div>; }
function LoadError({ retry }: { retry: () => void }) { return <div className="surface px-6 py-12 text-center"><p className="font-semibold">We couldn’t load this just now.</p><p className="mt-1 text-sm text-muted-foreground">Your work is still here. Try again in a moment.</p><button onClick={retry} className="btn-quiet mt-5" data-testid="button-retry">Try again</button></div>; }
function EmptyState({ title, body, action }: { title: string; body: string; action?: React.ReactNode }) { return <div className="surface flex min-h-[220px] flex-col items-center justify-center px-5 py-10 text-center"><div className="grid h-11 w-11 place-items-center rounded-2xl bg-accent text-primary"><BriefcaseBusiness size={20} /></div><h3 className="mt-4 font-semibold">{title}</h3><p className="mt-1 max-w-sm text-sm text-muted-foreground">{body}</p>{action && <div className="mt-5">{action}</div>}</div>; }
function Metric({ label, value, note, icon: Icon, variant = 'sage' }: { label: string; value: string; note: string; icon: typeof WalletCards; variant?: string }) { return <div className="surface relative overflow-hidden p-5"><span className={`absolute -right-4 -top-7 h-24 w-24 rounded-full ${variant === 'clay' ? 'bg-[#f0e4d6]' : 'bg-[#e2eee4]'}`} /><div className="relative flex items-center justify-between"><span className="text-xs font-semibold text-muted-foreground">{label}</span><span className={`grid h-8 w-8 place-items-center rounded-lg ${variant === 'clay' ? 'bg-[#f0e4d6] text-[#a06c42]' : 'bg-[#e2eee4] text-primary'}`}><Icon size={16} /></span></div><p className="relative mt-4 font-[var(--app-font-serif)] text-[1.8rem] font-bold tracking-[-.045em]">{value}</p><p className="relative mt-1 text-[11px] text-muted-foreground">{note}</p></div>; }
function DashboardPage() {
  const overview = useGetFreelanceOverview();
  const qc = useQueryClient();
  const data = overview.data;
  return <Workspace title="A good day to make progress." subtitle="Here’s the shape of your work, all in one place." action={<Link href="/proposals" className="btn-primary"><Plus size={16} /> New proposal</Link>}>
    {overview.isLoading ? <><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[1,2,3,4].map(i => <div key={i} className="h-36 animate-pulse rounded-2xl bg-muted/70" />)}</div><div className="mt-6 h-64 animate-pulse rounded-2xl bg-muted/70" /></> : overview.isError ? <LoadError retry={() => qc.invalidateQueries({ queryKey: getGetFreelanceOverviewQueryKey() })} /> : <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Active proposals" value={`${data?.activeProposals ?? 0}`} note="Out in the world" icon={FileText} />
        <Metric label="Outstanding" value={money(data?.outstandingAmount)} note={`${data?.outstandingInvoices ?? 0} invoices to keep an eye on`} icon={HandCoins} variant="clay" />
        <Metric label="Paid this month" value={money(data?.paidThisMonth)} note="A little proof it's working" icon={WalletCards} />
        <Metric label="Reminders to review" value={`${data?.remindersToReview ?? 0}`} note="Drafts waiting for your voice" icon={Mail} variant="clay" />
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.55fr_.75fr]">
        <section className="surface overflow-hidden"><div className="flex items-center justify-between border-b border-border px-5 py-4"><div><h2 className="font-semibold">Recent invoices</h2><p className="mt-1 text-xs text-muted-foreground">A quick look at what’s moving.</p></div><Link href="/invoices" className="inline-flex items-center gap-1 text-xs font-semibold text-primary">All invoices <ArrowRight size={14} /></Link></div>
          {data?.recentInvoices?.length ? <div>{data.recentInvoices.map(inv => <InvoiceRow key={inv.id} invoice={inv} />)}</div> : <div className="p-5"><EmptyState title="Your first invoice is still ahead." body="Once a proposal is accepted, turn it into an invoice in a couple of clicks." action={<Link href="/proposals" className="btn-quiet">See proposals</Link>} /></div>}
        </section>
        <section className="relative overflow-hidden rounded-2xl bg-[#2d403e] p-6 text-[#f4f1e8]"><div className="absolute -right-12 -top-10 h-44 w-44 rounded-full border border-[#5d746a]/50" /><div className="absolute -right-5 -top-3 h-28 w-28 rounded-full border border-[#5d746a]/50" /><div className="relative"><span className="grid h-9 w-9 place-items-center rounded-xl bg-[#b9d7bf] text-[#2d403e]"><Clock3 size={18} /></span><p className="mt-7 font-mono text-[9px] uppercase tracking-[.2em] text-[#b7c8bc]">A gentle nudge</p><h2 className="mt-2 font-[var(--app-font-serif)] text-2xl font-bold leading-tight">Keep the good work moving.</h2><p className="mt-3 text-sm leading-6 text-[#cad4cc]">Review a reminder draft, make it sound like you, then copy it into your own email.</p><Link href="/reminders" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#d9e8d8] px-4 py-2.5 text-xs font-bold text-[#2d403e] transition hover:bg-white">Review reminders <ArrowRight size={15} /></Link></div></section>
      </div>
      <div className="surface flex flex-wrap items-center justify-between gap-4 px-5 py-4"><div className="flex items-center gap-3"><div className="grid h-9 w-9 place-items-center rounded-xl bg-[#f1eadc] text-[#a06c42]"><Sparkles size={17} /></div><div><p className="text-sm font-semibold">Drafts are yours to write.</p><p className="mt-1 text-xs text-muted-foreground">AI drafting is unavailable until a provider is connected. Manual editing is always ready.</p></div></div><Link href="/proposals" className="text-xs font-semibold text-primary">Write a proposal <ArrowRight size={14} className="ml-1 inline" /></Link></div>
    </div>}
  </Workspace>;
}
function InvoiceRow({ invoice }: { invoice: Invoice }) {
  return <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4 last:border-0" data-testid={`row-invoice-${invoice.id}`}><div className="flex min-w-0 items-center gap-3"><div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-muted text-muted-foreground"><ReceiptText size={16} /></div><div className="min-w-0"><p className="truncate text-sm font-semibold">{invoice.clientName}</p><p className="mt-1 truncate text-xs text-muted-foreground">{invoice.invoiceNumber} · {invoice.description}</p></div></div><div className="flex items-center gap-5"><div className="text-right"><p className="text-sm font-semibold">{money(invoice.amount)}</p><p className="mt-1 text-[10px] text-muted-foreground">Due {shortDate(invoice.dueDate)}</p></div><Status value={invoice.status} /></div></div>;
}
function Status({ value }: { value: string }) {
  const label = value.charAt(0).toUpperCase() + value.slice(1);
  const cls = ['paid','accepted'].includes(value) ? 'bg-[#e5f0e6] text-[#3e795b]' : ['overdue','declined'].includes(value) ? 'bg-[#f5e4df] text-[#a94b3f]' : value === 'draft' ? 'bg-muted text-muted-foreground' : 'bg-[#f3ebdc] text-[#98703e]';
  return <span data-testid={`status-${value}`} className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold ${cls}`}>{label}</span>;
}
function Dialog({ title, close, children }: { title: string; close: () => void; children: React.ReactNode }) {
  return <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#1f2b2d]/45 p-0 backdrop-blur-[2px] sm:items-center sm:p-5" onMouseDown={e => { if(e.target === e.currentTarget) close(); }}>
    <section className="animate-enter max-h-[92dvh] w-full overflow-y-auto rounded-t-[24px] border border-border bg-card p-5 shadow-2xl sm:max-w-[620px] sm:rounded-[24px] sm:p-7"><div className="mb-6 flex items-start justify-between"><div><p className="font-mono text-[9px] uppercase tracking-[.2em] text-primary">Your workbench</p><h2 className="mt-1 font-[var(--app-font-serif)] text-2xl font-bold tracking-tight">{title}</h2></div><button onClick={close} className="rounded-lg p-2 text-muted-foreground hover:bg-muted" aria-label="Close dialog" data-testid="button-close-dialog"><X size={18} /></button></div>{children}</section>
  </div>;
}
function ControlledField<T extends FieldValues>({ control, name, label, placeholder, type = 'text', rows }: {
  control: Control<T>; name: Path<T>; label: string; placeholder?: string; type?: string; rows?: number;
}) {
  const testId = `input-${label.toLowerCase().replaceAll(' ', '-')}`;
  return <FormField control={control} name={name} render={({ field }) => <FormItem className="space-y-0">
    <FormLabel className="label">{label}</FormLabel>
    <FormControl>{rows
      ? <Textarea {...field} value={field.value ?? ''} className="field min-h-[100px] resize-y" rows={rows} placeholder={placeholder} data-testid={testId} />
      : <Input {...field} value={field.value ?? ''} className="field" type={type} placeholder={placeholder} data-testid={testId} />}</FormControl>
    <FormMessage className="mt-1 text-xs text-destructive" />
  </FormItem>} />;
}
function ClientsPage() {
  const q = useListClients();
  const create = useCreateClient(), update = useUpdateClient(), del = useDeleteClient();
  const refresh = useRefresh(getListClientsQueryKey);
  const [editing, setEditing] = useState<Client | null>(null), [modal, setModal] = useState(false), [search, setSearch] = useState('');
  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientSchema),
    defaultValues: { name: '', email: '', company: '', notes: '' },
  });
  const reset = (c?: Client) => {
    setEditing(c || null);
    form.reset({ name: c?.name || '', email: c?.email || '', company: c?.company || '', notes: c?.notes || '' });
    setModal(true);
  };
  const submit = form.handleSubmit(values => {
    const data = { name: values.name, email: values.email || null, company: values.company || null, notes: values.notes || null };
    const opts = { onSuccess: () => { refresh();setModal(false);toast.success(editing ? 'Client details saved.' : 'Client added to your workspace.'); }, onError: () => toast.error('Could not save client. Please try again.') };
    editing ? update.mutate({ id: editing.id, data }, opts) : create.mutate({ data }, opts);
  });
  const remove = (c: Client) => { if(confirm(`Remove ${c.name} from your clients?`)) del.mutate({ id: c.id }, { onSuccess: () => { refresh();toast.success('Client removed.'); }, onError: () => toast.error('Could not remove client.') }); };
  const clients = (q.data || []).filter(c => `${c.name} ${c.email || ''} ${c.company || ''}`.toLowerCase().includes(search.toLowerCase()));
  return <Workspace title="Good people, in one place." subtitle="Keep the important details close to the work." action={<button onClick={() => reset()} className="btn-primary" data-testid="button-add-client"><Plus size={16} /> Add client</button>}>
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><p className="text-xs text-muted-foreground">{q.data?.length || 0} {q.data?.length === 1 ? 'client' : 'clients'}</p><input className="field max-w-[270px] py-2.5" placeholder="Search people or companies" value={search} onChange={e => setSearch(e.target.value)} data-testid="input-search-clients" /></div>
    {q.isLoading ? <LoadingRows /> : q.isError ? <LoadError retry={() => q.refetch()} /> : !clients.length ? <EmptyState title={search ? 'No matches just yet.' : 'Start with someone you work with.'} body={search ? 'Try a different name or company.' : 'Add the people who make your independent work happen.'} action={!search && <button onClick={() => reset()} className="btn-primary"><Plus size={16} /> Add your first client</button>} /> :
      <div className="surface overflow-hidden"><div className="hidden grid-cols-[1.2fr_1.2fr_1fr_90px] gap-4 border-b border-border px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground md:grid"><span>Name</span><span>Email</span><span>Company</span><span /></div>{clients.map(c => <div key={c.id} className="grid gap-3 border-b border-border px-5 py-4 last:border-0 md:grid-cols-[1.2fr_1.2fr_1fr_90px] md:items-center" data-testid={`row-client-${c.id}`}><div className="flex items-center gap-3"><div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#e2eee4] text-xs font-bold text-primary">{c.name.split(/\s+/).map(n=>n[0]).slice(0,2).join('').toUpperCase()}</div><div><p className="text-sm font-semibold">{c.name}</p><p className="mt-1 text-[11px] text-muted-foreground md:hidden">{c.company || 'Independent'}</p></div></div><p className="text-xs text-muted-foreground">{c.email || 'No email added'}</p><p className="hidden text-xs text-muted-foreground md:block">{c.company || '—'}</p><div className="flex gap-1"><button onClick={() => reset(c)} className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground" aria-label={`Edit ${c.name}`} data-testid={`button-edit-client-${c.id}`}><Pencil size={15} /></button><button onClick={() => remove(c)} className="rounded-lg p-2 text-muted-foreground hover:bg-[#f5e4df] hover:text-destructive" aria-label={`Delete ${c.name}`} data-testid={`button-delete-client-${c.id}`}><Trash2 size={15} /></button></div></div>)}</div>}
    {modal && <Dialog title={editing ? 'Update client details' : 'Add a client'} close={() => setModal(false)}><Form {...form}><form onSubmit={submit} className="space-y-4"><ControlledField control={form.control} name="name" label="Name" placeholder="e.g. Casey Rivera" /><div className="grid gap-4 sm:grid-cols-2"><ControlledField control={form.control} name="email" label="Email" placeholder="casey@example.com" type="email" /><ControlledField control={form.control} name="company" label="Company" placeholder="Studio or business" /></div><ControlledField control={form.control} name="notes" label="Notes" placeholder="Useful context to remember…" rows={3} /><div className="flex justify-end gap-2 pt-2"><button type="button" onClick={() => setModal(false)} className="btn-quiet">Cancel</button><button className="btn-primary" disabled={create.isPending || update.isPending}>{editing ? 'Save changes' : 'Add client'}</button></div></form></Form></Dialog>}
  </Workspace>;
}
function ProposalsPage() {
  const q = useListProposals(), clientsQ = useListClients();
  const create = useCreateProposal(), update = useUpdateProposal(), del = useDeleteProposal(), convert = useConvertProposalToInvoice();
  const refresh = useRefresh(getListProposalsQueryKey, getListInvoicesQueryKey);
  const [editing,setEditing]=useState<Proposal|null>(null),[modal,setModal]=useState(false),[filter,setFilter]=useState('all');
  const form=useForm<ProposalFormValues>({
    resolver:zodResolver(proposalSchema),
    defaultValues:{clientId:'',clientName:'',title:'',sourceText:'',content:'',amount:'',timeline:''},
  });
  const reset=(p?:Proposal)=>{setEditing(p||null);form.reset({clientId:p?.clientId?String(p.clientId):'',clientName:p?.clientName||'',title:p?.title||'',sourceText:p?.sourceText||'',content:p?.content||'',amount:p?.amount?String(p.amount):'',timeline:p?.timeline||''});setModal(true);};
  const chooseClient=(id:string)=>{form.setValue('clientId',id,{shouldDirty:true,shouldValidate:true});const c=(clientsQ.data||[]).find(item=>String(item.id)===id);if(c)form.setValue('clientName',c.name,{shouldDirty:true,shouldValidate:true});};
  const submit=form.handleSubmit(values=>{const data={clientId:values.clientId?Number(values.clientId):null,clientName:values.clientName,title:values.title,sourceText:values.sourceText||null,content:values.content,amount:Number(values.amount),timeline:values.timeline};const opts={onSuccess:()=>{refresh();setModal(false);toast.success(editing?'Proposal saved.':'Proposal draft created.');},onError:()=>toast.error('Could not save proposal.')};editing?update.mutate({id:editing.id,data},opts):create.mutate({data},opts);});
  const setStatus=(p:Proposal,status:'draft'|'sent'|'accepted'|'declined')=>update.mutate({id:p.id,data:{status}},{onSuccess:()=>{refresh();toast.success(`Proposal marked ${status}.`);},onError:()=>toast.error('Could not update proposal.')});
  const remove=(p:Proposal)=>{if(confirm(`Delete “${p.title}”?`))del.mutate({id:p.id},{onSuccess:()=>{refresh();toast.success('Proposal deleted.');},onError:()=>toast.error('Could not delete proposal.')});};
  const createInvoice=(p:Proposal)=>{const dueDate=prompt('Invoice due date (YYYY-MM-DD)',new Date(Date.now()+14*86400000).toISOString().slice(0,10));if(!dueDate)return;convert.mutate({id:p.id,data:{dueDate}},{onSuccess:()=>{refresh();toast.success('Invoice created from accepted proposal.');},onError:()=>toast.error('Could not convert proposal to invoice.')});};
  const proposals=(q.data||[]).filter(p=>filter==='all'||p.status===filter);
  return <Workspace title="Clear scope, fewer loose ends." subtitle="Write proposals by hand, keep their status current, and carry accepted work forward." action={<button onClick={()=>reset()} className="btn-primary" data-testid="button-new-proposal"><Plus size={16} /> New proposal</button>}>
    <div className="mb-5 rounded-xl border border-[#e6dccb] bg-[#f5eee2] px-4 py-3 text-xs leading-5 text-[#806849]"><Sparkles size={14} className="mr-2 inline" /> AI drafting is unavailable until a provider is connected. Create and edit every proposal manually here.</div>
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div className="flex flex-wrap gap-1.5">{['all','draft','sent','accepted','declined'].map(s=><button key={s} onClick={()=>setFilter(s)} className={`rounded-lg px-3 py-2 text-xs font-semibold capitalize ${filter===s?'bg-[#2d403e] text-white':'bg-card text-muted-foreground hover:bg-muted'}`} data-testid={`filter-proposal-${s}`}>{s === 'all' ? 'All proposals' : s}</button>)}</div><span className="text-xs text-muted-foreground">{proposals.length} proposals</span></div>
    {q.isLoading ? <LoadingRows /> : q.isError ? <LoadError retry={()=>q.refetch()} /> : !proposals.length ? <EmptyState title="No proposals in this view." body={filter==='all'?'Start with a clear scope, estimate, and timeline.':'Try another status filter, or create a fresh draft.'} action={filter==='all'&&<button onClick={()=>reset()} className="btn-primary"><Plus size={16} /> Write a proposal</button>} /> :
      <div className="grid gap-4 lg:grid-cols-2">{proposals.map(p=><article key={p.id} className="surface p-5" data-testid={`card-proposal-${p.id}`}><div className="flex items-start justify-between gap-4"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><Status value={p.status} /><span className="text-[10px] text-muted-foreground">Updated {shortDate(p.updatedAt)}</span></div><h2 className="mt-3 truncate font-[var(--app-font-serif)] text-lg font-bold">{p.title}</h2><p className="mt-1 text-xs text-muted-foreground">{p.clientName}</p></div><p className="shrink-0 font-mono text-sm font-semibold">{money(p.amount)}</p></div><p className="mt-4 line-clamp-3 whitespace-pre-line text-sm leading-6 text-muted-foreground">{p.content || 'No proposal copy yet.'}</p><div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4"><p className="text-xs text-muted-foreground">{p.timeline || 'Timeline to be set'}</p><div className="flex flex-wrap items-center gap-1.5"><button onClick={()=>reset(p)} className="btn-quiet px-2.5 py-2 text-xs" data-testid={`button-edit-proposal-${p.id}`}><Pencil size={13} /> Edit</button><select className="field w-auto py-2 text-xs" aria-label={`Change status for ${p.title}`} value={p.status} onChange={e=>setStatus(p,e.target.value as 'draft'|'sent'|'accepted'|'declined')} data-testid={`select-proposal-status-${p.id}`}><option value="draft">Draft</option><option value="sent">Sent</option><option value="accepted">Accepted</option><option value="declined">Declined</option></select>{p.status==='accepted'&&<button onClick={()=>createInvoice(p)} disabled={convert.isPending} className="btn-primary px-2.5 py-2 text-xs" data-testid={`button-convert-proposal-${p.id}`}><ReceiptText size={13} /> Invoice</button>}<button onClick={()=>remove(p)} aria-label={`Delete ${p.title}`} className="rounded-lg p-2 text-muted-foreground hover:bg-[#f5e4df] hover:text-destructive" data-testid={`button-delete-proposal-${p.id}`}><Trash2 size={14} /></button></div></div></article>)}</div>}
    {modal&&<Dialog title={editing?'Edit proposal':'Write a proposal'} close={()=>setModal(false)}><Form {...form}><form onSubmit={submit} className="space-y-4"><FormField control={form.control} name="clientId" render={({field})=><FormItem className="space-y-0"><FormLabel className="label">Client</FormLabel><FormControl><select {...field} className="field" onChange={e=>chooseClient(e.target.value)} data-testid="select-proposal-client"><option value="">Choose a client (optional)</option>{(clientsQ.data||[]).map(c=><option key={c.id} value={c.id}>{c.name}{c.company?` · ${c.company}`:''}</option>)}</select></FormControl><FormMessage className="mt-1 text-xs text-destructive" /></FormItem>} />{!form.watch('clientId')&&<ControlledField control={form.control} name="clientName" label="Client name" placeholder="Client or company name" />}<ControlledField control={form.control} name="title" label="Proposal title" placeholder="e.g. Brand identity & launch" /><ControlledField control={form.control} name="sourceText" label="Inquiry notes" placeholder="What did they ask for? (optional)" rows={2} /><ControlledField control={form.control} name="content" label="Proposal content" placeholder="Scope, deliverables, assumptions, next steps…" rows={6} /><div className="grid gap-4 sm:grid-cols-2"><ControlledField control={form.control} name="amount" label="Amount" type="number" placeholder="0" /><ControlledField control={form.control} name="timeline" label="Timeline" placeholder="e.g. 3–4 weeks" /></div><div className="flex justify-end gap-2 pt-2"><button type="button" onClick={()=>setModal(false)} className="btn-quiet">Cancel</button><button className="btn-primary" disabled={create.isPending||update.isPending}>Save proposal</button></div></form></Form></Dialog>}
  </Workspace>;
}
function InvoicesPage() {
  const q=useListInvoices(), clientsQ=useListClients(); const create=useCreateInvoice(),update=useUpdateInvoice(),del=useDeleteInvoice(),createReminder=useCreateReminderDraft();
  const refresh=useRefresh(getListInvoicesQueryKey,getListRemindersQueryKey);
  const [editing,setEditing]=useState<Invoice|null>(null),[modal,setModal]=useState(false),[filter,setFilter]=useState('all'),[printingId,setPrintingId]=useState<number|null>(null);
  const form=useForm<InvoiceFormValues>({
    resolver:zodResolver(invoiceSchema),
    defaultValues:{clientId:'',clientName:'',email:'',description:'',amount:'',dueDate:''},
  });
  const reset=(inv?:Invoice)=>{setEditing(inv||null);form.reset({clientId:inv?.clientId?String(inv.clientId):'',clientName:inv?.clientName||'',email:inv?.clientEmail||'',description:inv?.description||'',amount:inv?.amount?String(inv.amount):'',dueDate:inv?.dueDate?.slice(0,10)||''});setModal(true);};
  const chooseClient=(id:string)=>{form.setValue('clientId',id,{shouldDirty:true,shouldValidate:true});const c=(clientsQ.data||[]).find(x=>String(x.id)===id);if(c){form.setValue('clientName',c.name,{shouldDirty:true,shouldValidate:true});form.setValue('email',c.email||'',{shouldDirty:true,shouldValidate:true});}};
  const submit=form.handleSubmit(values=>{const data={clientId:values.clientId?Number(values.clientId):null,clientName:values.clientName,clientEmail:values.email||null,description:values.description,amount:Number(values.amount),dueDate:values.dueDate};const opts={onSuccess:()=>{refresh();setModal(false);toast.success(editing?'Invoice updated.':'Invoice created.');},onError:()=>toast.error('Could not save invoice.')};editing?update.mutate({id:editing.id,data},opts):create.mutate({data},opts);});
  const markPaid=(inv:Invoice)=>update.mutate({id:inv.id,data:{status:inv.status==='paid'?'unpaid':'paid'}},{onSuccess:()=>{refresh();toast.success(inv.status==='paid'?'Invoice marked unpaid.':'Invoice marked paid.');},onError:()=>toast.error('Could not update invoice.')});
  const remove=(inv:Invoice)=>{if(confirm(`Delete invoice ${inv.invoiceNumber}?`))del.mutate({id:inv.id},{onSuccess:()=>{refresh();toast.success('Invoice deleted.');},onError:()=>toast.error('Could not delete invoice.')});};
  const draftReminder=(inv:Invoice,timing:'before_due'|'on_due'|'late')=>createReminder.mutate({id:inv.id,data:{timing}},{onSuccess:()=>{refresh();toast.success('Reminder draft created. Nothing was sent.');},onError:()=>toast.error('Could not create reminder draft.')});
  const invoices=(q.data||[]).filter(i=>filter==='all'||i.status===filter);
  return <Workspace title="Make getting paid feel simpler." subtitle="Keep due dates, amounts, and payment status easy to scan." action={<button onClick={()=>reset()} className="btn-primary" data-testid="button-new-invoice"><Plus size={16} /> New invoice</button>}>
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div className="flex gap-1.5">{['all','unpaid','overdue','paid'].map(s=><button key={s} onClick={()=>setFilter(s)} className={`rounded-lg px-3 py-2 text-xs font-semibold capitalize ${filter===s?'bg-[#2d403e] text-white':'bg-card text-muted-foreground hover:bg-muted'}`} data-testid={`filter-invoice-${s}`}>{s==='all'?'All invoices':s}</button>)}</div><span className="text-xs text-muted-foreground">{invoices.length} invoices</span></div>
    {q.isLoading?<LoadingRows />:q.isError?<LoadError retry={()=>q.refetch()} />:!invoices.length?<EmptyState title="No invoices here yet." body={filter==='all'?'Create one directly or convert an accepted proposal into an invoice.':'Nothing with this payment status.'} action={filter==='all'&&<button onClick={()=>reset()} className="btn-primary"><Plus size={16} /> Create invoice</button>} />:
    <div className="space-y-3">{invoices.map(inv=><article key={inv.id} className={`surface p-4 sm:p-5 print-sheet ${printingId===inv.id?'print-selected':''}`} data-testid={`card-invoice-${inv.id}`}><div className="flex flex-wrap items-start justify-between gap-4"><div className="flex min-w-0 items-start gap-3"><div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#e2eee4] text-primary"><ReceiptText size={18} /></div><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="text-sm font-bold">{inv.invoiceNumber}</p><Status value={inv.status} /></div><p className="mt-1 truncate text-xs text-muted-foreground">{inv.clientName} · {inv.description}</p><p className="mt-2 text-[11px] text-muted-foreground">Due {shortDate(inv.dueDate)}{inv.clientEmail?` · ${inv.clientEmail}`:''}</p></div></div><p className="font-mono text-lg font-semibold">{money(inv.amount)}</p></div><div className="no-print mt-4 flex flex-wrap justify-end gap-2 border-t border-border pt-3"><button onClick={()=>{setPrintingId(inv.id);document.body.classList.add('printing-invoice');setTimeout(()=>{window.print();document.body.classList.remove('printing-invoice');setPrintingId(null);},80);}} className="btn-quiet px-3 py-2 text-xs" data-testid={`button-print-invoice-${inv.id}`}><Printer size={14} /> Print / PDF</button><button onClick={()=>draftReminder(inv,inv.status==='overdue'?'late':'before_due')} disabled={inv.status==='paid'||createReminder.isPending} className="btn-quiet px-3 py-2 text-xs disabled:opacity-50" data-testid={`button-reminder-invoice-${inv.id}`}><Mail size={14} /> Draft reminder</button><button onClick={()=>reset(inv)} className="btn-quiet px-3 py-2 text-xs" data-testid={`button-edit-invoice-${inv.id}`}><Pencil size={14} /> Edit</button><button onClick={()=>markPaid(inv)} className="btn-primary px-3 py-2 text-xs" data-testid={`button-mark-paid-${inv.id}`}>{inv.status==='paid'?<ArrowDownRight size={14} />:<Check size={14} />}{inv.status==='paid'?'Mark unpaid':'Mark paid'}</button><button onClick={()=>remove(inv)} aria-label={`Delete ${inv.invoiceNumber}`} className="rounded-lg p-2 text-muted-foreground hover:bg-[#f5e4df] hover:text-destructive" data-testid={`button-delete-invoice-${inv.id}`}><Trash2 size={14} /></button></div></article>)}</div>}
    {modal&&<Dialog title={editing?'Edit invoice':'Create an invoice'} close={()=>setModal(false)}><Form {...form}><form onSubmit={submit} className="space-y-4"><FormField control={form.control} name="clientId" render={({field})=><FormItem className="space-y-0"><FormLabel className="label">Client</FormLabel><FormControl><select {...field} className="field" onChange={e=>chooseClient(e.target.value)} data-testid="select-invoice-client"><option value="">Choose a client (optional)</option>{(clientsQ.data||[]).map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></FormControl><FormMessage className="mt-1 text-xs text-destructive" /></FormItem>} />{!form.watch('clientId')&&<ControlledField control={form.control} name="clientName" label="Client name" placeholder="Client or company name" />}<ControlledField control={form.control} name="email" label="Client email" placeholder="billing@example.com" type="email" /><ControlledField control={form.control} name="description" label="Description" placeholder="Work delivered or agreed scope" /><div className="grid gap-4 sm:grid-cols-2"><ControlledField control={form.control} name="amount" label="Amount" type="number" placeholder="0" /><ControlledField control={form.control} name="dueDate" label="Due date" type="date" /></div><p className="text-xs text-muted-foreground">PDF export uses your browser’s print dialog. Choose “Save as PDF” to download.</p><div className="flex justify-end gap-2 pt-2"><button type="button" onClick={()=>setModal(false)} className="btn-quiet">Cancel</button><button className="btn-primary" disabled={create.isPending||update.isPending}>Save invoice</button></div></form></Form></Dialog>}
  </Workspace>;
}
function RemindersPage() {
  const q=useListReminders(),invQ=useListInvoices(),draft=useCreateReminderDraft(),update=useUpdateReminder();
  const refresh=useRefresh(getListRemindersQueryKey,getListInvoicesQueryKey);
  const [filter,setFilter]=useState('draft'),[editing,setEditing]=useState<number|null>(null);
  const createForm=useForm<ReminderCreateFormValues>({
    resolver:zodResolver(reminderCreateSchema),
    defaultValues:{invoiceId:'',timing:'before_due'},
  });
  const editForm=useForm<ReminderFormValues>({
    resolver:zodResolver(reminderSchema),
    defaultValues:{message:''},
  });
  const list=(q.data||[]).filter(r=>filter==='all'||r.status===filter);
  const makeDraft=createForm.handleSubmit(values=>draft.mutate({id:Number(values.invoiceId),data:{timing:values.timing}},{onSuccess:()=>{refresh();toast.success('Reminder template created. It has not been sent.');},onError:()=>toast.error('Could not create reminder draft.')}));
  const save=(r:Reminder,status?:'draft'|'sent',messageOverride?:string)=>{const message=messageOverride??(editing===r.id?editForm.getValues('message'):r.message);update.mutate({id:r.id,data:{message,...status?{status}:{}}},{onSuccess:()=>{refresh();setEditing(null);toast.success(status==='sent'?'Marked as sent.':'Reminder draft saved.');},onError:()=>toast.error('Could not update reminder.')});};
  const copy=async(text:string)=>{try{await navigator.clipboard.writeText(text);toast.success('Reminder copied. Send it from your own email when ready.');}catch{toast.error('Clipboard access is unavailable. Select and copy the text instead.');}};
  return <Workspace title="A kind follow-up, on your terms." subtitle="Review and edit your reminder drafts. Nothing is ever emailed automatically." action={<span className="inline-flex items-center gap-2 rounded-xl border border-[#e6dccb] bg-[#f5eee2] px-3 py-2.5 text-xs font-semibold text-[#806849]"><Mail size={14} /> Manual sending only</span>}>
    <div className="mb-5 flex flex-wrap items-center justify-between gap-4"><div className="flex gap-1.5">{['draft','sent','all'].map(s=><button key={s} onClick={()=>setFilter(s)} className={`rounded-lg px-3 py-2 text-xs font-semibold capitalize ${filter===s?'bg-[#2d403e] text-white':'bg-card text-muted-foreground hover:bg-muted'}`} data-testid={`filter-reminder-${s}`}>{s==='all'?'All reminders':s}</button>)}</div><Form {...createForm}><form className="flex flex-wrap items-start gap-2" onSubmit={makeDraft}><FormField control={createForm.control} name="invoiceId" render={({field})=><FormItem className="space-y-0"><FormControl><select {...field} className="field w-auto py-2.5 text-xs" aria-label="Invoice for reminder" data-testid="select-reminder-invoice"><option value="">Choose invoice</option>{(invQ.data||[]).filter(i=>i.status!=='paid').map(i=><option key={i.id} value={i.id}>{i.invoiceNumber} · {i.clientName}</option>)}</select></FormControl><FormMessage className="mt-1 text-xs text-destructive" /></FormItem>} /><FormField control={createForm.control} name="timing" render={({field})=><FormItem className="space-y-0"><FormControl><select {...field} className="field w-auto py-2.5 text-xs" aria-label="Reminder timing" data-testid="select-reminder-timing"><option value="before_due">Before due</option><option value="on_due">On due date</option><option value="late">Past due</option></select></FormControl></FormItem>} /><button className="btn-primary py-2.5 text-xs" disabled={draft.isPending} data-testid="button-create-reminder"><Plus size={14} /> Create draft</button></form></Form></div>
    <div className="mb-5 flex items-start gap-3 rounded-xl border border-[#dce6dc] bg-[#edf3eb] px-4 py-3 text-xs leading-5 text-[#4e6c57]"><CircleHelp size={15} className="mt-0.5 shrink-0" /> These are editable text templates—not emails. Copy the wording, send it manually from your email, then mark it sent here.</div>
    {q.isLoading?<LoadingRows />:q.isError?<LoadError retry={()=>q.refetch()} />:!list.length?<EmptyState title={filter==='sent'?'Nothing sent from here yet.':'No drafts waiting on you.'} body="Create a template from an invoice when it’s time for a gentle nudge. You remain in control of sending it." />:
      <div className="space-y-4">{list.map(r=><article key={r.id} className="surface p-5" data-testid={`card-reminder-${r.id}`}><div className="flex flex-wrap items-start justify-between gap-3"><div><div className="flex flex-wrap items-center gap-2"><Status value={r.status} /><span className="rounded-full bg-muted px-2.5 py-1 text-[10px] font-semibold text-muted-foreground">{r.timing.replace('_',' ')}</span></div><h2 className="mt-3 font-semibold">{r.clientName}</h2><p className="mt-1 text-xs text-muted-foreground">Invoice {r.invoiceNumber} · Drafted {shortDate(r.createdAt)}</p></div><button onClick={()=>{const next=editing===r.id?null:r.id;setEditing(next);if(next===r.id)editForm.reset({message:r.message});}} className="btn-quiet px-3 py-2 text-xs" data-testid={`button-edit-reminder-${r.id}`}><Pencil size={14} /> {editing===r.id?'Close editor':'Edit draft'}</button></div>
        {editing===r.id?<Form {...editForm}><form onSubmit={editForm.handleSubmit(values=>save(r,undefined,values.message))} className="mt-4"><ControlledField control={editForm.control} name="message" label="Message" rows={6} /><div className="mt-3 flex justify-end"><button className="btn-primary" disabled={update.isPending} data-testid={`button-save-reminder-${r.id}`}>Save draft</button></div></form></Form>:<p className="mt-4 whitespace-pre-line rounded-xl bg-muted/55 p-4 text-sm leading-6 text-foreground/80">{r.message}</p>}
        <div className="mt-4 flex flex-wrap justify-end gap-2 border-t border-border pt-3"><button onClick={()=>copy(r.message)} className="btn-quiet text-xs" data-testid={`button-copy-reminder-${r.id}`}><Clipboard size={14} /> Copy text</button>{r.status==='draft'&&<button onClick={()=>save(r,'sent')} className="btn-primary text-xs" data-testid={`button-mark-reminder-sent-${r.id}`}><Check size={14} /> Mark sent</button>}</div>
      </article>)}</div>}
  </Workspace>;
}
function RoutedErrorBoundary({ children }: { children: React.ReactNode }) { const [location] = useLocation(); return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>; }
function App() {
  return <TooltipProvider><WouterRouter base={basePath}><RoutedErrorBoundary><AuthRoutes /></RoutedErrorBoundary></WouterRouter><Toaster /></TooltipProvider>;
}
export default App;
