import type { Metadata } from "next";
import { PageHero } from "@/components/marketing/PageHero";
import { FaqList, type Faq } from "./FaqList";

export const metadata: Metadata = {
  title: "Help centre",
  description: "Answers to common questions about accounts, payments, lending, investing, crypto and security.",
};

const SECTIONS: { title: string; items: Faq[] }[] = [
  {
    title: "Getting started",
    items: [
      { q: "Is Intercontinental Crest a real bank?", a: "No. It's a demonstration platform that works like a digital bank end to end. It isn't licensed, doesn't hold customer money, and balances are not deposits or FDIC insured. Please don't send it real funds." },
      { q: "How do I open an account?", a: "Select Open an account, enter your name, email and a strong password. Your checking account, savings account and crypto wallets are created immediately." },
      { q: "How do I add money?", a: "Use a simulated crypto deposit from the Wallets page, receive a transfer from another customer, or apply for a loan. Approved loans are paid into the account you choose." },
    ],
  },
  {
    title: "Payments",
    items: [
      { q: "How long do transfers take?", a: "Transfers to other Intercontinental Crest accounts arrive instantly. Transfers to external account numbers are recorded as outgoing payments." },
      { q: "Are there fees?", a: "Transfers between customers and bill payments are free. International wires cost $3, shown before you confirm. Crypto trades carry a 0.5% fee." },
      { q: "Can I pay bills with crypto?", a: "Yes. Choose crypto as the funding source on the Bill payments page; the equivalent amount of your chosen asset is sold at the live price to cover the bill." },
    ],
  },
  {
    title: "Loans & investing",
    items: [
      { q: "How are loan rates set?", a: "Each loan product has a fixed APR shown on the Loans page and in the application form. The rate is applied by our servers when you apply." },
      { q: "Why do you ask for the last four digits of my SSN?", a: "It's part of the application flow. We only store the last four digits, never a full Social Security number." },
      { q: "Are investment returns guaranteed?", a: "No. Return ranges are illustrative estimates for each asset class. Values can go down as well as up, and you can close a plan back to cash at any time." },
    ],
  },
  {
    title: "Security",
    items: [
      { q: "How do I turn on two factor authentication?", a: "Go to Settings, open Security, choose Turn on two factor authentication, scan the QR code with an authenticator app and enter the 6 digit code." },
      { q: "What happens after several wrong passwords?", a: "After 5 failed attempts the account is locked for 15 minutes. You can reset your password at any time from the sign in page." },
      { q: "I forgot my password.", a: "Choose Forgot password on the sign in page and enter your email. If an account exists, we'll send a reset link that expires after one hour." },
    ],
  },
];

export default function FaqPage() {
  return (
    <>
      <PageHero eyebrow="Help centre" title="Frequently asked questions" description="Can't find your answer? Signed in customers can message support from the dashboard." />
      <section className="py-20">
        <div className="container-page grid gap-12 lg:grid-cols-[240px_1fr]">
          <nav className="hidden lg:block" aria-label="Help topics">
            <ul className="sticky top-28 space-y-1">
              {SECTIONS.map((s) => (
                <li key={s.title}>
                  <a href={`#${s.title.toLowerCase().replace(/[^a-z]+/g, "-")}`} className="block rounded-lg px-3 py-2 text-sm font-medium text-fg-muted hover:bg-surface hover:text-fg">
                    {s.title}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <div className="space-y-12">
            {SECTIONS.map((s) => (
              <div key={s.title} id={s.title.toLowerCase().replace(/[^a-z]+/g, "-")} className="scroll-mt-28">
                <h2 className="mb-4 text-xl font-semibold">{s.title}</h2>
                <FaqList items={s.items} />
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
