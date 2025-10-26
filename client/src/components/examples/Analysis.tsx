import Analysis from '../../pages/Analysis';

export default function AnalysisExample() {
  const mockData = {
    appName: "Spotify",
    store: "Google Play",
    averageRating: 4.3,
    totalReviews: 500,
    positiveCategories: ["UI", "Music Selection", "Offline Mode"],
    negativeCategories: ["Performance", "Ads", "Login Issues"],
    topNegativeReviews: [
      "App crashes after latest update",
      "Too many ads in the free version",
      "Playback stops randomly",
      "Can't sync across devices",
      "Battery drain is excessive"
    ],
    trend: [
      { month: "2025-06", avgRating: 4.5 },
      { month: "2025-07", avgRating: 4.4 },
      { month: "2025-08", avgRating: 4.2 },
      { month: "2025-09", avgRating: 4.1 },
      { month: "2025-10", avgRating: 4.3 },
    ],
  };

  return <Analysis data={mockData} onBack={() => console.log('Back clicked')} />;
}
