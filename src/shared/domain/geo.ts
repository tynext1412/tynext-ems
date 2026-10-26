export interface GeoPoint {
  lat: number;
  lng: number;
}

export function isValidGeoPoint(point: GeoPoint): boolean {
  return point.lat >= -90 && point.lat <= 90 && point.lng >= -180 && point.lng <= 180;
}
