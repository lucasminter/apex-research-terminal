'use client';

export default function ResearchHub() {
  return (
    <div style={{ width: '100%', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <iframe
        src="/research/index.html"
        style={{ width: '100%', height: '100%', border: 'none', flex: 1 }}
        title="Research Hub"
      />
    </div>
  );
}
