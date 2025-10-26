import { Card } from "@/components/ui/card";
import { 
  LineChart, 
  Line, 
  BarChart,
  Bar,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  ResponsiveContainer 
} from "recharts";

interface TrendData {
  month: string;
  avgRating: number;
  positive: number;
  negative: number;
}

interface TrendChartProps {
  data: TrendData[];
}

export default function TrendChart({ data }: TrendChartProps) {
  return (
    <div className="space-y-6">
      <Card className="p-8">
        <h3 className="text-xl font-semibold">Rating Trend</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Average rating over time
        </p>
        <div className="mt-6 h-80" data-testid="chart-rating-trend">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis 
                dataKey="month" 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
              />
              <YAxis 
                domain={[0, 5]}
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "6px",
                }}
              />
              <Line 
                type="monotone" 
                dataKey="avgRating" 
                name="Average Rating"
                stroke="hsl(var(--chart-1))" 
                strokeWidth={2}
                dot={{ fill: "hsl(var(--chart-1))", r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="p-8">
        <h3 className="text-xl font-semibold">Sentiment Trend</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Positive vs negative reviews by month
        </p>
        <div className="mt-6 h-80" data-testid="chart-sentiment-trend">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis 
                dataKey="month" 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "6px",
                }}
              />
              <Legend />
              <Bar 
                dataKey="positive" 
                name="Positive Reviews"
                fill="hsl(142, 76%, 36%)" 
                stackId="sentiment"
              />
              <Bar 
                dataKey="negative" 
                name="Negative Reviews"
                fill="hsl(0, 84%, 60%)" 
                stackId="sentiment"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}
