import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  CircleDollarSign,
  FileCheck2,
  FileText,
  Receipt,
  Send,
  ShieldCheck,
  Sparkles,
  Wallet,
} from 'lucide-react';

const features = [
  {
    icon: FileText,
    number: '01',
    title: 'Quotes that win work',
    description: 'Build polished quotations in minutes with reusable items, flexible taxes, and clear approval-ready layouts.',
    color: 'bg-blue-100 text-blue-700',
  },
  {
    icon: Send,
    number: '02',
    title: 'Invoices that move faster',
    description: 'Turn accepted quotes into accurate invoices, send them from one place, and keep every status visible.',
    color: 'bg-amber-100 text-amber-700',
  },
  {
    icon: BarChart3,
    number: '03',
    title: 'A business you can read',
    description: 'See revenue, outstanding balances, payment activity, and performance trends without spreadsheet work.',
    color: 'bg-emerald-100 text-emerald-700',
  },
];

const workflow = [
  'Create branded quotations and invoices',
  'Track every status from draft to paid',
  'Keep clients, payments, and reports together',
];

function WorkspacePreview() {
  return (
    <div className="relative mx-auto w-full max-w-xl lg:mx-0">
      <div className="absolute -right-4 -top-8 h-24 w-24 rounded-full bg-amber-300/40 blur-2xl" />
      <div className="absolute -bottom-10 -left-8 h-32 w-32 rounded-full bg-blue-400/30 blur-3xl" />
      <div className="relative overflow-hidden rounded-2xl border border-white/80 bg-white shadow-2xl shadow-slate-900/20">
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-5 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white">
              <Receipt size={16} />
            </div>
            <span className="text-sm font-bold text-slate-900">Invoice Pro</span>
          </div>
          <div className="flex gap-1.5">
            <span className="h-2 w-2 rounded-full bg-red-300" />
            <span className="h-2 w-2 rounded-full bg-amber-300" />
            <span className="h-2 w-2 rounded-full bg-emerald-300" />
          </div>
        </div>
        <div className="grid gap-5 p-5 sm:grid-cols-[1fr_1.35fr]">
          <div className="space-y-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Overview</p>
              <p className="mt-1 text-lg font-bold text-slate-900">Good morning, Admin</p>
            </div>
            <div className="rounded-xl bg-blue-600 p-4 text-white">
              <div className="flex items-start justify-between">
                <CircleDollarSign size={20} className="text-blue-200" />
                <span className="rounded-full bg-white/15 px-2 py-1 text-[10px] font-semibold">This month</span>
              </div>
              <p className="mt-7 text-xs text-blue-100">Total revenue</p>
              <p className="mt-1 text-2xl font-bold">$48,240</p>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/20">
                <div className="h-full w-3/4 rounded-full bg-amber-300" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                <p className="text-[10px] text-slate-400">Outstanding</p>
                <p className="mt-2 text-base font-bold text-slate-900">$12,680</p>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                <p className="text-[10px] text-slate-400">Paid invoices</p>
                <p className="mt-2 text-base font-bold text-slate-900">128</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Recent invoices</p>
                <p className="mt-1 text-sm font-bold text-slate-900">Activity at a glance</p>
              </div>
              <div className="rounded-lg bg-blue-50 p-2 text-blue-600"><FileCheck2 size={15} /></div>
            </div>
            <div className="mt-5 space-y-3">
              {[
                ['INV-1048', 'Northstar Studio', '$4,800', 'Paid', 'bg-emerald-100 text-emerald-700'],
                ['INV-1047', 'Lumen Works', '$2,240', 'Pending', 'bg-amber-100 text-amber-700'],
                ['INV-1046', 'Aster Labs', '$7,160', 'Paid', 'bg-emerald-100 text-emerald-700'],
                ['INV-1045', 'Morrow & Co.', '$1,980', 'Draft', 'bg-slate-100 text-slate-600'],
              ].map(([number, client, amount, status, statusColor]) => (
                <div key={number} className="flex items-center justify-between border-b border-slate-50 pb-3 last:border-0 last:pb-0">
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-800">{number}</p>
                    <p className="truncate text-[10px] text-slate-400">{client}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-semibold text-slate-800">{amount}</p>
                    <span className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[9px] font-semibold ${statusColor}`}>{status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-slate-50 text-slate-900">
      <header className="border-b border-slate-800 bg-slate-950 text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-2.5" aria-label="Invoice Pro home">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white">
              <Receipt size={19} />
            </span>
            <span className="text-lg font-bold tracking-tight">Invoice Pro</span>
          </Link>

          <nav className="flex items-center gap-2">
            <a href="#features" className="hidden rounded-lg px-3 py-2 text-sm font-medium text-slate-300 hover:bg-white/10 hover:text-white sm:block">
              Features
            </a>
            <Link to="/login" className="rounded-lg border border-slate-600 px-4 py-2 text-sm font-semibold text-slate-200 hover:border-blue-400 hover:text-white">
              Sign in
            </Link>
            <Link to="/login" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700">
              Get started
            </Link>
          </nav>
        </div>
      </header>

      <section className="bg-slate-950 text-white">
        <div className="mx-auto max-w-6xl px-6 py-20 sm:py-28">
        <div className="grid items-center gap-14 lg:grid-cols-[1fr_0.85fr]">
          <div className="max-w-2xl">
            <p className="mb-5 text-sm font-semibold uppercase tracking-wider text-blue-300">Quotation and invoice management</p>
            <h1 className="text-4xl font-bold leading-tight tracking-tight text-white sm:text-6xl">
              Professional invoicing, without the paperwork.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-slate-300">
              Create clear quotations, send polished invoices, and keep every payment moving from one reliable workspace.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/login" className="inline-flex items-center gap-2 rounded-lg bg-blue-500 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-400">
                Enter your workspace <ArrowRight size={16} />
              </Link>
              <a href="#features" className="rounded-lg border border-slate-600 px-5 py-3 text-sm font-semibold text-slate-200 hover:border-slate-400 hover:text-white">
                View capabilities
              </a>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-900 shadow-2xl shadow-black/30">
            <div className="flex items-center justify-between border-b border-slate-100 pb-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">This month</p>
                <p className="mt-1 text-2xl font-bold text-slate-950">$24,860</p>
                <p className="mt-1 text-xs font-medium text-emerald-600">12.5% from last month</p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <Wallet size={21} />
              </div>
            </div>
            <div className="mt-6 space-y-4">
              {[
                ['INV-1048', 'Northstar Studio', '$4,800', 'Paid'],
                ['INV-1047', 'Lumen Works', '$2,240', 'Pending'],
                ['INV-1046', 'Aster Labs', '$7,160', 'Paid'],
              ].map(([number, client, amount, status]) => (
                <div key={number} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{number}</p>
                    <p className="text-xs text-slate-400">{client}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-slate-800">{amount}</p>
                    <p className={`text-xs font-medium ${status === 'Paid' ? 'text-emerald-600' : 'text-amber-600'}`}>{status}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        </div>
      </section>

      <section id="features" className="border-y border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <div className="mb-10 max-w-xl">
            <h2 className="text-3xl font-bold tracking-tight text-slate-950">Everything you need to stay organized</h2>
            <p className="mt-3 text-slate-600">A clear workflow for the everyday work behind your business.</p>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {features.map(({ icon: Icon, title, description }) => (
              <article key={title} className="rounded-xl border border-slate-200 p-6">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                  <Icon size={19} />
                </span>
                <h3 className="mt-5 font-bold text-slate-950">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <footer className="mx-auto flex max-w-6xl flex-col gap-3 px-6 py-8 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
        <p className="font-semibold text-slate-700">Invoice Pro</p>
        <p>Quotations, invoices, and payments in one place.</p>
      </footer>
    </main>
  );
}
