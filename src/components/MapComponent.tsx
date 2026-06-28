import React, { useEffect, useRef } from "react";
import L from "leaflet";

interface MapComponentProps {
  latitude: number;
  longitude: number;
  uncertaintyRadius: number;
}

export default function MapComponent({ latitude, longitude, uncertaintyRadius }: MapComponentProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const circleRef = useRef<L.Circle | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Create map if it doesn't exist
    if (!mapRef.current) {
      mapRef.current = L.map(mapContainerRef.current, {
        zoomControl: true,
        attributionControl: false,
      }).setView([latitude, longitude], 13);

      // Add tile layer
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
      }).addTo(mapRef.current);
    } else {
      // If it exists, update view
      mapRef.current.setView([latitude, longitude]);
    }

    const map = mapRef.current;

    // Remove old marker/circle if present
    if (markerRef.current) {
      map.removeLayer(markerRef.current);
    }
    if (circleRef.current) {
      map.removeLayer(circleRef.current);
    }

    // Custom Icon (pulsing SVG pin)
    const customPinIcon = L.divIcon({
      html: `
        <div class="relative flex items-center justify-center">
          <div class="absolute w-8 h-8 rounded-full bg-indigo-500 opacity-40 animate-ping"></div>
          <div class="relative w-8 h-8 flex items-center justify-center bg-indigo-600 rounded-full border-2 border-white shadow-lg transform -translate-y-1">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="text-white"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
          </div>
        </div>
      `,
      className: "custom-pin-icon",
      iconSize: [32, 32],
      iconAnchor: [16, 24],
    });

    // Add marker
    markerRef.current = L.marker([latitude, longitude], { icon: customPinIcon }).addTo(map);

    // Add uncertainty circle if present and > 0
    if (uncertaintyRadius > 0) {
      circleRef.current = L.circle([latitude, longitude], {
        color: "#6366f1",
        fillColor: "#818cf8",
        fillOpacity: 0.15,
        radius: uncertaintyRadius,
        weight: 1.5,
      }).addTo(map);

      // Fit map bounds to show circle
      try {
        const bounds = circleRef.current.getBounds();
        map.fitBounds(bounds, { maxZoom: 15, padding: [20, 20] });
      } catch (e) {
        map.setView([latitude, longitude], 13);
      }
    } else {
      map.setView([latitude, longitude], 15);
    }
  }, [latitude, longitude, uncertaintyRadius]);

  // Handle map resizing
  useEffect(() => {
    const handleResize = () => {
      if (mapRef.current) {
        mapRef.current.invalidateSize();
      }
    };

    const observer = new ResizeObserver(() => {
      handleResize();
    });

    if (mapContainerRef.current) {
      observer.observe(mapContainerRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden border border-slate-100 shadow-inner">
      <div ref={mapContainerRef} className="w-full h-full z-10" />

      {/* Floating coordinates tag */}
      <div className="absolute bottom-3 left-3 z-20 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-slate-200/80 shadow-md text-xs font-mono text-slate-700 flex items-center gap-1.5">
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-indigo-600"><circle cx="12" cy="12" r="10"/><path d="m16.2 7.8-2 2"/><path d="m7.8 16.2 2-2"/><path d="m12 8 .01-4"/><path d="m12 16 .01 4"/><path d="M8 12h-4"/><path d="M16 12h4"/></svg>
        <span>
          {latitude.toFixed(6)}, {longitude.toFixed(6)}
        </span>
      </div>
    </div>
  );
}
