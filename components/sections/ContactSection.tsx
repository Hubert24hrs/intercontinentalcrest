"use client";

import { useState } from "react";
import { Mail, Phone, MapPin, Send, CheckCircle } from "lucide-react";

export default function ContactSection() {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate form submission
    setTimeout(() => setSubmitted(true), 500);
  };

  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-14">
          <p className="section-label mb-3">Contact Us</p>
          <h2 className="section-title max-w-2xl mx-auto mb-4">
            We&apos;d Love to{" "}
            <span className="text-brand-primary">Hear From You</span>
          </h2>
          <p className="text-gray-500 text-sm max-w-lg mx-auto">
            Our support team is available 24/7 to answer your questions and help
            you get the most from your banking experience.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact form */}
          <div className="bg-gray-50 rounded-3xl p-8">
            {submitted ? (
              <div className="flex flex-col items-center justify-center h-full gap-4 py-12 text-center">
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="font-display font-bold text-brand-secondary text-xl">
                  Message Sent!
                </h3>
                <p className="text-gray-500 text-sm max-w-xs">
                  Thank you for reaching out. Our team will get back to you
                  within 24 hours.
                </p>
                <button
                  onClick={() => {
                    setSubmitted(false);
                    setForm({ name: "", email: "", subject: "", message: "" });
                  }}
                  className="btn-outline text-sm"
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-2" htmlFor="contact-name">
                      Full Name
                    </label>
                    <input
                      id="contact-name"
                      type="text"
                      className="form-input"
                      placeholder="John Doe"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-2" htmlFor="contact-email">
                      Email Address
                    </label>
                    <input
                      id="contact-email"
                      type="email"
                      className="form-input"
                      placeholder="john@example.com"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-2" htmlFor="contact-subject">
                    Subject
                  </label>
                  <input
                    id="contact-subject"
                    type="text"
                    className="form-input"
                    placeholder="How can we help you?"
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-2" htmlFor="contact-message">
                    Message
                  </label>
                  <textarea
                    id="contact-message"
                    rows={5}
                    className="form-input resize-none"
                    placeholder="Tell us how we can assist you..."
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    required
                  />
                </div>
                <button type="submit" className="btn-primary w-full justify-center">
                  Send Message
                  <Send className="w-4 h-4" />
                </button>
              </form>
            )}
          </div>

          {/* Contact info */}
          <div className="space-y-8">
            <div>
              <h3 className="font-display font-bold text-brand-secondary text-xl mb-6">
                Contact Information
              </h3>
              <div className="space-y-5">
                {[
                  {
                    icon: Mail,
                    label: "Email",
                    value: "support@intercontinentalcrest.com",
                    href: "mailto:support@intercontinentalcrest.com",
                  },
                  {
                    icon: Phone,
                    label: "Phone",
                    value: "+1 (800) 555-CREST",
                    href: "tel:+18005550000",
                  },
                  {
                    icon: MapPin,
                    label: "Address",
                    value: "100 Crest Tower, Financial District, New York, NY 10004",
                    href: "#",
                  },
                ].map(({ icon: Icon, label, value, href }) => (
                  <a
                    key={label}
                    href={href}
                    className="flex items-start gap-4 group"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-brand-primary/10 group-hover:bg-brand-primary flex items-center justify-center flex-shrink-0 transition-colors duration-300">
                      <Icon className="w-5 h-5 text-brand-primary group-hover:text-white transition-colors duration-300" />
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 font-medium mb-0.5">
                        {label}
                      </div>
                      <div className="text-brand-secondary font-medium text-sm">
                        {value}
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            </div>

            {/* Office hours */}
            <div className="bg-brand-secondary rounded-2xl p-6 text-white">
              <h4 className="font-display font-bold text-base mb-4">
                Office Hours
              </h4>
              <div className="space-y-2">
                {[
                  ["Monday - Friday", "8:00 AM - 10:00 PM EST"],
                  ["Saturday", "9:00 AM - 6:00 PM EST"],
                  ["Sunday", "10:00 AM - 4:00 PM EST"],
                  ["Online Support", "24/7 Available"],
                ].map(([day, hours]) => (
                  <div key={day} className="flex justify-between text-sm">
                    <span className="text-gray-400">{day}</span>
                    <span className="text-brand-primary font-medium">{hours}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
