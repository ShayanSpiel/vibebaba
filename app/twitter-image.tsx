import { ImageResponse } from 'next/og';

// Image metadata
export const alt = 'Vibebaba - AI App Builder';
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = 'image/png';

// Image generation (same as OG image for consistency)
export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 128,
          background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontFamily: 'sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 40,
          }}
        >
          <div
            style={{
              width: 120,
              height: 120,
              background: 'rgba(255, 255, 255, 0.2)',
              borderRadius: 30,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 80,
              fontWeight: 'bold',
              marginRight: 30,
            }}
          >
            V
          </div>
          <div style={{ fontSize: 96, fontWeight: 'bold' }}>Vibebaba</div>
        </div>
        <div
          style={{
            fontSize: 48,
            color: 'rgba(255, 255, 255, 0.9)',
            textAlign: 'center',
            maxWidth: 900,
          }}
        >
          AI-Powered Full-Stack App Builder
        </div>
        <div
          style={{
            fontSize: 32,
            color: 'rgba(255, 255, 255, 0.7)',
            marginTop: 30,
          }}
        >
          Turn Ideas into Applications with AI
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
