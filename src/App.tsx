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
  ArrowDownRight,
  LogIn,
  LogOut,
  User
} from "lucide-react";
import { GameState, Stock, Loan, GameEvent, GamePhase } from "./types";
import { INITIAL_STOCKS, POTENTIAL_EVENTS, LIFE_EVENTS } from "./constants";
import { StockCard } from "./components/StockCard";
import { cn } from "./lib/utils";
import { StockChart } from "./components/StockChart";
import { auth, db, googleProvider, signInWithPopup } from "./firebase";
import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  limit, 
  onSnapshot, 
  serverTimestamp,
  Timestamp
} from "firebase/firestore";
import { onAuthStateChanged, signOut, User as FirebaseUser } from "firebase/auth";

const INITIAL_BALANCE = 10000;

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export default function App() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [hasSavedScore, setHasSavedScore] = useState(false);
  
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
    fastForwardYears: 1,
    fastForwardSummary: [],
  });

  const [pendingEvent, setPendingEvent] = useState<any>(null);
  const [isGameOver, setIsGameOver] = useState(false);
  const [simulationSpeed] = useState(150); // Faster simulation for fast forward
  const simInterval = useRef<NodeJS.Timeout | null>(null);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
    });
    return () => unsubscribe();
  }, []);

  // Leaderboard Listener
  useEffect(() => {
    const q = query(collection(db, "leaderboard"), orderBy("netWorth", "desc"), limit(10));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const scores = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setLeaderboard(scores);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, "leaderboard");
    });
    return () => unsubscribe();
  }, []);

  const calculateNetWorth = (state: GameState) => {
    const stockValue = state.stocks.reduce((acc, stock) => {
      const owned = state.portfolio[stock.id] || 0;
      return acc + owned * stock.price;
    }, 0);
    const debtValue = state.loans.reduce((acc, loan) => acc + loan.amount, 0);
    return state.balance + stockValue - debtValue;
  };

  const netWorth = calculateNetWorth(gameState);

  // Save score when game ends
  useEffect(() => {
    if (gameState.phase === "GAMEOVER" && user && !hasSavedScore) {
      const saveScore = async () => {
        try {
          await addDoc(collection(db, "leaderboard"), {
            name: user.displayName || "Anonymous",
            netWorth: netWorth,
            year: gameState.year,
            timestamp: serverTimestamp(),
            uid: user.uid
          });
          setHasSavedScore(true);
        } catch (error) {
          handleFirestoreError(error, OperationType.CREATE, "leaderboard");
        }
      };
      saveScore();
    }
  }, [gameState.phase, user, hasSavedScore, netWorth, gameState.year]);

  // Simulation Logic
  useEffect(() => {
    if (gameState.phase === "SIMULATING") {
      simInterval.current = setInterval(() => {
        setGameState(prev => {
          if (prev.month >= 12) {
            if (prev.fastForwardYears > 1) {
              const nextYear = prev.year + 1;
              if (nextYear > 60) {
                if (simInterval.current) clearInterval(simInterval.current);
                return { ...prev, phase: "GAMEOVER" };
              }
              
              return {
                ...prev,
                year: nextYear,
                month: 1,
                fastForwardYears: prev.fastForwardYears - 1,
                history: [...prev.history, { year: prev.year, month: 12, netWorth: calculateNetWorth(prev) }],
                currentYearHistory: [{ month: 0, netWorth: calculateNetWorth(prev) }]
              };
            } else {
              if (simInterval.current) clearInterval(simInterval.current);
              if (prev.year >= 60) return { ...prev, phase: "GAMEOVER" };
              return { ...prev, phase: "SUMMARY" };
            }
          }

          const currentMonth = prev.month + 1;
          
          // Randomly trigger Market Events (POTENTIAL_EVENTS)
          let newActiveEvents = prev.activeEvents.map(e => ({ ...e, duration: e.duration - 1 })).filter(e => e.duration > 0);
          if (Math.random() < 0.02 && newActiveEvents.length < 2) { // 2% chance per month
            const randomEvent = POTENTIAL_EVENTS[Math.floor(Math.random() * POTENTIAL_EVENTS.length)];
            if (!newActiveEvents.find(e => e.id === randomEvent.id)) {
              newActiveEvents.push(randomEvent);
            }
          }

          if (currentMonth === 6) {
            const event = LIFE_EVENTS[Math.floor(Math.random() * LIFE_EVENTS.length)];
            setPendingEvent(event);
            if (simInterval.current) clearInterval(simInterval.current);
            return { ...prev, month: currentMonth, phase: "EVENT", activeEvents: newActiveEvents };
          }

          const newStocks = prev.stocks.map(stock => {
            // Calculate combined impact from active events
            const eventImpact = newActiveEvents.reduce((acc, event) => {
              const sectorImpact = event.impact[stock.sector] || 0;
              const marketImpact = event.impact["Market"] || 0;
              return acc + sectorImpact + marketImpact;
            }, 0);

            // Random trend shift (market cycles)
            let currentTrend = stock.trend;
            if (currentMonth === 1) { // Shift trend at start of year
              currentTrend += (Math.random() - 0.5) * 0.002;
              currentTrend = Math.max(-0.01, Math.min(0.015, currentTrend));
            }

            const changePercent = (Math.random() - 0.5) * stock.volatility + currentTrend + eventImpact;
            const newPrice = Math.max(1, stock.price * (1 + changePercent));
            return {
              ...stock,
              price: newPrice,
              trend: currentTrend,
              history: [...stock.history, { time: prev.year * 12 + currentMonth, price: newPrice }].slice(-20),
            };
          });

          const netWorth = calculateNetWorth({ ...prev, stocks: newStocks });
          
          return {
            ...prev,
            month: currentMonth,
            stocks: newStocks,
            activeEvents: newActiveEvents,
            currentYearHistory: [...prev.currentYearHistory, { month: currentMonth, netWorth }]
          };
        });
      }, simulationSpeed);
    }

    return () => {
      if (simInterval.current) clearInterval(simInterval.current);
    };
  }, [gameState.phase]);

  const login = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  const startSimulation = () => {
    if (gameState.fastForwardYears > 1) {
      // Instant Fast Forward
      setGameState(prev => {
        let currentBalance = prev.balance;
        let currentYear = prev.year;
        let currentStocks = [...prev.stocks];
        let currentHistory = [...prev.history];
        let activeEvents: GameEvent[] = [...prev.activeEvents];
        let summary: any[] = [];
        const totalYears = prev.fastForwardYears;

        for (let y = 0; y < totalYears; y++) {
          const yearNum = currentYear + y;
          if (yearNum > 60) break;

          for (let m = 1; m <= 12; m++) {
            // Update Active Events
            activeEvents = activeEvents.map(e => ({ ...e, duration: e.duration - 1 })).filter(e => e.duration > 0);
            
            // Randomly trigger Market Events
            if (Math.random() < 0.02 && activeEvents.length < 2) {
              const randomEvent = POTENTIAL_EVENTS[Math.floor(Math.random() * POTENTIAL_EVENTS.length)];
              if (!activeEvents.find(e => e.id === randomEvent.id)) {
                activeEvents.push(randomEvent);
                summary.push({
                  year: yearNum,
                  month: m,
                  title: `MARKET: ${randomEvent.title}`,
                  cost: 0,
                  isMarket: true
                });
              }
            }

            // Update Stocks
            currentStocks = currentStocks.map(stock => {
              const eventImpact = activeEvents.reduce((acc, event) => {
                const sectorImpact = event.impact[stock.sector] || 0;
                const marketImpact = event.impact["Market"] || 0;
                return acc + sectorImpact + marketImpact;
              }, 0);

              let currentTrend = stock.trend;
              if (m === 1) {
                currentTrend += (Math.random() - 0.5) * 0.002;
                currentTrend = Math.max(-0.01, Math.min(0.015, currentTrend));
              }

              const changePercent = (Math.random() - 0.5) * stock.volatility + currentTrend + eventImpact;
              const newPrice = Math.max(1, stock.price * (1 + changePercent));
              return {
                ...stock,
                price: newPrice,
                trend: currentTrend,
                history: [...stock.history, { time: yearNum * 12 + m, price: newPrice }].slice(-20),
              };
            });

            // Random Life Event at Month 6
            if (m === 6) {
              const event = LIFE_EVENTS[Math.floor(Math.random() * LIFE_EVENTS.length)];
              currentBalance -= event.cost;
              summary.push({
                year: yearNum,
                month: m,
                title: event.title,
                cost: event.cost
              });
            }
          }

          const yearEndNetWorth = currentBalance + currentStocks.reduce((acc, s) => acc + (prev.portfolio[s.id] || 0) * s.price, 0);
          currentHistory.push({ year: yearNum, month: 12, netWorth: yearEndNetWorth });
        }

        const finalYear = Math.min(60, currentYear + totalYears - 1);
        const nextPhase = finalYear >= 60 ? "GAMEOVER" : "FASTFORWARD_SUMMARY";

        return {
          ...prev,
          balance: currentBalance,
          year: finalYear,
          month: 12,
          stocks: currentStocks,
          history: currentHistory,
          activeEvents: activeEvents,
          fastForwardSummary: summary,
          phase: nextPhase as any,
          fastForwardYears: 1 // Reset
        };
      });
    } else {
      // Normal Simulation
      setGameState(prev => ({ 
        ...prev, 
        phase: "SIMULATING", 
        month: 0, 
        currentYearHistory: [{ month: 0, netWorth: calculateNetWorth(prev) }] 
      }));
    }
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
      fastForwardSummary: [],
      history: [...prev.history, { year: prev.year, month: 12, netWorth: calculateNetWorth(prev) }]
    }));
  };

  const buyStock = (stockId: string, quantity: number) => {
    const stock = gameState.stocks.find(s => s.id === stockId);
    const totalCost = stock ? stock.price * quantity : 0;
    if (!stock || gameState.balance < totalCost || quantity <= 0) return;

    setGameState(prev => ({
      ...prev,
      balance: prev.balance - totalCost,
      portfolio: {
        ...prev.portfolio,
        [stockId]: (prev.portfolio[stockId] || 0) + quantity,
      }
    }));
  };

  const sellStock = (stockId: string, quantity: number) => {
    const stock = gameState.stocks.find(s => s.id === stockId);
    const owned = gameState.portfolio[stockId] || 0;
    if (!stock || owned < quantity || quantity <= 0) return;

    setGameState(prev => ({
      ...prev,
      balance: prev.balance + (stock.price * quantity),
      portfolio: {
        ...prev.portfolio,
        [stockId]: owned - quantity,
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
          
          <div className="flex items-center gap-6">
            {user ? (
              <div className="flex items-center gap-4 bg-white border-4 border-black p-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <div className="w-10 h-10 bg-monopoly-blue border-2 border-black flex items-center justify-center">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt={user.displayName || ""} className="w-full h-full object-cover" />
                  ) : (
                    <User className="text-white" size={20} />
                  )}
                </div>
                <div className="hidden md:block">
                  <div className="text-[10px] font-black uppercase tracking-widest text-gray-500">Player</div>
                  <div className="text-sm font-black uppercase italic tracking-tighter">{user.displayName}</div>
                </div>
                <button onClick={logout} className="p-2 hover:text-monopoly-red transition-colors">
                  <LogOut size={20} />
                </button>
              </div>
            ) : (
              <button 
                onClick={login}
                className="monopoly-button bg-monopoly-blue text-white flex items-center gap-2 py-2 px-4 text-sm"
              >
                <LogIn size={18} /> Login
              </button>
            )}

            <div className="h-12 w-1 bg-black" />

            <div className="hidden md:flex flex-col items-end">
              <span className="text-[10px] uppercase tracking-widest text-gray-500 font-black">Current Year</span>
              <span className="font-mono text-3xl font-black text-black">{gameState.year}</span>
            </div>
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
                <div className="space-y-4">
                  <div>
                    <h2 className="text-4xl font-black text-black mb-2 uppercase italic tracking-tighter">Investment Phase</h2>
                    <p className="text-gray-700 font-medium max-w-xl">
                      Welcome to Year {gameState.year}. Buy properties and stocks to build your empire. Click "Roll Dice" to simulate the year.
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-8">
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase tracking-widest text-gray-500 font-black">Current Net Worth</span>
                      <div className="flex items-center gap-2 text-4xl text-monopoly-blue font-mono font-black">
                        <TrendingUp size={28} />
                        ${netWorth.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </div>
                    </div>
                    <div className="h-12 w-1 bg-black/10" />
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase tracking-widest text-gray-500 font-black">Portfolio Value</span>
                      <div className="text-2xl font-mono font-black text-black">
                        ${gameState.stocks.reduce((acc, s) => acc + (gameState.portfolio[s.id] || 0) * s.price, 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </div>
                    </div>
                  </div>

                  {/* Active Market Events */}
                  {gameState.activeEvents.length > 0 && (
                    <div className="flex flex-wrap gap-3">
                      {gameState.activeEvents.map(event => (
                        <div key={event.id} className="flex items-center gap-2 bg-monopoly-blue/10 border-2 border-monopoly-blue p-2 px-3 rounded-sm">
                          <AlertCircle className="text-monopoly-blue" size={16} />
                          <div className="flex flex-col">
                            <span className="text-[10px] font-black uppercase tracking-tight text-monopoly-blue leading-none">{event.title}</span>
                            <span className="text-[8px] font-bold text-monopoly-blue/70 uppercase tracking-widest">{event.duration} months left</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-3 bg-white border-4 border-black p-3">
                    <span className="text-xs font-black uppercase tracking-widest">Fast Forward</span>
                    <input 
                      type="number" 
                      min="1" 
                      max={60 - gameState.year + 1}
                      value={gameState.fastForwardYears}
                      onChange={(e) => setGameState(prev => ({ ...prev, fastForwardYears: Math.max(1, parseInt(e.target.value) || 1) }))}
                      className="w-16 font-mono font-black text-center border-b-2 border-black focus:outline-none"
                    />
                    <span className="text-xs font-black uppercase tracking-widest">Years</span>
                  </div>
                  <button
                    onClick={startSimulation}
                    className="monopoly-button bg-monopoly-red text-white hover:bg-red-600 flex items-center justify-center gap-3 text-xl border-black w-full"
                  >
                    Roll Dice <ArrowRight size={24} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {gameState.stocks.map(stock => (
                  <StockCard 
                    key={stock.id}
                    stock={stock}
                    onBuy={buyStock}
                    onSell={sellStock}
                    owned={gameState.portfolio[stock.id] || 0}
                    balance={gameState.balance}
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
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                  <div className="space-y-2">
                    <div className="text-xs text-gray-500 font-black uppercase tracking-widest">Total Assets</div>
                    <div className="text-4xl font-mono font-black text-black">
                      ${(gameState.balance + gameState.stocks.reduce((acc, s) => acc + (gameState.portfolio[s.id] || 0) * s.price, 0)).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-xs text-gray-500 font-black uppercase tracking-widest">Total Debt</div>
                    <div className="text-4xl font-mono font-black text-monopoly-red">
                      ${gameState.loans.reduce((acc, l) => acc + l.amount, 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-xs text-gray-500 font-black uppercase tracking-widest">Net Worth</div>
                    <div className="text-4xl font-mono font-black text-monopoly-green">
                      ${netWorth.toLocaleString(undefined, { maximumFractionDigits: 0 })}
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

          {gameState.phase === "FASTFORWARD_SUMMARY" && (
            <motion.div
              key="ff-summary"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-4xl mx-auto space-y-8"
            >
              <div className="monopoly-card p-12 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8">
                  <Calendar className="text-monopoly-blue opacity-40" size={120} />
                </div>
                
                <h2 className="text-6xl font-black text-black mb-10 uppercase italic tracking-tighter border-b-8 border-black pb-4 inline-block">Fast Forward Report</h2>
                
                <p className="text-xl font-bold text-gray-700 mb-8">
                  You've advanced to Year {gameState.year}. Here are the events that occurred during your journey:
                </p>

                <div className="bg-white border-4 border-black p-6 space-y-4 mb-12 max-h-96 overflow-y-auto shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                  <div className="flex justify-between font-black uppercase text-xs border-b-2 border-black pb-2 sticky top-0 bg-white">
                    <span>Year/Month</span>
                    <span>Event</span>
                    <span>Cost</span>
                  </div>
                  {gameState.fastForwardSummary.map((event, i) => (
                    <div key={i} className={cn(
                      "flex justify-between font-mono text-sm border-b border-gray-100 py-2",
                      event.isMarket ? "bg-monopoly-blue/5" : ""
                    )}>
                      <span className="font-black">Y{event.year} M{event.month}</span>
                      <span className={cn("italic", event.isMarket ? "text-monopoly-blue font-black" : "")}>
                        {event.title}
                      </span>
                      <span className={cn("font-black", event.cost > 0 ? "text-monopoly-red" : (event.cost < 0 ? "text-monopoly-green" : "text-gray-400"))}>
                        {event.cost === 0 ? "---" : (event.cost > 0 ? "-" : "+") + "$" + Math.abs(event.cost).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                  <div className="bg-gray-50 border-4 border-black p-6">
                    <div className="text-xs text-gray-500 font-black uppercase tracking-widest mb-1">Final Balance</div>
                    <div className="text-4xl font-mono font-black text-monopoly-green">${gameState.balance.toLocaleString()}</div>
                  </div>
                  <div className="bg-gray-50 border-4 border-black p-6">
                    <div className="text-xs text-gray-500 font-black uppercase tracking-widest mb-1">Final Net Worth</div>
                    <div className="text-4xl font-mono font-black text-black">${netWorth.toLocaleString()}</div>
                  </div>
                </div>

                <button
                  onClick={startNextYear}
                  className="monopoly-button w-full bg-monopoly-blue text-white hover:bg-blue-600 flex items-center justify-center gap-4 text-2xl py-6"
                >
                  Continue to Year {gameState.year + 1} <ArrowRight size={32} />
                </button>
              </div>
            </motion.div>
          )}

          {gameState.phase === "GAMEOVER" && (
            <motion.div
              key="gameover"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-4xl mx-auto space-y-12"
            >
              <div className="monopoly-card p-16 text-center space-y-8 bg-monopoly-yellow/10">
                <div className="w-32 h-32 bg-monopoly-yellow border-8 border-black flex items-center justify-center mx-auto shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                  <Trophy className="text-black" size={80} />
                </div>
                
                <div className="space-y-4">
                  <h2 className="text-7xl font-black text-black uppercase italic tracking-tighter">Retirement Reached!</h2>
                  <p className="text-2xl font-bold text-gray-700">You've completed your 60-year journey. Here is your final legacy.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="bg-white border-4 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                    <div className="text-sm font-black uppercase tracking-widest text-gray-500 mb-2">Total Assets</div>
                    <div className="text-4xl font-mono font-black text-black">
                      ${(gameState.balance + gameState.stocks.reduce((acc, s) => acc + (gameState.portfolio[s.id] || 0) * s.price, 0)).toLocaleString()}
                    </div>
                  </div>
                  <div className="bg-white border-4 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                    <div className="text-sm font-black uppercase tracking-widest text-gray-500 mb-2">Total Debt</div>
                    <div className="text-4xl font-mono font-black text-monopoly-red">
                      ${gameState.loans.reduce((acc, l) => acc + l.amount, 0).toLocaleString()}
                    </div>
                  </div>
                  <div className="bg-white border-4 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                    <div className="text-sm font-black uppercase tracking-widest text-gray-500 mb-2">Final Net Worth</div>
                    <div className="text-4xl font-mono font-black text-monopoly-green">${netWorth.toLocaleString()}</div>
                  </div>
                </div>

                <div className="space-y-6">
                  <h3 className="text-3xl font-black uppercase italic border-b-4 border-black pb-2 inline-block">Leaderboard</h3>
                  <div className="bg-white border-4 border-black p-6 space-y-4 text-left">
                    <div className="flex justify-between font-black uppercase text-sm border-b-2 border-black pb-2">
                      <span>Rank</span>
                      <span>Name</span>
                      <span>Net Worth</span>
                    </div>
                    {leaderboard.length > 0 ? (
                      leaderboard.map((entry, i) => (
                        <div key={entry.id} className={cn(
                          "flex justify-between font-mono font-bold",
                          entry.uid === user?.uid ? "text-monopoly-red" : "text-black"
                        )}>
                          <span>#{i + 1}</span>
                          <span>{entry.name}</span>
                          <span>${entry.netWorth.toLocaleString()}</span>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-4 text-gray-400 italic">No scores recorded yet...</div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-4">
                  {!user && (
                    <p className="text-monopoly-red font-black uppercase text-xs">Login to save your score to the leaderboard!</p>
                  )}
                  <button
                    onClick={() => window.location.reload()}
                    className="monopoly-button bg-black text-white hover:bg-gray-800 text-2xl w-full py-6"
                  >
                    Start New Empire
                  </button>
                </div>
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
