import React, { useEffect, useRef, useState } from 'react';
import { StudySpot } from '../types';
import { Compass, Info, MapPin } from 'lucide-react';
import L from 'leaflet';

interface InteractiveMapProps {
  spots: StudySpot[];
  selectedSpot: StudySpot | null;
  onSelectSpot: (spot: StudySpot) => void;
  favorites: string[];
  onToggleFavorite: (id: string) => void;
}

// Custom Div Icon generator to display beautifully styled Tailwind HTML pins
const createMarkerIcon = (isSelected: boolean, isFav: boolean) => {
  const bgClass = isSelected
    ? 'bg-sky-500 text-white border-sky-200'
    : isFav
    ? 'bg-rose-500 text-white border-rose-200'
    : 'bg-emerald-700 text-white border-emerald-200';

  const pulseRing = isSelected
    ? '<span class="absolute inline-flex h-8 w-8 rounded-full bg-sky-400 opacity-60 animate-ping"></span>'
    : '';

  return L.divIcon({
    className: 'custom-leaflet-marker',
    html: `
      <div class="relative flex items-center justify-center">
        ${pulseRing}
        <div class="w-8 h-8 rounded-full flex items-center justify-center border-2 shadow-md transition-all duration-300 ${bgClass}">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-map-pin">
            <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0Z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
        </div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -12]
  });
};

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  spots,
  selectedSpot,
  onSelectSpot,
  favorites,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<{ [key: string]: L.Marker }>({});

  // 1. Initialize map on mount
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      zoomControl: true,
      scrollWheelZoom: true,
      attributionControl: true,
    }).setView([29.940788, -90.120453], 16.5);

    mapRef.current = map;

    // Use a clean, elegant OpenStreetMap Voyager tile layer
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 20,
    }).addTo(map);

    // Initial resize trigger to guarantee Leaflet expands correctly
    setTimeout(() => {
      map.invalidateSize();
    }, 200);

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // 2. Synchronize markers when spots, favorites, or selections change
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Clear existing markers
    Object.values(markersRef.current).forEach((marker: L.Marker) => {
      marker.remove();
    });
    markersRef.current = {};

    // Render new markers
    spots.forEach((spot) => {
      const isSelected = selectedSpot?.id === spot.id;
      const isFav = favorites.includes(spot.id);

      const marker = L.marker([spot.lat, spot.lng], {
        icon: createMarkerIcon(isSelected, isFav),
      }).addTo(map);

      // Custom popups that look integrated
      const popupElement = document.createElement('div');
      popupElement.className = 'font-sans min-w-[220px] text-slate-800 p-1';
      popupElement.innerHTML = `
        <div class="flex flex-col gap-1.5">
          <div class="flex items-center justify-between gap-2 border-b border-slate-100 pb-1 mb-0.5">
            <span class="text-[9px] font-bold text-emerald-800 uppercase tracking-wider">${spot.building.split(' ')[0]}</span>
            <span class="text-[9px] text-slate-500 font-mono">${spot.hours}</span>
          </div>
          <h4 class="font-bold text-xs text-slate-900 leading-tight">${spot.name}</h4>
          <p class="text-[10px] text-slate-500 line-clamp-2 mt-0.5 leading-normal">${spot.description}</p>
          <div class="flex gap-1.5 items-center mt-1">
            <span class="text-[8px] font-semibold bg-emerald-50 text-emerald-800 px-1.5 py-0.5 rounded">🔊 ${spot.quietLevel}</span>
            <span class="text-[8px] font-semibold bg-blue-50 text-blue-800 px-1.5 py-0.5 rounded">🔌 Outlets: ${spot.outlets}</span>
          </div>
          <button id="popup-view-btn-${spot.id}" class="mt-2 text-center w-full bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-[10px] py-1 px-2 rounded shadow-sm transition-colors cursor-pointer">
            Select & View Details
          </button>
        </div>
      `;

      marker.bindPopup(popupElement, {
        closeButton: true,
        className: 'custom-leaflet-popup',
      });

      marker.on('click', () => {
        onSelectSpot(spot);
      });

      marker.on('popupopen', () => {
        const btn = document.getElementById(`popup-view-btn-${spot.id}`);
        if (btn) {
          btn.addEventListener('click', (e) => {
            e.stopPropagation();
            onSelectSpot(spot);
            marker.closePopup();
          });
        }
      });

      markersRef.current[spot.id] = marker;

      if (isSelected) {
        marker.openPopup();
      }
    });
  }, [spots, favorites, selectedSpot, onSelectSpot]);

  // 3. Pan/zoom to selected spot when it changes externally
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedSpot) return;

    map.setView([selectedSpot.lat, selectedSpot.lng], 17.5, {
      animate: true,
      duration: 1.0,
    });

    const marker = markersRef.current[selectedSpot.id];
    if (marker && !marker.isPopupOpen()) {
      marker.openPopup();
    }
  }, [selectedSpot]);

  return (
    <div className="relative z-10 w-full h-[360px] md:h-[500px] bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden shadow-sm flex flex-col">
      {/* Map Header / Indicators overlay */}
      <div className="absolute top-4 left-4 z-20 bg-white/95 backdrop-blur-md border border-slate-200 rounded-xl px-3 py-2 flex items-center gap-2 pointer-events-none shadow-sm">
        <Compass className="w-4 h-4 text-emerald-700 animate-spin-slow" />
        <span className="font-sans font-semibold text-xs text-slate-800 uppercase tracking-wider">
          Live Tulane Uptown Campus Map
        </span>
      </div>

      {/* Map Legend Overlay */}
      <div className="absolute bottom-4 left-4 z-20 bg-white/95 backdrop-blur-md border border-slate-200 rounded-xl p-3 flex flex-col gap-1.5 text-[10px] text-slate-600 font-mono shadow-sm pointer-events-auto">
        <div className="font-semibold text-slate-800 border-b border-slate-100 pb-1 mb-1">MAP LEGEND</div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 bg-emerald-700 rounded-full inline-block border border-white shadow-sm"></span>
          <span>Study Spot</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 bg-rose-500 rounded-full inline-block border border-white shadow-sm"></span>
          <span>Favorite Spot</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 bg-sky-500 rounded-full inline-block border border-white shadow-sm"></span>
          <span>Currently Selected</span>
        </div>
      </div>

      {/* Actual Map Container */}
      <div className="w-full flex-1 relative z-[1]">
        <div ref={mapContainerRef} className="w-full h-full" />
      </div>
    </div>
  );
};
