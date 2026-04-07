import { TrendingUp, TrendingDown, Plus, Minus } from "lucide-react";
import { Stock } from "../types";
import { StockChart } from "./StockChart";
import { cn } from "../lib/utils";
import { motion } from "motion/react";

interface StockCardProps {
  stock: Stock;
  onBuy: (id: string) => void;
  onSell: (id: string) => void;
  owned: number;
  canAfford: boolean;
  key?: string;
}

export function StockCard({ stock, onBuy, onSell, owned, canAfford }: StockCardProps) {
  const lastPrice = stock.price;
  const prevPrice = stock.history[stock.history.length - 2]?.price || lastPrice;
  const change = ((lastPrice - prevPrice) / prevPrice) * 100;
  const isPositive = change >= 0;

  // Monopoly sector colors
  const sectorColors: Record<string, string> = {
    Technology: "bg-monopoly-blue",
    Energy: "bg-monopoly-green",
    Healthcare: "bg-monopoly-red",
    Consumer: "bg-monopoly-yellow",
    Industrial: "bg-monopoly-orange",
    Market: "bg-black",
  };

  return (
    <motion.div 
      whileHover={{ y: -8 }}
      className="monopoly-card flex flex-col group overflow-hidden"
    >
      {/* Property Header */}
      <div className={cn(
        "h-16 border-b-4 border-black flex items-center justify-center p-4 text-center",
        sectorColors[stock.sector] || "bg-gray-200"
      )}>
        <h3 className={cn(
          "font-black uppercase italic tracking-tighter leading-none text-xl",
          (stock.sector === "Consumer" || stock.sector === "Market") ? "text-white" : "text-white"
        )}>
          {stock.name}
        </h3>
      </div>

      <div className="p-6 flex flex-col gap-4">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">{stock.symbol} • {stock.sector}</p>
          </div>
          <div className={cn(
            "flex items-center gap-1 text-sm font-black italic",
            isPositive ? "text-monopoly-green" : "text-monopoly-red"
          )}>
            {isPositive ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
            {Math.abs(change).toFixed(1)}%
          </div>
        </div>

        <p className="text-xs text-gray-600 font-medium leading-relaxed italic">
          "{stock.description}"
        </p>

        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-mono font-black text-black tracking-tighter">
            ${lastPrice.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </span>
        </div>

        <div className="h-20 w-full opacity-40 group-hover:opacity-100 transition-opacity">
          <StockChart data={stock.history} color="#000" />
        </div>

        <div className="flex flex-col gap-4 mt-auto">
          <div className="flex justify-between items-end border-t-4 border-black pt-4">
            <div className="flex flex-col">
              <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1">Owned</span>
              <span className="text-xl font-mono font-black text-black">{owned}</span>
            </div>
            <div className="text-right flex flex-col">
              <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1">Value</span>
              <span className="text-xl font-mono font-black text-monopoly-green">
                ${(owned * lastPrice).toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => onSell(stock.id)}
              disabled={owned <= 0}
              className="monopoly-button py-2 text-xs"
            >
              <Minus size={14} className="inline mr-1" /> Sell
            </button>
            <button
              onClick={() => onBuy(stock.id)}
              disabled={!canAfford}
              className="monopoly-button py-2 text-xs bg-black text-white hover:bg-gray-800"
            >
              <Plus size={14} className="inline mr-1" /> Buy
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
