'use client';

import { useState, useEffect } from 'react';
import { FiVolumeX, FiVolume2 } from 'react-icons/fi';

export default function AudioToggle({ isAudioEnabled, onToggle }) {
  return (
    <div className="audio-toggle-container">
      <button 
        className="audio-toggle-button" 
        onClick={onToggle}
        aria-label={isAudioEnabled ? 'Disabilita audio' : 'Abilita audio'}
        title={isAudioEnabled ? 'Disabilita audio' : 'Abilita audio'}
      >
        {isAudioEnabled ? <FiVolume2 /> : <FiVolumeX />}
      </button>
    </div>
  );
}