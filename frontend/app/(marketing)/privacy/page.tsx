import type { Metadata } from "next";
import { LegalPage } from "@/components/marketing/LegalPage";

export const metadata: Metadata = { title: "Privacy policy", description: "What information Intercontinental Crest collects and how it is used and protected." };

export default function PrivacyPage() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Privacy policy"
      updated="November 2026"
      intro={<p>This policy explains what we collect when you use Intercontinental Crest, why, and the choices you have. We collect as little as possible and never sell personal information.</p>}
      sections={[
        {
          title: "Information we collect",
          body: (
            <ul className="list-disc space-y-2 pl-5">
              <li>Account details you provide: name, email address and, optionally, a phone number.</li>
              <li>Activity on the Platform: simulated transfers, payments, loan applications, investments, crypto orders and support messages.</li>
              <li>For loan applications, only the last four digits of a Social Security number, never the full number.</li>
              <li>Security data such as sign in times, failed sign in attempts and IP addresses for admin actions.</li>
            </ul>
          ),
        },
        {
          title: "How we use it",
          body: <p>To run your account, show your activity and statements, send service emails (for example password resets and account notifications), keep the Platform secure, and investigate misuse.</p>,
        },
        {
          title: "Security",
          body: <p>Passwords are hashed with bcrypt, sessions use httpOnly cookies, password reset links work only once and expire after an hour, and access to administrative tools is restricted by role and recorded in an audit log.</p>,
        },
        {
          title: "Sharing",
          body: <p>We use service providers to host the Platform and send email. They process data only on our instructions. We don&apos;t sell or rent personal information.</p>,
        },
        {
          title: "Your choices",
          body: <p>You can update your name and phone number in Settings, and ask support to close your account. Closing an account deletes its profile and simulated records, except where we need to keep audit entries.</p>,
        },
        {
          title: "Contact",
          body: (
            <p>
              Questions about privacy? Email <a className="font-medium text-brand-700 hover:underline" href="mailto:support@intercontinentalcrest.com">support@intercontinentalcrest.com</a>.
            </p>
          ),
        },
      ]}
    />
  );
}
