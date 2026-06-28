import { AnalysisResult } from "./types";

export const sampleAnalyses: AnalysisResult[] = [
  {
    id: "sample_japan",
    imageName: "osaka_street_dusk.jpg",
    uploadedAt: "2026-06-26T11:00:00Z",
    location: {
      country: "Japan",
      region: "Osaka Prefecture",
      city: "Osaka",
      confidence: 94
    },
    coordinates: {
      latitude: 34.6937,
      longitude: 135.5023,
      uncertaintyRadiusMeters: 100
    },
    exif: {
      gps: {
        latitude: 34.6937,
        longitude: 135.5023,
        altitude: 12
      },
      cameraModel: "Fujifilm X-T4",
      timestamp: "2026-04-12 18:24:05",
      orientation: "Horizontal (normal)",
      software: "Digital Camera Fujifilm X-T4 v1.2",
      additionalTags: {
        "LensModel": "XF35mmF2 R WR",
        "ExposureTime": "1/125 sec",
        "FNumber": "f/2.0",
        "ISO": "400",
        "ApertureValue": "f/2.0",
        "FocalLength": "35.0 mm",
        "MeteringMode": "Multi-segment",
        "Flash": "Flash did not fire, compulsory flash mode",
        "ColorSpace": "sRGB",
        "SensingMethod": "One-chip color area sensor",
        "ExposureProgram": "Aperture priority",
        "WhiteBalance": "Auto",
        "FocalLengthIn35mmFormat": "53 mm",
        "SceneCaptureType": "Standard",
        "Sharpness": "Normal"
      }
    },
    ocrText: [
      "ファミリーマート (FamilyMart)",
      "止まれ (Stop Sign)",
      "南船場 3-chome",
      "大阪市"
    ],
    visualClues: {
      architecture: "Narrow multi-story commercial buildings with dense external piping and fire escapes. Characteristic Japanese storefront layout.",
      roadMarkings: "White '止まれ' (Stop) characters painted directly on the narrow asphalt road, bordered by white lane-boundary lines.",
      vegetation: "Small, carefully pruned decorative cherry blossom (Sakura) trees in street planters.",
      terrain: "Extremely flat, high-density coastal plain metropolis.",
      trafficDirection: "Left-hand traffic system, corroborated by vehicle orientation and road markings.",
      utilityPoles: "Dense, complex overhead utility lines with cylindrical grey concrete poles, multiple transformers, and streetlamp attachments.",
      vehicles: "Compact kei-cars (yellow license plates) and local metropolitan delivery vans.",
      languages: "Japanese Kanji, Hiragana, and Katakana scripts with minor English romaji for tourist signage.",
      flags: "No flags visible in primary frame.",
      landmarks: "Generic cityscape, but signage indicates proximity to Shinsaibashi/Minami commercial area.",
      weather: "Overcast dusk, diffused golden lighting, high humidity indicator.",
      clothing: "Pedestrians wearing standard modern metropolitan corporate attire and lightweight trench coats."
    },
    evidence: [
      "✓ '止まれ' (Stop) Japanese road markings painted on asphalt",
      "✓ FamilyMart convenience store branding and logo visible",
      "✓ Yellow-plate compact Kei cars characteristic of Japan",
      "✓ Left-side traffic system with vehicles positioned on the left",
      "✓ Distinctive double-transformer concrete utility poles",
      "✓ Shinsaibashi / Minami district street name indicators"
    ],
    summary: "This image is located in Osaka, Japan (specifically in the Minami/Shinsaibashi neighborhood). The conclusion is backed by high-certainty GPS coordinates from the camera EXIF header, and fully corroborated by visual visual indicators: Japanese Kanji painted stop signs, left-side traffic flow, FamilyMart convenience branding, and concrete utility poles specific to Kansai urban infrastructure."
  },
  {
    id: "sample_france",
    imageName: "paris_cafe_avenue.jpg",
    uploadedAt: "2026-06-25T15:30:00Z",
    location: {
      country: "France",
      region: "Île-de-France",
      city: "Paris",
      confidence: 88
    },
    coordinates: {
      latitude: 48.8566,
      longitude: 2.3522,
      uncertaintyRadiusMeters: 500
    },
    exif: {
      gps: null,
      cameraModel: "iPhone 13 Pro",
      timestamp: "2026-06-25 15:28:44",
      orientation: "Horizontal (normal)",
      software: "iOS 15.4.1",
      additionalTags: {
        "LensModel": "iPhone 13 Pro back triple camera 5.7mm f/1.5",
        "ExposureTime": "1/220 sec",
        "FNumber": "f/1.5",
        "ISO": "50",
        "ApertureValue": "f/1.5",
        "FocalLength": "5.7 mm",
        "FocalLengthIn35mmFormat": "26 mm",
        "MeteringMode": "Pattern",
        "Flash": "Flash did not fire, auto mode",
        "ColorSpace": "sRGB",
        "SensingMethod": "One-chip color area sensor",
        "ExposureProgram": "Normal program",
        "WhiteBalance": "Auto",
        "SceneCaptureType": "Standard",
        "LensSpecification": "1.57mm, 5.7mm, 9mm / f/1.5, f/1.5, f/2.8"
      }
    },
    ocrText: [
      "BOULANGERIE",
      "RUE DE RIVOLI",
      "LE METRO"
    ],
    visualClues: {
      architecture: "Classic Haussmann-style limestone residential buildings featuring black wrought-iron balconies, continuous cornices, and zinc mansard roofs.",
      roadMarkings: "Standard white-dashed lane markings, cobblestone street texture, and prominent pedestrian crossings.",
      vegetation: "Neatly lined deciduous Plane trees (Platanus occidentalis) bordering the wide boulevard.",
      terrain: "Flat river basin topography with historic urban dense layout.",
      trafficDirection: "Right-hand traffic system.",
      utilityPoles: "Cast-iron ornamental streetlamps, specifically the dark green Parisian double-lantern model. Absence of overhead power lines.",
      vehicles: "European hatchback models (Renault, Peugeot, Citroën) carrying French-style white license plates with blue EU bands.",
      languages: "French language on boulangerie signage and official dark-blue street plaques.",
      flags: "French Tricolor flag visible in the background near a public building.",
      landmarks: "Avenue leading toward a distant historic monument resembling the Louvre palace wing.",
      weather: "Bright, sunny spring morning with clear blue skies and soft light shadows.",
      clothing: "Cafe patrons wearing casual chic clothing, sunglasses, and lightweight denim jackets."
    },
    evidence: [
      "✓ Rue de Rivoli dark-blue enamel street sign with green borders",
      "✓ Haussmannian architecture with zinc roofs and continuous stone balconies",
      "✓ Classic green Morris column and cast-iron metro entrance in the background",
      "✓ Lined Plane trees, characteristic of major French urban boulevards",
      "✓ White license plates with the European Union blue strip on the left and French regional identifier on the right"
    ],
    summary: "This image was taken in Paris, France along Rue de Rivoli. Although EXIF GPS data was missing, visual clues provide extremely high confidence. The limestone Haussmann-style facades, Mansard roofs, Plane-tree boulevard styling, and French shop names ('Boulangerie') consistently point to Paris. The location is narrowed to the 1st arrondissement by the legible street plaque."
  },
  {
    id: "sample_iceland",
    imageName: "reykjavik_harbor.jpg",
    uploadedAt: "2026-06-24T09:15:00Z",
    location: {
      country: "Iceland",
      region: "Capital Region",
      city: "Reykjavík",
      confidence: 82
    },
    coordinates: {
      latitude: 64.1466,
      longitude: -21.9426,
      uncertaintyRadiusMeters: 2000
    },
    exif: {
      gps: null,
      cameraModel: "Sony Alpha 7R III",
      timestamp: "2026-05-30 14:02:11",
      orientation: "Horizontal (normal)",
      software: "ILCE-7RM3 v3.10",
      additionalTags: {
        "LensModel": "FE 24-105mm F4 G OSS",
        "ExposureTime": "1/800 sec",
        "FNumber": "f/8.0",
        "ISO": "100",
        "ApertureValue": "f/8.0",
        "FocalLength": "35.0 mm",
        "FocalLengthIn35mmFormat": "35 mm",
        "MeteringMode": "Multi-segment",
        "Flash": "Flash did not fire, compulsory flash mode",
        "ColorSpace": "sRGB",
        "ExposureProgram": "Manual",
        "WhiteBalance": "Manual",
        "CreativeStyle": "Landscape",
        "DynamicRangeOptimizer": "Off",
        "LensSpecification": "24-105mm f/4.0"
      }
    },
    ocrText: [
      "KAFFI",
      "SNAEFELL",
      "ISLANDS"
    ],
    visualClues: {
      architecture: "Modest residential and commercial structures clad in brightly painted corrugated metal sheets, typical of high-latitude windproofing.",
      roadMarkings: "Faded yellow and white road markings, heavily weathered by winter salt and studded tires.",
      vegetation: "Extremely sparse, low-lying shrubs and mossy green patches on volcanic rock. Complete absence of tall deciduous trees.",
      terrain: "Rugged basaltic coast with sweeping snow-capped volcanic ridges visible across the bay (Esja mountain).",
      trafficDirection: "Right-hand traffic system.",
      utilityPoles: "Short, heavy wooden telephone poles with simplified insulators. Power lines buried underground.",
      vehicles: "Large 4x4 SUVs and modified off-road trucks with snorkel kits and wide high-clearance tires.",
      languages: "Icelandic language with specific characters (ð, þ, æ) on local coffee shop signage.",
      flags: "Icelandic national flag on a harbor flagstaff.",
      landmarks: "Harbor layout with fishing vessels and Mount Esja visible across Faxaflói Bay.",
      weather: "Crisp, cold ocean breeze, clear sky with low-angle arctic sun and brilliant reflection on the water.",
      clothing: "Pedestrians wearing heavy-duty wool sweaters (Lopapeysa), thermal parkas, and hiking boots."
    },
    evidence: [
      "✓ Icelandic letters on storefronts ('KAFFI')",
      "✓ Traditional corrugated metal siding on historic harborside buildings",
      "✓ Mount Esja volcanic ridge visible across the bay to the north",
      "✓ Heavy 4x4 modified super-jeeps suited for F-roads and highland terrain",
      "✓ Complete absence of tall trees combined with sub-arctic volcanic coastal geography"
    ],
    summary: "The image shows the Old Harbor of Reykjavík, Iceland. Geolocation is confirmed by Mount Esja across the water, the sub-arctic climate markers, traditional Icelandic corrugated-iron architectural facades, and Icelandic script. The presence of specialized heavy-duty 4x4 vehicles and marine vessels further aligns with Faxaflói coastal harbor lanes."
  }
];
