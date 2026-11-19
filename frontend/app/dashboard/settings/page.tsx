"use client";

import { useEffect, useState } from "react";
import { BadgeCheck } from "lucide-react";
import { kycApi } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Field";
import { Alert } from "@/components/ui/Alert";
import { StatusBadge } from "@/components/ui/Badge";
import { PageHeader, Segmented, Skeleton } from "@/components/ui/misc";
import { PasswordCard, ProfileCard, TwoFactorCard } from "@/components/app/AccountCards";

type Tab = "profile" | "security" | "verification";

function VerificationCard() {
  const [kyc, setKyc] = useState<any | null | undefined>(undefined);
  const [docType, setDocType] = useState("passport");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ tone: "success" | "danger"; text: string } | null>(null);

  useEffect(() => {
    kycApi.getKyc().then(setKyc).catch(() => setKyc(null));
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      const res = await kycApi.submitKyc({ documentType: docType });
      setKyc(res);
      setMsg({ tone: "success", text: "Submitted for review. We'll notify you when it's done." });
    } catch (err: any) {
      setMsg({ tone: "danger", text: err.message });
    } finally {
      setBusy(false);
    }
  }

  const status = kyc?.status as string | undefined;
  return (
    <Card>
      <CardHeader
        title="Identity verification"
        description="Verify your identity to complete your profile."
        icon={<BadgeCheck className="size-4" />}
        action={kyc === undefined ? null : <StatusBadge status={status || "not_submitted"} label={status ? undefined : "Not started"} />}
      />
      <div className="space-y-4 p-6">
        {msg && <Alert tone={msg.tone}>{msg.text}</Alert>}
        {kyc === undefined ? (
          <Skeleton className="h-10" />
        ) : status === "approved" ? (
          <Alert tone="success" title="You're verified">
            Approved {formatDate(kyc.reviewedAt)}.
          </Alert>
        ) : status === "pending" ? (
          <Alert tone="info" title="Under review">
            Submitted {formatDate(kyc.submittedAt)}. Most reviews finish within one business day.
          </Alert>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            {status === "rejected" && (
              <Alert tone="warning" title="Your last submission wasn't approved">
                {kyc.reviewerNotes || "Please submit again."}
              </Alert>
            )}
            <Select label="Document type" value={docType} onChange={(e) => setDocType(e.target.value)}>
              <option value="passport">Passport</option>
              <option value="drivers_license">Driver&apos;s licence</option>
              <option value="national_id">National ID card</option>
              <option value="residence_permit">Residence permit</option>
            </Select>
            <p className="text-xs text-fg-subtle">Demo platform: no document images are collected. Submitting starts a simulated review by our team.</p>
            <Button type="submit" loading={busy}>
              Submit for verification
            </Button>
          </form>
        )}
      </div>
    </Card>
  );
}

export default function SettingsPage() {
  const [tab, setTab] = useState<Tab>("profile");
  return (
    <div>
      <PageHeader title="Settings" description="Manage your profile, security and verification." />
      <Segmented
        value={tab}
        onChange={setTab}
        className="mb-6"
        options={[
          { value: "profile", label: "Profile" },
          { value: "security", label: "Security" },
          { value: "verification", label: "Verification" },
        ]}
      />
      <div className="max-w-3xl space-y-6">
        {tab === "profile" && <ProfileCard />}
        {tab === "security" && (
          <>
            <PasswordCard />
            <TwoFactorCard />
          </>
        )}
        {tab === "verification" && <VerificationCard />}
      </div>
    </div>
  );
}
