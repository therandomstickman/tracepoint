export interface LocationEstimate {
  country: string;
  region: string;
  city: string;
  confidence: number;
}

export interface Coordinates {
  latitude: number;
  longitude: number;
  uncertaintyRadiusMeters: number;
}

export interface ExifData {
  gps: {
    latitude?: number;
    longitude?: number;
    altitude?: number;
  } | null;
  cameraModel?: string;
  timestamp?: string;
  orientation?: string;
  software?: string;
  additionalTags?: Record<string, string>;
}

export interface VisualClues {
  architecture?: string;
  roadMarkings?: string;
  vegetation?: string;
  terrain?: string;
  trafficDirection?: string;
  utilityPoles?: string;
  vehicles?: string;
  languages?: string;
  flags?: string;
  landmarks?: string;
  weather?: string;
  clothing?: string;
}

export interface AnalysisResult {
  id: string;
  imageName: string;
  uploadedAt: string;
  location: LocationEstimate;
  coordinates: Coordinates;
  exif: ExifData | null;
  ocrText: string[];
  visualClues: VisualClues;
  evidence: string[];
  summary: string;
}
