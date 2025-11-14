// src/components/MapView.tsx
"use client";

import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from "react-leaflet";
import L from "leaflet";
import { useEffect, useState } from "react";

type Props = {
  onLocationChange?: (pos: { lat: number; lng: number; accuracy?: number }) => void;
};

const markerIcon = new L.Icon({
  iconUrl: "/marker-icon.png",
  iconRetinaUrl: "/marker-icon-2x.png",
  shadowUrl: "/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

function ChangeView({ center }: { center: [number, number] }) {
  const map = useMap();
  map.setView(center, 15);
  return null;
}

export default function MapView({ onLocationChange }: Props) {
  const [position, setPosition] = useState<[number, number] | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const defaultIndia: [number, number] = [20.5937, 78.9629];

  useEffect(() => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const p: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setPosition(p);
        setAccuracy(pos.coords.accuracy);
        if (onLocationChange) onLocationChange({ lat: p[0], lng: p[1], accuracy: pos.coords.accuracy });
      },
      (err) => {
        console.error("Geolocation error:", err);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, [onLocationChange]);

  return (
    <div className="h-[420px] w-full rounded-xl overflow-hidden border shadow">
      <MapContainer center={position || defaultIndia} zoom={position ? 15 : 5} style={{ height: "100%", width: "100%" }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap" />
        {position && (
          <>
            <ChangeView center={position} />
            <Marker position={position} icon={markerIcon}>
              <Popup>You're here — accuracy: {accuracy ? `${Math.round(accuracy)} m` : "unknown"}</Popup>
            </Marker>
            {accuracy && (
              <Circle
                center={position}
                radius={Math.min(accuracy, 150)} // visually cap so it doesn't cover entire map
                pathOptions={{ color: "blue", fillColor: "blue", fillOpacity: 0.08 }}
              />
            )}
          </>
        )}
      </MapContainer>
    </div>
  );
}
