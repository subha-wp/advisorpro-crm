export const insurers = [
  "LIC of India",
  "HDFC Life",
  "ICICI Prudential",
  "SBI Life",
  "Bajaj Allianz",
  "Max Life",
  "Tata AIA",
  "Kotak Life",
  "Aditya Birla Sun Life",
  "Canara HSBC OBC Life",
  "PNB MetLife",
  "Aegon Life",
  "Aviva Life",
  "Bharti AXA Life",
  "Future Generali",
  "IDBI Federal",
  "IndiaFirst Life",
  "Reliance Nippon Life",
  "Sahara Life",
  "Shriram Life",
  "Star Union Dai-ichi Life",
  "Other",
];

export const premiumModes = [
  { value: "MONTHLY", label: "Monthly", factor: 12 },
  { value: "QUARTERLY", label: "Quarterly", factor: 4 },
  { value: "HALF_YEARLY", label: "Half Yearly", factor: 2 },
  { value: "YEARLY", label: "Yearly", factor: 1 },
  { value: "SINGLE", label: "Single Premium", factor: 1 },
];

export const policyStatuses = [
  { value: "ACTIVE", label: "Active", color: "default" },
  { value: "LAPSED", label: "Lapsed", color: "destructive" },
  { value: "MATURED", label: "Matured", color: "secondary" },
  { value: "SURRENDERED", label: "Surrendered", color: "outline" },
];