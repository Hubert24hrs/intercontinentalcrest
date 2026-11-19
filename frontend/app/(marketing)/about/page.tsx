import type { Metadata } from "next";
import { ArrowRight, Database, FileCheck2, KeyRound, LockKeyhole, Scale, ServerCog, ShieldCheck, Users } from "lucide-react";
import { PageHero } from "@/components/marketing/PageHero";
import { ButtonLink } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "About",
  description: "What Intercontinental Crest is, how it works, and how accounts are protected.",
};

const PRINCIPLES = [
  { icon: Scale, title: "Clear pricing", body: "Fees, rates and limits are shown before you confirm anything. Statements add up to the cent." },
  { icon: Users, title: "Easy to use", body: "Readable text, strong contrast and layouts that work on phones and large screens." },
  { icon: FileCheck2, title: "Full audit trail", body: "Admin actions such as credits, freezes and approvals are logged with a reason." },
];

const SECURITY = [
  { icon: KeyRound, title: "Two factor authentication", body: "Customers can require a code from an authenticator app every time they sign in." },
  { icon: LockKeyhole, title: "Session security", body: "Sessions use secure cookies that expire quickly, renew in the background and stop working as soon as an account is suspended." },
  { icon: ShieldCheck, title: "Access by role", body: "Admin features are restricted by role on our servers, not just hidden in the app." },
  { icon: Database, title: "Consistent ledgers", body: "Balance changes run in database transactions with conditional updates, so concurrent payments can't overdraw an account." },
  { icon: ServerCog, title: "Input validation", body: "Every request is validated and unknown fields are rejected before any business logic runs." },
  { icon: FileCheck2, title: "Data minimisation", body: "We keep only what a feature needs. For example, loan applications store only the last four digits of an SSN." },
];

export default function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="About"
        title="About Intercontinental Crest"
        description="What the platform is, how it works, and how we protect accounts."
      />

      <section className="py-20">
        <div className="container-page grid gap-14 lg:grid-cols-2 lg:items-center">
          <div>
            <h2 className="display text-3xl sm:text-4xl">What this platform is</h2>
            <div className="mt-6 space-y-4 text-[17px] leading-relaxed text-fg-muted">
              <p>
                Intercontinental Crest is a working demo of an online bank. It has a customer app, an admin console for staff, and a
                server that enforces the rules behind every screen.
              </p>
              <p>
                It is not a licensed bank and does not hold customer money. Balances, payments, loans and investments are simulated, so
                you can try everything without risk.
              </p>
            </div>
          </div>
          <div id="demo" className="panel-dark p-8 sm:p-10">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gold-300">At a glance</p>
            <dl className="mt-6 grid grid-cols-2 gap-6">
              {[
                ["Accounts per customer", "2 + 7 wallets"],
                ["Transfer settlement", "Instant"],
                ["Crypto trading fee", "0.5%"],
                ["International wire fee", "$3"],
                ["Loan amounts", "$500 to $1M"],
                ["Statement format", "PDF"],
              ].map(([k, v]) => (
                <div key={k}>
                  <dt className="text-sm text-white/55">{k}</dt>
                  <dd className="mt-1 text-xl font-semibold">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      <section className="bg-surface py-20">
        <div className="container-page">
          <h2 className="display text-3xl sm:text-4xl">How we work</h2>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {PRINCIPLES.map((p) => (
              <div key={p.title} className="card p-7">
                <p.icon className="size-6 text-brand-600" />
                <h3 className="mt-4 text-lg font-semibold">{p.title}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-fg-muted">{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="security" className="py-20">
        <div className="container-page">
          <p className="eyebrow">Security</p>
          <h2 className="display mt-2 text-3xl sm:text-4xl">How accounts are protected</h2>
          <div className="mt-10 grid gap-x-10 gap-y-8 md:grid-cols-2 lg:grid-cols-3">
            {SECURITY.map((s) => (
              <div key={s.title} className="flex gap-4">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                  <s.icon className="size-5" />
                </span>
                <div>
                  <h3 className="font-semibold">{s.title}</h3>
                  <p className="mt-1 text-[15px] leading-relaxed text-fg-muted">{s.body}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-14">
            <ButtonLink href="/register" size="lg">
              Open an account <ArrowRight className="size-4" />
            </ButtonLink>
          </div>
        </div>
      </section>
    </>
  );
}
