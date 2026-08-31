const STORAGE_KEY = 'burgerfest_device_id';

function buildFingerprint() {
  const screenSize =
    typeof screen !== 'undefined' ? `${screen.width}x${screen.height}` : 'unknown';
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'unknown';

  return [
    navigator.userAgent,
    screenSize,
    timeZone,
    navigator.language,
  ].join('|');
}

function hashToDeviceId(raw) {
  let hash = 0;

  for (let i = 0; i < raw.length; i += 1) {
    hash = ((hash << 5) - hash + raw.charCodeAt(i)) | 0;
  }

  return `dev_${Math.abs(hash).toString(36)}`;
}

export function getDeviceId() {
  const stored = localStorage.getItem(STORAGE_KEY);

  if (stored) {
    return stored;
  }

  const deviceId = hashToDeviceId(buildFingerprint());
  localStorage.setItem(STORAGE_KEY, deviceId);

  return deviceId;
}
