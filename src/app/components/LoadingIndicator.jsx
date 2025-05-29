'use client';

export default function LoadingIndicator({ type = 'dots', message = '', size = 'medium' }) {
  // Determina la classe di dimensione
  const sizeClass = {
    small: 'loading-small',
    medium: 'loading-medium',
    large: 'loading-large'
  }[size] || 'loading-medium';
  
  return (
    <div className={`loading-indicator ${type} ${sizeClass}`} role="status" aria-live="polite">
      {type === 'dots' && (
        <div className="loading-dots">
          <div className="dot"></div>
          <div className="dot"></div>
          <div className="dot"></div>
        </div>
      )}
      
      {type === 'spinner' && (
        <div className="loading-spinner">
          <svg viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg">
            <circle cx="25" cy="25" r="20" fill="none" strokeWidth="5"></circle>
          </svg>
        </div>
      )}
      
      {type === 'bar' && (
        <div className="loading-bar">
          <div className="bar-progress"></div>
        </div>
      )}
      
      {type === 'pulse' && (
        <div className="loading-pulse"></div>
      )}
      
      {message && <p className="loading-message">{message}</p>}
      
      {/* Testo nascosto per screen reader */}
      <span className="sr-only">
        {message || 'Caricamento in corso...'}
      </span>
    </div>
  );
}