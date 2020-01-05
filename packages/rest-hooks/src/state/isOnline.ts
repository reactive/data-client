export default function isOnline(): boolean {
  if (navigator.onLine !== undefined) {
    return navigator.onLine;
  }
  return true;
}
