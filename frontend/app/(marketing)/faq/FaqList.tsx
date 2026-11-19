"use client";

import * as Accordion from "@radix-ui/react-accordion";
import { ChevronDown } from "lucide-react";

export type Faq = { q: string; a: string };

export function FaqList({ items }: { items: Faq[] }) {
  return (
    <Accordion.Root type="multiple" className="divide-y divide-line rounded-2xl border border-line bg-white">
      {items.map((f, i) => (
        <Accordion.Item key={f.q} value={`item-${i}`}>
          <Accordion.Header>
            <Accordion.Trigger className="group flex w-full items-center justify-between gap-6 px-6 py-5 text-left text-[16px] font-medium text-fg hover:text-ink-700">
              {f.q}
              <ChevronDown className="size-5 shrink-0 text-fg-subtle transition-transform duration-200 group-data-[state=open]:rotate-180" />
            </Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Content className="overflow-hidden px-6 pb-5 text-[15px] leading-relaxed text-fg-muted">{f.a}</Accordion.Content>
        </Accordion.Item>
      ))}
    </Accordion.Root>
  );
}
