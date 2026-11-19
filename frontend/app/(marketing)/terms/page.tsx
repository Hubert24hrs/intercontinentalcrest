import type { Metadata } from "next";
import { LegalPage } from "@/components/marketing/LegalPage";

export const metadata: Metadata = { title: "Terms of use", description: "The terms that apply when you use the Intercontinental Crest demo platform." };

export default function TermsPage() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Terms of use"
      updated="November 2026"
      intro={<p>These terms apply to your use of the Intercontinental Crest website, customer dashboard and related services (the &quot;Platform&quot;). By creating an account or using the Platform you agree to them.</p>}
      sections={[
        {
          id: "demo",
          title: "A demonstration platform",
          body: (
            <>
              <p>
                <strong className="text-fg">Intercontinental Crest is not a bank</strong> and is not licensed to provide banking, lending,
                investment, money-transmission or cryptocurrency custody services. The Platform demonstrates how such services can work.
              </p>
              <p>
                Accounts, balances, transfers, bill payments, loans, investments, crypto holdings and statements are simulated records. They
                are not deposits, are not insured by the FDIC or any other scheme, and cannot be withdrawn as real money. Do not send real
                funds or real cryptocurrency to anything shown on the Platform.
              </p>
            </>
          ),
        },
        {
          title: "Your account",
          body: (
            <>
              <p>You must provide accurate information, keep your password and authentication codes private, and tell us if you suspect someone else has accessed your account.</p>
              <p>We may suspend or close accounts that are used to abuse the Platform, attempt to access other people&apos;s data, or interfere with its operation.</p>
            </>
          ),
        },
        {
          title: "Market data",
          body: <p>Prices for crypto assets, stocks, indices and commodities come from third party sources or are simulated when those sources are unavailable. They are for illustration only, may be delayed or inaccurate, and are not an offer to buy or sell anything.</p>,
        },
        {
          title: "No advice",
          body: <p>Nothing on the Platform is financial, investment, tax or legal advice. Illustrative return ranges are estimates, not promises.</p>,
        },
        {
          title: "Availability and changes",
          body: <p>We may change, pause or reset the Platform, including demo balances, at any time. We may update these terms; continued use after a change means you accept the updated terms.</p>,
        },
        {
          title: "Liability",
          body: <p>The Platform is provided &quot;as is&quot;. To the extent permitted by law we are not liable for any loss arising from its use, including reliance on simulated balances or market data.</p>,
        },
      ]}
    />
  );
}
