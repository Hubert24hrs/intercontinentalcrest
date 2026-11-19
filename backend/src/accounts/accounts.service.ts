import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NON_CASH_TRANSACTION_TYPES } from '../common/pagination';
import PDFDocument = require('pdfkit');

@Injectable()
export class AccountsService {
  constructor(private prisma: PrismaService) {}

  async getAccountsByUserId(userId: string) {
    const accounts = await this.prisma.account.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    });
    return accounts;
  }

  async getAccountById(accountId: string, userId: string) {
    const account = await this.prisma.account.findUnique({
      where: { id: accountId },
    });
    if (!account) throw new NotFoundException('Account not found');
    if (account.userId !== userId) throw new ForbiddenException('Access denied');
    return account;
  }

  async updateAccount(accountId: string, userId: string, data: { accountName?: string }) {
    const account = await this.getAccountById(accountId, userId);
    return this.prisma.account.update({
      where: { id: account.id },
      data: { accountName: data.accountName },
    });
  }

  async getAllAccounts(page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;
    const [accounts, total] = await Promise.all([
      this.prisma.account.findMany({
        skip,
        take: limit,
        include: { user: { select: { id: true, fullName: true, email: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.account.count(),
    ]);
    return { accounts, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async freezeAccount(accountId: string) {
    return this.prisma.account.update({
      where: { id: accountId },
      data: { isFrozen: true },
    });
  }

  async unfreezeAccount(accountId: string) {
    return this.prisma.account.update({
      where: { id: accountId },
      data: { isFrozen: false },
    });
  }

  async getTotalBalance(userId: string) {
    const accounts = await this.prisma.account.findMany({
      where: { userId },
    });
    const total = accounts.reduce((sum, a) => sum + Number(a.balance), 0);
    return { total, accounts };
  }

  /** Signed cash effect of a ledger entry on one account: money in is positive, money out (incl. fees) negative. */
  private netEffect(tx: { amount: any; fee: any; senderAccountId: string | null; receiverAccountId: string | null }, accountId: string): number {
    const amount = Number(tx.amount);
    const fee = Number(tx.fee || 0);
    const isCredit = tx.receiverAccountId === accountId;
    const isDebit = tx.senderAccountId === accountId;
    if (isCredit && !isDebit) return amount;
    if (isDebit && !isCredit) return -(amount + fee);
    return 0;
  }

  private cashLedgerWhere(accountId: string) {
    return {
      OR: [{ senderAccountId: accountId }, { receiverAccountId: accountId }],
      status: 'completed',
      type: { notIn: NON_CASH_TRANSACTION_TYPES },
    };
  }

  async getMonthlyStatementsList(accountId: string, userId: string) {
    const account = await this.getAccountById(accountId, userId);
    const transactions = await this.prisma.transaction.findMany({
      where: this.cashLedgerWhere(accountId),
      orderBy: { createdAt: 'desc' },
    });

    const byMonth = new Map<string, typeof transactions>();
    for (const tx of transactions) {
      const d = new Date(tx.createdAt);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      if (!byMonth.has(key)) byMonth.set(key, []);
      byMonth.get(key)!.push(tx);
    }

    // One entry per month from account opening to now, newest first; balances are
    // reconstructed backwards from the current balance.
    const now = new Date();
    const firstActivity = transactions.length ? new Date(transactions[transactions.length - 1].createdAt) : account.createdAt;
    const start = new Date(Math.min(account.createdAt.getTime(), firstActivity.getTime()));
    const cursor = new Date(now.getFullYear(), now.getMonth(), 1);
    const stop = new Date(start.getFullYear(), start.getMonth(), 1);

    let closing = Number(account.balance);
    const list: any[] = [];
    while (cursor >= stop && list.length < 120) {
      const year = cursor.getFullYear();
      const monthIndex = cursor.getMonth();
      const txs = byMonth.get(`${year}-${monthIndex}`) || [];
      let credits = 0;
      let debits = 0;
      for (const tx of txs) {
        const effect = this.netEffect(tx, accountId);
        if (effect > 0) credits += effect;
        else debits += -effect;
      }
      const opening = closing - credits + debits;
      list.push({
        period: cursor.toLocaleString('en-US', { month: 'long', year: 'numeric' }),
        year,
        month: monthIndex + 1,
        from: new Date(Date.UTC(year, monthIndex, 1)).toISOString().slice(0, 10),
        to: new Date(Date.UTC(year, monthIndex + 1, 0)).toISOString().slice(0, 10),
        txCount: txs.length,
        credits: Math.round(credits * 100) / 100,
        debits: Math.round(debits * 100) / 100,
        opening: Math.round(opening * 100) / 100,
        closing: Math.round(closing * 100) / 100,
      });
      closing = opening;
      cursor.setMonth(cursor.getMonth() - 1);
    }
    return list;
  }

  async generatePdfStatement(accountId: string, userId: string, year: number, month: number): Promise<Buffer> {
    const account = await this.getAccountById(accountId, userId);
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    const [transactions, later] = await Promise.all([
      this.prisma.transaction.findMany({
        where: { ...this.cashLedgerWhere(accountId), createdAt: { gte: startDate, lte: endDate } },
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.transaction.findMany({
        where: { ...this.cashLedgerWhere(accountId), createdAt: { gt: endDate } },
        select: { amount: true, fee: true, senderAccountId: true, receiverAccountId: true },
      }),
    ]);

    let totalCredits = 0;
    let totalDebits = 0;
    const list = transactions.map((tx) => {
      const effect = this.netEffect(tx, accountId);
      if (effect > 0) totalCredits += effect;
      else totalDebits += -effect;
      return {
        date: new Date(tx.createdAt).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
        ref: tx.transactionReference,
        desc: tx.description || 'Transfer',
        type: effect >= 0 ? 'CREDIT' : 'DEBIT',
        amount: Math.abs(effect),
      };
    });

    const laterNet = later.reduce((sum, tx) => sum + this.netEffect(tx, accountId), 0);
    const closingBalance = Number(account.balance) - laterNet;
    const startingBalance = closingBalance - totalCredits + totalDebits;


    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50 });
      const buffers: Buffer[] = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      // Header background
      doc.fillColor('#0A2342').rect(0, 0, doc.page.width, 120).fill();

      // Brand Title
      doc.fillColor('#ffffff').fontSize(22).font('Helvetica-Bold').text('INTERCONTINENTAL CREST', 50, 40);
      doc.fontSize(9).font('Helvetica').text('Digital banking demo platform', 50, 70);

      // Statement Label
      doc.fillColor('#ffffff').fontSize(14).font('Helvetica-Bold').text('ACCOUNT STATEMENT', doc.page.width - 250, 40, { align: 'right', width: 200 });
      doc.fontSize(9).font('Helvetica').text(`Period: ${startDate.toLocaleString('en-US', { month: 'long', year: 'numeric' })}`, doc.page.width - 250, 65, { align: 'right', width: 200 });

      // Customer Details (Left)
      doc.fillColor('#333333').fontSize(9).font('Helvetica-Bold').text('Prepared For:', 50, 150);
      doc.font('Helvetica').text(user?.fullName || 'Client Name', 50, 165);
      doc.text(user?.email || '', 50, 178);
      doc.text(user?.phone || 'No phone number on record', 50, 191);

      // Account Details (Right)
      doc.font('Helvetica-Bold').text('Account Details:', 300, 150);
      doc.font('Helvetica').text(`Account Number: ${account.accountNumber}`, 300, 165);
      doc.text(`Account Type: ${account.accountType.toUpperCase()}`, 300, 178);
      doc.text(`Currency: ${account.currency}`, 300, 191);

      // Summary Table Header Background
      doc.rect(50, 225, doc.page.width - 100, 40).fillColor('#F3F4F6').fill();
      doc.fillColor('#4B5563').font('Helvetica-Bold').fontSize(8);
      doc.text('Starting Balance', 60, 233);
      doc.text('Total Deposits (Credits)', 180, 233);
      doc.text('Total Withdrawals (Debits)', 310, 233);
      doc.text('Ending Balance', 440, 233);

      doc.fillColor('#0A2342').font('Helvetica-Bold').fontSize(10);
      doc.text(`$${startingBalance.toFixed(2)}`, 60, 248);
      doc.text(`+$${totalCredits.toFixed(2)}`, 180, 248);
      doc.text(`-$${totalDebits.toFixed(2)}`, 310, 248);
      doc.text(`$${closingBalance.toFixed(2)}`, 440, 248);

      // Table Title
      doc.fillColor('#0A2342').font('Helvetica-Bold').fontSize(10).text('Transaction History Ledger', 50, 290);

      // Ledger Table Header
      let y = 308;
      doc.fillColor('#0A2342').rect(50, y, doc.page.width - 100, 20).fill();
      doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(8);
      doc.text('Date', 60, y + 6);
      doc.text('Reference', 140, y + 6);
      doc.text('Description', 240, y + 6);
      doc.text('Type', 380, y + 6);
      doc.text('Amount', 460, y + 6, { align: 'right', width: 80 });

      // Ledger Table Rows
      y += 20;
      doc.fillColor('#333333').font('Helvetica').fontSize(8);
      
      if (list.length === 0) {
        doc.text('No transaction events recorded in this statement cycle.', 60, y + 15);
      } else {
        list.forEach((tx, idx) => {
          if (idx % 2 === 1) {
            doc.fillColor('#F9FAFB').rect(50, y, doc.page.width - 100, 18).fill();
          }
          doc.fillColor('#333333');
          doc.text(tx.date, 60, y + 5);
          doc.text(tx.ref.slice(0, 15), 140, y + 5);
          doc.text(tx.desc, 240, y + 5, { width: 130, height: 12, ellipsis: true });
          
          if (tx.type === 'CREDIT') {
            doc.fillColor('#10B981').font('Helvetica-Bold').text(tx.type, 380, y + 5);
            doc.text(`+$${tx.amount.toFixed(2)}`, 460, y + 5, { align: 'right', width: 80 });
          } else {
            doc.fillColor('#EF4444').font('Helvetica-Bold').text(tx.type, 380, y + 5);
            doc.text(`-$${tx.amount.toFixed(2)}`, 460, y + 5, { align: 'right', width: 80 });
          }
          doc.font('Helvetica');
          y += 18;

          if (y > doc.page.height - 80) {
            doc.addPage();
            y = 50;
            // Draw header again on new page
            doc.fillColor('#0A2342').rect(50, y, doc.page.width - 100, 20).fill();
            doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(8);
            doc.text('Date', 60, y + 6);
            doc.text('Reference', 140, y + 6);
            doc.text('Description', 240, y + 6);
            doc.text('Type', 380, y + 6);
            doc.text('Amount', 460, y + 6, { align: 'right', width: 80 });
            y += 20;
            doc.fillColor('#333333').font('Helvetica').fontSize(8);
          }
        });
      }

      // Footer
      doc.fillColor('#9CA3AF').fontSize(8);
      const today = new Date().toLocaleDateString('en-US', { dateStyle: 'medium' });
      doc.text(`Generated ${today} | Demo statement. Balances are simulated and not FDIC insured.`, 50, doc.page.height - 50, { align: 'center', width: doc.page.width - 100 });

      doc.end();
    });
  }
}
