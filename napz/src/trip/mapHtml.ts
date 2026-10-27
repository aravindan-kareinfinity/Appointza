import type { LatLng } from './types';

/** Same Leaflet + OpenStreetMap setup as the ride map, so tiles load inside the WebView. */
export function tripMapHtml(route: LatLng[], stops: { lat: number; lng: number; name: string }[]): string {
  const line = JSON.stringify(route.map((point) => [point.lat, point.lng])).replace(/</g, '\\u003c');
  const pins = JSON.stringify(stops).replace(/</g, '\\u003c');
  return `<!DOCTYPE html><html><head><meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1"/>
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css"/>
<script src="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js"></script>
<style>
  html, body, #map { margin:0; padding:0; height:100%; width:100%; background:#FAFAFA; }
  .leaflet-control-attribution { font-size:10px; }
</style>
</head><body><div id="map"></div><script>
var route = ${line};
var stops = ${pins};
var map = L.map('map', { zoomControl: false, attributionControl: true }).setView([20, 78], 5);
var osm = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap',
  maxZoom: 19
});
var backup = L.tileLayer('https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap',
  subdomains: 'abc',
  maxZoom: 19
});
osm.on('tileerror', function () {
  if (map && !map.hasLayer(backup)) {
    map.removeLayer(osm);
    backup.addTo(map);
  }
});
osm.addTo(map);
var line = null;
if (route.length > 1) {
  line = L.polyline(route, { color: '#002FA7', weight: 5, opacity: 0.9 }).addTo(map);
  map.fitBounds(line.getBounds(), { padding: [28, 28] });
} else if (route.length === 1) {
  map.setView(route[0], 12);
}
stops.forEach(function (stop) {
  if (!isFinite(stop.lat) || !isFinite(stop.lng)) return;
  L.circleMarker([stop.lat, stop.lng], {
    radius: 7,
    color: '#FFFFFF',
    weight: 2,
    fillColor: '#002FA7',
    fillOpacity: 1
  }).addTo(map).bindPopup(stop.name);
});
function fit() {
  map.invalidateSize();
  if (line) map.fitBounds(line.getBounds(), { padding: [28, 28] });
}
setTimeout(fit, 200);
setTimeout(fit, 700);
</script></body></html>`;
}
