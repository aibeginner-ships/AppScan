import SummaryCards from '../SummaryCards';

export default function SummaryCardsExample() {
  return (
    <div className="p-8">
      <SummaryCards
        positiveCategories={["UI", "Music Selection", "Offline Mode"]}
        negativeCategories={["Performance", "Ads", "Login Issues"]}
        averageRating={4.3}
        totalReviews={500}
      />
    </div>
  );
}
