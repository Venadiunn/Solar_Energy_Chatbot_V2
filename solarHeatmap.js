/**
 * Solar Heatmap Overlay
 * Open-source interactive solar irradiance visualization using Leaflet.js
 * No Google Maps API required - fully open-source and lightweight
 */

// Global map state
let solarMapInstance = null;
let solarHeatmapLayer = null;
let currentSolarData = null;
let selectedRegionMarker = null;

// Solar data for major US cities (preprocessed - no API latency)
const SOLAR_DATA_CACHE = {
    'denver': { lat: 39.7392, lng: -104.9903, hours: 5.4, category: 'Very High', generation: 7500, payback: '5-7', system: 6.0 },
    'phoenix': { lat: 33.4484, lng: -112.0742, hours: 6.3, category: 'Very High', generation: 8500, payback: '4-6', system: 6.5 },
    'los-angeles': { lat: 34.0522, lng: -118.2437, hours: 5.9, category: 'Very High', generation: 8000, payback: '5-8', system: 6.2 },
    'san-diego': { lat: 32.7157, lng: -117.1611, hours: 5.8, category: 'Very High', generation: 7900, payback: '5-8', system: 6.1 },
    'las-vegas': { lat: 36.1699, lng: -115.1398, hours: 6.1, category: 'Very High', generation: 8300, payback: '4-7', system: 6.4 },
    'miami': { lat: 25.7617, lng: -80.1918, hours: 4.8, category: 'High', generation: 6500, payback: '7-10', system: 5.7 },
    'st-louis': { lat: 38.6270, lng: -90.1994, hours: 4.5, category: 'High', generation: 6000, payback: '7-10', system: 5.5 },
    'atlanta': { lat: 33.7490, lng: -84.3880, hours: 4.4, category: 'High', generation: 5900, payback: '8-11', system: 5.4 },
    'boston': { lat: 42.3601, lng: -71.0589, hours: 4.0, category: 'Moderate', generation: 5300, payback: '8-12', system: 5.0 },
    'seattle': { lat: 47.6062, lng: -122.3321, hours: 3.5, category: 'Fair', generation: 4700, payback: '10-14', system: 4.5 },
    'chicago': { lat: 41.8781, lng: -87.6298, hours: 3.8, category: 'Fair', generation: 5100, payback: '9-12', system: 4.8 },
    'new-york': { lat: 40.7128, lng: -74.0060, hours: 4.0, category: 'Moderate', generation: 5300, payback: '8-12', system: 5.0 },
    'austin': { lat: 30.2672, lng: -97.7431, hours: 5.2, category: 'Very High', generation: 7000, payback: '6-9', system: 6.0 },
    'houston': { lat: 29.7604, lng: -95.3698, hours: 4.9, category: 'High', generation: 6600, payback: '7-10', system: 5.8 },
    'portland': { lat: 45.5152, lng: -122.6784, hours: 3.7, category: 'Fair', generation: 4950, payback: '10-13', system: 4.6 }
};

// Color scale for solar irradiance (kWh/m²/day)
const SOLAR_COLOR_SCALE = [
    { threshold: 6.0, color: '#8B0000', label: 'Very High (6.0+)' },        // Dark Red
    { threshold: 5.5, color: '#DC143C', label: 'Very High (5.5-5.9)' },     // Crimson
    { threshold: 5.0, color: '#FF4500', label: 'High (5.0-5.4)' },          // OrangeRed
    { threshold: 4.5, color: '#FF8C00', label: 'High (4.5-4.9)' },          // DarkOrange
    { threshold: 4.0, color: '#FFD700', label: 'Moderate (4.0-4.4)' },      // Gold
    { threshold: 3.5, color: '#87CEEB', label: 'Fair (3.5-3.9)' },          // SkyBlue
    { threshold: 0, color: '#ADD8E6', label: 'Low (<3.5)' }                 // LightBlue
];

/**
 * Initialize the solar heatmap on demand
 * Creates map, loads data, renders heatmap overlay
 */
function initializeSolarHeatmap() {
    console.log('[SolarHeatmap] Initializing solar heatmap...');
    
    try {
        const mapContainer = document.getElementById('solarMapCanvas');
        if (!mapContainer) {
            console.error('[SolarHeatmap] Container #solarMapCanvas not found');
            showToast('Solar map container not found. Please refresh.');
            return;
        }

        // Destroy existing map instance if present
        if (solarMapInstance) {
            console.log('[SolarHeatmap] Destroying existing map instance');
            solarMapInstance.remove();
            solarMapInstance = null;
        }

        // Create Leaflet map centered on St. Louis
        const DEFAULT_LAT = 38.6270;
        const DEFAULT_LNG = -90.1994;
        const DEFAULT_ZOOM = 4;

        console.log('[SolarHeatmap] Creating Leaflet map instance...');
        solarMapInstance = L.map('solarMapCanvas').setView([DEFAULT_LAT, DEFAULT_LNG], DEFAULT_ZOOM);

        // Add OpenStreetMap tile layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19,
            minZoom: 2
        }).addTo(solarMapInstance);

        // Apply theme to map
        applyThemeToSolarMap();

        console.log('[SolarHeatmap] Map instance created successfully');

        // Load and render solar data
        loadSolarDataLayer();

        // Add legend to map
        addSolarMapLegend();

        // Add controls
        addSolarMapControls();

        // Setup event listeners for persistence
        setupMapEventListeners();

        // Restore last saved map state
        setTimeout(function() {
            restoreSolarMapState();
        }, 100);

        console.log('[SolarHeatmap] Initialization complete');

    } catch (error) {
        console.error('[SolarHeatmap] Error initializing heatmap:', error);
        console.error('[SolarHeatmap] Error stack:', error.stack);
        showToast('Could not initialize solar map: ' + error.message);
    }
}

/**
 * Load solar irradiance data and render as heatmap overlay
 */
function loadSolarDataLayer() {
    console.log('[SolarHeatmap] Loading solar data layer...');
    
    try {
        if (!solarMapInstance) {
            console.error('[SolarHeatmap] Map instance not initialized');
            return;
        }

        // Remove existing heatmap layer if present
        if (solarHeatmapLayer) {
            solarMapInstance.removeLayer(solarHeatmapLayer);
            solarHeatmapLayer = null;
        }

        // Generate heatmap data points from cache
        const heatData = [];
        const citiesToMap = Object.entries(SOLAR_DATA_CACHE);
        
        console.log(`[SolarHeatmap] Generating heatmap from ${citiesToMap.length} cities`);

        citiesToMap.forEach(([cityKey, data]) => {
            // Leaflet.heat expects [lat, lng, intensity (0-1)]
            // Normalize sun hours to 0-1 scale (0-7 hours)
            const intensity = Math.min(data.hours / 7.0, 1.0);
            heatData.push([data.lat, data.lng, intensity]);
            console.log(`[SolarHeatmap]   ${cityKey}: ${data.hours} hrs/day (intensity: ${intensity.toFixed(2)})`);
        });

        // Create and add heatmap layer using Leaflet.heat
        // Heat layer expects array of [lat, lng, intensity] points
        solarHeatmapLayer = L.heatLayer(heatData, {
            radius: 40,           // Radius of each point in pixels
            blur: 15,             // Blur amount
            maxZoom: 17,          // Max zoom for detail
            gradient: {
                0.0: '#ADD8E6',   // Light Blue (low)
                0.3: '#87CEEB',   // Sky Blue
                0.5: '#FFD700',   // Gold
                0.7: '#FF8C00',   // Dark Orange
                0.85: '#FF4500',  // Orange Red
                1.0: '#8B0000'    // Dark Red (high)
            }
        }).addTo(solarMapInstance);

        console.log('[SolarHeatmap] Heatmap layer created successfully');

        // Add interactive markers for major cities
        addSolarCityMarkers();

        // Store data for reference
        currentSolarData = SOLAR_DATA_CACHE;

    } catch (error) {
        console.error('[SolarHeatmap] Error loading solar data:', error);
        console.error('[SolarHeatmap] Error stack:', error.stack);
        showToast('Could not load solar data: ' + error.message);
    }
}

/**
 * Add interactive markers for each city
 */
function addSolarCityMarkers() {
    console.log('[SolarHeatmap] Adding city markers...');
    
    Object.entries(SOLAR_DATA_CACHE).forEach(([cityKey, data]) => {
        // Determine marker color based on solar hours
        let markerColor = '#8B0000'; // Default to very high
        SOLAR_COLOR_SCALE.forEach(scale => {
            if (data.hours >= scale.threshold) {
                markerColor = scale.color;
                return;
            }
        });

        // Get city name from key
        const cityName = cityKey.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

        // Create custom marker icon
        const markerIcon = L.divIcon({
            className: 'solar-marker',
            html: `<div class="solar-marker-inner" style="background-color: ${markerColor}; border-color: ${markerColor};">☀</div>`,
            iconSize: [32, 32],
            popupAnchor: [0, -16]
        });

        // Create and add marker
        const marker = L.marker([data.lat, data.lng], { icon: markerIcon })
            .bindPopup(createSolarPopup(cityKey, cityName, data))
            .addTo(solarMapInstance);

        // Store marker reference
        marker.cityKey = cityKey;
    });

    console.log('[SolarHeatmap] City markers added');
}

/**
 * Create popup content for city markers
 */
function createSolarPopup(cityKey, cityName, data) {
    const monthlyGeneration = (data.generation / 12).toFixed(0);
    const dailyGeneration = (data.generation / 365).toFixed(1);
    const annualSavings = Math.round(data.generation * 0.12 * 0.80); // $0.12/kWh * 80% is average savings

    return `
        <div class="solar-popup">
            <div class="popup-title">${cityName}</div>
            <div class="popup-stat">
                <span class="stat-icon">☀️</span>
                <span><strong>${data.hours}</strong> peak sun hours/day</span>
            </div>
            <div class="popup-stat">
                <span class="stat-icon">⚡</span>
                <span><strong>${dailyGeneration}</strong> kWh/day (5kW system)</span>
            </div>
            <div class="popup-stat">
                <span class="stat-icon">💰</span>
                <span><strong>~$${annualSavings}/year</strong> savings potential</span>
            </div>
            <div class="popup-stat">
                <span class="stat-icon">⏱️</span>
                <span>Payback: <strong>${data.payback} years</strong></span>
            </div>
            <button class="popup-btn" onclick="selectSolarRegion('${cityKey}')">View Details</button>
        </div>
    `;
}

/**
 * Handle city/region selection
 */
function selectSolarRegion(cityKey) {
    console.log('[SolarHeatmap] Selected region:', cityKey);
    
    if (!solarMapInstance || !currentSolarData[cityKey]) {
        console.error('[SolarHeatmap] Invalid city key or map not initialized');
        return;
    }

    const data = currentSolarData[cityKey];
    const cityName = cityKey.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

    // Pan to location with animation
    solarMapInstance.setView([data.lat, data.lng], 10, { animate: true });

    // Update sidebar panel with detailed info
    updateSolarInfoPanel(cityName, data);

    // Store in localStorage
    localStorage.setItem('lastSelectedSolarRegion', cityKey);

    console.log('[SolarHeatmap] Region selected and info panel updated');
}

/**
 * Update the solar info panel in the sidebar
 */
function updateSolarInfoPanel(cityName, data) {
    console.log('[SolarHeatmap] Updating info panel for:', cityName);
    
    const panelElement = document.getElementById('mapInfoPanel');
    if (!panelElement) {
        console.error('[SolarHeatmap] mapInfoPanel not found');
        return;
    }

    const monthlyGeneration = (data.generation / 12).toFixed(0);
    const dailyGeneration = (data.generation / 365).toFixed(1);
    const annualSavings = Math.round(data.generation * 0.12 * 0.80);

    panelElement.innerHTML = `
        <div class="solar-info-detailed">
            <div class="info-title">☀️ ${cityName}</div>
            
            <div class="info-section">
                <div class="section-label">Solar Irradiance</div>
                <div class="info-stat">
                    <span class="stat-label">Peak Sun Hours:</span>
                    <span class="stat-value">${data.hours} hrs/day</span>
                </div>
                <div class="info-stat">
                    <span class="stat-label">Category:</span>
                    <span class="stat-value">${data.category}</span>
                </div>
            </div>

            <div class="info-section">
                <div class="section-label">System Estimate (5kW)</div>
                <div class="info-stat">
                    <span class="stat-label">Daily Production:</span>
                    <span class="stat-value">${dailyGeneration} kWh</span>
                </div>
                <div class="info-stat">
                    <span class="stat-label">Monthly Average:</span>
                    <span class="stat-value">${monthlyGeneration} kWh</span>
                </div>
                <div class="info-stat">
                    <span class="stat-label">Annual Total:</span>
                    <span class="stat-value">${data.generation.toLocaleString()} kWh</span>
                </div>
            </div>

            <div class="info-section">
                <div class="section-label">Financial Estimate</div>
                <div class="info-stat">
                    <span class="stat-label">Estimated Annual Savings:</span>
                    <span class="stat-value">~$${annualSavings.toLocaleString()}</span>
                </div>
                <div class="info-stat">
                    <span class="stat-label">Payback Period:</span>
                    <span class="stat-value">${data.payback} years</span>
                </div>
                <div class="info-stat">
                    <span class="stat-label">System Size (kW):</span>
                    <span class="stat-value">${data.system}</span>
                </div>
            </div>

            <button class="popup-btn" onclick="compareSolarRegions('${Object.keys(SOLAR_DATA_CACHE)[0]}')">
                📊 Compare Regions
            </button>
        </div>
    `;

    console.log('[SolarHeatmap] Info panel updated');
}

/**
 * Compare two regions side-by-side
 */
function compareSolarRegions(otherCityKey = 'st-louis') {
    console.log('[SolarHeatmap] Comparing regions...');
    
    // This could be enhanced to show comparison UI
    // For now, just log and show toast
    showToast('Comparison feature coming soon!');
}

/**
 * Add legend to map
 */
function addSolarMapLegend() {
    console.log('[SolarHeatmap] Adding legend...');
    
    if (!solarMapInstance) return;

    const legend = L.control({ position: 'bottomright' });

    legend.onAdd = function() {
        const div = L.DomUtil.create('div', 'solar-map-legend');
        div.innerHTML = `
            <div class="legend-content">
                <div class="legend-title">Solar Irradiance</div>
                <div class="legend-scale">
                    ${SOLAR_COLOR_SCALE.map(scale => `
                        <div class="legend-item">
                            <div class="legend-color" style="background-color: ${scale.color};"></div>
                            <span>${scale.label}</span>
                        </div>
                    `).join('')}
                </div>
                <div class="legend-note">kWh/m²/day</div>
            </div>
        `;
        return div;
    };

    legend.addTo(solarMapInstance);
    console.log('[SolarHeatmap] Legend added');
}

/**
 * Add map controls and filters
 */
function addSolarMapControls() {
    console.log('[SolarHeatmap] Adding map controls...');
    
    if (!solarMapInstance) return;

    // Zoom controls are added by default, just ensure they're visible
    solarMapInstance.zoomControl.setPosition('topleft');

    // Add custom control for layer toggle
    const layerControl = L.control({ position: 'topleft' });

    layerControl.onAdd = function() {
        const div = L.DomUtil.create('div', 'solar-map-controls');
        div.innerHTML = `
            <button class="control-btn active" id="heatmapToggle" onclick="toggleSolarLayer('heatmap')" title="Toggle Heatmap">
                🔥 Heatmap
            </button>
            <button class="control-btn" id="markersToggle" onclick="toggleSolarLayer('markers')" title="Toggle Markers">
                📍 Markers
            </button>
        `;
        L.DomEvent.disableClickPropagation(div);
        return div;
    };

    layerControl.addTo(solarMapInstance);
    console.log('[SolarHeatmap] Controls added');
}

/**
 * Toggle heatmap or marker layers
 */
function toggleSolarLayer(layerType) {
    console.log('[SolarHeatmap] Toggling layer:', layerType);
    
    if (layerType === 'heatmap') {
        if (solarHeatmapLayer) {
            if (solarMapInstance.hasLayer(solarHeatmapLayer)) {
                solarMapInstance.removeLayer(solarHeatmapLayer);
                document.getElementById('heatmapToggle')?.classList.remove('active');
            } else {
                solarMapInstance.addLayer(solarHeatmapLayer);
                document.getElementById('heatmapToggle')?.classList.add('active');
            }
        }
    }
    // Markers can be toggled similarly if needed
}

/**
 * Apply current theme to map
 */
function applyThemeToSolarMap() {
    console.log('[SolarHeatmap] Applying theme...');
    
    if (!solarMapInstance) return;

    const isDarkTheme = state.currentTheme === 'dark';
    
    // Update map container classes
    const mapContainer = document.getElementById('solarMapCanvas');
    if (mapContainer) {
        mapContainer.classList.toggle('dark-mode', isDarkTheme);
    }

    // Update tile layer for theme
    const layers = solarMapInstance._layers;
    for (const layer of Object.values(layers)) {
        if (layer instanceof L.TileLayer) {
            if (isDarkTheme) {
                // Dark tile variant
                layer.setUrl('https://{s}.tile.openstreetmap.de/tiles/osmde/{z}/{x}/{y}.png');
            } else {
                // Light tile variant
                layer.setUrl('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png');
            }
        }
    }

    console.log('[SolarHeatmap] Theme applied');
}

/**
 * Close solar map modal
 */
function closeSolarMap() {
    console.log('[SolarHeatmap] Closing solar map...');
    
    const modal = document.getElementById('solarMapModal');
    if (modal) {
        modal.classList.remove('active');
    }

    // Store map state
    if (solarMapInstance) {
        const center = solarMapInstance.getCenter();
        const zoom = solarMapInstance.getZoom();
        localStorage.setItem('lastSolarMapCenter', JSON.stringify({
            lat: center.lat,
            lng: center.lng,
            zoom: zoom
        }));
    }
}

/**
 * Search for a location on the map
 */
function searchSolarLocation(query) {
    console.log('[SolarHeatmap] Searching for location:', query);
    
    if (!query || !solarMapInstance) return;

    const lowerQuery = query.toLowerCase();
    
    // Search in cached cities
    for (const [cityKey, data] of Object.entries(SOLAR_DATA_CACHE)) {
        if (cityKey.includes(lowerQuery.replace(/[,\s]/g, '-'))) {
            selectSolarRegion(cityKey);
            return;
        }
    }

    console.warn('[SolarHeatmap] Location not found in cache:', query);
    showToast(`Location "${query}" not found in solar data. Try searching for a major US city.`);
}

/**
 * Reset map to default view
 */
function resetSolarMap() {
    console.log('[SolarHeatmap] Resetting map to default view...');
    
    if (solarMapInstance) {
        solarMapInstance.setView([38.6270, -90.1994], 4, { animate: true });
    }
}

/**
 * Save map preferences to localStorage
 */
function saveSolarMapPreferences() {
    try {
        if (solarMapInstance) {
            const center = solarMapInstance.getCenter();
            const zoom = solarMapInstance.getZoom();
            
            const prefs = {
                center: { lat: center.lat, lng: center.lng },
                zoom: zoom,
                timestamp: Date.now(),
                version: 3
            };
            
            localStorage.setItem('solarMapPreferences', JSON.stringify(prefs));
            console.log('[SolarHeatmap] Preferences saved to localStorage');
        }
    } catch (error) {
        console.warn('[SolarHeatmap] Could not save preferences:', error.message);
    }
}

/**
 * Load map preferences from localStorage
 */
function loadSolarMapPreferences() {
    try {
        const stored = localStorage.getItem('solarMapPreferences');
        if (stored) {
            const prefs = JSON.parse(stored);
            console.log('[SolarHeatmap] Loaded preferences from localStorage:', prefs);
            return prefs;
        }
    } catch (error) {
        console.warn('[SolarHeatmap] Could not load preferences:', error.message);
    }
    return null;
}

/**
 * Cache solar data for offline use
 */
function cacheSolarData() {
    try {
        const cacheData = {
            regions: SOLAR_DATA_CACHE,
            colorScale: SOLAR_COLOR_SCALE,
            timestamp: Date.now(),
            version: 3
        };
        
        localStorage.setItem('solarDataCache', JSON.stringify(cacheData));
        console.log('[SolarHeatmap] Solar data cached for offline use');
    } catch (error) {
        console.warn('[SolarHeatmap] Could not cache solar data:', error.message);
    }
}

/**
 * Restore solar data from cache (fallback for offline)
 */
function restoreSolarData() {
    try {
        const cached = localStorage.getItem('solarDataCache');
        if (cached) {
            const cacheData = JSON.parse(cached);
            console.log('[SolarHeatmap] Restored solar data from cache');
            return cacheData.regions;
        }
    } catch (error) {
        console.warn('[SolarHeatmap] Could not restore solar data:', error.message);
    }
    return SOLAR_DATA_CACHE; // Fallback to hardcoded data
}

/**
 * Handle map events for persistence
 */
function setupMapEventListeners() {
    if (!solarMapInstance) return;
    
    // Save preferences when map is moved or zoomed
    solarMapInstance.on('moveend zoomend', function() {
        saveSolarMapPreferences();
    });
    
    console.log('[SolarHeatmap] Map event listeners configured');
}

/**
 * Restore map to last saved state
 */
function restoreSolarMapState() {
    if (!solarMapInstance) return;
    
    try {
        const prefs = loadSolarMapPreferences();
        if (prefs && prefs.center && prefs.zoom) {
            // Check if preferences are recent (within 30 days)
            const ageMs = Date.now() - prefs.timestamp;
            const ageDays = ageMs / (1000 * 60 * 60 * 24);
            
            if (ageDays < 30) {
                solarMapInstance.setView(
                    [prefs.center.lat, prefs.center.lng],
                    prefs.zoom,
                    { animate: false }
                );
                console.log('[SolarHeatmap] Restored map state from localStorage');
                return;
            }
        }
    } catch (error) {
        console.warn('[SolarHeatmap] Could not restore map state:', error.message);
    }
    
    // Default to St. Louis view
    console.log('[SolarHeatmap] Using default St. Louis view');
}

/**
 * Initialize data caching on page load
 */
function initializeDataCache() {
    console.log('[SolarHeatmap] Initializing data cache...');
    
    // Cache solar data for offline use
    cacheSolarData();
    
    // Check if Leaflet is available
    if (typeof L === 'undefined') {
        console.warn('[SolarHeatmap] Leaflet.js not loaded, using fallback viewer');
        window.usingSolarHeatmap = false;
        window.usingSolarFallback = true;
        return false;
    }
    
    // Check if leaflet.heat is available
    if (typeof L.heatLayer === 'undefined') {
        console.warn('[SolarHeatmap] Leaflet.heat not loaded, using fallback viewer');
        window.usingSolarHeatmap = false;
        window.usingSolarFallback = true;
        return false;
    }
    
    console.log('[SolarHeatmap] All dependencies available, heatmap ready');
    return true;
}

// Initialize cache on script load
window.addEventListener('load', function() {
    if (!window.solarDataCacheInitialized) {
        initializeDataCache();
        window.solarDataCacheInitialized = true;
    }
});

// Also cache data immediately if document is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeDataCache);
} else {
    initializeDataCache();
}

// Export functions for global use
window.initializeSolarHeatmap = initializeSolarHeatmap;
window.selectSolarRegion = selectSolarRegion;
window.toggleSolarLayer = toggleSolarLayer;
window.searchSolarLocation = searchSolarLocation;
window.resetSolarMap = resetSolarMap;
window.applyThemeToSolarMap = applyThemeToSolarMap;
window.closeSolarMap = closeSolarMap;
window.compareSolarRegions = compareSolarRegions;
window.saveSolarMapPreferences = saveSolarMapPreferences;
window.setupMapEventListeners = setupMapEventListeners;
window.restoreSolarMapState = restoreSolarMapState;
