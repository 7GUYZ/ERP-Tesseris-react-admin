import React from 'react';
import '../../../styles/jungeun/loadingSpinner.css';

const LoadingSpinner = ({
  size = 'large', // small, medium, large
  text = 'LOADING...',
  fullScreen = false,
  className = ''
}) => {
  const sizeClass = `jungeun-spinner-${size}`;
  const fullScreenClass = fullScreen ? 'jungeun-spinner-fullscreen' : '';

  return (
    <div className={`jungeun-loading-container ${fullScreenClass} ${className}`}>
      <div className={`jungeun-spinner ${sizeClass}`}></div>
      {text && <p className="jungeun-loading-text">{text}</p>}
    </div>
  );
};

export default LoadingSpinner; 