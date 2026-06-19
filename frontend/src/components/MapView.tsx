"use client";

import { useEffect, useRef } from "react";
import { Property } from "@/lib/api";

interface MapViewProps {
  activePin: string | null;
  setActivePin: (id: string | null) => void;
  properties: Property[];
  onSelectProperty?: (property: Property) => void; // NEW — click marker to open full detail
}

export default function MapView({ activePin, setActivePin, properties, onSelectProperty }: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<unknown>(null);

  const mappedProps = properties.filter(p => p.latitude && p.longitude);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!mapRef.current) return;
    if (mapInstanceRef.current) return;

    if (mapRef.current.classList.contains("leaflet-container")) return;

    import("leaflet").then((L) => {
      if (!mapRef.current) return;
      if (mapRef.current.classList.contains("leaflet-container")) return;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      // If there's exactly one property (e.g. single-property detail view), center on it
      const initialView: [number, number] = mappedProps.length === 1
        ? [mappedProps[0].latitude as number, mappedProps[0].longitude as number]
        : [1.3733, 32.2903];
      const initialZoom = mappedProps.length === 1 ? 14 : 7;

      const map = L.map(mapRef.current).setView(initialView, initialZoom);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
      }).addTo(map);

      const typeInfo: Record<number, { label: string; color: string }> = {
        1: { label: "Sale",       color: "#c9a84c" },
        2: { label: "Rent",       color: "#3b82f6" },
        3: { label: "Short Stay", color: "#22c55e" },
      };

      mappedProps.forEach((property) => {
        if (!property.latitude || !property.longitude) return;

        const isShortStayPin = property.transaction_type_id === 3;
        const price = isShortStayPin
          ? (property.amenities?.daily_rate as number | undefined)
          : (property.amenities?.price as number | undefined);
        const priceLabel = price
          ? price >= 1000000
            ? `${property.currency || 'UGX'} ${(price / 1000000).toFixed(1)}M${isShortStayPin ? '/night' : ''}`
            : `${property.currency || 'UGX'} ${(price / 1000).toFixed(0)}K${isShortStayPin ? '/night' : ''}`
          : "POA";

        const tInfo = typeInfo[property.transaction_type_id || 1] || typeInfo[1];

        const icon = L.divIcon({
          className: "",
          html: `
            <div style="
              background: ${tInfo.color}; color: #000; padding: 4px 8px;
              border-radius: 4px; font-size: 11px; font-weight: 700;
              white-space: nowrap; font-family: 'DM Sans', sans-serif;
              box-shadow: 0 2px 8px rgba(0,0,0,0.3); position: relative;
              display: flex; align-items: center; gap: 4px;
            ">
              <span style="font-size:9px; opacity:0.75; text-transform:uppercase; letter-spacing:0.04em;">${tInfo.label}</span>
              <span>${priceLabel}</span>
              <div style="
                position: absolute; bottom: -6px; left: 50%;
                transform: translateX(-50%); width: 0; height: 0;
                border-left: 6px solid transparent;
                border-right: 6px solid transparent;
                border-top: 6px solid ${tInfo.color};
              "></div>
            </div>
          `,
          iconAnchor: [30, 36],
        });

        const popupId = `map-popup-view-${property.id}`;

        const marker = L.marker([property.latitude, property.longitude], { icon })
          .addTo(map)
          .bindPopup(`
            <div style="font-family: 'DM Sans', sans-serif; min-width: 200px;">
              ${property.images?.[0] ? `<img src="${property.images[0]}" style="width:100%; height:100px; object-fit:cover; margin-bottom:8px; border-radius:2px;" />` : ''}
              <div style="font-weight:600; margin-bottom:4px;">${property.title}</div>
              <div style="color:#666; font-size:12px; margin-bottom:4px;">📍 ${property.location}</div>
              <div style="color:${tInfo.color}; font-weight:700; margin-bottom:8px;">${priceLabel}</div>
              ${property.bedrooms ? `<div style="font-size:11px; color:#888; margin-bottom:8px;">🛏 ${property.bedrooms} beds · 🚿 ${property.bathrooms} baths</div>` : ''}
              ${onSelectProperty ? `<button id="${popupId}" style="width:100%; background:${tInfo.color}; border:none; color:#000; padding:8px; font-size:11px; font-weight:700; letter-spacing:0.05em; text-transform:uppercase; cursor:pointer; border-radius:2px; font-family:'DM Sans', sans-serif;">View Details</button>` : ''}
            </div>
          `, { maxWidth: 240 });

        marker.on("click", () => setActivePin(property.id));

        // Wire up the "View Details" button inside the popup once it opens
        if (onSelectProperty) {
          marker.on("popupopen", () => {
            const btn = document.getElementById(popupId);
            if (btn) {
              btn.onclick = () => onSelectProperty(property);
            }
          });
        }
      });

      mapInstanceRef.current = map;
    });

    return () => {
      if (mapInstanceRef.current) {
        (mapInstanceRef.current as { remove: () => void }).remove();
        mapInstanceRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
            <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Properties will appear here once agents pin their locations.</div>
          </div>
        </div>
      )}
      <div ref={mapRef} style={{ height: "100%", minHeight: 400, width: "100%" }} />
    </div>
  );
}