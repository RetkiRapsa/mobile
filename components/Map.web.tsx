import React, { useEffect, useState } from 'react';
import { MapContainer, Marker, TileLayer, useMap } from 'react-leaflet';

import L from 'leaflet';
import 'leaflet-defaulticon-compatibility';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css';
import 'leaflet/dist/leaflet.css';

import Location from '@/types/Location';
import { getIconName } from '@/utils/map';

// Fix for default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Icon mapping to MaterialDesignIcons unicode characters
const iconUnicode: Record<string, string> = {
  tent: '⛺',
  campfire: '🔥',
  waves: '🌊',
  bridge: '🌉',
  'chevron-up-box-outline': '⬆️',
  toilet: '🚻',
  parking: '🅿️',
  'map-marker-question': '❓',
};

// Create custom icon
function createCustomIcon(iconName: string, available: boolean, ticks: boolean) {
  const icon = iconUnicode[iconName] || iconUnicode['map-marker-question'];
  const borderColor = ticks ? 'red' : 'green';
  const iconColor = available ? 'black' : 'red';

  return L.divIcon({
    html: `<div style="
      display: flex;
      align-items: center;
      justify-content: center;
      border: 2px solid ${borderColor};
      border-radius: 8px;
      background-color: lightblue;
      width: 34px;
      height: 34px;
      font-size: 20px;
      color: ${iconColor};
    ">${icon}</div>`,
    className: 'custom-marker',
    iconSize: [34, 34],
    iconAnchor: [17, 17],
  });
}

// Component to handle map updates
function MapController({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();

  useEffect(() => {
    if (center) {
      map.flyTo(center, zoom, { duration: 1.5 });
    }
  }, [center, zoom, map]);

  return null;
}

interface LeafletMapProps {
  location: { latitude: number; longitude: number } | null;
  visibleLocations: Location[];
  onMarkerClick: (location: Location) => void;
}

export default function LeafletMapWeb({
  location,
  visibleLocations,
  onMarkerClick,
}: LeafletMapProps) {
  const [mapCenter, setMapCenter] = useState<[number, number]>([60.1699, 24.9384]);
  const [mapZoom, setMapZoom] = useState(16); // Zoom 16 ≈ 200m radius view

  useEffect(() => {
    if (location) {
      setMapCenter([location.latitude, location.longitude]);
    }
  }, [location]);

  return (
    <MapContainer
      center={mapCenter}
      zoom={mapZoom}
      scrollWheelZoom={true}
      style={{ height: '100%', width: '100%' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapController center={mapCenter} zoom={mapZoom} />

      {visibleLocations.map((loc) => (
        <Marker
          key={loc.id}
          position={[loc.latitude, loc.longitude]}
          icon={createCustomIcon(getIconName(loc.type!), loc.available, loc.ticks)}
          eventHandlers={{
            click: () => {
              onMarkerClick(loc);
            },
          }}
        />
      ))}
    </MapContainer>
  );
}
