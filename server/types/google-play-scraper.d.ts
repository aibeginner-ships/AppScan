declare module 'google-play-scraper' {
  interface AppDetails {
    appId: string;
    title: string;
    summary: string;
    description: string;
    descriptionHTML: string;
    developer: string;
    developerId: string;
    developerEmail: string;
    developerWebsite: string;
    developerAddress: string;
    privacyPolicy: string;
    icon: string;
    genre: string;
    genreId: string;
    released: string;
    updated: number;
    version: string;
    recentChanges: string;
    comments: string[];
    price: number;
    free: boolean;
    currency: string;
    priceText: string;
    screenshots: string[];
    video: string;
    videoImage: string;
    contentRating: string;
    contentRatingDescription: string;
    adSupported: boolean;
    containsAds: boolean;
    reviews: number;
    score: number;
    scoreText: string;
    ratings: number;
    histogram: { [key: string]: number };
  }

  interface Review {
    id: string;
    userName: string;
    userImage: string;
    date: string;
    score: number;
    scoreText: string;
    url: string;
    title: string;
    text: string;
    replyDate?: string;
    replyText?: string;
    version: string;
    thumbsUp: number;
    criterias?: Array<{ criteria: string; rating: number }>;
  }

  interface ReviewsResult {
    data: Review[];
    nextPaginationToken?: string;
  }

  interface ReviewsOptions {
    appId: string;
    lang?: string;
    country?: string;
    sort?: number;
    num?: number;
    paginate?: boolean;
    nextPaginationToken?: string;
  }

  interface AppOptions {
    appId: string;
    lang?: string;
    country?: string;
  }

  const sort: {
    NEWEST: number;
    RATING: number;
    HELPFULNESS: number;
  };

  function app(options: AppOptions): Promise<AppDetails>;
  function reviews(options: ReviewsOptions): Promise<ReviewsResult>;

  export default {
    app,
    reviews,
    sort,
  };
}
