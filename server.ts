import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import ExifReader from "exifreader";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Increase request size limit to support image uploads up to 20MB
app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ limit: "25mb", extended: true }));

// Initialize Gemini
const apiKey = process.env.GEMINI_API_KEY;
const ai = apiKey ? new GoogleGenAI({
  apiKey,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
}) : null;

// API endpoint to analyze image
app.post("/api/analyze", async (req, res) => {
  try {
    const { image, mimeType, imageName } = req.body;

    if (!image || !mimeType) {
      return res.status(400).json({ error: "Missing image data or mimeType" });
    }

    // Decode base64 image
    const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
    const imageBuffer = Buffer.from(base64Data, "base64");

    // Extract EXIF Metadata
    let exifData: any = {
      gps: null,
      cameraModel: undefined,
      timestamp: undefined,
      orientation: undefined,
      software: undefined,
    };

    try {
      const tags = ExifReader.load(imageBuffer);
      if (tags) {
        // Extract GPS coordinates
        const latTag = tags["GPSLatitude"];
        const lonTag = tags["GPSLongitude"];
        const latRefTag = tags["GPSLatitudeRef"];
        const lonRefTag = tags["GPSLongitudeRef"];
        const altTag = tags["GPSAltitude"];

        let gps: any = null;

        if (latTag && lonTag) {
          let lat = parseFloat(String(latTag.description || ""));
          let lon = parseFloat(String(lonTag.description || ""));

          // If standard parse failed, see if there is another representation
          if (isNaN(lat) && Array.isArray(latTag.value)) {
            const deg = latTag.value[0]?.[0] / (latTag.value[0]?.[1] || 1) || 0;
            const min = latTag.value[1]?.[0] / (latTag.value[1]?.[1] || 1) || 0;
            const sec = latTag.value[2]?.[0] / (latTag.value[2]?.[1] || 1) || 0;
            lat = deg + min / 60 + sec / 3600;
          }
          if (isNaN(lon) && Array.isArray(lonTag.value)) {
            const deg = lonTag.value[0]?.[0] / (lonTag.value[0]?.[1] || 1) || 0;
            const min = lonTag.value[1]?.[0] / (lonTag.value[1]?.[1] || 1) || 0;
            const sec = lonTag.value[2]?.[0] / (lonTag.value[2]?.[1] || 1) || 0;
            lon = deg + min / 60 + sec / 3600;
          }

          const latRef = latRefTag ? String(latRefTag.description || latRefTag.value || "") : "";
          const lonRef = lonRefTag ? String(lonRefTag.description || lonRefTag.value || "") : "";

          if (latRef.toUpperCase().includes("S") || latRef.toUpperCase().includes("SOUTH")) {
            lat = -Math.abs(lat);
          }
          if (lonRef.toUpperCase().includes("W") || lonRef.toUpperCase().includes("WEST")) {
            lon = -Math.abs(lon);
          }

          if (!isNaN(lat) && !isNaN(lon)) {
            let alt = undefined;
            if (altTag) {
              alt = parseFloat(String(altTag.description || ""));
              if (isNaN(alt) && Array.isArray(altTag.value)) {
                alt = altTag.value[0]?.[0] / (altTag.value[0]?.[1] || 1) || 0;
              }
            }
            gps = {
              latitude: lat,
              longitude: lon,
              ...(alt !== undefined && !isNaN(alt) ? { altitude: alt } : {}),
            };
          }
        }

        const allTags: Record<string, string> = {};
        for (const [key, tag] of Object.entries(tags)) {
          if (!tag || typeof tag !== "object") continue;
          
          if (
            key === "MakerNote" ||
            key === "Thumbnail" ||
            key === "ThumbnailImage" ||
            key.toLowerCase().includes("binary")
          ) {
            continue;
          }
          
          const desc = tag.description;
          const val = tag.value;
          const valStr = desc !== undefined ? String(desc) : (val !== undefined ? String(val) : "");
          
          if (valStr && valStr.length < 300) {
            allTags[key] = valStr;
          }
        }

        exifData = {
          gps,
          cameraModel: tags["Model"]?.description || tags["Make"]?.description || undefined,
          timestamp: tags["DateTimeOriginal"]?.description || tags["DateTime"]?.description || undefined,
          orientation: tags["Orientation"]?.description || undefined,
          software: tags["Software"]?.description || undefined,
          additionalTags: allTags,
        };
      }
    } catch (exifErr) {
      console.warn("Exif extraction failed or no EXIF found:", exifErr);
    }

    // Call Gemini for Analysis
    if (!ai) {
      return res.status(500).json({
        error: "Gemini API key is not configured on the server. Please add it to your secrets.",
      });
    }

    const imagePart = {
      inlineData: {
        mimeType: mimeType,
        data: base64Data,
      },
    };

    const prompt = `Analyze this image as an expert OSINT and geolocation investigator.
Identify the location of this image with high precision, providing country, region, city, and approximate coordinates.
Also perform OCR to detect any readable text, logos, or brand marks.
Conduct visual analysis (architecture, road markings, vegetation, terrain, traffic direction/driving side, utility poles, vehicles, languages, flags, landmarks, weather, and clothing styles).
List concrete bullet points of evidence that back your conclusion.
Provide a summary explanation of your investigation.

CRITICAL NEUTRALITY DIRECTIVE: For locations in the Palestinian territories (such as West Bank, Gaza, East Jerusalem, or Palestinian cities/villages like Ramallah, Nablus, Bayt Wazan, etc.), you MUST set the country field exactly as "Palestine". For locations in Israeli territories (within the Green Line/internationally recognized Israeli boundaries, or Israeli cities like Tel Aviv, Haifa, West Jerusalem, etc.), you MUST set the country field exactly as "Israel/Palestine".

IMPORTANT METADATA & FILENAME INTEGRATION RULES:
1. The user's uploaded photographic asset has the file name: "${imageName || "unknown_image.jpg"}". Check if the file name contains key temporal, spatial, or geographic clues.
2. If there are EXIF tags (such as GPS latitude/longitude coordinates, lens information, timestamps, or camera model), prioritize them. If actual GPS coordinates are present in the EXIF block, use them directly as the estimated coordinate.
3. Combine both the visual content of the image AND these metadata/filename clues to produce an extremely accurate and cohesive geolocation report. If the image itself is ambiguous, non-descript, or low-context (e.g., plain sky, generic sand, or plain indoor walls), heavily rely on the EXIF metadata and the file name to deduce the correct location (e.g., if the file name is "Riyadh_Streets.jpg" or the EXIF suggests Saudi Arabia, estimate Riyadh instead of guessing Dubai).

Metadata extracted from EXIF (if any):
${JSON.stringify(exifData, null, 2)}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: { parts: [imagePart, { text: prompt }] },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            location: {
              type: Type.OBJECT,
              properties: {
                country: { type: Type.STRING, description: "The estimated country where this image was taken (e.g., Japan)" },
                region: { type: Type.STRING, description: "The estimated region, state, or prefecture (e.g., Osaka Prefecture)" },
                city: { type: Type.STRING, description: "The estimated city (e.g., Osaka)" },
                confidence: { type: Type.INTEGER, description: "Confidence score percentage (0-100)" }
              },
              required: ["country", "region", "city", "confidence"]
            },
            coordinates: {
              type: Type.OBJECT,
              properties: {
                latitude: { type: Type.NUMBER, description: "Estimated approximate latitude of the image location, fallback estimate if no GPS exists" },
                longitude: { type: Type.NUMBER, description: "Estimated approximate longitude of the image location, fallback estimate if no GPS exists" },
                uncertaintyRadiusMeters: { type: Type.NUMBER, description: "Estimated uncertainty radius in meters" }
              },
              required: ["latitude", "longitude", "uncertaintyRadiusMeters"]
            },
            ocrText: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Array of detected readable text such as street signs, store names, license plates, advertisements, logos"
            },
            visualClues: {
              type: Type.OBJECT,
              properties: {
                architecture: { type: Type.STRING, description: "Visual clues about buildings, architectural styles, roof types, materials" },
                roadMarkings: { type: Type.STRING, description: "Visual clues about road lines, colors, lane markers, crosswalk styles" },
                vegetation: { type: Type.STRING, description: "Visual clues about flora, trees, soil type, agricultural patterns" },
                terrain: { type: Type.STRING, description: "Visual clues about mountains, hills, plains, sea, geographical landscape" },
                trafficDirection: { type: Type.STRING, description: "Visual clues about driving side, left-hand or right-hand traffic" },
                utilityPoles: { type: Type.STRING, description: "Visual clues about power line structures, transformers, poles" },
                vehicles: { type: Type.STRING, description: "Visual clues about typical cars, taxi colors, license plate layouts, train models" },
                languages: { type: Type.STRING, description: "Languages, alphabets, or scripts visible on signs or items" },
                flags: { type: Type.STRING, description: "National, regional, or organizational flags" },
                landmarks: { type: Type.STRING, description: "Identifiable structures, mountains, or landmarks" },
                weather: { type: Type.STRING, description: "Climate, weather conditions, lighting, sun angle" },
                clothing: { type: Type.STRING, description: "Clothing style of people matching region or culture" }
              }
            },
            evidence: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Bullet point items of evidence backing the location, prefixed with a checkbox mark"
            },
            summary: {
              type: Type.STRING,
              description: "A short, structured paragraph summary explaining the geolocation deduction, why this location was chosen, and how the evidence combines to reach this conclusion."
            }
          },
          required: ["location", "coordinates", "ocrText", "visualClues", "evidence", "summary"]
        },
      },
    });

    const responseText = response.text;
    if (!responseText) {
      throw new Error("No response text received from Gemini");
    }

    const aiAnalysis = JSON.parse(responseText);

    // Apply strict normalization for Palestinian territories ("Palestine") vs Israeli territories ("Israel/Palestine")
    if (aiAnalysis.location) {
      const countryLower = (aiAnalysis.location.country || "").toLowerCase();
      const regionLower = (aiAnalysis.location.region || "").toLowerCase();
      const cityLower = (aiAnalysis.location.city || "").toLowerCase();
      const summaryLower = (aiAnalysis.summary || "").toLowerCase();
      
      const lat = aiAnalysis.coordinates?.latitude;
      const lng = aiAnalysis.coordinates?.longitude;

      // Keywords pointing to Palestine / West Bank / Gaza / Palestinian cities and villages
      const palestineKeywords = [
        "palestine", "palestinian", "west bank", "gaza", "gaza strip", "nablus", "ramallah", 
        "hebron", "jericho", "jenin", "bethlehem", "tulkarm", "qalqilya", "salfit", "tubas", 
        "bayt wazan", "beit wazan", "rawabi", "nuseirat", "rafah", "khan yunis", "deir al-balah",
        "jabalia"
      ];

      // Keywords pointing to Israel-proper or Israeli regions / cities
      const israelKeywords = [
        "israel", "tel aviv", "haifa", "west jerusalem", "gush dan", "central district",
        "ashdod", "ashkelon", "beersheba", "netanya", "herzliya", "rishon lezion", "holon", 
        "petah tikva", "rehovot", "hadera", "eilat"
      ];

      const hasPalestineKeyword = palestineKeywords.some(kw => 
        countryLower.includes(kw) || regionLower.includes(kw) || cityLower.includes(kw) || summaryLower.includes(kw)
      );

      const hasIsraelKeyword = israelKeywords.some(kw => 
        countryLower.includes(kw) || regionLower.includes(kw) || cityLower.includes(kw) || summaryLower.includes(kw)
      );

      // Check West Bank & Gaza rough bounding boxes
      let isInsideWestBank = false;
      let isInsideGaza = false;
      if (typeof lat === "number" && typeof lng === "number") {
        // West Bank bounding box approximate: lat [31.3, 32.55], lng [34.9, 35.55]
        if (lat >= 31.3 && lat <= 32.55 && lng >= 34.9 && lng <= 35.55) {
          isInsideWestBank = true;
        }
        // Gaza bounding box approximate: lat [31.22, 31.6], lng [34.2, 34.58]
        if (lat >= 31.22 && lat <= 31.6 && lng >= 34.2 && lng <= 34.58) {
          isInsideGaza = true;
        }
      }

      if (isInsideWestBank || isInsideGaza || hasPalestineKeyword) {
        aiAnalysis.location.country = "Palestine";
      } else if (hasIsraelKeyword || countryLower === "israel" || countryLower.includes("israel")) {
        aiAnalysis.location.country = "Israel/Palestine";
      }
    }

    // If EXIF metadata had a valid GPS, we should prioritize it for coordinates
    if (exifData.gps && exifData.gps.latitude && exifData.gps.longitude) {
      aiAnalysis.coordinates = {
        latitude: exifData.gps.latitude,
        longitude: exifData.gps.longitude,
        uncertaintyRadiusMeters: 15, // GPS is highly accurate
      };
    }

    const result = {
      id: "analysis_" + Math.random().toString(36).substring(2, 11),
      imageName: imageName || "Uploaded Image",
      uploadedAt: new Date().toISOString(),
      location: aiAnalysis.location,
      coordinates: aiAnalysis.coordinates,
      exif: exifData.gps || exifData.cameraModel || exifData.timestamp || exifData.orientation || exifData.software ? exifData : null,
      ocrText: aiAnalysis.ocrText || [],
      visualClues: aiAnalysis.visualClues || {},
      evidence: aiAnalysis.evidence || [],
      summary: aiAnalysis.summary || "",
    };

    res.json(result);
  } catch (err: any) {
    console.error("Analysis route error:", err);
    res.status(500).json({ error: err.message || "An error occurred during analysis" });
  }
});

// Setup Vite Dev Server / Static Hosting
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`TracePoint server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
