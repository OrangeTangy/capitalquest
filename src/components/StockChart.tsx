import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface StockChartProps {
  data: { time: number; price: number }[];
  color?: string;
}

export function StockChart({ data, color = "#10b981" }: StockChartProps) {
  return (
    <div className="h-full w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <XAxis dataKey="time" hide />
          <YAxis hide domain={["auto", "auto"]} />
          <Tooltip
            contentStyle={{ 
              backgroundColor: "#fff", 
              border: "2px solid #000", 
              borderRadius: "0px", 
              fontSize: "10px",
              fontFamily: "monospace",
              fontWeight: "black",
              boxShadow: "4px 4px 0px 0px rgba(0,0,0,1)"
            }}
            itemStyle={{ color: "#000" }}
            labelStyle={{ display: "none" }}
            cursor={{ stroke: "#000", strokeWidth: 2, strokeDasharray: "4 4" }}
          />
          <Line
            type="monotone"
            dataKey="price"
            stroke={color}
            strokeWidth={3}
            dot={false}
            animationDuration={1000}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
