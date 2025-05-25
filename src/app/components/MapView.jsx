'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

const Map = dynamic(
  () => import('./Map').then((mod) => mod.default),
  {
    ssr: false,
    loading: () => (
      <div className="h-full w-full flex items-center justify-center">
        Caricamento mappa...
      </div>
    ),
  }
);

const MapView = () => {
  return (
    <div className="h-full w-full">
      <Map />
    </div>
  );
};

export default MapView;