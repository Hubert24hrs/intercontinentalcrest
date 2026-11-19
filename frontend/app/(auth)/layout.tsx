import Link from "next/link";
import { ArrowLeftRight, KeyRound, LineChart } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { DemoPill } from "@/components/brand/DemoNotice";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
      <aside className="panel-dark relative hidden flex-col justify-between overflow-hidden rounded-none p-12 lg:flex">
        <div className="grid-bg absolute inset-0 opacity-40" />
        <div className="relative flex items-center gap-3">
          <Logo tone="light" />
          <DemoPill />
        </div>

        <div className="relative max-w-md">
          <h2 className="display text-[44px] leading-[1.08] text-white">Your accounts, payments and investments in one place.</h2>
          <ul className="mt-10 space-y-5">
            {[
              { icon: ArrowLeftRight, title: "Instant transfers", body: "Move money between accounts and customers in seconds." },
              { icon: LineChart, title: "Invest & trade", body: "Plans across asset classes, plus crypto at live prices." },
              { icon: KeyRound, title: "Account security", body: "Two factor sign in, lockout after failed attempts, and secure sessions." },
            ].map((f) => (
              <li key={f.title} className="flex gap-4">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-brand-300">
                  <f.icon className="size-5" />
                </span>
                <div>
                  <p className="font-semibold text-white">{f.title}</p>
                  <p className="text-sm text-white/60">{f.body}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs leading-relaxed text-white/45">
          Demo platform. Not a bank. Balances and transactions are simulated and are not FDIC insured.
        </p>
      </aside>

      <main className="flex min-h-screen flex-col bg-white">
        <div className="flex items-center justify-between px-6 py-5 sm:px-10 lg:justify-end">
          <span className="lg:hidden">
            <Logo />
          </span>
          <Link href="/" className="text-sm font-medium text-fg-subtle hover:text-fg">
            Back to site
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-center px-6 pb-12 sm:px-10">
          <div className="w-full max-w-[420px] animate-fade-up">{children}</div>
        </div>
        <p className="px-6 pb-6 text-center text-xs text-fg-faint lg:hidden">Demo platform. Balances and transactions are simulated.</p>
      </main>
    </div>
  );
}
