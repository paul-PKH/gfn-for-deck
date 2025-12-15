import React, { VFC, CSSProperties } from 'react';
import { GFNSettings } from '../types';
import nvidiaLogo from '../../assets/images/nvidia-logo.png';

interface GFNLogoProps {
  available: boolean;
  settings: GFNSettings;
}

export const GFNLogo: VFC<GFNLogoProps> = ({ available, settings }) => {
  if (!settings.enabled) {
    return null;
  }

  const getPositionStyles = (): CSSProperties => {
    const baseStyles: CSSProperties = {
      position: 'fixed',
      zIndex: 9999,
      pointerEvents: 'none',
    };

    switch (settings.position) {
      case 'top-left':
        return { ...baseStyles, top: '16px', left: '16px' };
      case 'top-right':
        return { ...baseStyles, top: '16px', right: '16px' };
      case 'bottom-left':
        return { ...baseStyles, bottom: '16px', left: '16px' };
      case 'bottom-right':
        return { ...baseStyles, bottom: '16px', right: '16px' };
      case 'top-center':
        return { ...baseStyles, top: '16px', left: '50%', transform: 'translateX(-50%)' };
      case 'bottom-center':
        return { ...baseStyles, bottom: '16px', left: '50%', transform: 'translateX(-50%)' };
      case 'center-left':
        return { ...baseStyles, top: '50%', left: '16px', transform: 'translateY(-50%)' };
      case 'center-right':
        return { ...baseStyles, top: '50%', right: '16px', transform: 'translateY(-50%)' };
      case 'custom':
        return {
          ...baseStyles,
          top: `${settings.customY || 16}px`,
          left: `${settings.customX || 16}px`
        };
      default:
        return { ...baseStyles, top: '16px', right: '16px' };
    }
  };

  const getLogoStyles = (): CSSProperties => {
    const glowOpacity = settings.glowIntensity / 100;

    const baseStyles: CSSProperties = {
      width: `${settings.logoSize}px`,
      height: `${settings.logoSize}px`,
      borderRadius: '8px',
      transition: 'all 0.3s ease',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: available
        ? 'rgba(118, 185, 0, 0.2)'
        : 'rgba(128, 128, 128, 0.2)',
      border: available
        ? '2px solid rgba(118, 185, 0, 0.6)'
        : '2px solid rgba(128, 128, 128, 0.4)',
      boxShadow: available
        ? `0 0 ${settings.logoSize * 0.2}px rgba(118, 185, 0, ${glowOpacity * 0.6}),
           0 0 ${settings.logoSize * 0.4}px rgba(118, 185, 0, ${glowOpacity * 0.4}),
           0 0 ${settings.logoSize * 0.6}px rgba(118, 185, 0, ${glowOpacity * 0.2})`
        : 'none',
    };

    return baseStyles;
  };

  const getImageStyles = (): CSSProperties => {
    return {
      width: '70%',
      height: '70%',
      objectFit: 'contain',
      opacity: available ? 1 : 0.4,
      filter: available ? 'brightness(1.2)' : 'grayscale(100%)',
    };
  };

  return (
    <div style={getPositionStyles()}>
      <div style={getLogoStyles()}>
        <img
          src={nvidiaLogo}
          style={getImageStyles()}
          alt="NVIDIA GeForce NOW"
        />
      </div>
    </div>
  );
};
