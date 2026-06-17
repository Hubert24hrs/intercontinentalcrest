import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Intercontinental Crest Privacy Policy — how we collect, use, and protect your personal information.",
};

export default function PrivacyPage() {
  return (
    <>
      <Header />
      <main>
        <section className="py-24 bg-brand-secondary text-center">
          <div className="container mx-auto px-4">
            <p className="section-label mb-4">Legal</p>
            <h1 className="section-title-white max-w-2xl mx-auto mb-4">Privacy Policy</h1>
            <p className="text-gray-400 text-sm">Last updated: January 1, 2025</p>
          </div>
        </section>
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="prose prose-gray max-w-none space-y-8">
              {[
                {
                  title: "1. Information We Collect",
                  content: "We collect information you provide directly to us, including your name, email address, phone number, date of birth, government-issued identification, financial information, and any other information you choose to provide. We also collect information automatically when you use our services, including log data, device information, location information, and cookies.",
                },
                {
                  title: "2. How We Use Your Information",
                  content: "We use the information we collect to provide, maintain, and improve our financial services, process transactions and send related information, send promotional communications (with your consent), monitor and analyze trends and usage, detect and prevent fraudulent transactions and other illegal activities, and comply with legal obligations.",
                },
                {
                  title: "3. Information Sharing",
                  content: "We do not sell, trade, or rent your personal information to third parties. We may share your information with trusted service providers who assist us in operating our platform, conducting our business, or serving our customers, provided they agree to keep this information confidential. We may also share information when required by law or to protect our rights.",
                },
                {
                  title: "4. Data Security",
                  content: "We implement industry-standard security measures including 256-bit AES encryption, two-factor authentication, real-time fraud monitoring, and regular security audits. We are ISO 27001 certified and PCI DSS Level 1 compliant. However, no method of transmission over the Internet is 100% secure, and we cannot guarantee absolute security.",
                },
                {
                  title: "5. Data Retention",
                  content: "We retain your personal information for as long as necessary to provide our services and comply with our legal obligations, resolve disputes, and enforce our agreements. Financial records are typically retained for 7 years as required by banking regulations.",
                },
                {
                  title: "6. Your Rights",
                  content: "You have the right to access, correct, update, or delete your personal information. You may also have the right to data portability and to object to certain processing activities. To exercise these rights, please contact us at privacy@intercontinentalcrest.com.",
                },
                {
                  title: "7. Cookies",
                  content: "We use cookies and similar tracking technologies to track activity on our platform and hold certain information. You can instruct your browser to refuse all cookies or indicate when a cookie is being sent. However, if you do not accept cookies, some portions of our service may not function properly.",
                },
                {
                  title: "8. Contact Us",
                  content: "If you have questions about this Privacy Policy, please contact us at: Intercontinental Crest, 100 Crest Tower, Financial District, New York, NY 10004. Email: privacy@intercontinentalcrest.com. Phone: +1 (800) 555-CREST.",
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
