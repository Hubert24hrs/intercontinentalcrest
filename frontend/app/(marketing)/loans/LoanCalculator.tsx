"use client";

import { useMemo, useState } from "react";
import { ArrowRight } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { Select } from "@/components/ui/Field";
import { LOAN_MAX, LOAN_MIN, LOAN_PRODUCTS, LOAN_TERMS, loanProduct, monthlyPayment } from "@/lib/products";
import { formatMoney } from "@/lib/format";

export default function LoanCalculator() {
  const [type, setType] = useState<string>("personal");
  const [amount, setAmount] = useState(25_000);
  const [term, setTerm] = useState(36);
  const product = loanProduct(type);

  const { monthly, total, interest } = useMemo(() => {
    const m = monthlyPayment(amount, product.rate, term);
    return { monthly: m, total: m * term, interest: m * term - amount };
  }, [amount, term, product.rate]);

  return (
    <div className="card grid overflow-hidden lg:grid-cols-[1.2fr_1fr]">
      <div className="space-y-7 p-6 sm:p-8">
        <Select label="Loan type" value={type} onChange={(e) => setType(e.target.value)}>
          {LOAN_PRODUCTS.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label} · {p.rate.toFixed(2)}% APR
            </option>
          ))}
        </Select>

        <div>
          <div className="flex items-baseline justify-between">
            <label htmlFor="calc-amount" className="label mb-0">
              Amount
            </label>
            <span className="num text-lg font-semibold">{formatMoney(amount)}</span>
          </div>
          <input
            id="calc-amount"
            type="range"
            min={LOAN_MIN}
            max={250_000}
            step={500}
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            className="mt-3 w-full accent-brand-600"
          />
          <div className="mt-1 flex justify-between text-xs text-fg-faint">
            <span>{formatMoney(LOAN_MIN)}</span>
            <span>{formatMoney(250_000)}+</span>
          </div>
        </div>

        <div>
          <div className="flex items-baseline justify-between">
            <label htmlFor="calc-term" className="label mb-0">
              Term
            </label>
            <span className="num text-lg font-semibold">{term} months</span>
          </div>
          <input
            id="calc-term"
            type="range"
            min={0}
            max={LOAN_TERMS.length - 1}
            step={1}
            value={LOAN_TERMS.indexOf(term)}
            onChange={(e) => setTerm(LOAN_TERMS[Number(e.target.value)])}
            className="mt-3 w-full accent-brand-600"
          />
          <div className="mt-1 flex justify-between text-xs text-fg-faint">
            {LOAN_TERMS.map((t) => (
              <span key={t}>{t}</span>
            ))}
          </div>
        </div>
        <p className="text-xs text-fg-subtle">Applications up to {formatMoney(LOAN_MAX)}. Estimates use the product&apos;s APR and exclude any fees.</p>
      </div>

      <div className="panel-dark flex flex-col justify-between rounded-none p-6 sm:p-8">
        <div>
          <p className="text-sm text-white/60">Estimated monthly payment</p>
          <p className="num mt-2 text-5xl font-semibold tracking-tight">{formatMoney(monthly)}</p>
          <dl className="mt-8 space-y-3 text-sm">
            <div className="flex justify-between border-b border-white/10 pb-3">
              <dt className="text-white/60">APR</dt>
              <dd className="num font-medium">{product.rate.toFixed(2)}%</dd>
            </div>
            <div className="flex justify-between border-b border-white/10 pb-3">
              <dt className="text-white/60">Total interest</dt>
              <dd className="num font-medium">{formatMoney(interest)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-white/60">Total repayment</dt>
              <dd className="num font-medium">{formatMoney(total)}</dd>
            </div>
          </dl>
        </div>
        <ButtonLink href="/register" variant="on-dark" size="lg" className="mt-8">
          Apply in the app <ArrowRight className="size-4" />
        </ButtonLink>
      </div>
    </div>
  );
}
