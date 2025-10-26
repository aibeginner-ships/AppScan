import ErrorState from '../ErrorState';

export default function ErrorStateExample() {
  return (
    <ErrorState 
      message="Unable to fetch reviews from this app" 
      onRetry={() => console.log('Retry clicked')}
    />
  );
}
