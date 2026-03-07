'use client';

import { useEffect, useState } from 'react';

export default function ResearchHub() {
  const [loading, setLoading] = useState(true);
  const [iframeReady, setIframeReady] = useState(false);

  useEffect(() => {
    // Small delay to ensure DOM setup
    const timer = setTimeout(() => {
      setLoading(false);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  const handleIframeLoad = () => {
    setIframeReady(true);
    console.log('Research hub iframe loaded successfully');
  };

  const handleIframeError = () => {
    console.error('Failed to load research hub iframe');
  };

  if (loading) {
    return (
      <div style={{
        width: '100%',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0d1117',
        color: '#58a6ff',
        fontSize: '16px',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        Loading Research Hub...
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {!iframeReady && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: '#0d1117',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1,
          color: '#58a6ff',
        }}>
          Research Hub Loading...
        </div>
      )}
      <iframe
        src="https://apex-research-terminal-111.vercel.app/research/index.html"
        onLoad={handleIframeLoad}
        onError={handleIframeError}
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
          flex: 1,
          backgroundColor: '#0d1117',
          zIndex: 2,
        }}
        title="Research Hub"
        allow="fullscreen"
      />
    </div>
  );
}
