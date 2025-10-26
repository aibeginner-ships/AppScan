import TrendChart from '../TrendChart';

export default function TrendChartExample() {
  const data = [
    { month: "2025-06", avgRating: 4.5 },
    { month: "2025-07", avgRating: 4.4 },
    { month: "2025-08", avgRating: 4.2 },
    { month: "2025-09", avgRating: 4.1 },
    { month: "2025-10", avgRating: 4.3 },
  ];

  return (
    <div className="p-8">
      <TrendChart data={data} />
    </div>
  );
}
