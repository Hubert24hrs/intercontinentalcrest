import Link from "next/link";
import {
  ArrowRight,
  ArrowLeftRight,
  Bitcoin,
  CheckCircle2,
  FileText,
  Fingerprint,
  KeyRound,
  Landmark,
  LineChart,
  LockKeyhole,
  MessagesSquare,
  Receipt,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { HeroVisual } from "@/components/marketing/HeroVisual";
import { MarketTicker } from "@/components/marketing/MarketTicker";

const FEATURES = [
  { icon: Wallet, title: "Checking & savings", body: "Two accounts from day one, with live balances and a clean, searchable history." },
  { icon: ArrowLeftRight, title: "Instant transfers", body: "Move money between your accounts or to other customers in seconds, plus international wires." },
  { icon: Receipt, title: "Bill pay", body: "Pay utilities, subscriptions and cards from cash or crypto, with every payment on your statement." },
  { icon: Landmark, title: "Lending", body: "Apply for personal, auto, education or business loans and track the decision in real time." },
  { icon: LineChart, title: "Investing", body: "Choose a plan, follow its value, and move it back to cash when you want." },
  { icon: Bitcoin, title: "Crypto custody", body: "Buy, sell and hold major assets with live market prices and a wallet for each coin." },
];

const SECURITY = [
  { icon: KeyRound, title: "Two factor sign in", body: "Protect your login with a code from an authenticator app." },
  { icon: LockKeyhole, title: "Secure sessions", body: "Session cookies expire quickly and can't be read by scripts on the page." },
  { icon: Fingerprint, title: "Lockout protection", body: "After repeated failed sign in attempts the account is locked for a while." },
  { icon: FileText, title: "Full audit trail", body: "Every administrative action is recorded and reviewable." },
];

const STEPS = [
  { n: "01", title: "Open your account", body: "Sign up with your name, email and a strong password. Your checking, savings and crypto wallets are created instantly." },
  { n: "02", title: "Add funds", body: "Add a simulated crypto deposit, or apply for a loan. Approved loans are paid straight into your account." },
  { n: "03", title: "Bank, pay and invest", body: "Send money, pay bills, trade, invest and download PDF statements from one dashboard." },
];

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-x-0 top-0 -z-10 h-[620px] bg-[radial-gradient(60%_60%_at_80%_10%,rgba(30,153,142,0.10),transparent_70%),radial-gradient(40%_50%_at_10%_20%,rgba(199,154,69,0.10),transparent_70%)]" />
        <div className="container-page grid items-center gap-14 pb-20 pt-14 lg:grid-cols-[1.05fr_1fr] lg:pb-28 lg:pt-20">
          <div className="animate-fade-up">
            <span className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-3 py-1 text-xs font-medium text-fg-muted shadow-[0_1px_2px_rgba(16,24,40,0.05)]">
              <span className="size-1.5 rounded-full bg-brand-500" /> Checking · Savings · Loans · Investing · Crypto
            </span>
            <h1 className="display mt-6 text-[42px] leading-[1.05] sm:text-6xl lg:text-[64px]">
              Checking, savings, loans and investing in <em className="font-normal italic text-brand-600">one</em> account.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-fg-muted">
              Open an account online in about two minutes. Send money to other customers instantly, pay bills, apply for a loan, invest, and
              buy or sell crypto from the same dashboard.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <ButtonLink href="/register" size="lg">
                Open an account <ArrowRight className="size-4" />
              </ButtonLink>
              <ButtonLink href="/services" size="lg" variant="secondary">
                Explore features
              </ButtonLink>
            </div>
            <ul className="mt-9 flex flex-wrap gap-x-6 gap-y-2 text-sm text-fg-muted">
              {["No paperwork", "Free transfers between customers", "Works on phone and desktop"].map((t) => (
                <li key={t} className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-brand-600" /> {t}
                </li>
              ))}
            </ul>
          </div>
          <HeroVisual />
        </div>
      </section>

      <MarketTicker />

      {/* Features */}
      <section className="py-24">
        <div className="container-page">
          <div className="max-w-2xl">
            <p className="eyebrow">Features</p>
            <h2 className="display mt-3 text-4xl sm:text-5xl">What every account includes</h2>
            <p className="mt-4 text-lg text-fg-muted">There are no account tiers and no monthly fees. Every customer gets all of these.</p>
          </div>
          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div key={f.title} className="card card-hover p-7">
                <div className="flex size-11 items-center justify-center rounded-xl bg-ink-900 text-white">
                  <f.icon className="size-5" />
                </div>
                <h3 className="mt-5 text-lg font-semibold text-fg">{f.title}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-fg-muted">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Split feature */}
      <section className="bg-surface py-24">
        <div className="container-page grid items-center gap-14 lg:grid-cols-2">
          <div className="order-2 lg:order-1">
            <div className="card overflow-hidden">
              <div className="border-b border-line px-6 py-4">
                <p className="text-sm font-semibold">Send money</p>
              </div>
              <div className="space-y-4 p-6">
                {[
                  ["From", "Everyday Checking •••• 4821"],
                  ["To", "Ada Okafor · IC7731049920"],
                  ["Amount", "$1,250.00"],
                  ["Arrives", "Instantly"],
                ].map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between rounded-xl border border-line px-4 py-3 text-sm">
                    <span className="text-fg-subtle">{k}</span>
                    <span className="num font-medium">{v}</span>
                  </div>
                ))}
                <div className="btn btn-accent w-full">Review transfer</div>
              </div>
            </div>
          </div>
          <div className="order-1 lg:order-2">
            <p className="eyebrow">Payments</p>
            <h2 className="display mt-3 text-4xl sm:text-5xl">Send money in seconds</h2>
            <p className="mt-4 text-lg leading-relaxed text-fg-muted">
              Transfers to other Intercontinental Crest customers arrive immediately and are free. For international wires, the $3 fee is shown
              before you confirm. Every payment checks your available balance first, so the same money can never be spent twice.
            </p>
            <ul className="mt-8 space-y-4">
              {[
                "Save the people you pay often and pay them in one tap",
                "Pay bills from cash or from your crypto holdings",
                "Monthly statements with opening and closing balances",
              ].map((t) => (
                <li key={t} className="flex items-start gap-3 text-[15px] text-fg">
                  <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-brand-600" /> {t}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24">
        <div className="container-page">
          <div className="mx-auto max-w-2xl text-center">
            <p className="eyebrow">How it works</p>
            <h2 className="display mt-3 text-4xl sm:text-5xl">Open an account in three steps</h2>
          </div>
          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {STEPS.map((s) => (
              <div key={s.n} className="relative rounded-2xl border border-line p-7">
                <span className="display text-5xl text-brand-200">{s.n}</span>
                <h3 className="mt-4 text-lg font-semibold">{s.title}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-fg-muted">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Security */}
      <section id="security" className="relative overflow-hidden bg-ink-900 py-24 text-white">
        <div className="grid-bg absolute inset-0 opacity-50" />
        <div className="container-page relative grid gap-14 lg:grid-cols-[1fr_1.2fr] lg:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gold-300">Security</p>
            <h2 className="display mt-3 text-4xl text-white sm:text-5xl">How we protect your account</h2>
            <p className="mt-4 text-lg leading-relaxed text-white/65">
              Every request is checked on our servers, admin tools are limited by role, and every admin action is logged.
            </p>
            <ButtonLink href="/about#security" variant="outline-on-dark" className="mt-8">
              Read about our security <ArrowRight className="size-4" />
            </ButtonLink>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {SECURITY.map((s) => (
              <div key={s.title} className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur">
                <s.icon className="size-6 text-brand-300" />
                <h3 className="mt-4 font-semibold">{s.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-white/60">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Support */}
      <section className="py-24">
        <div className="container-page">
          <div className="card grid items-center gap-8 overflow-hidden p-8 sm:p-12 lg:grid-cols-[1.4fr_1fr]">
            <div>
              <p className="eyebrow">Support</p>
              <h2 className="display mt-3 text-3xl sm:text-4xl">Need help? Message our support team.</h2>
              <p className="mt-3 text-fg-muted">Once you are signed in, open Support from the menu to chat with us. Common questions are answered in the help centre.</p>
              <div className="mt-6 flex flex-wrap gap-3">
                <ButtonLink href="/faq" variant="secondary">
                  Visit the help centre
                </ButtonLink>
                <Link href="/contact" className="btn btn-ghost">
                  Contact us <ArrowRight className="size-4" />
                </Link>
              </div>
            </div>
            <div className="rounded-2xl bg-surface p-5">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <MessagesSquare className="size-4 text-brand-600" /> Support chat
              </div>
              <div className="mt-4 space-y-3 text-sm">
                <p className="w-fit max-w-[85%] rounded-2xl rounded-bl-md bg-white px-4 py-2.5 shadow-[0_1px_2px_rgba(16,24,40,0.06)]">Hi! How can we help today?</p>
                <p className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-md bg-ink-900 px-4 py-2.5 text-white">Where can I download last month&apos;s statement?</p>
                <p className="w-fit max-w-[85%] rounded-2xl rounded-bl-md bg-white px-4 py-2.5 shadow-[0_1px_2px_rgba(16,24,40,0.06)]">
                  Open <span className="font-medium">Statements</span>, pick the account and month, then tap Download PDF.
                </p>
              </div>
              <div className="mt-4 flex items-center gap-2 text-xs text-fg-subtle">
                <ShieldCheck className="size-3.5 text-brand-600" /> Only you and our support team can see your conversation.
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
