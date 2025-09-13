// Form state interface
export interface FormState {
  // Policy Holder Details
  clientId: string;

  // Policy Details
  policyNumber: string;
  insurer: string;
  planName: string;
  policyType: string;
  commencementDate: Date | null;
  maturityDate: Date | null;
  status: string;

  // Premium Calculation
  sumAssured: string;
  premiumAmount: string;
  annualPremium: string;
  premiumMode: string;
  premiumPayingTerm: string;
  policyTerm: string;

  // Payment Details
  nextDueDate: Date | null;
  lastPaidDate: Date | null;
  installmentPremium: string;

  // Riders
  riders: Array<{
    name: string;
    sumAssured: string;
    premium: string;
  }>;

  // Advanced Options
  nomineeDetails: string;
  agentCode: string;
  branchCode: string;
  servicing: string;

  // Additional Information
  medicalRequired: boolean;
  proposalNumber: string;
  receiptNumber: string;
  chequeNumber: string;
  bankName: string;
  remarks: string;
}

// LIC Product interfaces
export interface Nature {
  participating: boolean;
  linked: boolean;
  type: string;
}

export interface Eligibility {
  min_age: number | null;
  max_age: number | null;
  term_range_years: string | number | null;
  ppt_options: string | number | (string | number)[] | null;
  min_sum_assured: number | null;
  max_sum_assured: number | null;
}

export interface Premium {
  modes: string[];
  modal_factors: Record<string, number> | null;
  high_sa_rebate: string | null;
  mode_rebate: string | null;
  gst_applicable: boolean;
}

export interface Benefits {
  death_benefit: string | null;
  maturity_benefit: string | null;
  survival_benefit: string | null;
  bonus_type: string | null;
}

export interface SurrenderLoan {
  surrender: string;
  loan: string;
}

export interface LICProduct {
  plan_name: string;
  plan_no: number | null;
  uin: string;
  category: string;
  nature: Nature;
  status: string;
  eligibility: Eligibility;
  premium: Premium;
  benefits: Benefits;
  riders_allowed: string[];
  surrender_loan: SurrenderLoan;
  last_updated: string;
}