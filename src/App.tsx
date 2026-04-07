import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Wallet, 
  TrendingUp, 
  ArrowRight, 
  History, 
  AlertCircle, 
  Building2, 
  Coins,
  ChevronRight,
  Info,
  Calendar,
  Car,
  GraduationCap,
  Stethoscope,
  Receipt,
  Trophy,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";
import { GameState, Stock, Loan, GameEvent, GamePhase } from "./types";
import { INITIAL_STOCKS, POTENTIAL_EVENTS, LIFE_EVENTS } from "./constants";
import { StockCard } from "./components/StockCard";
import { cn } from "./lib/utils";
import { StockChart } from "./components/StockChart";

const INITIAL_BALANCE = 10000;

export default function App() {
  const [gameState, setGameState] = useState<GameState>({
    balance: INITIAL_BALANCE,
    year: 1,
    month: 1,
    stocks: INITIAL_STOCKS,
    portfolio: {},
    loans: [],
    history: [],
    activeEvents: [],
    phase: "INVESTING",
    currentYearHistory: [],
  });

  const [pendingEvent, setPendingEvent] = useState<any>(null);
  const [isGameOver, setIsGameOver] = useState(false);
  const [simulationSpeed] = useState(300); // ms per month
  const simInterval = useRef<NodeJS.Timeout | null>(null);

  const calculateNetWorth = (state: GameState) => {
    const stockValue = state.stocks.reduce((acc, stock) => {
      const owned = state.portfolio[stock.id] || 0;
      return acc + owned * stock.price;
    }, 0);
    const debtValue = state.loans.reduce((acc, loan) => acc + loan.amount, 0);
    return state.balance + stockValue - debtValue;
  };

  // Simulation Logic
  useEffect(() => {
    if (gameState.phase === "SIMULATING") {
      simInterval.current = setInterval(() => {
        setGameState(prev => {
          if (prev.month >= 12) {
            if (simInterval.current) clearInterval(simInterval.current);
            return { ...prev, phase: "SUMMARY" };
          }

          const currentMonth = prev.month + 1;
          
          // Random Life Event at Month 6
          if (currentMonth === 6) {
            const event = LIFE_EVENTS[Math.floor(Math.random() * LIFE_EVENTS.length)];
            setPendingEvent(event);
            if (simInterval.current) clearInterval(simInterval.current);
            return { ...prev, month: currentMonth, phase: "EVENT" };
          }

          // Update Stocks
          const newStocks = prev.stocks.map(stock => {
            const changePercent = (Math.random() - 0.5) * stock.volatility + stock.trend;
            const newPrice = Math.max(1, stock.price * (1 + changePercent));
            return {
              ...stock,
              price: newPrice,
              history: [...stock.history, { time: prev.year * 12 + currentMonth, price: newPrice }].slice(-20),
            };
          });

          const netWorth = calculateNetWorth({ ...prev, stocks: newStocks });
          
          return {
            ...prev,
            month: currentMonth,
            stocks: newStocks,
            currentYearHistory: [...prev.currentYearHistory, { month: currentMonth, netWorth }]
          };
        });
      }, simulationSpeed);
    }

    return () => {
      if (simInterval.current) clearInterval(simInterval.current);
    };
  }, [gameState.phase]);

  const startSimulation = () => {
    setGameState(prev => ({ 
      ...prev, 
      phase: "SIMULATING", 
      month: 0, 
      currentYearHistory: [{ month: 0, netWorth: calculateNetWorth(prev) }] 
    }));
  };

  const resumeSimulation = () => {
    setPendingEvent(null);
    setGameState(prev => ({ ...prev, phase: "SIMULATING" }));
  };

  const startNextYear = () => {
    setGameState(prev => ({
      ...prev,
      year: prev.year + 1,
      month: 1,
      phase: "INVESTING",
      currentYearHistory: [],
      history: [...prev.history, { year: prev.year, month: 12, netWorth: calculateNetWorth(prev) }]
    }));
  };

  const buyStock = (stockId: string) => {
    const stock = gameState.stocks.find(s => s.id === stockId);
    if (!stock || gameState.balance < stock.price) return;

    setGameState(prev => ({
      ...prev,
      balance: prev.balance - stock.price,
      portfolio: {
        ...prev.portfolio,
        [stockId]: (prev.portfolio[stockId] || 0) + 1,
      }
    }));
  };

  const sellStock = (stockId: string) => {
    const stock = gameState.stocks.find(s => s.id === stockId);
    const owned = gameState.portfolio[stockId] || 0;
    if (!stock || owned <= 0) return;

    setGameState(prev => ({
      ...prev,
      balance: prev.balance + stock.price,
      portfolio: {
        ...prev.portfolio,
        [stockId]: owned - 1,
      }
    }));
  };

  const handleEventAction = () => {
    if (!pendingEvent) return;
    setGameState(prev => ({
      ...prev,
      balance: prev.balance - pendingEvent.cost,
    }));
    resumeSimulation();
  };

  const netWorth = calculateNetWorth(gameState);
  const startOfYearNetWorth = gameState.history.find(h => h.year === gameState.year - 1)?.netWorth || INITIAL_BALANCE;
  const yearPerformance = ((netWorth - startOfYearNetWorth) / startOfYearNetWorth) * 100;

  return (
    <div className="min-h-screen bg-monopoly-board text-black font-sans selection:bg-monopoly-red/30 overflow-x-hidden">
      {/* Header */}
      <header className="monopoly-header">
        <div className="max-w-7xl mx-auto px-6 h-24 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-monopoly-red border-4 border-black flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <Building2 className="text-white" size={32} />
            </div>
            <div>
              <h1 className="font-black text-3xl tracking-tighter text-black uppercase italic leading-none">Capital Quest</h1>
              <div className="flex items-center gap-2 text-[10px] text-monopoly-red font-black uppercase tracking-widest mt-1">
                <span className="w-2 h-2 bg-monopoly-red rounded-full animate-pulse" />
                Board Game Edition
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-8">
            <div className="hidden md:flex flex-col items-end">
              <span className="text-[10px] uppercase tracking-widest text-gray-500 font-black">Current Year</span>
              <span className="font-mono text-3xl font-black text-black">{gameState.year}</span>
            </div>
            <div className="h-12 w-1 bg-black" />
            <div className="flex flex-col items-end">
              <span className="text-[10px] uppercase tracking-widest text-gray-500 font-black">Bank Balance</span>
              <div className="flex items-center gap-2 text-3xl text-monopoly-green font-mono font-black">
                <Wallet size={24} />
                ${gameState.balance.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        
        <AnimatePresence mode="wait">
          {gameState.phase === "INVESTING" && (
            <motion.div
              key="investing"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-12"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 bg-white border-4 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                <div>
                  <h2 className="text-4xl font-black text-black mb-2 uppercase italic tracking-tighter">Investment Phase</h2>
                  <p className="text-gray-700 font-medium max-w-xl">
                    Welcome to Year {gameState.year}. Buy properties and stocks to build your empire. Click "Roll Dice" to simulate the year.
                  </p>
                </div>
                <button
                  onClick={startSimulation}
                  className="monopoly-button bg-monopoly-red text-white hover:bg-red-600 flex items-center gap-3 text-xl border-black"
                >
                  Roll Dice <ArrowRight size={24} />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {gameState.stocks.map(stock => (
                  <StockCard 
                    key={stock.id}
                    stock={stock}
                    onBuy={buyStock}
                    onSell={sellStock}
                    owned={gameState.portfolio[stock.id] || 0}
                    canAfford={gameState.balance >= stock.price}
                  />
                ))}
              </div>
            </motion.div>
          )}

          {gameState.phase === "SIMULATING" && (
            <motion.div
              key="simulating"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center min-h-[60vh] space-y-12"
            >
              <div className="text-center space-y-4">
                <div className="text-8xl font-black text-black uppercase italic tracking-tighter">
                  {new Intl.DateTimeFormat('en-US', { month: 'long' }).format(new Date(2026, gameState.month - 1))}
                </div>
                <div className="text-2xl text-monopoly-red font-black uppercase tracking-[0.3em]">Year {gameState.year} In Progress</div>
              </div>

              <div className="w-full max-w-4xl h-80 bg-white border-8 border-black p-12 relative overflow-hidden shadow-[16px_16px_0px_0px_rgba(0,0,0,1)]">
                <div className="absolute inset-0 opacity-10">
                  <StockChart data={gameState.currentYearHistory.map(h => ({ time: h.month, price: h.netWorth }))} color="#000" />
                </div>
                <div className="relative z-10 flex flex-col items-center justify-center h-full">
                  <div className="text-sm text-gray-500 uppercase font-black tracking-widest mb-2">Current Net Worth</div>
                  <div className="text-7xl font-mono font-black text-black">
                    ${netWorth.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </div>
                </div>
              </div>

              <div className="flex gap-6">
                {[...Array(12)].map((_, i) => (
                  <div 
                    key={i} 
                    className={cn(
                      "w-6 h-6 border-4 border-black transition-all duration-500",
                      i < gameState.month ? "bg-monopoly-green scale-125 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]" : "bg-white"
                    )} 
                  />
                ))}
              </div>
            </motion.div>
          )}

          {gameState.phase === "SUMMARY" && (
            <motion.div
              key="summary"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-4xl mx-auto space-y-8"
            >
              <div className="monopoly-card p-12 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8">
                  <Trophy className="text-monopoly-yellow opacity-40" size={120} />
                </div>
                
                <h2 className="text-6xl font-black text-black mb-10 uppercase italic tracking-tighter border-b-8 border-black pb-4 inline-block">Year {gameState.year} Report</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-12">
                  <div className="space-y-2">
                    <div className="text-xs text-gray-500 font-black uppercase tracking-widest">Ending Assets</div>
                    <div className="text-6xl font-mono font-black text-black">${netWorth.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-xs text-gray-500 font-black uppercase tracking-widest">Annual Growth</div>
                    <div className={cn(
                      "text-6xl font-mono font-black flex items-center gap-2",
                      yearPerformance >= 0 ? "text-monopoly-green" : "text-monopoly-red"
                    )}>
                      {yearPerformance >= 0 ? <ArrowUpRight size={56} /> : <ArrowDownRight size={56} />}
                      {Math.abs(yearPerformance).toFixed(1)}%
                    </div>
                  </div>
                </div>

                <div className="h-48 w-full mb-12 border-4 border-black bg-gray-50 p-4">
                  <StockChart data={gameState.currentYearHistory.map(h => ({ time: h.month, price: h.netWorth }))} color={yearPerformance >= 0 ? "#1fb25a" : "#ed1b24"} />
                </div>

                <button
                  onClick={startNextYear}
                  className="monopoly-button w-full bg-monopoly-blue text-white hover:bg-blue-600 flex items-center justify-center gap-4 text-2xl py-6"
                >
                  Pass GO & Collect Year {gameState.year + 1} <ArrowRight size={32} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </main>

      {/* Event Modal */}
      <AnimatePresence>
        {gameState.phase === "EVENT" && pendingEvent && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, rotate: -2 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              className="bg-white border-8 border-black p-12 max-w-md w-full shadow-[20px_20px_0px_0px_rgba(0,0,0,1)] text-center relative"
            >
              {/* Chance/Community Chest Header */}
              <div className={cn(
                "absolute top-0 left-0 right-0 h-12 border-b-8 border-black flex items-center justify-center font-black uppercase tracking-widest text-white",
                pendingEvent.cost > 0 ? "bg-monopoly-orange" : "bg-monopoly-blue"
              )}>
                {pendingEvent.cost > 0 ? "Chance" : "Community Chest"}
              </div>

              <div className="mt-12 w-24 h-24 bg-gray-100 border-4 border-black flex items-center justify-center mx-auto mb-8">
                {pendingEvent.icon === "Car" && <Car className="text-black" size={48} />}
                {pendingEvent.icon === "GraduationCap" && <GraduationCap className="text-black" size={48} />}
                {pendingEvent.icon === "Stethoscope" && <Stethoscope className="text-black" size={48} />}
                {pendingEvent.icon === "Receipt" && <Receipt className="text-black" size={48} />}
              </div>
              
              <h2 className="text-4xl font-black text-black mb-4 uppercase italic tracking-tighter">{pendingEvent.title}</h2>
              <p className="text-gray-700 mb-10 leading-relaxed text-xl font-bold italic">
                "{pendingEvent.description}"
              </p>
              
              <div className="bg-gray-50 border-4 border-black p-6 mb-10">
                <div className="text-[10px] uppercase tracking-widest text-gray-500 font-black mb-1">Bank Transaction</div>
                <div className={cn(
                  "text-4xl font-mono font-black",
                  pendingEvent.cost > 0 ? "text-monopoly-red" : "text-monopoly-green"
                )}>
                  {pendingEvent.cost > 0 ? "PAY" : "RECEIVE"} ${Math.abs(pendingEvent.cost).toLocaleString()}
                </div>
              </div>

              <button
                onClick={handleEventAction}
                className="monopoly-button w-full bg-black text-white hover:bg-gray-800"
              >
                Continue
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Game Over Modal */}
      <AnimatePresence>
        {isGameOver && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-monopoly-red/90 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white border-8 border-black p-12 max-w-md text-center shadow-[20px_20px_0px_0px_rgba(0,0,0,1)]"
            >
              <div className="w-24 h-24 bg-black border-4 border-white flex items-center justify-center mx-auto mb-8">
                <AlertCircle className="text-white" size={64} />
              </div>
              <h2 className="text-5xl font-black mb-6 text-black uppercase italic tracking-tighter">Bankrupt!</h2>
              <p className="text-gray-700 mb-10 font-bold text-xl">
                You've run out of cash and assets. Go directly to jail. Do not pass GO.
              </p>
              <div className="bg-gray-100 border-4 border-black p-8 mb-10">
                <div className="text-xs text-gray-500 uppercase font-black mb-2">Final Net Worth</div>
                <div className="text-4xl font-mono font-black text-monopoly-red">${netWorth.toLocaleString()}</div>
              </div>
              <button
                onClick={() => window.location.reload()}
                className="monopoly-button w-full bg-monopoly-red text-white hover:bg-red-600"
              >
                New Game
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
