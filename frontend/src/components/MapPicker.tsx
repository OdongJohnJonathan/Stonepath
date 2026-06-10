"use client";

import { useEffect, useRef } from "react";

interface MapPickerProps {
  latitude: number | null;
  longitude: number | null;
  onChange: (lat: number, lng: number) => void;
}

export default function MapPicker({ latitude, longitude, onChange }: MapPickerProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<unknown>(null);
  const markerRef = useRef<unknown>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (mapInstanceRef.current) return; // already initialized

    // Dynamically import leaflet to avoid SSR issues
    import("leaflet").then((L) => {
      if (!mapRef.current) return;

      // Fix default marker icon paths
      // REPLACE with this:
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      // Default center — Kampala, Uganda
      const defaultLat = latitude || 0.3476;
      const defaultLng = longitude || 32.5825;

      const map = L.map(mapRef.current).setView([defaultLat, defaultLng], 13);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
      }).addTo(map);

      // Add marker if coordinates already exist
      if (latitude && longitude) {
        markerRef.current = L.marker([latitude, longitude]).addTo(map);
      }

      // Click to place/move marker
      map.on("click", (e: { latlng: { lat: number; lng: number } }) => {
        const { lat, lng } = e.latlng;

        // Remove old marker
        if (markerRef.current) {
          (markerRef.current as { remove: () => void }).remove();
        }

        // Add new marker
        markerRef.current = L.marker([lat, lng])
          .addTo(map)
          .bindPopup("📍 Property location")
          .openPopup();

        onChange(lat, lng);
      });

      mapInstanceRef.current = map;
    });

    return () => {
      if (mapInstanceRef.current) {
        (mapInstanceRef.current as { remove: () => void }).remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  return (
    <div>
      <div
        ref={mapRef}
        style={{ height: 280, width: "100%", borderRadius: 2, border: "1px solid var(--border)", zIndex: 1 }}
      />
      {latitude && longitude ? (
        <div style={{ fontSize: 12, color: "var(--gold)", marginTop: 6 }}>
          📍 Pin placed at {latitude.toFixed(5)}, {longitude.toFixed(5)} — click map to adjust
        </div>
      ) : (
        <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 6 }}>
          Click anywhere on the map to place the property pin
        </div>
      )}
    </div>
  );
}