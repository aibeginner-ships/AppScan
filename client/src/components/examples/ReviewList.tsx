import ReviewList from '../ReviewList';

export default function ReviewListExample() {
  const reviews = [
    "App crashes after latest update",
    "Too many ads in the free version",
    "Playback stops randomly",
    "Can't sync across devices",
    "Battery drain is excessive"
  ];

  return (
    <div className="p-8">
      <ReviewList reviews={reviews} />
    </div>
  );
}
