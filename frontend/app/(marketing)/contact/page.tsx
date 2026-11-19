import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, Mail, MessagesSquare } from "lucide-react";
import { PageHero } from "@/components/marketing/PageHero";
import { ButtonLink } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "Contact",
  description: "Contact Intercontinental Crest. Customers can use support chat in the app. For anything else, email us.",
};

export default function ContactPage() {
  return (
    <>
      <PageHero eyebrow="Contact" title="Contact us" description="Choose the option that fits what you need." />

      <section className="py-20">
        <div className="container-page grid gap-6 lg:grid-cols-3">
          <div className="card flex flex-col p-7">
            <MessagesSquare className="size-7 text-brand-600" />
            <h2 className="mt-5 text-lg font-semibold">Customers: support chat</h2>
            <p className="mt-2 flex-1 text-[15px] leading-relaxed text-fg-muted">
              Sign in and open <span className="font-medium text-fg">Support</span> from the dashboard menu. Your conversation is saved in your
              account, so you never have to repeat yourself.
            </p>
            <ButtonLink href="/login?next=/dashboard/support" className="mt-6 self-start">
              Sign in to chat <ArrowRight className="size-4" />
            </ButtonLink>
          </div>

          <div className="card flex flex-col p-7">
            <BookOpen className="size-7 text-brand-600" />
            <h2 className="mt-5 text-lg font-semibold">Help centre</h2>
            <p className="mt-2 flex-1 text-[15px] leading-relaxed text-fg-muted">
              Answers about accounts, transfers, loans, investing, crypto and security. Often quicker than waiting for a reply.
            </p>
            <ButtonLink href="/faq" variant="secondary" className="mt-6 self-start">
              Browse answers
            </ButtonLink>
          </div>

          <div className="card flex flex-col p-7">
            <Mail className="size-7 text-brand-600" />
            <h2 className="mt-5 text-lg font-semibold">Everything else</h2>
            <p className="mt-2 flex-1 text-[15px] leading-relaxed text-fg-muted">
              Questions about the platform, partnerships or press? Email the team and we&apos;ll get back to you.
            </p>
            <a href="mailto:support@intercontinentalcrest.com" className="btn btn-secondary mt-6 self-start">
              support@intercontinentalcrest.com
            </a>
          </div>
        </div>

        <div className="container-page mt-10">
          <p className="text-sm text-fg-subtle">
            Never share your password or authentication codes with anyone. Our team will never ask for them. See{" "}
            <Link href="/about#security" className="font-medium text-brand-700 hover:underline">
              how we protect accounts
            </Link>
            .
          </p>
        </div>
      </section>
    </>
  );
}
