import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ContactSection from "@/components/sections/ContactSection";

export const metadata: Metadata = {
  title: "Contact Us",
  description:
    "Get in touch with Intercontinental Crest. Our support team is available 24/7 via live chat, phone, and email.",
};

export default function ContactPage() {
  return (
    <>
      <Header />
      <main>
        <section className="py-24 bg-brand-secondary text-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-96 h-96 rounded-full bg-brand-primary blur-3xl" />
          </div>
          <div className="relative container mx-auto px-4">
            <p className="section-label mb-4">Contact Us</p>
            <h1 className="section-title-white max-w-3xl mx-auto mb-6">
              We&apos;re Here to{" "}
              <span style={{ color: "#00B7F1" }}>Help You</span>
            </h1>
            <p className="text-gray-400 max-w-2xl mx-auto leading-relaxed">
              Reach out to our team of financial experts. We respond within 24
              hours, or you can chat with us live right now.
            </p>
          </div>
        </section>
        <ContactSection />
      </main>
      <Footer />
    </>
  );
}
