import { Stock, GameEvent } from "./types";

export const POTENTIAL_EVENTS: GameEvent[] = [
  {
    id: "tech_boom",
    title: "Tech Revolution",
    description: "New AI breakthroughs are driving technology stocks to new heights.",
    impact: { Technology: 0.03, Market: 0.01 },
    duration: 12,
  },
  {
    id: "energy_crisis",
    title: "Energy Supply Shock",
    description: "Global tensions are causing energy prices to skyrocket.",
    impact: { Energy: 0.05, Industrial: -0.02, Market: -0.01 },
    duration: 8,
  },
  {
    id: "healthcare_reform",
    title: "Healthcare Reform",
    description: "New regulations are impacting pharmaceutical profit margins.",
    impact: { Healthcare: -0.03, Market: -0.005 },
    duration: 18,
  },
  {
    id: "retail_surge",
    title: "Holiday Spending Spree",
    description: "Consumer confidence is at an all-time high.",
    impact: { Consumer: 0.02 },
    duration: 3,
  },
  {
    id: "market_crash",
    title: "Market Correction",
    description: "A sudden bubble burst has sent the entire market into a tailspin.",
    impact: { Market: -0.06, Technology: -0.08, Consumer: -0.04, Energy: -0.02, Healthcare: -0.01, Industrial: -0.03 },
    duration: 12,
  },
  {
    id: "industrial_boom",
    title: "Infrastructure Bill",
    description: "New government spending on roads and bridges is boosting industrials.",
    impact: { Industrial: 0.04, Market: 0.01 },
    duration: 24,
  },
  {
    id: "pandemic_scare",
    title: "Global Health Scare",
    description: "A new virus variant is causing lockdowns and supply chain issues.",
    impact: { Healthcare: 0.06, Consumer: -0.05, Technology: 0.02, Market: -0.03 },
    duration: 10,
  },
];

export const INITIAL_STOCKS: Stock[] = [
  {
    id: "spy",
    name: "Market Index",
    symbol: "SPY",
    price: 400,
    history: [{ time: 0, price: 400 }],
    volatility: 0.015,
    trend: 0.006, // ~7% annual growth
    sector: "Market",
    description: "A basket of the 500 largest companies. Slow, steady, and reliable growth.",
  },
  {
    id: "1",
    name: "TechNova Solutions",
    symbol: "TNV",
    price: 150,
    history: [{ time: 0, price: 150 }],
    volatility: 0.05,
    trend: 0.008, // ~10% annual growth
    sector: "Technology",
    description: "Cutting-edge AI and cloud computing. High risk, high reward potential.",
  },
  {
    id: "2",
    name: "GreenGrid Energy",
    symbol: "GGE",
    price: 85,
    history: [{ time: 0, price: 85 }],
    volatility: 0.025,
    trend: 0.005, // ~6% annual growth
    sector: "Energy",
    description: "Renewable energy infrastructure. Stable returns with a green future.",
  },
  {
    id: "3",
    name: "BioPharma Corp",
    symbol: "BIO",
    price: 210,
    history: [{ time: 0, price: 210 }],
    volatility: 0.07,
    trend: 0.004, // ~5% annual growth
    sector: "Healthcare",
    description: "Pharmaceutical giant. Volatile based on clinical trial results.",
  },
  {
    id: "4",
    name: "Stellar Retail",
    symbol: "STR",
    price: 45,
    history: [{ time: 0, price: 45 }],
    volatility: 0.035,
    trend: 0.003, // ~4% annual growth
    sector: "Consumer",
    description: "Global retail chain. Performance tied to consumer spending habits.",
  },
  {
    id: "5",
    name: "IronForge Heavy",
    symbol: "IFH",
    price: 120,
    history: [{ time: 0, price: 120 }],
    volatility: 0.02,
    trend: 0.005, // ~6% annual growth
    sector: "Industrial",
    description: "Heavy machinery and manufacturing. Solid backbone of the economy.",
  },
];

export const LIFE_EVENTS = [
  {
    id: "car_trouble",
    title: "Car Trouble!",
    description: "Your transmission gave out. That's going to cost you.",
    cost: 1500,
    icon: "Car",
  },
  {
    id: "student_loans",
    title: "Student Loan Payment",
    description: "The grace period is over. Time to pay up.",
    cost: 800,
    icon: "GraduationCap",
  },
  {
    id: "medical_bill",
    title: "Unexpected Medical Bill",
    description: "A quick trip to the ER wasn't in the budget.",
    cost: 1200,
    icon: "Stethoscope",
  },
  {
    id: "tax_refund",
    title: "Tax Refund",
    description: "The IRS actually owes YOU money this year!",
    cost: -1000, // Negative cost is a gain
    icon: "Receipt",
  },
];
