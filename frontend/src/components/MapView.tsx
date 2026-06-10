"use client";

import { useEffect, useRef } from "react";
import { Property } from "@/lib/api";

interface MapViewProps {
  activePin: string | null;
  setActivePin: (id: string | null) => void;
  properties: Property[];
}

export default function MapView({ activePin, setActivePin, properties }: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<unknown>(null);

  // Only show properties that have real coordinates
  const mappedProps = properties.filter(p => p.latitude && p.longitude);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (mapInstanceRef.current) return;

    import("leaflet").then((L) => {
      if (!mapRef.current) return;

      
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      // Center on East Africa
      const map = L.map(mapRef.current).setView([1.3733, 32.2903], 7);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
      }).addTo(map);

      // Add markers for all properties with coordinates
      mappedProps.forEach((property) => {
        if (!property.latitude || !property.longitude) return;

        const price = property.amenities?.price as number | undefined;
        const priceLabel = price
          ? price >= 1000000
            ? `${property.currency || 'UGX'} ${(price / 1000000).toFixed(1)}M`
            : `${property.currency || 'UGX'} ${(price / 1000).toFixed(0)}K`
          : "POA";

        // Custom gold marker
        const icon = L.divIcon({
          className: "",
          html: `
            <div style="
              background: #c9a84c;
              color: #000;
              padding: 4px 8px;
              border-radius: 4px;
              font-size: 11px;
              font-weight: 700;
              white-space: nowrap;
              font-family: 'DM Sans', sans-serif;
              box-shadow: 0 2px 8px rgba(0,0,0,0.3);
              position: relative;
            ">
              ${priceLabel}
              <div style="
                position: absolute;
                bottom: -6px;
                left: 50%;
                transform: translateX(-50%);
                width: 0;
                height: 0;
                border-left: 6px solid transparent;
                border-right: 6px solid transparent;
                border-top: 6px solid #c9a84c;
              "></div>
            </div>
          `,
          iconAnchor: [30, 36],
        });

        const marker = L.marker([property.latitude, property.longitude], { icon })
          .addTo(map)
          .bindPopup(`
            <div style="font-family: 'DM Sans', sans-serif; min-width: 200px;">
              ${property.images?.[0] ? `<img src="${property.images[0]}" style="width:100%; height:100px; object-fit:cover; margin-bottom:8px; border-radius:2px;" />` : ''}
              <div style="font-weight:600; margin-bottom:4px;">${property.title}</div>
              <div style="color:#666; font-size:12px; margin-bottom:4px;">📍 ${property.location}</div>
              <div style="color:#c9a84c; font-weight:700;">${priceLabel}</div>
              ${property.bedrooms ? `<div style="font-size:11px; color:#888; margin-top:4px;">🛏 ${property.bedrooms} beds · 🚿 ${property.bathrooms} baths</div>` : ''}
            </div>
          `, { maxWidth: 240 });

        marker.on("click", () => setActivePin(property.id));
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
    <div style={{ position: "relative", height: "100%", minHeight: 400 }}>
      {mappedProps.length === 0 && (
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0,
          background: "rgba(10,10,11,0.85)", backdropFilter: "blur(8px)",
          zIndex: 10, padding: "16px 20px", display: "flex",
          alignItems: "center", gap: 12,
        }}>
          <span style={{ fontSize: 20 }}>🗺️</span>
          <div>
            <div style={{ fontSize: 13, color: "var(--text)", fontWeight: 500 }}>No pinned properties yet</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Properties will appear on the map once agents add location pins when listing.</div>
          </div>
        </div>
      )}
      <div ref={mapRef} style={{ height: "100%", minHeight: 400, width: "100%" }} />
    </div>
  );
}