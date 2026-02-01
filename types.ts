
export enum Language {
  ENGLISH = 'en',
  KANNADA = 'kn'
}

export enum Region {
  GLOBAL = 'Global',
  COUNTRY = 'India',
  STATE = 'Karnataka',
  CITY = 'Local',
  SAVED = 'Saved',
  READ_LATER = 'Read Later'
}

export enum NewsGenre {
  ALL = 'All',
  TRENDING = 'Trending',
  POLITICS = 'Politics',
  CURRENT_AFFAIRS = 'Current Affairs',
  SPORTS = 'Sports',
  ENTERTAINMENT = 'Entertainment',
  BUSINESS = 'Business',
  TECH = 'Technology',
  HEALTH = 'Health',
  CRIME = 'Crime',
  EDUCATION = 'Education'
}

export interface NewsItem {
  id: string;
  title: string;
  summary: string;
  fullDescription?: string;
  source: string;
  sourceUrl: string;
  timestamp: string;
  category: NewsGenre;
  region: string;
  imageUrl?: string;
  isUrgent: boolean;
  isVerified: boolean;
}

export interface GeolocationData {
  city?: string;
  state?: string;
  country?: string;
}
