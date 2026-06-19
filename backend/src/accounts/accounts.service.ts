import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as PDFDocument from 'pdfkit';

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

  async getMonthlyStatementsList(accountId: string, userId: string) {
    const account = await this.getAccountById(accountId, userId);
    
    // Fetch all completed transactions for this account
    const transactions = await this.prisma.transaction.findMany({
      where: {
        OR: [
          { senderAccountId: accountId },
          { receiverAccountId: accountId },
        ],
        status: 'completed',
      },
      orderBy: { createdAt: 'desc' },
    });

    if (transactions.length === 0) {
      // If there are no transactions, return statements starting from the registration month
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      const regDate = user?.createdAt || new Date();
      const now = new Date();
      const list = [];
      let current = new Date(regDate.getFullYear(), regDate.getMonth(), 1);
      while (current <= now) {
        const periodStr = current.toLocaleString('en-US', { month: 'long', year: 'numeric' });
        list.push({
          period: periodStr,
          year: current.getFullYear(),
          month: current.getMonth() + 1,
          from: new Date(current.getFullYear(), current.getMonth(), 1).toISOString().split('T')[0],
          to: new Date(current.getFullYear(), current.getMonth() + 1, 0).toISOString().split('T')[0],
          txCount: 0,
          credits: 0,
          debits: 0,
          closing: Number(account.balance),
        });
        current.setMonth(current.getMonth() + 1);
      }
      return list.reverse();
    }

    // Group transactions by month
    const groups: { [key: string]: typeof transactions } = {};
    transactions.forEach(tx => {
      const date = new Date(tx.createdAt);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(tx);
    });

    const keys = Object.keys(groups).sort().reverse();
    let runningBalance = Number(account.balance);

    const list = keys.map(key => {
      const [year, month] = key.split('-').map(Number);
      const txs = groups[key];
      
      let credits = 0;
      let debits = 0;
      txs.forEach(tx => {
        const amt = Number(tx.amount);
        const isCredit = tx.receiverAccountId === accountId;
        if (isCredit) credits += amt;
        else debits += amt;
      });

      const periodStr = new Date(year, month - 1, 1).toLocaleString('en-US', { month: 'long', year: 'numeric' });
      const item = {
        period: periodStr,
        year,
        month,
        from: new Date(year, month - 1, 1).toISOString().split('T')[0],
        to: new Date(year, month, 0).toISOString().split('T')[0],
        txCount: txs.length,
        credits,
        debits,
        closing: runningBalance,
      };

      runningBalance = runningBalance - credits + debits;

      return item;
    });

    return list;
  }

  async generatePdfStatement(accountId: string, userId: string, year: number, month: number): Promise<Buffer> {
    const account = await this.getAccountById(accountId, userId);
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const transactions = await this.prisma.transaction.findMany({
      where: {
        OR: [
          { senderAccountId: accountId },
          { receiverAccountId: accountId },
        ],
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        status: 'completed',
      },
      orderBy: { createdAt: 'asc' },
    });

    let totalCredits = 0;
    let totalDebits = 0;

    const list = transactions.map(tx => {
      const amt = Number(tx.amount);
      const isCredit = tx.receiverAccountId === accountId;
      if (isCredit) {
        totalCredits += amt;
      } else {
        totalDebits += amt;
      }
      return {
        date: new Date(tx.createdAt).toLocaleDateString(),
        ref: tx.transactionReference,
        desc: tx.description || 'Transfer',
        type: isCredit ? 'CREDIT' : 'DEBIT',
        amount: amt,
      };
    });

    const closingBalance = Number(account.balance);
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
      doc.fontSize(9).font('Helvetica').text('Global Banking. Trusted Worldwide.', 50, 70);

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
      const today = new Date().toLocaleDateString();
      doc.text(`Generated on ${today} | Intercontinental Crest Simulated Statement | FDIC Insured Simulation`, 50, doc.page.height - 50, { align: 'center', width: doc.page.width - 100 });

      doc.end();
    });
  }
}
