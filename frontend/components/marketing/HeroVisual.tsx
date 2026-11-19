import { ArrowDownLeft, ArrowUpRight, Bitcoin, ShieldCheck, Zap } from "lucide-react";

/** Illustrative product preview (static, no real data). */
export function HeroVisual() {
  const bars = [38, 52, 44, 61, 57, 72, 66, 81, 77, 90, 84, 96];
  return (
    <div className="relative mx-auto w-full max-w-[520px]" aria-hidden>
      <div className="absolute -inset-6 rounded-[2.5rem] bg-gradient-to-br from-brand-100/70 via-white to-gold-200/40 blur-2xl" />

      <div className="panel-dark relative overflow-hidden p-6 shadow-[0_30px_80px_-30px_rgba(11,31,51,0.55)]">
        <div className="grid-bg absolute inset-0 opacity-40" />
        <div className="relative flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-white/60">Total balance</p>
            <p className="num mt-1 text-[34px] font-semibold tracking-tight">$84,213.40</p>
            <p className="mt-1 inline-flex items-center gap-1 rounded-full bg-success-500/15 px-2 py-0.5 text-xs font-medium text-emerald-300">
              <ArrowUpRight className="size-3" /> 4.2% this month
            </p>
          </div>
          <div className="rounded-xl bg-white/10 px-3 py-2 text-right backdrop-blur">
            <p className="text-[10px] uppercase tracking-wider text-white/50">Checking</p>
            <p className="font-mono text-xs text-white/80">•••• 4821</p>
          </div>
        </div>

        <div className="relative mt-6 flex h-24 items-end gap-1.5">
          {bars.map((h, i) => (
            <div key={i} className="flex-1 rounded-t-md bg-gradient-to-t from-brand-500/40 to-brand-300" style={{ height: `${h}%`, opacity: 0.45 + i * 0.045 }} />
          ))}
        </div>

        <div className="relative mt-6 grid grid-cols-3 gap-2 text-center text-xs">
          {["Send", "Pay bills", "Invest"].map((a) => (
            <div key={a} className="rounded-xl border border-white/10 bg-white/5 py-2.5 font-medium text-white/85">
              {a}
            </div>
          ))}
        </div>
      </div>

      <div className="card relative -mt-8 ml-auto w-[88%] p-4 shadow-[0_20px_50px_-25px_rgba(11,31,51,0.45)]">
        <p className="text-xs font-semibold text-fg-subtle">Recent activity</p>
        <ul className="mt-3 space-y-3">
          {[
            { icon: ArrowDownLeft, label: "Salary from Northwind Ltd", amt: "+$6,240.00", pos: true },
            { icon: Zap, label: "Electricity bill", amt: "−$84.20", pos: false },
            { icon: Bitcoin, label: "Bought 0.0125 BTC", amt: "−$1,000.00", pos: false },
          ].map((r) => (
            <li key={r.label} className="flex items-center gap-3">
              <span className={`flex size-8 items-center justify-center rounded-lg ${r.pos ? "bg-success-50 text-success-600" : "bg-surface-muted text-fg-muted"}`}>
                <r.icon className="size-4" />
              </span>
              <span className="flex-1 truncate text-sm text-fg">{r.label}</span>
              <span className={`num text-sm font-semibold ${r.pos ? "text-success-600" : "text-fg"}`}>{r.amt}</span>
            </li>
          ))}
        </ul>
        <p className="mt-4 flex items-center gap-2 border-t border-line pt-3 text-xs text-fg-subtle">
          <ShieldCheck className="size-3.5 text-brand-600" /> Protected with two factor sign in
        </p>
      </div>
    </div>
  );
}
