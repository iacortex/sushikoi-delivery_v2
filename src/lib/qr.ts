// QR Code generation utilities using public API

// Base QR server URL
const QR_SERVER_BASE = 'https://api.qrserver.com/v1/create-qr-code/';

// Generate QR code URL with options
export const generateQRUrl = (
  data: string,
  options: {
    size?: number;
    format?: 'png' | 'gif' | 'jpeg' | 'jpg' | 'svg';
    errorCorrection?: 'L' | 'M' | 'Q' | 'H';
    margin?: number;
    color?: string;
    bgcolor?: string;
  } = {}
): string => {
  const {
    size = 200,
    format = 'png',
    errorCorrection = 'M',
    margin = 0,
    color = '000000',
    bgcolor = 'ffffff'
  } = options;

  const params = new URLSearchParams({
    size: `${size}x${size}`,
    data: data,
    format,
    ecc: errorCorrection,
    margin: margin.toString(),
    color,
    bgcolor
  });

  return `${QR_SERVER_BASE}?${params.toString()}`;
};

// Generate QR for Waze navigation
export const generateWazeQR = (wazeUrl: string, size = 220): string => {
  return generateQRUrl(wazeUrl, { 
    size,
    errorCorrection: 'M',
    margin: 1
  });
};

// Generate QR for order tracking
export const generateTrackingQR = (trackingUrl: string, size = 140): string => {
  return generateQRUrl(trackingUrl, { 
    size,
    errorCorrection: 'L',
    margin: 1
  });
};

// Generate QR for general purpose
export const generateGenericQR = (
  data: string, 
  size = 200,
  options?: { margin?: number; color?: string; bgcolor?: string }
): string => {
  return generateQRUrl(data, {
    size,
    errorCorrection: 'M',
    ...options
  });
};