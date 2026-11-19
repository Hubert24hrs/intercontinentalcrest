import {
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  Bitcoin,
  Globe2,
  Landmark,
  LineChart,
  Receipt,
  SlidersHorizontal,
} from "lucide-react";
import { TX_TYPE_LABEL, formatDateTime, formatMoney, toNumber } from "@/lib/format";
import { cn } from "@/lib/cn";

export type Tx = {
  id: string;
  transactionReference: string;
  amount: string | number;
  fee?: string | number;
  type: string;
  status: string;
  description?: string | null;
  createdAt: string;
  flow?: "credit" | "debit" | "internal";
  senderAccount?: { accountNumber: string; accountType: string } | null;
  receiverAccount?: { accountNumber: string; accountType: string } | null;
};

/** Icon for a ledger entry, chosen by type and direction. */
export function TxIcon({ tx, className = "size-[18px]" }: { tx: Pick<Tx, "type" | "flow">; className?: string }) {
  switch (tx.type) {
    case "bill_payment":
      return <Receipt className={className} />;
    case "international_transfer":
      return <Globe2 className={className} />;
    case "investment":
      return <LineChart className={className} />;
    case "loan_disbursement":
      return <Landmark className={className} />;
    case "crypto_buy":
    case "crypto_sell":
    case "crypto_deposit":
    case "crypto_withdrawal":
      return <Bitcoin className={className} />;
    case "admin_credit":
    case "admin_debit":
      return <SlidersHorizontal className={className} />;
    default:
      if (tx.flow === "internal") return <ArrowLeftRight className={className} />;
      return tx.flow === "credit" ? <ArrowDownLeft className={className} /> : <ArrowUpRight className={className} />;
  }
}

export function signedAmount(tx: Tx): { text: string; tone: "pos" | "neg" | "neutral" } {
  const amt = toNumber(tx.amount);
  if (tx.flow === "credit") return { text: `+${formatMoney(amt)}`, tone: "pos" };
  if (tx.flow === "internal") return { text: formatMoney(amt), tone: "neutral" };
  return { text: `−${formatMoney(amt + toNumber(tx.fee))}`, tone: "neg" };
}

export function TxRow({ tx, onClick }: { tx: Tx; onClick?: () => void }) {
  const { text, tone } = signedAmount(tx);
  const body = (
    <>
      <span
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-xl",
          tone === "pos" ? "bg-success-50 text-success-600" : tone === "neutral" ? "bg-info-50 text-info-600" : "bg-surface-muted text-fg-muted",
        )}
      >
        <TxIcon tx={tx} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-fg">{tx.description || TX_TYPE_LABEL[tx.type] || "Transaction"}</span>
        <span className="block truncate text-xs text-fg-subtle">
          {TX_TYPE_LABEL[tx.type] || tx.type} · {formatDateTime(tx.createdAt)}
        </span>
      </span>
      <span className={cn("num shrink-0 text-sm font-semibold", tone === "pos" ? "text-success-600" : "text-fg")}>{text}</span>
    </>
  );
  const cls = "flex w-full items-center gap-3.5 px-5 py-3.5 text-left sm:px-6";
  return onClick ? (
    <button type="button" onClick={onClick} className={cn(cls, "transition-colors hover:bg-surface")}>
      {body}
    </button>
  ) : (
    <div className={cls}>{body}</div>
  );
}
