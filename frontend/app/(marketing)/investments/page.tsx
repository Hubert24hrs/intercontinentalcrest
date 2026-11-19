import type { Metadata } from "next";
import { ArrowRight, Info } from "lucide-react";
import { PageHero } from "@/components/marketing/PageHero";
import { ButtonLink } from "@/components/ui/Button";
import { MarketTicker } from "@/components/marketing/MarketTicker";
import { INVESTMENT_CATEGORIES, INVESTMENT_PLANS } from "@/lib/products";
import LiveCryptoPrices from "./LiveCryptoPrices";

export const metadata: Metadata = {
  title: "Investing",
  description: "Index funds, bonds, property, themed plans and crypto, with estimated returns and live crypto prices.",
};

const RISK_STYLE: Record<string, string> = {
  Low: "bg-success-50 text-success-700",
  Moderate: "bg-info-50 text-info-600",
  High: "bg-warning-50 text-warning-700",
  "Very high": "bg-danger-50 text-danger-700",
};

export default function InvestmentsPage() {
  return (
    <>
      <PageHero
        eyebrow="Investing"
        title="Invest in funds, bonds, property and crypto"
        description="Pick a plan, see how it is doing in your dashboard, and move back to cash whenever you want."
      >
        <ButtonLink href="/register" size="lg">
          Start investing <ArrowRight className="size-4" />
        </ButtonLink>
      </PageHero>
      <MarketTicker />

      <section className="py-20">
        <div className="container-page">
          <h2 className="display text-3xl sm:text-4xl">Investment plans</h2>
          <p className="mt-3 max-w-2xl text-fg-muted">Return ranges are estimates for each type of asset. They are not guaranteed, and values can go down as well as up.</p>

          {INVESTMENT_CATEGORIES.map((cat) => (
            <div key={cat} className="mt-12">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-fg-subtle">{cat}</h3>
              <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {INVESTMENT_PLANS.filter((p) => p.category === cat).map((p) => (
                  <div key={p.id} className="card flex flex-col p-6">
                    <div className="flex items-start justify-between gap-3">
                      <h4 className="font-semibold">{p.name}</h4>
                      <span className={`badge ${RISK_STYLE[p.risk]}`}>{p.risk} risk</span>
                    </div>
                    <p className="mt-2 flex-1 text-[15px] leading-relaxed text-fg-muted">{p.description}</p>
                    <dl className="mt-5 grid grid-cols-3 gap-3 border-t border-line pt-4 text-sm">
                      <div>
                        <dt className="text-xs text-fg-subtle">Est. return</dt>
                        <dd className="num mt-0.5 font-semibold">
                          {p.minReturn} to {p.maxReturn}%
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs text-fg-subtle">Horizon</dt>
                        <dd className="num mt-0.5 font-semibold">{p.termMonths} mo</dd>
                      </div>
                      <div>
                        <dt className="text-xs text-fg-subtle">From</dt>
                        <dd className="num mt-0.5 font-semibold">${p.minInvestment}</dd>
                      </div>
                    </dl>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-surface py-20">
        <div className="container-page">
          <div className="mb-8 max-w-2xl">
            <p className="eyebrow">Digital assets</p>
            <h2 className="display mt-2 text-3xl sm:text-4xl">Live crypto prices</h2>
          </div>
          <LiveCryptoPrices />
          <p className="mt-6 flex items-start gap-2 text-xs text-fg-subtle">
            <Info className="mt-0.5 size-3.5 shrink-0" />
            Crypto assets are highly volatile. Prices come from public market data for illustration. Trading in the dashboard is simulated.
          </p>
        </div>
      </section>
    </>
  );
}
