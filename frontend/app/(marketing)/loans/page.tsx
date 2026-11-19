import type { Metadata } from "next";
import { CheckCircle2, ClipboardList, Clock3, Landmark } from "lucide-react";
import { PageHero } from "@/components/marketing/PageHero";
import { ButtonLink } from "@/components/ui/Button";
import { LOAN_PRODUCTS } from "@/lib/products";
import LoanCalculator from "./LoanCalculator";

export const metadata: Metadata = {
  title: "Loans",
  description: "Personal, auto, mortgage, education, business and crypto backed loans with clear rates and a repayment calculator.",
};

const STEPS = [
  { icon: ClipboardList, title: "Apply in minutes", body: "Choose a product, amount and term in the dashboard and confirm with the last four digits of your SSN." },
  { icon: Clock3, title: "Fast review", body: "Our team reviews each application. Most decisions are made within 72 hours and you get a notification straight away." },
  { icon: Landmark, title: "Funds land in your account", body: "Approved loans are paid into the account you choose. Your schedule appears on the Loans page." },
];

export default function LoansPage() {
  return (
    <>
      <PageHero
        eyebrow="Lending"
        title="Loans with fixed rates and fixed payments"
        description="See your monthly payment before you apply, then follow the decision from your dashboard. There are no application fees."
      >
        <ButtonLink href="/register" size="lg">
          Start an application
        </ButtonLink>
      </PageHero>

      <section className="py-20">
        <div className="container-page">
          <div className="mb-10 max-w-2xl">
            <p className="eyebrow">Calculator</p>
            <h2 className="display mt-2 text-3xl sm:text-4xl">Estimate your monthly payment.</h2>
          </div>
          <LoanCalculator />
        </div>
      </section>

      <section className="bg-surface py-20">
        <div className="container-page">
          <h2 className="display text-3xl sm:text-4xl">Our loan products</h2>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {LOAN_PRODUCTS.map((p) => (
              <div key={p.value} className="card p-6">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-semibold">{p.label}</h3>
                  <span className="num rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700">{p.rate.toFixed(2)}% APR</span>
                </div>
                <p className="mt-2 text-[15px] leading-relaxed text-fg-muted">{p.blurb}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="container-page">
          <h2 className="display text-3xl sm:text-4xl">How it works</h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <div key={s.title} className="rounded-2xl border border-line p-6">
                <div className="flex items-center gap-3">
                  <span className="flex size-10 items-center justify-center rounded-xl bg-ink-900 text-white">
                    <s.icon className="size-5" />
                  </span>
                  <span className="text-sm font-semibold text-fg-subtle">Step {i + 1}</span>
                </div>
                <h3 className="mt-4 text-lg font-semibold">{s.title}</h3>
                <p className="mt-1.5 text-[15px] leading-relaxed text-fg-muted">{s.body}</p>
              </div>
            ))}
          </div>
          <ul className="mt-10 grid gap-3 text-sm text-fg-muted sm:grid-cols-2">
            {[
              "Amounts from $500 to $1,000,000",
              "Terms of 6 to 60 months",
              "We only ever store the last four digits of your SSN",
              "The rate shown for each product is the rate you get",
            ].map((t) => (
              <li key={t} className="flex items-start gap-2.5">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-brand-600" />
                {t}
              </li>
            ))}
          </ul>
          <p className="mt-8 text-xs text-fg-subtle">
            Demo platform: applications, approvals and disbursements are simulated and do not create a real credit agreement.
          </p>
        </div>
      </section>
    </>
  );
}
