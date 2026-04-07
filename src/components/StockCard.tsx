import { useState } from "react";
import { TrendingUp, TrendingDown, Plus, Minus, Maximize2 } from "lucide-react";
import { Stock } from "../types";
import { StockChart } from "./StockChart";
import { cn } from "../lib/utils";
import { motion } from "motion/react";

interface StockCardProps {
  stock: Stock;
  onBuy: (id: string, quantity: number) => void;
  onSell: (id: string, quantity: number) => void;
  owned: number;
  balance: number;
  key?: string;
}

export function StockCard({ stock, onBuy, onSell, owned, balance }: StockCardProps) {
  const [quantity, setQuantity] = useState<number>(1);
  const lastPrice = stock.price;
  const prevPrice = stock.history[stock.history.length - 2]?.price || lastPrice;
  const change = ((lastPrice - prevPrice) / prevPrice) * 100;
  const isPositive = change >= 0;

  const maxBuy = Math.floor(balance / lastPrice);
  const canAfford = balance >= lastPrice;

  // Monopoly sector colors
  const sectorColors: Record<string, string> = {
    Technology: "bg-monopoly-blue",
    Energy: "bg-monopoly-green",
    Healthcare: "bg-monopoly-red",
    Consumer: "bg-monopoly-yellow",
    Industrial: "bg-monopoly-orange",
    Market: "bg-black",
  };

  const handleQuantityChange = (val: string) => {
    const num = parseInt(val) || 0;
    setQuantity(Math.max(0, num));
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
          "font-black uppercase italic tracking-tighter leading-none text-xl text-white"
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
          <div className="flex flex-col">
            <span className="text-[8px] text-gray-400 font-black uppercase tracking-widest">Max Buy</span>
            <button 
              onClick={() => setQuantity(maxBuy)}
              className="text-[10px] font-mono font-black text-monopoly-blue hover:underline text-left"
            >
              {maxBuy} units
            </button>
          </div>
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

          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 bg-gray-50 border-2 border-black p-1 px-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Qty:</span>
              <input 
                type="number"
                value={quantity}
                onChange={(e) => handleQuantityChange(e.target.value)}
                className="bg-transparent font-mono font-black text-sm w-full focus:outline-none"
                min="0"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => onSell(stock.id, quantity)}
                disabled={owned <= 0 || quantity <= 0}
                className="monopoly-button py-2 text-xs"
              >
                <Minus size={14} className="inline mr-1" /> Sell
              </button>
              <button
                onClick={() => onBuy(stock.id, quantity)}
                disabled={!canAfford || quantity <= 0 || (quantity * lastPrice > balance)}
                className="monopoly-button py-2 text-xs bg-black text-white hover:bg-gray-800"
              >
                <Plus size={14} className="inline mr-1" /> Buy
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
