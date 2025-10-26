declare module 'app-store-scraper' {
  interface AppDetails {
    id: string;
    appId: string;
    title: string;
    url: string;
    description: string;
    icon: string;
    genres: string[];
    genreIds: string[];
    primaryGenre: string;
    primaryGenreId: number;
    contentRating: string;
    languages: string[];
    size: string;
    requiredOsVersion: string;
    released: string;
    updated: string;
    releaseNotes: string;
    version: string;
    price: number;
    currency: string;
    free: boolean;
    developerId: number;
    developer: string;
    developerUrl: string;
    developerWebsite: string;
    score: number;
    reviews: number;
    currentVersionScore: number;
    currentVersionReviews: number;
    screenshots: string[];
    ipadScreenshots: string[];
    appletvScreenshots: string[];
    supportedDevices: string[];
  }

  interface Review {
    id: string;
    userName: string;
    userUrl: string;
    version: string;
    score: number;
    title: string;
    text: string;
    url: string;
    updated: string;
  }

  interface AppOptions {
    id?: string | number;
    appId?: string;
    country?: string;
    lang?: string;
    ratings?: boolean;
  }

  interface ReviewsOptions {
    id?: string | number;
    appId?: string;
    country?: string;
    page?: number;
    sort?: string;
  }

  interface SearchOptions {
    term: string;
    num?: number;
    page?: number;
    country?: string;
    lang?: string;
  }

  const sort: {
    RECENT: string;
    HELPFUL: string;
  };

  function app(options: AppOptions): Promise<AppDetails>;
  function reviews(options: ReviewsOptions): Promise<Review[]>;
  function search(options: SearchOptions): Promise<AppDetails[]>;

  export default {
    app,
    reviews,
    search,
    sort,
  };
}
