/**
 * Product catalogue shared by the marketing site and the dashboard.
 * Loan rates mirror the backend (backend/src/loans/loan-products.ts), which is
 * the source of truth when an application is submitted.
 */

export const LOAN_PRODUCTS = [
  { value: "personal", label: "Personal loan", rate: 9.25, blurb: "For debt consolidation, travel, a wedding or other plans." },
  { value: "auto", label: "Auto loan", rate: 7.25, blurb: "New or used vehicles with fixed monthly payments." },
  { value: "mortgage", label: "Home mortgage", rate: 7.15, blurb: "Buy or refinance with a long, predictable term." },
  { value: "education", label: "Education loan", rate: 5.5, blurb: "Tuition, courses and certifications." },
  { value: "business", label: "Business financing", rate: 8.5, blurb: "Working capital and equipment for growing businesses." },
  { value: "crypto", label: "Crypto backed loan", rate: 9.5, blurb: "Borrow against crypto you hold with us." },
  { value: "others", label: "Other financing", rate: 10.0, blurb: "Tell us what you need and we'll review it." },
] as const;

export type LoanType = (typeof LOAN_PRODUCTS)[number]["value"];

export const LOAN_TERMS = [6, 12, 24, 36, 48, 60];
export const LOAN_MIN = 500;
export const LOAN_MAX = 1_000_000;

export function loanProduct(value: string) {
  return LOAN_PRODUCTS.find((p) => p.value === value) ?? LOAN_PRODUCTS[0];
}

export function monthlyPayment(principal: number, annualRate: number, months: number): number {
  if (!principal || !months) return 0;
  const r = annualRate / 100 / 12;
  if (r === 0) return principal / months;
  const f = Math.pow(1 + r, months);
  return (principal * r * f) / (f - 1);
}

export type InvestmentPlan = {
  id: string;
  name: string;
  category: string;
  description: string;
  /** Illustrative annual return range — not a promise. */
  minReturn: number;
  maxReturn: number;
  termMonths: number;
  minInvestment: number;
  risk: "Low" | "Moderate" | "High" | "Very high";
};

export const INVESTMENT_PLANS: InvestmentPlan[] = [
  { id: "IDX-1", name: "Global Equity Index", category: "Index funds", description: "Broad exposure to large companies across developed markets.", minReturn: 6, maxReturn: 9, termMonths: 12, minInvestment: 100, risk: "Moderate" },
  { id: "IDX-2", name: "US Total Market Index", category: "Index funds", description: "Thousands of US listed companies in one low cost plan.", minReturn: 6, maxReturn: 10, termMonths: 12, minInvestment: 100, risk: "Moderate" },
  { id: "BND-1", name: "Treasury Bond Ladder", category: "Bonds & income", description: "Short and medium term government bonds for steadier income.", minReturn: 3.5, maxReturn: 4.8, termMonths: 24, minInvestment: 250, risk: "Low" },
  { id: "BND-2", name: "Investment Grade Corporate Bonds", category: "Bonds & income", description: "Bonds issued by highly rated companies.", minReturn: 4.5, maxReturn: 6, termMonths: 36, minInvestment: 500, risk: "Low" },
  { id: "MMF-1", name: "Cash Reserve Fund", category: "Bonds & income", description: "A steady place for cash you may need soon.", minReturn: 3, maxReturn: 4.2, termMonths: 3, minInvestment: 50, risk: "Low" },
  { id: "RE-1", name: "Diversified Real Estate", category: "Real estate", description: "Commercial and residential property through listed real estate trusts.", minReturn: 5, maxReturn: 8, termMonths: 24, minInvestment: 500, risk: "Moderate" },
  { id: "THM-1", name: "Technology & AI Leaders", category: "Thematic", description: "Companies building computing, semiconductors and AI.", minReturn: 8, maxReturn: 15, termMonths: 24, minInvestment: 500, risk: "High" },
  { id: "THM-2", name: "Clean Energy Transition", category: "Thematic", description: "Renewables, grid infrastructure and electrification.", minReturn: 6, maxReturn: 13, termMonths: 36, minInvestment: 500, risk: "High" },
  { id: "THM-3", name: "Healthcare Innovation", category: "Thematic", description: "Biotech, medical devices and digital health.", minReturn: 6, maxReturn: 12, termMonths: 24, minInvestment: 500, risk: "High" },
  { id: "CRY-1", name: "Digital Asset Index", category: "Digital assets", description: "A basket of the largest crypto assets, rebalanced monthly.", minReturn: 0, maxReturn: 25, termMonths: 12, minInvestment: 250, risk: "Very high" },
  { id: "CRY-2", name: "Stablecoin Yield", category: "Digital assets", description: "Yield on USD-pegged stablecoins.", minReturn: 3, maxReturn: 6, termMonths: 6, minInvestment: 100, risk: "Moderate" },
];

export const INVESTMENT_CATEGORIES = Array.from(new Set(INVESTMENT_PLANS.map((p) => p.category)));
