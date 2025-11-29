export interface ImageAsset {
  id: string;
  url: string; // Used for display
  base64?: string; // Used for API calls (loaded on demand)
  isUserUploaded?: boolean;
}

export interface GenerationHistory {
  id: string;
  personImage: string;
  clothingImage: string;
  resultImage: string;
  timestamp: number;
}

export enum AppStep {
  SELECT_PERSON = 1,
  SELECT_CLOTHING = 2,
  GENERATE = 3
}

export type LoadingState = 'idle' | 'loading' | 'success' | 'error';
