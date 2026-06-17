import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Intercontinental Crest Terms of Service — the rules and guidelines for using our banking platform.",
};

export default function TermsPage() {
  return (
    <>
      <Header />
      <main>
        <section className="py-24 bg-brand-secondary text-center">
          <div className="container mx-auto px-4">
            <p className="section-label mb-4">Legal</p>
            <h1 className="section-title-white max-w-2xl mx-auto mb-4">Terms of Service</h1>
            <p className="text-gray-400 text-sm">Last updated: January 1, 2025</p>
          </div>
        </section>
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="space-y-8">
              {[
                {
                  title: "1. Acceptance of Terms",
                  content: "By accessing and using the Intercontinental Crest banking platform, you accept and agree to be bound by the terms and provisions of this agreement. Additionally, when using particular services of our platform, you shall be subject to any posted guidelines applicable to such services.",
                },
                {
                  title: "2. Account Registration",
                  content: "To access our services, you must register for an account. You agree to provide accurate, current, and complete information during the registration process and to update such information to keep it accurate, current, and complete. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.",
                },
                {
                  title: "3. Financial Services",
                  content: "Intercontinental Crest provides banking, lending, investment, and related financial services subject to applicable laws and regulations. All financial products and services are subject to eligibility requirements, credit approval, and applicable terms and conditions. Interest rates, fees, and terms are subject to change.",
                },
                {
                  title: "4. Acceptable Use",
                  content: "You agree to use our services only for lawful purposes. You agree not to use the platform for money laundering, fraud, financing of terrorism, or any other illegal activity. We reserve the right to terminate accounts engaged in prohibited activities and to report such activities to relevant authorities.",
                },
                {
                  title: "5. Privacy",
                  content: "Your use of our services is also governed by our Privacy Policy, which is incorporated into these Terms of Service by reference. Please review our Privacy Policy to understand our practices.",
                },
                {
                  title: "6. Fees and Charges",
                  content: "You agree to pay all fees and charges associated with your account and the services you use. Fee schedules are available on our website and may be updated from time to time with notice to you. Continued use of the services after fee changes constitutes acceptance of the new fee schedule.",
                },
                {
                  title: "7. Limitation of Liability",
                  content: "To the maximum extent permitted by law, Intercontinental Crest shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, data, or goodwill, arising from your use of the services.",
                },
                {
                  title: "8. Termination",
                  content: "We may terminate or suspend your account and access to our services at any time, with or without cause, with or without notice. Upon termination, your right to use the services will immediately cease. All provisions which should survive termination shall survive, including ownership provisions, warranty disclaimers, and limitations of liability.",
                },
                {
                  title: "9. Governing Law",
                  content: "These Terms shall be governed by and construed in accordance with the laws of the State of New York, without regard to its conflict of law provisions. Any disputes shall be resolved in the courts of New York County, New York.",
                },
                {
                  title: "10. Contact",
                  content: "For questions about these Terms of Service, please contact us at: legal@intercontinentalcrest.com or Intercontinental Crest, 100 Crest Tower, Financial District, New York, NY 10004.",
                },
              ].map((section) => (
                <div key={section.title}>
                  <h2 className="font-display font-bold text-brand-secondary text-xl mb-3">{section.title}</h2>
                  <p className="text-gray-600 leading-relaxed text-sm">{section.content}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
