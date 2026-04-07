export interface Stock {
  id: string;
  name: string;
  symbol: string;
  price: number;
  history: { time: number; price: number }[];
  volatility: number; // 0 to 1
  trend: number; // -1 to 1
  sector: string;
  description: string;
}

export interface Loan {
  id: string;
  amount: number;
  interestRate: number;
  remainingTerm: number; // in turns
  monthlyPayment: number;
}

export interface GameEvent {
  id: string;
  title: string;
  description: string;
  impact: { [sector: string]: number }; // sector -> trend multiplier
  duration: number; // turns
}

export interface Policy {
  id: string;
  title: string;
  description: string;
  effect: (state: GameState) => GameState;
}

export type GamePhase = "INVESTING" | "SIMULATING" | "EVENT" | "SUMMARY";

export interface GameState {
  balance: number;
  year: number;
  month: number;
  stocks: Stock[];
  portfolio: { [stockId: string]: number };
  loans: Loan[];
  history: { year: number; month: number; netWorth: number }[];
  activeEvents: GameEvent[];
  phase: GamePhase;
  currentYearHistory: { month: number; netWorth: number }[];
}
