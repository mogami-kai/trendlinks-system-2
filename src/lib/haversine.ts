/** haversine 距離計算 (FR-5 GPS到着判定) */

export const ARRIVAL_THRESHOLD_M = 200;

/** 2地点間の大円距離 (メートル) */
export function haversineMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371000; // 地球半径 (m)
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export function isArrived(distanceM: number): boolean {
  return distanceM <= ARRIVAL_THRESHOLD_M;
}
