/**
 * Leaflet Map HTML
 * Embedded interactive map for destination selection
 */

export const MAP_HTML = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css" />
    <script src="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js"></script>
    <style>
        * { margin: 0; padding: 0; }
        body { height: 100vh; width: 100vw; }
        #map { width: 100%; height: 100%; }
        .blue-dot { width: 30px; height: 30px; }
        @keyframes pulse {
            0% { r: 15; opacity: 1; }
            100% { r: 25; opacity: 0; }
        }
    </style>
</head>
<body>
    <div id="map"></div>
    <script>
        let map = null;
        let userMarker = null;
        let userAccuracyCircle = null;
        let destinationMarker = null;
        let radiusCircle = null;
        let searchResultMarkers = [];
        let routeLine = null;

        function postToApp(payload) {
            try {
                if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
                    window.ReactNativeWebView.postMessage(JSON.stringify(payload));
                } else {
                    // Fallback (some environments)
                    window.postMessage(JSON.stringify(payload), '*');
                }
            } catch (e) {}
        }

        function addTileLayer() {
            const osm = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors',
                maxZoom: 19,
            });
            const osmFr = L.tileLayer('https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors',
                subdomains: 'abc',
                maxZoom: 19,
            });
            osm.on('tileerror', function() {
                if (map && !map.hasLayer(osmFr)) {
                    map.removeLayer(osm);
                    osmFr.addTo(map);
                }
            });
            osm.addTo(map);
        }

        function initMap() {
            map = L.map('map').setView([20, 78], 5);
            addTileLayer();
            
            postToApp({ type: 'mapReady' });

            map.on('click', function(e) {
                postToApp({
                    type: 'mapTap',
                    lat: e.latlng.lat,
                    lng: e.latlng.lng
                });
            });
        }

        function setView(lat, lng, zoom = 13) {
            if (map) map.setView([lat, lng], zoom);
        }

        function setUserLocation(lat, lng) {
            if (userMarker) map.removeLayer(userMarker);
            if (userAccuracyCircle) map.removeLayer(userAccuracyCircle);
            
            // Create a Leaflet feature group to hold both circle and popup
            userMarker = L.circleMarker([lat, lng], {
                radius: 10,
                fillColor: '#002FA7',
                color: '#fff',
                weight: 3,
                opacity: 1,
                fillOpacity: 0.9,
            }).addTo(map);
            
            // Add a label popup
            userMarker.bindPopup('Your Location', { offset: [0, -25], closeButton: false });
            
            // Add accuracy circle (if needed for visual reference)
            userAccuracyCircle = L.circle([lat, lng], {
                radius: 50,
                color: '#002FA7',
                fillColor: 'rgba(0, 47, 167, 0.05)',
                weight: 1,
                opacity: 0.3,
                fillOpacity: 0.05,
            }).addTo(map);
        }

        function setDestination(lat, lng, radius) {
            if (destinationMarker) map.removeLayer(destinationMarker);
            
            // Create a red circle marker for destination (matching the red dots style)
            destinationMarker = L.circleMarker([lat, lng], {
                radius: 12,
                fillColor: '#FF2A2A',
                color: '#fff',
                weight: 3,
                opacity: 1,
                fillOpacity: 0.95,
            }).addTo(map);
            
            // Add destination label popup
            destinationMarker.bindPopup('Destination', { offset: [0, -25], closeButton: false });

            if (radius > 0) {
                updateRadius(lat, lng, radius);
            } else if (radiusCircle) {
                map.removeLayer(radiusCircle);
                radiusCircle = null;
            }
        }

        function updateRadius(lat, lng, radius) {
            if (radiusCircle) map.removeLayer(radiusCircle);
            radiusCircle = L.circle([lat, lng], {
                radius: radius,
                color: '#0047A7',
                fillColor: 'rgba(0, 71, 167, 0.1)',
                weight: 2,
                opacity: 0.5,
                fillOpacity: 0.2,
            }).addTo(map);
        }

        function clearSearchResults() {
            searchResultMarkers.forEach(marker => {
                if (marker && map.hasLayer(marker)) {
                    map.removeLayer(marker);
                }
            });
            searchResultMarkers = [];
        }

        function showSearchResults(results) {
            clearSearchResults();
            if (!results || results.length === 0) return;
            
            // Create bounds to fit all results
            const bounds = L.latLngBounds([]);
            
            results.forEach(result => {
                const marker = L.circleMarker([result.lat, result.lng], {
                    radius: 8,
                    fillColor: '#FF2A2A',
                    color: '#fff',
                    weight: 2,
                    opacity: 1,
                    fillOpacity: 0.8,
                }).addTo(map);
                
                // Add name popup
                if (result.name) {
                    const shortName = result.name.split(',')[0].trim();
                    marker.bindPopup(shortName, { offset: [0, -20], closeButton: false });
                }
                
                // Send click to React Native so the result is auto-selected
                marker.on('click', function() {
                    postToApp({
                        type: 'searchResultClicked',
                        lat: result.lat,
                        lng: result.lng,
                        name: result.name || ''
                    });
                });
                
                searchResultMarkers.push(marker);
                bounds.extend([result.lat, result.lng]);
            });
            
            // Fit map to show all search results
            if (bounds.isValid()) {
                map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
            }
        }

        function setRoute(latlngs) {
            if (routeLine) {
                map.removeLayer(routeLine);
                routeLine = null;
            }
            if (!latlngs || !latlngs.length) return;
            routeLine = L.polyline(latlngs, { color: '#002FA7', weight: 5, opacity: 0.85 }).addTo(map);
            const bounds = L.latLngBounds(latlngs);
            if (bounds.isValid()) {
                map.fitBounds(bounds, { padding: [48, 48], maxZoom: 16 });
            }
        }

        function setPickup(lat, lng) {
            setUserLocation(lat, lng);
        }

        function clearAll() {
            if (userMarker) map.removeLayer(userMarker);
            if (userAccuracyCircle) map.removeLayer(userAccuracyCircle);
            if (destinationMarker) map.removeLayer(destinationMarker);
            if (radiusCircle) map.removeLayer(radiusCircle);
            if (routeLine) map.removeLayer(routeLine);
            clearSearchResults();
            userMarker = null;
            userAccuracyCircle = null;
            destinationMarker = null;
            radiusCircle = null;
            routeLine = null;
        }

        function fitToUserAndDestination(padding = 70, maxZoom = 15) {
            if (!map) return;
            if (!userMarker || !destinationMarker) return;
            const bounds = L.latLngBounds([]);
            bounds.extend(userMarker.getLatLng());
            bounds.extend(destinationMarker.getLatLng());
            if (bounds.isValid()) {
                map.fitBounds(bounds, { padding: [padding, padding], maxZoom: maxZoom });
            }
        }

        window.cmd = function(command) {
            if (!map) return;
            
            switch(command.type) {
                case 'setView':
                    setView(command.lat, command.lng, command.zoom || 13);
                    break;
                case 'setUserLocation':
                    setUserLocation(command.lat, command.lng);
                    break;
                case 'setDestination':
                    setDestination(command.lat, command.lng, command.radius || 1000);
                    break;
                case 'showSearchResults':
                    showSearchResults(command.results);
                    break;
                case 'clearSearchResults':
                    clearSearchResults();
                    break;
                case 'updateRadius':
                    if (destinationMarker) {
                        const latlng = destinationMarker.getLatLng();
                        updateRadius(latlng.lat, latlng.lng, command.radius);
                    }
                    break;
                case 'clearAll':
                    clearAll();
                    break;
                case 'fitToUserAndDestination':
                    fitToUserAndDestination(command.padding || 70, command.maxZoom || 15);
                    break;
                case 'setRoute':
                    setRoute(command.latlngs || []);
                    break;
                case 'setPickup':
                    setPickup(command.lat, command.lng);
                    break;
            }
        };

        initMap();
    </script>
</body>
</html>
`;
