'use client';

import { useEffect, useState } from 'react';

// Get absolute URL for iframe based on current origin
const getIframeUrl = () => {
  if (typeof window !== 'undefined') {
    // Use absolute URL to work correctly in Whop's embedded app context
    const currentOrigin = window.location.origin;
    return `${currentOrigin}/research/index.html`;
  }
  // Fallback for SSR
  return '/research/index.html';
};

export default function ResearchHub() {
  const [loading, setLoading] = useState(true);
  const [iframeReady, setIframeReady] = useState(false);
  const [iframeUrl, setIframeUrl] = useState('/research/index.html');

  useEffect(() => {
    // Set absolute iframe URL on client side
    setIframeUrl(getIframeUrl());
    
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
    console.error('Failed to load research hub iframe at:', iframeUrl);
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
        src={iframeUrl}
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
        sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox"
      />
    </div>
  );
}
