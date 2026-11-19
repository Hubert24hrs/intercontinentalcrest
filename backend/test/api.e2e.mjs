/**
 * End-to-end API checks for the Intercontinental Crest backend.
 *
 *   cd backend
 *   node --env-file=.env test/api.e2e.mjs            # against http://localhost:4000/api
 *   API=https://host/api node --env-file=.env test/api.e2e.mjs
 *
 * Needs ADMIN_EMAIL / ADMIN_PASSWORD (the super admin) in the environment.
 * Creates throwaway customers with unique emails; safe to run repeatedly
 * against a local or staging database. Do not point it at production.
 */
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';

const require = createRequire(import.meta.url);
const { authenticator } = require('otplib');

const API = (process.env.API || 'http://localhost:4000/api').replace(/\/$/, '');
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
const ADMIN_PASSWORD = (process.env.ADMIN_PASSWORD || '').trim();
const MAIL_LOG = path.resolve(process.cwd(), 'mails', 'sent_mails.log');

let passed = 0;
let failed = 0;
const failures = [];

function check(name, condition, detail = '') {
  if (condition) {
    passed++;
    console.log(`  ✓ ${name}`);
  } else {
    failed++;
    failures.push(`${name}${detail ? ` — ${detail}` : ''}`);
    console.log(`  ✗ ${name}${detail ? ` — ${detail}` : ''}`);
  }
}

/** Minimal client with a cookie jar, so cookie-based auth is exercised like a browser. */
class Client {
  constructor(label) {
    this.label = label;
    this.cookies = new Map();
    this.bearer = null;
  }
  cookieHeader() {
    return [...this.cookies.entries()].map(([k, v]) => `${k}=${v}`).join('; ');
  }
  storeCookies(res) {
    const raw = typeof res.headers.getSetCookie === 'function' ? res.headers.getSetCookie() : [];
    for (const line of raw) {
      const [pair] = line.split(';');
      const idx = pair.indexOf('=');
      const name = pair.slice(0, idx).trim();
      const value = pair.slice(idx + 1).trim();
      if (!value || /expires=Thu, 01 Jan 1970/i.test(line)) this.cookies.delete(name);
      else this.cookies.set(name, value);
    }
  }
  async call(method, p, body, { raw = false, bearer } = {}) {
    const headers = { Accept: 'application/json' };
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    const cookie = this.cookieHeader();
    if (cookie) headers.Cookie = cookie;
    const token = bearer ?? this.bearer;
    if (token) headers.Authorization = `Bearer ${token}`;
    const res = await fetch(API + p, { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined });
    this.storeCookies(res);
    if (raw) return res;
    let data = null;
    try {
      data = await res.json();
    } catch {
      data = null;
    }
    return { status: res.status, data };
  }
}

const unique = Date.now().toString(36);
const strongPassword = 'Str0ngPassw0rd!' + unique.slice(-3);

async function registerAndLogin(label) {
  const c = new Client(label);
  const email = `e2e.${label}.${unique}@example.com`;
  const reg = await c.call('POST', '/auth/register', { fullName: `E2E ${label}`, email, password: strongPassword });
  check(`register ${label}`, reg.status === 201, `status ${reg.status} ${JSON.stringify(reg.data)}`);
  const login = await c.call('POST', '/auth/login', { email, password: strongPassword });
  check(`login ${label} (cookie session)`, login.status === 200 && c.cookies.has('accessToken') && c.cookies.has('refreshToken'));
  c.email = email;
  c.user = login.data?.user;
  return c;
}

async function accountsOf(c) {
  const r = await c.call('GET', '/accounts');
  return {
    checking: r.data.find((a) => a.accountType === 'checking'),
    savings: r.data.find((a) => a.accountType === 'savings'),
    all: r.data,
  };
}

function latestResetToken(email) {
  if (!fs.existsSync(MAIL_LOG)) return null;
  const text = fs.readFileSync(MAIL_LOG, 'utf8');
  const blocks = text.split('========================================================================').filter((b) => b.includes(`TO: ${email}`));
  const last = blocks[blocks.length - 1] || '';
  const m = last.match(/reset-password\?token=([a-f0-9]{64})/);
  return m ? m[1] : null;
}

async function main() {
  console.log(`API under test: ${API}\n`);

  console.log('Public endpoints');
  const anon = new Client('anon');
  check('health', (await anon.call('GET', '')).status === 200);
  const pub = await anon.call('GET', '/public/markets');
  check('public markets without sign-in', pub.status === 200 && Array.isArray(pub.data) && pub.data.length > 5);
  check('protected route rejects anonymous', (await anon.call('GET', '/accounts')).status === 401);

  console.log('\nRegistration & validation');
  const weak = await anon.call('POST', '/auth/register', { fullName: 'Weak', email: `weak.${unique}@example.com`, password: 'short' });
  check('weak password rejected', weak.status === 400);
  const bogus = await anon.call('POST', '/auth/register', { fullName: 'X', email: 'not-an-email', password: strongPassword, role: 'admin' });
  check('unknown fields / bad email rejected', bogus.status === 400);

  const alice = await registerAndLogin('alice');
  const bob = await registerAndLogin('bob');
  const dup = await anon.call('POST', '/auth/register', { fullName: 'Dup', email: alice.email, password: strongPassword });
  check('duplicate email rejected', dup.status === 409);

  const me = await alice.call('GET', '/auth/me');
  check('/auth/me returns customer', me.status === 200 && me.data.user.role === 'customer' && !('passwordHash' in me.data.user));

  console.log('\nAdmin sign-in');
  const admin = new Client('admin');
  const adminLogin = await admin.call('POST', '/auth/login', { email: ADMIN_EMAIL, password: ADMIN_PASSWORD });
  check('super admin can sign in', adminLogin.status === 200 && adminLogin.data?.user?.role === 'super_admin', `status ${adminLogin.status}`);

  console.log('\nAuthorization (customer must not reach admin endpoints)');
  for (const p of ['/loans/admin/all', '/kyc/admin/all', '/investments/admin/all', '/admin/stats', '/admin/users', '/crypto/admin/orders', '/admin/support/conversations']) {
    const r = await alice.call('GET', p);
    check(`customer blocked from ${p}`, r.status === 403, `got ${r.status}`);
  }

  console.log('\nToken hygiene');
  const refreshCookie = alice.cookies.get('refreshToken');
  const asBearer = await anon.call('GET', '/accounts', undefined, { bearer: refreshCookie });
  check('refresh token is not accepted as an access token', asBearer.status === 401, `got ${asBearer.status}`);
  const refreshed = await alice.call('POST', '/auth/refresh');
  check('refresh endpoint issues a new session from the cookie', refreshed.status === 200 && !!refreshed.data?.accessToken);

  console.log('\nFunding & transfers');
  const a = await accountsOf(alice);
  const b = await accountsOf(bob);
  check('new customer has checking + savings at $0', !!a.checking && !!a.savings && Number(a.checking.balance) === 0);

  const credit = await admin.call('POST', `/admin/customers/${alice.user.id}/adjust-balance`, {
    type: 'credit', amount: 10000, accountId: a.checking.id, reason: 'E2E opening deposit',
  });
  check('admin credit adjustment', credit.status === 201 && credit.data.updatedBalance === 10000, JSON.stringify(credit.data));

  const neg = await alice.call('POST', '/transactions/transfer', { fromAccountId: a.checking.id, toAccountNumber: b.checking.accountNumber, amount: -500 });
  check('negative transfer rejected', neg.status === 400);
  const zero = await alice.call('POST', '/transactions/transfer', { fromAccountId: a.checking.id, toAccountNumber: b.checking.accountNumber, amount: 0 });
  check('zero transfer rejected', zero.status === 400);
  const tooMuch = await alice.call('POST', '/transactions/transfer', { fromAccountId: a.checking.id, toAccountNumber: b.checking.accountNumber, amount: 10000.01 });
  check('overdraft rejected', tooMuch.status === 400);
  const self = await alice.call('POST', '/transactions/transfer', { fromAccountId: a.checking.id, toAccountNumber: a.checking.accountNumber, amount: 5 });
  check('transfer to same account rejected', self.status === 400);
  const notMine = await bob.call('POST', '/transactions/transfer', { fromAccountId: a.checking.id, toAccountNumber: b.checking.accountNumber, amount: 5 });
  check("cannot send from someone else's account", notMine.status === 404);

  const t1 = await alice.call('POST', '/transactions/transfer', { senderAccountId: a.checking.id, receiverAccountNumber: b.checking.accountNumber, amount: 1250.5, description: 'Rent split' });
  check('internal transfer to another customer', t1.status === 201, JSON.stringify(t1.data));
  const t2 = await alice.call('POST', '/transactions/transfer', { fromAccountId: a.checking.id, toAccountNumber: a.savings.accountNumber, amount: 1000 });
  check('transfer between own accounts', t2.status === 201);
  const wire = await alice.call('POST', '/transactions/transfer', { fromAccountId: a.checking.id, toAccountNumber: 'GB29NWBK60161331926819', amount: 100, type: 'international_transfer' });
  check('international wire with fee', wire.status === 201 && Number(wire.data.fee) === 3);
  const bill = await alice.call('POST', '/transactions/transfer', { fromAccountId: a.checking.id, toAccountNumber: 'EXT-BILL-ELECTRIC-1', amount: 49.5, type: 'bill_payment', description: 'Electricity' });
  check('bill payment', bill.status === 201);

  // Concurrent transfers must not overdraw: 8 × $1,000 against what's left (~$7,597)
  const a1 = await accountsOf(alice);
  const before = Number(a1.checking.availableBalance);
  const burst = await Promise.all(
    Array.from({ length: 8 }, () => alice.call('POST', '/transactions/transfer', { fromAccountId: a.checking.id, toAccountNumber: b.savings.accountNumber, amount: 1000 })),
  );
  const ok = burst.filter((r) => r.status === 201).length;
  const a2 = await accountsOf(alice);
  check('concurrent transfers never overdraw', Number(a2.checking.balance) >= 0 && ok === Math.floor(before / 1000), `ok=${ok} before=${before} after=${a2.checking.balance}`);

  const expected = before - ok * 1000;
  check('checking balance reconciles', Math.abs(Number(a2.checking.balance) - expected) < 0.001, `${a2.checking.balance} vs ${expected}`);
  const bAfter = await accountsOf(bob);
  check('recipient credited', Number(bAfter.checking.balance) === 1250.5 && Number(bAfter.savings.balance) === ok * 1000);

  const txs = await alice.call('GET', '/transactions?limit=50');
  check('transaction history lists activity', txs.status === 200 && txs.data.total >= 5);
  const flows = new Set(txs.data.transactions.map((t) => t.flow));
  check('history marks debits, credits and internal moves', flows.has('debit') && flows.has('credit') && flows.has('internal'), [...flows].join(','));
  const one = await alice.call('GET', `/transactions/${t1.data.id}`);
  check('transaction detail', one.status === 200 && one.data.id === t1.data.id);
  const notYours = await bob.call('GET', `/transactions/${wire.data.id}`);
  check("cannot read someone else's transaction", notYours.status === 404);

  console.log('\nLoans');
  const loan = await alice.call('POST', '/loans/apply', {
    loanType: 'personal', principalAmount: 5000, interestRate: 0, termMonths: 12, accountId: a.checking.id, ssn: '123-45-6789',
  });
  check('loan application accepted', loan.status === 201, JSON.stringify(loan.data));
  check('server sets the rate (client 0% ignored)', Number(loan.data.interestRate) === 9.25);
  check('only last 4 SSN digits stored', loan.data.ssn === '***-**-6789');
  check('customer cannot approve own loan', (await alice.call('PATCH', `/loans/admin/${loan.data.id}/approve`)).status === 403);
  const badLoan = await alice.call('POST', '/loans/apply', { loanType: 'personal', principalAmount: 2_000_000, termMonths: 12, accountId: a.checking.id, ssn: '6789' });
  check('loan above limit rejected', badLoan.status === 400);
  const otherAcct = await alice.call('POST', '/loans/apply', { loanType: 'auto', principalAmount: 1000, termMonths: 12, accountId: b.checking.id, ssn: '6789' });
  check("cannot route a loan into someone else's account", otherAcct.status === 400);

  const preLoan = Number((await accountsOf(alice)).checking.balance);
  const approve = await admin.call('PATCH', `/loans/admin/${loan.data.id}/approve`);
  check('admin approves loan', approve.status === 200 && approve.data.status === 'approved');
  const again = await admin.call('PATCH', `/loans/admin/${loan.data.id}/approve`);
  check('loan cannot be approved twice', again.status === 400);
  const postLoan = Number((await accountsOf(alice)).checking.balance);
  check('loan disbursed exactly once', Math.abs(postLoan - preLoan - 5000) < 0.001, `${preLoan} → ${postLoan}`);
  const loan2 = await alice.call('POST', '/loans/apply', { loanType: 'education', principalAmount: 800, termMonths: 6, accountId: a.savings.id, ssnLast4: '1111' });
  const reject = await admin.call('PATCH', `/loans/admin/${loan2.data.id}/reject`);
  check('admin rejects loan', reject.status === 200 && reject.data.status === 'rejected');
  const adminLoans = await admin.call('GET', '/loans/admin/all');
  check('admin loan list masks SSNs', adminLoans.status === 200 && adminLoans.data.loans.every((l) => !l.ssn || l.ssn.startsWith('***')));

  console.log('\nCrypto trading & custody wallets');
  const wallets = await alice.call('GET', '/wallets');
  check('custody wallets provisioned', wallets.status === 200 && wallets.data.length === 7);
  check('wallet addresses are per-user demo references', wallets.data.every((w) => w.address.startsWith('DEMO-')));
  check('no legacy shared addresses', !wallets.data.some((w) => w.address.startsWith('0xbb1097') || w.address.startsWith('bc1quj2')));
  const bobWallets = await bob.call('GET', '/wallets');
  check('addresses differ between customers', bobWallets.data[0].address !== wallets.data[0].address);

  const buy = await alice.call('POST', '/crypto/buy', { coinId: 'bitcoin', usdAmount: 1000, fromAccountId: a.checking.id, coinSymbol: 'FAKE', coinName: 'Fake' });
  check('buy BTC', buy.status === 201, JSON.stringify(buy.data));
  check('server uses real coin metadata', buy.data.order?.coinSymbol === 'BTC');
  const bought = buy.data.coinsBought;
  let btcWallet = (await alice.call('GET', '/wallets')).data.find((w) => w.coinId === 'bitcoin');
  check('wallet mirrors purchased coins', Math.abs(Number(btcWallet.balance) - bought) < 1e-8, `${btcWallet.balance} vs ${bought}`);

  const sellTooMuch = await alice.call('POST', '/crypto/sell', { coinId: 'bitcoin', quantity: bought * 2, toAccountId: a.checking.id });
  check('cannot sell more than held', sellTooMuch.status === 400);
  const sellToOther = await alice.call('POST', '/crypto/sell', { coinId: 'bitcoin', quantity: Number((bought / 4).toFixed(8)), toAccountId: b.checking.id });
  check("cannot pay sale proceeds into someone else's account", sellToOther.status === 404);
  const sell = await alice.call('POST', '/crypto/sell', { coinId: 'bitcoin', quantity: Number((bought / 2).toFixed(8)), toAccountId: a.checking.id });
  check('sell half the BTC', sell.status === 201, JSON.stringify(sell.data));

  const dep = await alice.call('POST', '/wallets/deposit', { coinId: 'ethereum', amount: 1.5 });
  check('simulated ETH deposit', dep.status === 201);
  const sellEth = await alice.call('POST', '/crypto/sell', { coinId: 'ethereum', quantity: 1.5, toAccountId: a.checking.id });
  check('sell the deposited ETH', sellEth.status === 201);
  const doubleSpend = await alice.call('POST', '/wallets/withdraw', { coinId: 'ethereum', amount: 1.5, destinationAddress: '0x52908400098527886E0F7030069857D2E4169EE7' });
  check('sold coins cannot also be withdrawn (no double spend)', doubleSpend.status === 400, `got ${doubleSpend.status}`);

  btcWallet = (await alice.call('GET', '/wallets')).data.find((w) => w.coinId === 'bitcoin');
  const wd = await alice.call('POST', '/wallets/withdraw', { coinId: 'bitcoin', amount: Number(btcWallet.balance), destinationAddress: 'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq' });
  check('withdraw remaining BTC', wd.status === 201, JSON.stringify(wd.data));
  const history = await alice.call('GET', '/wallets/history');
  check('wallet history shows deposit and withdrawal', history.status === 200 && history.data.some((h) => h.type === 'deposit') && history.data.some((h) => h.type === 'withdrawal'));
  const bigDeposit = await alice.call('POST', '/wallets/deposit', { coinId: 'bitcoin', amount: 1000 });
  check('oversized simulated deposit rejected', bigDeposit.status === 400);
  const portfolio = await alice.call('GET', '/crypto/portfolio');
  check('portfolio reflects trades', portfolio.status === 200 && portfolio.data.orders.length >= 4);

  console.log('\nInvestments');
  const inv = await alice.call('POST', '/investments', { planName: 'Global Equity Index', principalAmount: 500, interestRate: 8, termMonths: 12, accountId: a.savings.id });
  check('open investment', inv.status === 201 && inv.data.maturityDate, JSON.stringify(inv.data));
  check('customer cannot revalue investment', (await alice.call('PATCH', `/investments/admin/${inv.data.id}/value`, { currentValue: 1e9 })).status === 403);
  const reval = await admin.call('PATCH', `/investments/admin/${inv.data.id}/value`, { currentValue: 525.25 });
  check('admin marks investment to market', reval.status === 200 && Number(reval.data.currentValue) === 525.25);
  const preClose = Number((await accountsOf(alice)).checking.balance);
  const close = await alice.call('POST', `/investments/${inv.data.id}/close`);
  check('close investment', close.status === 201 && close.data.status === 'closed');
  check('investment cannot be closed twice', (await alice.call('POST', `/investments/${inv.data.id}/close`)).status === 400);
  const postClose = Number((await accountsOf(alice)).checking.balance);
  check('payout credited once', Math.abs(postClose - preClose - 525.25) < 0.001, `${preClose} → ${postClose}`);
  const greedy = await alice.call('POST', '/investments', { planName: 'X', principalAmount: 50, interestRate: 1000, accountId: a.savings.id });
  check('absurd return rate rejected', greedy.status === 400);

  console.log('\nStatements');
  const stmts = await alice.call('GET', `/accounts/${a.checking.id}/statements`);
  check('monthly statements list', stmts.status === 200 && stmts.data.length >= 1 && stmts.data[0].txCount > 0);
  const cur = stmts.data[0];
  const live = Number((await accountsOf(alice)).checking.balance);
  check('statement closing = live balance', Math.abs(cur.closing - live) < 0.01, `${cur.closing} vs ${live}`);
  check('statement opening + credits − debits = closing', Math.abs(cur.opening + cur.credits - cur.debits - cur.closing) < 0.01);
  const pdf = await alice.call('GET', `/accounts/${a.checking.id}/statement/pdf?year=${cur.year}&month=${cur.month}`, undefined, { raw: true });
  const pdfBuf = Buffer.from(await pdf.arrayBuffer());
  check('PDF statement downloads', pdf.status === 200 && pdf.headers.get('content-type') === 'application/pdf' && pdfBuf.subarray(0, 4).toString() === '%PDF');
  check("cannot read someone else's statements", (await bob.call('GET', `/accounts/${a.checking.id}/statements`)).status === 403);

  console.log('\nBeneficiaries');
  const ben = await alice.call('POST', '/beneficiaries', { beneficiaryName: 'Bob E2E', accountNumber: b.checking.accountNumber, bankName: 'Intercontinental Crest' });
  check('add beneficiary', ben.status === 201);
  check('list beneficiaries', (await alice.call('GET', '/beneficiaries')).data.length === 1);
  check("cannot delete someone else's beneficiary", (await bob.call('DELETE', `/beneficiaries/${ben.data.id}`)).status === 403);
  check('delete beneficiary', (await alice.call('DELETE', `/beneficiaries/${ben.data.id}`)).status === 200);

  console.log('\nKYC');
  const kyc = await alice.call('POST', '/kyc/submit', { documentType: 'passport', documentFrontUrl: 'https://example.com/front.jpg' });
  check('submit KYC', kyc.status === 201);
  check('duplicate pending KYC rejected', (await alice.call('POST', '/kyc/submit', { documentType: 'passport' })).status === 400);
  check('customer cannot review KYC', (await alice.call('PATCH', `/kyc/admin/${kyc.data.id}/review`, { status: 'approved' })).status === 403);
  const review = await admin.call('PATCH', `/kyc/admin/${kyc.data.id}/review`, { status: 'approved', reviewerNotes: 'Looks good' });
  check('admin approves KYC', review.status === 200 && review.data.status === 'approved');

  console.log('\nSupport chat');
  const conv = await alice.call('POST', '/support/conversations');
  check('open support conversation', conv.status === 201 && !!conv.data.id);
  const msg = await alice.call('POST', `/support/conversations/${conv.data.id}/messages`, { content: 'Hello, I need help with a transfer.' });
  check('customer sends message', msg.status === 201);
  check('empty message rejected', (await alice.call('POST', `/support/conversations/${conv.data.id}/messages`, { content: '   ' })).status === 400);
  check("bob cannot read alice's conversation", (await bob.call('GET', `/support/conversations/${conv.data.id}/messages`)).status === 404);
  const inbox = await admin.call('GET', '/admin/support/conversations');
  check('admin inbox shows unread', inbox.status === 200 && inbox.data.data.some((c) => c.id === conv.data.id && c.unreadCount >= 1));
  check('admin replies', (await admin.call('POST', `/admin/support/conversations/${conv.data.id}/messages`, { content: 'Happy to help!' })).status === 201);
  const thread = await alice.call('GET', `/support/conversations/${conv.data.id}/messages`);
  check('customer sees reply', thread.data.messages.some((m) => m.senderType === 'admin'));

  console.log('\nNotifications');
  const notes = await alice.call('GET', '/notifications/me');
  check('notifications recorded', notes.status === 200 && notes.data.length >= 5);
  check('mark one read', (await alice.call('PATCH', `/notifications/${notes.data[0].id}/read`)).status === 200);
  check('mark all read', (await alice.call('POST', '/notifications/read-all')).status === 201);
  check("cannot mark someone else's notification", (await bob.call('PATCH', `/notifications/${notes.data[1].id}/read`)).status === 403);

  console.log('\nProfile & password');
  const phone = '+1 555 ' + String(Date.now()).slice(-7);
  const prof = await alice.call('PATCH', '/auth/profile', { fullName: 'Alice Updated', phone });
  check('update profile', prof.status === 200 && prof.data.fullName === 'Alice Updated');
  const wrongCur = await alice.call('PATCH', '/auth/password', { currentPassword: 'nope-nope-nope', newPassword: 'An0therStrongPass!' });
  check('password change needs current password', wrongCur.status === 400);
  const newPass = 'An0therStrongPass!' + unique.slice(-2);
  check('change password', (await alice.call('PATCH', '/auth/password', { currentPassword: strongPassword, newPassword: newPass })).status === 200);
  const relog = new Client('alice2');
  check('login with new password', (await relog.call('POST', '/auth/login', { email: alice.email, password: newPass })).status === 200);

  console.log('\nForgot / reset password');
  check('forgot-password (unknown email) still 200', (await anon.call('POST', '/auth/forgot-password', { email: `nobody.${unique}@example.com` })).status === 200);
  check('forgot-password', (await anon.call('POST', '/auth/forgot-password', { email: bob.email })).status === 200);
  const token = latestResetToken(bob.email);
  check('reset link emailed (local mail log)', !!token);
  if (token) {
    const resetPass = 'Res3tPassword!' + unique.slice(-2);
    check('reset password with token', (await anon.call('POST', '/auth/reset-password', { token, newPassword: resetPass })).status === 200);
    check('reset token is single-use', (await anon.call('POST', '/auth/reset-password', { token, newPassword: resetPass + 'x' })).status === 400);
    const bob2 = new Client('bob2');
    check('login after reset', (await bob2.call('POST', '/auth/login', { email: bob.email, password: resetPass })).status === 200);
  }

  console.log('\nTwo-factor authentication');
  const gen = await alice.call('POST', '/auth/2fa/generate');
  check('2FA secret + QR', gen.status === 201 && !!gen.data.secret && gen.data.qrCodeUrl.startsWith('data:image/png'));
  check('2FA rejects wrong code', (await alice.call('POST', '/auth/2fa/verify', { code: '000000' })).status === 400);
  check('2FA enabled', (await alice.call('POST', '/auth/2fa/verify', { code: authenticator.generate(gen.data.secret) })).status === 200);
  const tfa = new Client('alice-2fa');
  const step1 = await tfa.call('POST', '/auth/login', { email: alice.email, password: newPass });
  check('login asks for second factor', step1.status === 200 && step1.data.require2Fa === true && !tfa.cookies.has('accessToken'));
  check('2FA challenge token is not an access token', (await anon.call('GET', '/accounts', undefined, { bearer: step1.data.tempToken })).status === 401);
  const step2 = await tfa.call('POST', '/auth/2fa/authenticate', { tempToken: step1.data.tempToken, code: authenticator.generate(gen.data.secret) });
  check('second factor completes sign-in', step2.status === 200 && tfa.cookies.has('accessToken'));
  check('disable 2FA', (await tfa.call('POST', '/auth/2fa/disable', { code: authenticator.generate(gen.data.secret) })).status === 200);

  console.log('\nAccount lockout');
  const carol = await registerAndLogin('carol');
  const attacker = new Client('attacker');
  for (let i = 0; i < 5; i++) await attacker.call('POST', '/auth/login', { email: carol.email, password: 'wrong-password-' + i });
  const locked = await attacker.call('POST', '/auth/login', { email: carol.email, password: strongPassword });
  check('account locks after 5 failed attempts', locked.status === 429, `got ${locked.status}`);

  console.log('\nAdmin controls');
  const users = await admin.call('GET', `/admin/users?search=${encodeURIComponent(bob.email)}`);
  check('admin search', users.status === 200 && users.data.users.length === 1);
  const detail = await admin.call('GET', `/admin/users/${alice.user.id}`);
  check('user detail hides secrets', detail.status === 200 && !('twoFactorSecret' in detail.data) && !('passwordHash' in detail.data) && !('passwordResetToken' in detail.data));
  check('suspend customer', (await admin.call('PATCH', `/admin/users/${bob.user.id}/status`, { status: 'suspended' })).status === 200);
  check('suspended customer is signed out immediately', (await bob.call('GET', '/accounts')).status === 401);
  check('reactivate customer', (await admin.call('PATCH', `/admin/users/${bob.user.id}/status`, { status: 'active' })).status === 200);
  check('invalid status rejected', (await admin.call('PATCH', `/admin/users/${bob.user.id}/status`, { status: 'god' })).status === 400);
  check('admin cannot change own status', (await admin.call('PATCH', `/admin/users/${adminLogin.data.user.id}/status`, { status: 'suspended' })).status === 400);
  check('super_admin role cannot be granted', (await admin.call('PATCH', `/admin/users/${bob.user.id}/role`, { role: 'super_admin' })).status === 400);
  const freeze = await admin.call('PATCH', `/admin/accounts/${a.savings.id}/freeze`, { isFrozen: true });
  check('freeze account', freeze.status === 200);
  const frozenSend = await alice.call('POST', '/transactions/transfer', { fromAccountId: a.savings.id, toAccountNumber: b.checking.accountNumber, amount: 1 });
  check('frozen account cannot send', frozenSend.status === 400);
  check('unfreeze account', (await admin.call('PATCH', `/admin/accounts/${a.savings.id}/freeze`, { isFrozen: false })).status === 200);
  const debit = await admin.call('POST', `/admin/customers/${alice.user.id}/adjust-balance`, { type: 'debit', amount: 10_000_000, accountId: a.checking.id, reason: 'Too large' });
  check('admin debit cannot exceed balance or limit', debit.status === 400);
  const audit = await admin.call('GET', '/admin/audit');
  check('audit log records admin actions', audit.status === 200 && audit.data.logs.some((l) => l.action === 'ADMIN_CREDIT_ACCOUNT') && audit.data.logs.some((l) => l.action === 'APPROVE_LOAN'));
  const stats = await admin.call('GET', '/admin/stats');
  check('dashboard stats', stats.status === 200 && stats.data.stats.totalUsers >= 3);
  const adminTx = await admin.call('GET', '/admin/transactions?limit=5');
  check('admin transaction monitor', adminTx.status === 200 && adminTx.data.transactions.length > 0);
  const credCrypto = await admin.call('POST', `/admin/users/${bob.user.id}/credit-crypto`, { coinId: 'solana', quantity: 2, reason: 'E2E promo' });
  check('admin credit crypto', credCrypto.status === 201);
  check('wallet endpoints require sign-in', (await new Client('anon2').call('GET', '/wallets')).status === 401);

  const del = await admin.call('DELETE', `/admin/users/${carol.user.id}`);
  check('delete customer', del.status === 200);
  check('deleted customer cannot sign in', (await carol.call('GET', '/accounts')).status === 401);

  console.log('\nLogout');
  check('logout clears cookies', (await alice.call('POST', '/auth/logout')).status === 200 && !alice.cookies.has('accessToken'));
  check('signed out client is rejected', (await alice.call('GET', '/accounts')).status === 401);

  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed) {
    console.log('\nFailures:\n - ' + failures.join('\n - '));
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
