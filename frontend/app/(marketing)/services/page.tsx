import type { Metadata } from "next";
import { ArrowLeftRight, ArrowRight, Bitcoin, Building2, FileText, Globe2, Landmark, LineChart, PiggyBank, Receipt, Users, Wallet } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { PageHero } from "@/components/marketing/PageHero";

export const metadata: Metadata = {
  title: "Personal banking",
  description: "Checking, savings, transfers, bill pay, statements, loans, investing and crypto. Everything that comes with an account.",
};

const GROUPS = [
  {
    id: "accounts",
    title: "Accounts",
    items: [
      { icon: Wallet, title: "Everyday Checking", body: "Your spending account, with a live balance and an instant, searchable history." },
      { icon: PiggyBank, title: "High Yield Savings", body: "A separate pot for goals. Move money in and out between your own accounts any time." },
      { icon: FileText, title: "Monthly statements", body: "Opening and closing balances, credits and debits for every month, downloadable as PDF." },
    ],
  },
  {
    id: "payments",
    title: "Payments",
    items: [
      { icon: ArrowLeftRight, title: "Instant transfers", body: "Send money to any customer by account number. It arrives immediately." },
      { icon: Globe2, title: "International wires", body: "Send to external and international accounts with the fee shown before you confirm." },
      { icon: Receipt, title: "Bill pay", body: "Pay utilities, phone, internet, insurance and cards from cash or from crypto." },
      { icon: Users, title: "Saved beneficiaries", body: "Keep the people you pay often one tap away." },
    ],
  },
  {
    id: "grow",
    title: "Borrow & grow",
    items: [
      { icon: Landmark, title: "Loans", body: "Personal, auto, education, mortgage, business and crypto backed loans with clear repayments." },
      { icon: LineChart, title: "Investing", body: "Plans across index funds, bonds, property and themes. Track them and close them at any time." },
      { icon: Bitcoin, title: "Crypto", body: "Buy and sell major coins at live prices and hold them in a custody wallet for each coin." },
      { icon: Building2, title: "Business banking", body: "Business financing products with the same transparent, digital experience." },
    ],
  },
];

export default function ServicesPage() {
  return (
    <>
      <PageHero
        eyebrow="Personal banking"
        title="What you get with an account"
        description="Every customer gets all of the features below. There are no account tiers and no monthly fees."
      >
        <ButtonLink href="/register" size="lg">
          Open an account <ArrowRight className="size-4" />
        </ButtonLink>
      </PageHero>

      {GROUPS.map((g, gi) => (
        <section key={g.id} id={g.id} className={gi % 2 === 1 ? "bg-surface py-20" : "py-20"}>
          <div className="container-page">
            <div className="grid gap-10 lg:grid-cols-[280px_1fr]">
              <div>
                <p className="eyebrow">0{gi + 1}</p>
                <h2 className="display mt-2 text-3xl sm:text-4xl">{g.title}</h2>
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                {g.items.map((it) => (
                  <div key={it.title} className="card p-6">
                    <it.icon className="size-6 text-brand-600" />
                    <h3 className="mt-4 font-semibold text-fg">{it.title}</h3>
                    <p className="mt-1.5 text-[15px] leading-relaxed text-fg-muted">{it.body}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      ))}
    </>
  );
}
