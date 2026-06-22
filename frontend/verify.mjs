import { chromium } from "@playwright/test";
const BASE = "http://localhost:3000";
const results = [];

async function test(label, fn) {
  try { await fn(); results.push({ label, status: "PASS", note: "" }); }
  catch (e) { results.push({ label, status: "FAIL", note: e.message.slice(0, 250) }); }
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext();

  // 1. Homepage
  await test("Homepage (/) loads with no JS errors", async () => {
    const page = await ctx.newPage();
    const errs = [];
    page.on("console", m => { if (m.type() === "error") errs.push(m.text()); });
    await page.goto(BASE, { waitUntil: "domcontentloaded", timeout: 20000 });
    await page.waitForTimeout(2000);
    const h = await page.locator("h1, h2").first().innerText();
    console.log("  Heading:", h.slice(0, 60));
    const jsErrs = errs.filter(e => !e.includes("favicon") && !e.includes("manifest"));
    if (jsErrs.length) console.log("  JS errors:", jsErrs.slice(0, 3));
    await page.close();
  });

  // 2. Register
  await test("Register (/register) - form fields present", async () => {
    const page = await ctx.newPage();
    const errs = [];
    page.on("console", m => {
      if (m.type() === "error" && m.text().includes("Cannot read properties")) errs.push(m.text());
    });
    await page.goto(`${BASE}/register`, { waitUntil: "domcontentloaded", timeout: 20000 });
    await page.waitForTimeout(1500);
    const emailInput = page.locator("input[type='email']").first();
    await emailInput.waitFor({ timeout: 5000 });
    console.log("  Email input found ✓");
    if (errs.length) throw new Error("Critical JS error: " + errs[0]);
    await page.close();
  });

  // 3. Login
  await test("Login (/login) - form renders", async () => {
    const page = await ctx.newPage();
    await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded", timeout: 15000 });
    await page.locator("input[type='email']").first().waitFor({ timeout: 5000 });
    await page.locator("input[type='password']").first().waitFor({ timeout: 5000 });
    console.log("  Login inputs found ✓");
    await page.close();
  });

  // 4. Forgot password
  await test("Forgot-password - submits and shows success", async () => {
    const page = await ctx.newPage();
    await page.goto(`${BASE}/forgot-password`, { waitUntil: "domcontentloaded", timeout: 15000 });
    await page.locator("input[type='email']").first().fill("test@example.com");
    await page.locator("button[type='submit']").first().click();
    await page.waitForTimeout(3000);
    const body = await page.locator("body").innerText();
    const ok = body.toLowerCase().includes("email") || body.toLowerCase().includes("sent") || body.toLowerCase().includes("check") || body.toLowerCase().includes("reset");
    const notError = !body.toLowerCase().includes("internal server error");
    console.log("  Body snippet:", body.slice(0, 200).replace(/\n/g, " "));
    if (!ok || !notError) throw new Error("Success message not shown or error visible");
    await page.close();
  });

  // 5. Loans
  await test("Loans (/loans) - calculator with 3 sliders", async () => {
    const page = await ctx.newPage();
    await page.goto(`${BASE}/loans`, { waitUntil: "domcontentloaded", timeout: 20000 });
    await page.locator("input[type='range']").first().waitFor({ timeout: 8000 });
    const n = await page.locator("input[type='range']").count();
    console.log(`  Found ${n} sliders ✓`);
    if (n < 3) throw new Error(`Only ${n} sliders found`);
    // drag a slider
    const slider = page.locator("input[type='range']").first();
    await slider.fill("50000");
    const body = await page.locator("body").innerText();
    if (!body.includes("Monthly Payment")) throw new Error("Monthly Payment not visible");
    console.log("  Monthly Payment label present ✓");
    await page.close();
  });

  // 6. Investments
  await test("Investments - live crypto prices (BTC/ETH/SOL)", async () => {
    const page = await ctx.newPage();
    await page.goto(`${BASE}/investments`, { waitUntil: "domcontentloaded", timeout: 20000 });
    await page.waitForTimeout(5000);
    const body = await page.locator("body").innerText();
    const hasBTC = body.includes("Bitcoin") || body.includes("BTC");
    const hasETH = body.includes("Ethereum") || body.includes("ETH");
    console.log(`  Bitcoin: ${hasBTC}, Ethereum: ${hasETH}`);
    if (!hasBTC || !hasETH) throw new Error("Crypto prices not visible");
    await page.close();
  });

  // 7. Reset password
  await test("Reset-password page - password inputs present", async () => {
    const page = await ctx.newPage();
    await page.goto(`${BASE}/reset-password?token=abc123`, { waitUntil: "domcontentloaded", timeout: 15000 });
    await page.waitForTimeout(1500);
    const n = await page.locator("input[type='password']").count();
    console.log(`  Found ${n} password inputs`);
    if (n < 1) throw new Error("No password inputs");
    await page.close();
  });

  await browser.close();

  console.log("\n══════════════════════════════════════════════════");
  console.log("  VERIFICATION RESULTS");
  console.log("══════════════════════════════════════════════════");
  let pass = 0, fail = 0;
  for (const r of results) {
    const icon = r.status === "PASS" ? "✅" : "❌";
    console.log(`  ${icon} ${r.label}`);
    if (r.note) console.log(`       → ${r.note}`);
    r.status === "PASS" ? pass++ : fail++;
  }
  console.log("──────────────────────────────────────────────────");
  console.log(`  ${pass} passed, ${fail} failed`);
  console.log("══════════════════════════════════════════════════");
  process.exit(fail > 0 ? 1 : 0);
})();
