/**
 * Browser end-to-end test for the Intercontinental Crest web app.
 *
 *   # API on :4000 and web app running (next dev or next start)
 *   cd frontend
 *   BASE=http://localhost:3000 node --env-file=../backend/.env e2e/app.e2e.mjs
 *
 * Needs ADMIN_EMAIL / ADMIN_PASSWORD for the super admin (read from backend/.env above).
 * Creates a throwaway customer each run. Do not point it at production.
 */
import { chromium } from "@playwright/test";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const requireFromBackend = createRequire(path.resolve(here, "../../backend/package.json"));
const { authenticator } = requireFromBackend("otplib");

const BASE = (process.env.BASE || "http://localhost:3000").replace(/\/$/, "");
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || "").trim();
const ADMIN_PASSWORD = (process.env.ADMIN_PASSWORD || "").trim();
const HEADLESS = process.env.HEADED ? false : true;

const results = [];
const stamp = Date.now().toString(36);
const customer = { first: "Emily", last: `Tester${stamp}`, email: `e2e.ui.${stamp}@example.com`, password: `Ui-Passw0rd-${stamp}` };

async function step(name, fn) {
  const t0 = Date.now();
  try {
    await fn();
    results.push({ name, ok: true, ms: Date.now() - t0 });
    console.log(`  ✓ ${name} (${Date.now() - t0}ms)`);
  } catch (err) {
    results.push({ name, ok: false, ms: Date.now() - t0, err: String(err?.message || err).split("\n")[0].slice(0, 300) });
    console.log(`  ✗ ${name}\n      ${String(err?.message || err).split("\n")[0].slice(0, 300)}`);
  }
}

function expect(cond, msg) {
  if (!cond) throw new Error(msg);
}

/** Collect console errors + failed same-origin requests for a page. */
function watch(page) {
  const problems = [];
  page.on("console", (m) => {
    if (m.type() !== "error") return;
    const t = m.text();
    if (/favicon|Download the React DevTools|ERR_INTERNET_DISCONNECTED/i.test(t)) return;
    if (/status of 401/.test(t)) return; // expected while probing the session
    problems.push(t.slice(0, 200));
  });
  page.on("pageerror", (e) => problems.push(`pageerror: ${e.message.slice(0, 200)}`));
  return problems;
}

async function signIn(page, email, password) {
  await page.goto(`${BASE}/login`);
  await page.getByLabel("Email address").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
}

async function main() {
  console.log(`Web app under test: ${BASE}\n`);
  // PW_CHROMIUM_PATH lets you reuse an already-installed Chromium instead of `npx playwright install`.
  const browser = await chromium.launch({ headless: HEADLESS, executablePath: process.env.PW_CHROMIUM_PATH || undefined });
  const ctx = await browser.newContext({ viewport: { width: 1360, height: 900 }, acceptDownloads: true });
  const page = await ctx.newPage();
  const problems = watch(page);

  // ── Public site ────────────────────────────────────────────────────────────
  console.log("Public site");
  for (const [route, heading] of [
    ["/", /Checking, savings, loans and investing/i],
    ["/services", /What you get with an account/i],
    ["/loans", /fixed rates and fixed payments/i],
    ["/investments", /Invest in funds, bonds/i],
    ["/about", /About Intercontinental Crest/i],
    ["/contact", /Contact us/i],
    ["/faq", /Frequently asked questions/i],
    ["/privacy", /Privacy policy/i],
    ["/terms", /Terms of use/i],
  ]) {
    await step(`${route} renders with footer disclaimer`, async () => {
      const res = await page.goto(`${BASE}${route}`, { waitUntil: "domcontentloaded" });
      expect(res?.ok(), `HTTP ${res?.status()}`);
      await page.getByRole("heading", { level: 1 }).filter({ hasText: heading }).waitFor({ timeout: 20000 });
      expect(await page.getByText(/is a demonstration platform, not a bank/).count(), "footer disclaimer missing");
      expect(!(await page.content()).includes("FDIC Insured<"), "unqualified FDIC claim present");
    });
  }

  await step("loan calculator updates the payment", async () => {
    await page.goto(`${BASE}/loans`);
    const payment = page.locator("p.num.text-5xl");
    const before = await payment.innerText();
    await page.locator("#calc-amount").fill("100000");
    await page.waitForTimeout(150);
    const after = await payment.innerText();
    expect(before !== after && after.startsWith("$"), `payment did not change (${before} → ${after})`);
  });

  await step("public crypto prices load without signing in", async () => {
    await page.goto(`${BASE}/investments`);
    await page.getByRole("cell", { name: /Bitcoin/ }).first().waitFor({ timeout: 20000 });
    expect(page.url().includes("/investments"), "redirected away from public page");
  });

  await step("FAQ accordion opens", async () => {
    await page.goto(`${BASE}/faq`);
    await page.getByRole("button", { name: "Is Intercontinental Crest a real bank?" }).click();
    await page.getByText(/It's a demonstration platform/).waitFor();
  });

  await step("protected pages redirect to sign-in", async () => {
    await page.goto(`${BASE}/dashboard/transfer`);
    await page.waitForURL(/\/login\?next=/, { timeout: 20000 });
  });

  // ── Registration ───────────────────────────────────────────────────────────
  console.log("\nCustomer journey");
  await step("register a new account", async () => {
    await page.goto(`${BASE}/register`);
    await page.getByLabel("First name").fill(customer.first);
    await page.getByLabel("Last name").fill(customer.last);
    await page.getByLabel("Email address").fill(customer.email);
    await page.getByLabel("Password", { exact: true }).fill(customer.password);
    await page.getByLabel("Confirm password").fill(customer.password);
    await page.getByRole("checkbox").check();
    await page.getByRole("button", { name: "Create account" }).click();
    await page.waitForURL(/\/dashboard/, { timeout: 30000 });
    await page.getByRole("heading", { name: new RegExp(`${customer.first}`) }).waitFor({ timeout: 20000 });
    await page.getByText("Get started").waitFor();
  });

  await step("wallet: simulated BTC deposit", async () => {
    await page.goto(`${BASE}/dashboard/wallets`);
    await page.getByText(/Simulated custody/).waitFor({ timeout: 20000 });
    const ref = await page.locator("code").first().innerText();
    expect(ref.startsWith("DEMO-"), `unexpected deposit reference ${ref}`);
    await page.getByLabel(/Amount \(BTC\)/).fill("0.05");
    await page.getByRole("button", { name: /Credit BTC/ }).click();
    await page.getByText(/credited \(simulated deposit\)/).waitFor({ timeout: 20000 });
  });

  await step("crypto: sell BTC into checking", async () => {
    await page.goto(`${BASE}/dashboard/crypto`);
    await page.getByRole("tab", { name: /Sell BTC/ }).waitFor({ timeout: 20000 });
    await page.getByRole("tab", { name: /Sell BTC/ }).click();
    await page.getByLabel(/Quantity \(BTC\)/).fill("0.04");
    await page.getByRole("button", { name: /^Sell BTC/ }).click();
    await page.getByText(/^Sold 0\.04 BTC/).waitFor({ timeout: 20000 });
  });

  await step("crypto: buy ETH with cash", async () => {
    await page.getByRole("row", { name: /Ethereum/ }).first().click();
    await page.getByRole("tab", { name: /Buy ETH/ }).click();
    await page.getByLabel("Amount (USD)").fill("150");
    await page.getByRole("button", { name: /^Buy ETH/ }).click();
    await page.getByText(/^Bought .* ETH/).waitFor({ timeout: 20000 });
  });

  await step("transfer between own accounts (review → confirm → receipt)", async () => {
    await page.goto(`${BASE}/dashboard/transfer`);
    await page.getByRole("tab", { name: "My accounts" }).click();
    await page.getByLabel("Amount").fill("500");
    await page.getByRole("button", { name: "Continue" }).click();
    await page.getByText("Review your transfer").waitFor();
    await page.getByRole("button", { name: /Confirm and send/ }).click();
    await page.getByText("Money sent").waitFor({ timeout: 20000 });
  });

  await step("transfer validation blocks overdrafts", async () => {
    await page.getByRole("button", { name: "Make another transfer" }).click();
    await page.getByLabel("Amount").fill("99999999");
    await page.getByText(/available/i).first().waitFor();
    expect(await page.getByRole("button", { name: "Continue" }).isDisabled(), "Continue should be disabled");
  });

  await step("pay a bill from cash", async () => {
    await page.goto(`${BASE}/dashboard/bills`);
    await page.getByRole("button", { name: "Internet" }).click();
    await page.getByLabel("Account / reference number").fill("ACC-778899");
    await page.getByLabel("Amount").fill("45.90");
    await page.getByRole("button", { name: /Pay \$45\.90/ }).click();
    await page.getByText("Bill paid").waitFor({ timeout: 20000 });
  });

  await step("transactions: list, search and detail", async () => {
    await page.goto(`${BASE}/dashboard/transactions`);
    await page.getByText(/Internet/).first().waitFor({ timeout: 20000 });
    await page.getByLabel("Search transactions").fill("Internet");
    await page.getByRole("button", { name: /Internet/ }).first().click();
    await page.getByRole("dialog", { name: "Transaction details" }).waitFor();
    await page.keyboard.press("Escape");
  });

  await step("statements: monthly list and PDF download", async () => {
    await page.goto(`${BASE}/dashboard/statements`);
    const pdfButton = page.getByRole("button", { name: "PDF" }).first();
    await pdfButton.waitFor({ timeout: 20000 });
    const [download] = await Promise.all([page.waitForEvent("download", { timeout: 30000 }), pdfButton.click()]);
    expect(/\.pdf$/.test(download.suggestedFilename()), `unexpected file ${download.suggestedFilename()}`);
  });

  await step("loans: apply with SSN last four", async () => {
    await page.goto(`${BASE}/dashboard/loans`);
    await page.getByLabel("Amount").fill("2500");
    await page.getByLabel("Last 4 digits of your SSN").fill("4321");
    await page.getByRole("button", { name: "Submit application" }).click();
    await page.getByText(/Application submitted/).waitFor({ timeout: 20000 });
    await page.getByText("In review").first().waitFor();
  });

  await step("investments: invest then close a position", async () => {
    await page.goto(`${BASE}/dashboard/investments`);
    const card = page.locator("div.card").filter({ hasText: "Cash Reserve Fund" });
    await card.getByRole("button", { name: "Invest" }).click();
    await page.getByRole("dialog").getByLabel("Amount").fill("100");
    await page.getByRole("dialog").getByRole("button", { name: /^Invest \$100/ }).click();
    await page.getByText(/You invested \$100\.00 in Cash Reserve Fund/).waitFor({ timeout: 20000 });
    page.once("dialog", (d) => d.accept());
    await page.getByRole("button", { name: "Close" }).first().click();
    await page.getByText(/was closed and the proceeds were paid/).waitFor({ timeout: 20000 });
  });

  await step("support: send a message", async () => {
    await page.goto(`${BASE}/dashboard/support`);
    await page.getByLabel("Message", { exact: true }).fill("Hello from the end-to-end test");
    await page.getByRole("button", { name: "Send message" }).click();
    await page.getByText("Hello from the end-to-end test").waitFor({ timeout: 20000 });
  });

  await step("settings: update profile and verification", async () => {
    await page.goto(`${BASE}/dashboard/settings`);
    await page.getByLabel("Full name").fill(`${customer.first} ${customer.last} Jr`);
    await page.getByRole("button", { name: "Save changes" }).click();
    await page.getByText("Profile updated.").waitFor({ timeout: 20000 });
    await page.getByRole("tab", { name: "Verification" }).click();
    await page.getByRole("button", { name: "Submit for verification" }).click();
    await page.getByText(/Submitted for review/).waitFor({ timeout: 20000 });
  });

  let totpSecret = "";
  await step("settings: enable two-factor authentication", async () => {
    await page.getByRole("tab", { name: "Security" }).click();
    await page.getByRole("button", { name: "Turn on two factor authentication" }).click();
    totpSecret = (await page.locator("code").first().innerText()).trim();
    await page.getByLabel("6 digit code").fill(authenticator.generate(totpSecret));
    await page.getByRole("button", { name: "Verify and turn on" }).click();
    await page.getByText(/Two factor authentication is on/).waitFor({ timeout: 20000 });
  });

  await step("sign out and back in with 2FA", async () => {
    await page.getByRole("button", { name: "Account menu" }).click();
    await page.getByRole("menuitem", { name: "Sign out" }).click();
    await page.waitForURL(/\/login/, { timeout: 20000 });
    await signIn(page, customer.email, customer.password);
    await page.getByText("Two factor verification").waitFor({ timeout: 20000 });
    await page.getByLabel("Authentication code").fill(authenticator.generate(totpSecret));
    await page.getByRole("button", { name: "Verify and sign in" }).click();
    await page.waitForURL(/\/dashboard/, { timeout: 20000 });
  });

  await step("customer cannot open the admin console", async () => {
    await page.goto(`${BASE}/admin`);
    await page.waitForURL(/\/dashboard/, { timeout: 20000 });
  });

  await step("mobile layout: bottom navigation and drawer", async () => {
    const m = await ctx.newPage();
    await m.setViewportSize({ width: 390, height: 844 });
    await m.goto(`${BASE}/dashboard`);
    await m.getByRole("navigation", { name: "Quick" }).waitFor({ timeout: 20000 });
    await m.getByRole("button", { name: "More" }).click();
    await m.getByRole("dialog", { name: "Menu" }).getByRole("link", { name: "Statements" }).click();
    await m.waitForURL(/\/dashboard\/statements/);
    const overflow = await m.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
    expect(!overflow, "page scrolls horizontally on mobile");
    await m.close();
  });

  await step("sign out", async () => {
    await page.getByRole("button", { name: "Account menu" }).click();
    await page.getByRole("menuitem", { name: "Sign out" }).click();
    await page.waitForURL(/\/login/, { timeout: 20000 });
  });

  // ── Admin console ──────────────────────────────────────────────────────────
  console.log("\nAdmin console");
  await step("admin signs in and lands on the console", async () => {
    expect(ADMIN_EMAIL && ADMIN_PASSWORD, "ADMIN_EMAIL / ADMIN_PASSWORD not set");
    await signIn(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    await page.waitForURL(/\/admin$/, { timeout: 30000 });
    await page.getByText("Loan applications").waitFor({ timeout: 20000 });
  });

  await step("approve the customer's loan", async () => {
    await page.goto(`${BASE}/admin/loans`);
    const row = page.getByRole("row", { name: new RegExp(customer.last) }).first();
    await row.waitFor({ timeout: 20000 });
    page.once("dialog", (d) => d.accept());
    await row.getByRole("button", { name: "Approve" }).click();
    await page.getByText("Loan approved.").waitFor({ timeout: 20000 });
  });

  await step("customer search, detail and balance adjustment", async () => {
    await page.goto(`${BASE}/admin/customers`);
    await page.getByLabel("Search customers").fill(customer.email);
    await page.getByRole("row", { name: new RegExp(customer.last) }).first().click();
    const dialog = page.getByRole("dialog");
    await dialog.getByText("Balance adjustment").waitFor({ timeout: 20000 });
    await dialog.getByLabel("Amount").fill("250");
    await dialog.getByLabel("Reason").fill("E2E goodwill credit");
    await dialog.getByRole("button", { name: "Apply adjustment" }).click();
    await dialog.getByText(/Credited \$250\.00/).waitFor({ timeout: 20000 });
    await page.keyboard.press("Escape");
  });

  await step("approve identity verification", async () => {
    await page.goto(`${BASE}/admin/kyc`);
    const row = page.getByRole("row", { name: new RegExp(customer.last) }).first();
    await row.getByRole("button", { name: "Review" }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Approve" }).click();
    await page.getByRole("dialog").waitFor({ state: "detached", timeout: 20000 });
  });

  await step("reply in the support inbox", async () => {
    await page.goto(`${BASE}/admin/support`);
    await page.getByRole("button", { name: new RegExp(customer.last) }).first().click();
    await page.getByText("Hello from the end-to-end test").last().waitFor({ timeout: 20000 });
    await page.getByLabel("Reply", { exact: true }).fill("Thanks, we're on it!");
    await page.getByRole("button", { name: "Send reply" }).click();
    await page.locator("p", { hasText: "Thanks, we're on it!" }).last().waitFor({ timeout: 20000 });
  });

  for (const [route, text] of [
    ["/admin/transactions", /ledger entries/],
    ["/admin/investments", /Investments & crypto/],
    ["/admin/audit", /APPROVE_LOAN|Approve loan/i],
    ["/admin/roles", /Administrators/],
    ["/admin/settings", /Platform status/],
  ]) {
    await step(`${route} loads`, async () => {
      await page.goto(`${BASE}${route}`);
      await page.getByText(text).first().waitFor({ timeout: 20000 });
    });
  }

  await step("admin signs out", async () => {
    await page.getByRole("button", { name: "Account menu" }).click();
    await page.getByRole("menuitem", { name: "Sign out" }).click();
    await page.waitForURL(/\/login/, { timeout: 20000 });
  });

  // ── Customer sees the outcomes ─────────────────────────────────────────────
  console.log("\nCustomer follow-up");
  await step("customer sees loan approval, credit and support reply", async () => {
    await signIn(page, customer.email, customer.password);
    await page.getByText("Two factor verification").waitFor({ timeout: 20000 });
    await page.getByLabel("Authentication code").fill(authenticator.generate(totpSecret));
    await page.getByRole("button", { name: "Verify and sign in" }).click();
    await page.waitForURL(/\/dashboard/, { timeout: 20000 });
    await page.goto(`${BASE}/dashboard/loans`);
    await page.getByRole("cell", { name: "Approved" }).or(page.getByText("Approved")).first().waitFor({ timeout: 20000 });
    await page.getByRole("button", { name: /Notifications/ }).click();
    await page.getByText("Loan approved").first().waitFor({ timeout: 20000 });
    await page.keyboard.press("Escape");
    await page.goto(`${BASE}/dashboard/support`);
    await page.getByText("Thanks, we're on it!").first().waitFor({ timeout: 20000 });
  });

  await step("no unexpected browser console errors", async () => {
    expect(problems.length === 0, `${problems.length} error(s): ${problems.slice(0, 3).join(" | ")}`);
  });

  await browser.close();

  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length} passed, ${failed.length} failed`);
  if (failed.length) {
    console.log("\nFailures:\n" + failed.map((f) => ` - ${f.name}: ${f.err}`).join("\n"));
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
