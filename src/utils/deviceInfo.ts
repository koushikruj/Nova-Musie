// Utility to generate persistent Hardware ID (device fingerprint) and detect public IP address

export function getHardwareId(): string {
  const STORAGE_KEY = 'nova_device_hwid_v1';
  try {
    let hwid = localStorage.getItem(STORAGE_KEY);
    if (!hwid) {
      const components = [
        navigator.userAgent || '',
        navigator.language || '',
        window.screen ? `${window.screen.width}x${window.screen.height}x${window.screen.colorDepth}` : '',
        navigator.hardwareConcurrency || 4,
        new Date().getTimezoneOffset()
      ].join('|');

      let hash = 0;
      for (let i = 0; i < components.length; i++) {
        hash = ((hash << 5) - hash) + components.charCodeAt(i);
        hash |= 0;
      }
      const randHex = Math.floor(Math.random() * 0xFFFFFF).toString(16).toUpperCase().padStart(6, '0');
      hwid = `HWID-${Math.abs(hash).toString(16).toUpperCase().padStart(6, '0')}-${randHex}`;
      localStorage.setItem(STORAGE_KEY, hwid);
    }
    return hwid;
  } catch {
    return 'HWID-DEVICE-DEFAULT';
  }
}

export async function getPublicIpAddress(): Promise<string> {
  const endpoints = [
    'https://api.ipify.org?format=json',
    'https://api64.ipify.org?format=json',
    'https://ipapi.co/json/'
  ];

  for (const url of endpoints) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(2500) });
      if (res.ok) {
        const data = await res.json();
        if (data && data.ip) {
          return String(data.ip).trim();
        }
      }
    } catch {
      // Continue to next endpoint
    }
  }

  return '127.0.0.1'; // local fallback IP
}
