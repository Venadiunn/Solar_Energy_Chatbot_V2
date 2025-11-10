/**
 * SolarMap Module
 * Interactive Google Maps widget for visualizing solar irradiance across regions
 * Supports St. Louis and nationwide expansion
 */

// Solar Map Configuration
const SOLAR_MAP_CONFIG = {
    defaultCenter: { lat: 38.6270, lng: -90.1994 }, // St. Louis, MO
    defaultZoom: 9,
    mapId: 'solarRadianceMap',
    apiKey: 'AIzaSyARclNvgJwnomgTUSTr7n6DpiltNsX246g', // Google Maps API key
    maxQueryLength: 200,
    enableHeatmap: true,
    heatmapRadius: 40,
    heatmapOpacity: 0.7
};

// Color scale for solar irradiance (kWh/m²/day)
const SOLAR_COLOR_SCALE = {
    veryHigh: { range: [5.5, 7.0], color: '#8B0000', label: 'Very High (5.5+)' },      // Dark Red
    high: { range: [4.5, 5.4], color: '#FF4500', label: 'High (4.5-5.4)' },            // Orange Red
    moderate: { range: [4.0, 4.4], color: '#FFD700', label: 'Moderate (4.0-4.4)' },   // Gold
    fair: { range: [3.0, 3.9], color: '#87CEEB', label: 'Fair (3.0-3.9)' },           // Sky Blue
    low: { range: [0, 2.9], color: '#ADD8E6', label: 'Low (<3.0)' }                    // Light Blue
};

// US Regional Solar Data (kWh/m²/day averages)
const US_SOLAR_DATA = {
    // Missouri
    'st-louis-metro': {
        name: 'St. Louis, Missouri',
        center: { lat: 38.6270, lng: -90.1994 },
        solarHours: 4.5,
        data: [
            { lat: 38.6270, lng: -90.1994, value: 4.5 },
            { lat: 38.5, lng: -90.0, value: 4.4 },
            { lat: 38.7, lng: -90.3, value: 4.6 },
            { lat: 38.75, lng: -90.5, value: 4.3 }
        ]
    },
    'kansas-city': {
        name: 'Kansas City, Missouri',
        center: { lat: 39.0997, lng: -94.5786 },
        solarHours: 4.4,
        data: [
            { lat: 39.0997, lng: -94.5786, value: 4.4 },
            { lat: 39.2, lng: -94.7, value: 4.3 },
            { lat: 38.9, lng: -94.4, value: 4.5 }
        ]
    },
    'springfield-mo': {
        name: 'Springfield, Missouri',
        center: { lat: 37.2089, lng: -93.2923 },
        solarHours: 4.3,
        data: [
            { lat: 37.2089, lng: -93.2923, value: 4.3 },
            { lat: 37.3, lng: -93.1, value: 4.4 },
            { lat: 37.1, lng: -93.4, value: 4.2 }
        ]
    },
    // Midwest expansion
    'chicago': {
        name: 'Chicago, Illinois',
        center: { lat: 41.8781, lng: -87.6298 },
        solarHours: 4.1,
        data: [
            { lat: 41.8781, lng: -87.6298, value: 4.1 },
            { lat: 41.9, lng: -87.7, value: 4.0 }
        ]
    },
    'denver': {
        name: 'Denver, Colorado',
        center: { lat: 39.7392, lng: -104.9903 },
        solarHours: 5.4,
        data: [
            { lat: 39.7392, lng: -104.9903, value: 5.4 },
            { lat: 39.8, lng: -105.1, value: 5.5 }
        ]
    },
    'phoenix': {
        name: 'Phoenix, Arizona',
        center: { lat: 33.4484, lng: -112.0742 },
        solarHours: 6.3,
        data: [
            { lat: 33.4484, lng: -112.0742, value: 6.3 },
            { lat: 33.3, lng: -112.2, value: 6.1 }
        ]
    },
    'los-angeles': {
        name: 'Los Angeles, California',
        center: { lat: 34.0522, lng: -118.2437 },
        solarHours: 5.9,
        data: [
            { lat: 34.0522, lng: -118.2437, value: 5.9 }
        ]
    },
    'seattle': {
        name: 'Seattle, Washington',
        center: { lat: 47.6062, lng: -122.3321 },
        solarHours: 3.5,
        data: [
            { lat: 47.6062, lng: -122.3321, value: 3.5 }
        ]
    },
    'miami': {
        name: 'Miami, Florida',
        center: { lat: 25.7617, lng: -80.1918 },
        solarHours: 5.2,
        data: [
            { lat: 25.7617, lng: -80.1918, value: 5.2 }
        ]
    },
    'boston': {
        name: 'Boston, Massachusetts',
        center: { lat: 42.3601, lng: -71.0589 },
        solarHours: 3.9,
        data: [
            { lat: 42.3601, lng: -71.0589, value: 3.9 }
        ]
    },
    'atlanta': {
        name: 'Atlanta, Georgia',
        center: { lat: 33.7490, lng: -84.3880 },
        solarHours: 4.6,
        data: [
            { lat: 33.7490, lng: -84.3880, value: 4.6 }
        ]
    },
    'texas': {
        name: 'Austin, Texas',
        center: { lat: 30.2672, lng: -97.7431 },
        solarHours: 5.1,
        data: [
            { lat: 30.2672, lng: -97.7431, value: 5.1 }
        ]
    }
};

// Solar Map State
let solarMapState = {
    mapInstance: null,
    heatmapInstance: null,
    geocoder: null,
    selectedLocation: null,
    currentRegion: 'st-louis-metro',
    lastViewedLocation: null,
    isInitialized: false,
    markers: [],
    currentLayerType: 'heatmap' // 'heatmap' or 'markers'
};

/**
 * Get solar data by region key or search query
 */
function getSolarDataByRegion(regionKey) {
    return US_SOLAR_DATA[regionKey.toLowerCase()] || null;
}

/**
 * Calculate recommended system size based on location and home size
 */
function calculateSystemSizeForLocation(solarHours, homeSqFt) {
    // Base calculation: 1 kW per 1000-1200 sq ft (accounting for solar efficiency)
    let baseSize = homeSqFt / 1100;
    
    // Adjust based on solar hours (higher hours = smaller system needed)
    const stLouisRef = 4.5;
    if (solarHours > 0) {
        baseSize = baseSize * (stLouisRef / solarHours);
    }
    
    return Math.round(baseSize * 10) / 10; // Round to nearest 0.1
}

/**
 * Estimate monthly generation for a system at a location
 */
function estimateMonthlyGeneration(systemSizeKw, solarHours) {
    // kWh = System Size (kW) × Peak Sun Hours × Days × System Efficiency (0.78)
    const daysPerMonth = 30;
    const systemEfficiency = 0.78;
    const monthlyKwh = systemSizeKw * solarHours * daysPerMonth * systemEfficiency;
    return Math.round(monthlyKwh);
}

/**
 * Get color for solar irradiance value
 */
function getSolarColorForValue(value) {
    if (value >= SOLAR_COLOR_SCALE.veryHigh.range[0]) {
        return SOLAR_COLOR_SCALE.veryHigh.color;
    } else if (value >= SOLAR_COLOR_SCALE.high.range[0]) {
        return SOLAR_COLOR_SCALE.high.color;
    } else if (value >= SOLAR_COLOR_SCALE.moderate.range[0]) {
        return SOLAR_COLOR_SCALE.moderate.color;
    } else if (value >= SOLAR_COLOR_SCALE.fair.range[0]) {
        return SOLAR_COLOR_SCALE.fair.color;
    }
    return SOLAR_COLOR_SCALE.low.color;
}

/**
 * Get category label for solar hours
 */
function getSolarCategoryLabel(hours) {
    if (hours >= 5.5) return SOLAR_COLOR_SCALE.veryHigh.label;
    if (hours >= 4.5) return SOLAR_COLOR_SCALE.high.label;
    if (hours >= 4.0) return SOLAR_COLOR_SCALE.moderate.label;
    if (hours >= 3.0) return SOLAR_COLOR_SCALE.fair.label;
    return SOLAR_COLOR_SCALE.low.label;
}

/**
 * Load saved map preferences from localStorage
 */
function loadMapPreferences() {
    const saved = localStorage.getItem('solarbot_map_prefs');
    if (saved) {
        try {
            const prefs = JSON.parse(saved);
            solarMapState.lastViewedLocation = prefs.lastLocation;
            solarMapState.currentRegion = prefs.currentRegion || 'st-louis-metro';
            solarMapState.currentLayerType = prefs.layerType || 'heatmap';
            return prefs;
        } catch (e) {
            console.error('Error loading map preferences:', e);
        }
    }
    return null;
}

/**
 * Save map preferences to localStorage
 */
function saveMapPreferences() {
    if (!solarMapState.mapInstance) return;
    
    const center = solarMapState.mapInstance.getCenter();
    const prefs = {
        lastLocation: {
            lat: center.lat(),
            lng: center.lng(),
            zoom: solarMapState.mapInstance.getZoom()
        },
        currentRegion: solarMapState.currentRegion,
        layerType: solarMapState.currentLayerType,
        timestamp: new Date().toISOString()
    };
    
    localStorage.setItem('solarbot_map_prefs', JSON.stringify(prefs));
}

/**
 * Generate location info popup content
 */
function generateLocationInfoPopup(lat, lng, solarHours, locationName) {
    const systemSize = calculateSystemSizeForLocation(solarHours, 2000);
    const monthlyGen = estimateMonthlyGeneration(systemSize, solarHours);
    const annualGen = monthlyGen * 12;
    const color = getSolarColorForValue(solarHours);
    
    return {
        name: locationName,
        solarHours: solarHours,
        category: getSolarCategoryLabel(solarHours),
        color: color,
        recommendedSystem: systemSize,
        monthlyGeneration: monthlyGen,
        annualGeneration: annualGen,
        coordinates: { lat, lng }
    };
}

/**
 * Format location info for chat display
 */
function formatLocationForChat(locInfo) {
    return {
        location: locInfo.name,
        solarHours: locInfo.solarHours,
        systemSize: locInfo.recommendedSystem,
        monthlyKwh: locInfo.monthlyGeneration,
        category: locInfo.category
    };
}

/**
 * Search for solar data by address or city name
 */
function searchSolarLocation(query) {
    const lowerQuery = query.toLowerCase();
    
    // Exact match first
    for (const [key, data] of Object.entries(US_SOLAR_DATA)) {
        if (data.name.toLowerCase() === lowerQuery) {
            return data;
        }
    }
    
    // Partial match
    for (const [key, data] of Object.entries(US_SOLAR_DATA)) {
        if (data.name.toLowerCase().includes(lowerQuery) || 
            lowerQuery.includes(data.name.toLowerCase().split(',')[0])) {
            return data;
        }
    }
    
    return null;
}

/**
 * Get all available regions for dropdown/list
 */
function getAllSolarRegions() {
    return Object.entries(US_SOLAR_DATA).map(([key, data]) => ({
        id: key,
        name: data.name,
        solarHours: data.solarHours
    }));
}

/**
 * Initialize map (Google Maps API required)
 * Called after Google Maps loads
 */
function initializeSolarMap(containerId) {
    if (solarMapState.isInitialized && solarMapState.mapInstance) {
        return solarMapState.mapInstance;
    }
    
    try {
        // Check if Google Maps API is loaded
        if (typeof google === 'undefined' || typeof google.maps === 'undefined') {
            console.error('Google Maps API not loaded yet. Retrying...');
            setTimeout(() => initializeSolarMap(containerId), 500);
            return null;
        }
        
        // Load preferences
        loadMapPreferences();
        
        const mapContainer = document.getElementById(containerId);
        if (!mapContainer) {
            console.error('Map container not found:', containerId);
            return null;
        }
        
        // Determine initial center
        let center = SOLAR_MAP_CONFIG.defaultCenter;
        let zoom = SOLAR_MAP_CONFIG.defaultZoom;
        
        if (solarMapState.lastViewedLocation) {
            center = {
                lat: solarMapState.lastViewedLocation.lat,
                lng: solarMapState.lastViewedLocation.lng
            };
            zoom = solarMapState.lastViewedLocation.zoom || zoom;
        }
        
        // Determine map style based on current theme
        const isDarkTheme = document.body.classList.contains('dark-theme');
        const mapStyle = isDarkTheme ? getMapStyleDark() : getMapStyleLight();
        
        // Initialize Google Map
        solarMapState.mapInstance = new google.maps.Map(mapContainer, {
            zoom: zoom,
            center: center,
            styles: mapStyle,
            mapTypeControl: false,
            fullscreenControl: false,
            streetViewControl: false,
            gestureHandling: 'cooperative'
        });
        
        // Initialize geocoder
        solarMapState.geocoder = new google.maps.Geocoder();
        
        // Add heatmap
        if (SOLAR_MAP_CONFIG.enableHeatmap) {
            addHeatmapLayer();
        }
        
        // Add click listener
        solarMapState.mapInstance.addListener('click', function(event) {
            handleMapClick(event.latLng);
        });
        
        solarMapState.isInitialized = true;
        console.log('Solar Map initialized successfully');
        return solarMapState.mapInstance;
    } catch (error) {
        console.error('Error initializing Solar Map:', error);
        return null;
    }
}

/**
 * Add heatmap layer to map
 */
function addHeatmapLayer() {
    if (!solarMapState.mapInstance) return;
    
    try {
        const regionData = getSolarDataByRegion(solarMapState.currentRegion);
        if (!regionData) return;
        
        // Convert solar data to heatmap format with weighted values
        const heatmapData = regionData.data.map(point => ({
            location: new google.maps.LatLng(point.lat, point.lng),
            weight: Math.max(0, point.value / 7.0) * 100 // Normalize to 0-100
        }));
        
        // Remove existing heatmap
        if (solarMapState.heatmapInstance) {
            solarMapState.heatmapInstance.setMap(null);
        }
        
        // Create new heatmap
        solarMapState.heatmapInstance = new google.maps.visualization.HeatmapLayer({
            data: heatmapData,
            map: solarMapState.mapInstance,
            radius: SOLAR_MAP_CONFIG.heatmapRadius,
            opacity: SOLAR_MAP_CONFIG.heatmapOpacity,
            gradient: [
                '#ADD8E6', // Light blue (low)
                '#87CEEB', // Sky blue (fair)
                '#FFD700', // Gold (moderate)
                '#FF4500', // Orange red (high)
                '#8B0000'  // Dark red (very high)
            ]
        });
        
        console.log('Heatmap layer added');
    } catch (error) {
        console.error('Error adding heatmap layer:', error);
    }
}

/**
 * Handle map clicks
 */
function handleMapClick(latLng) {
    const lat = latLng.lat();
    const lng = latLng.lng();
    
    // Reverse geocode to get location name
    if (solarMapState.geocoder) {
        solarMapState.geocoder.geocode({ location: latLng }, function(results, status) {
            if (status === 'OK' && results.length > 0) {
                const address = results[0].formatted_address;
                
                // Find nearest region with solar data
                let nearestRegion = findNearestSolarRegion(lat, lng);
                let solarHours = nearestRegion ? nearestRegion.solarHours : 4.5;
                
                solarMapState.selectedLocation = {
                    name: address,
                    lat: lat,
                    lng: lng,
                    solarHours: solarHours
                };
                
                // Show info popup
                showLocationInfo(lat, lng, address, solarHours);
                
                // Trigger auto-response in chat
                triggerSolarMapAutoResponse(address, solarHours);
            }
        });
    }
}

/**
 * Find nearest solar region to coordinates
 */
function findNearestSolarRegion(lat, lng) {
    let nearest = null;
    let minDistance = Infinity;
    
    for (const [key, region] of Object.entries(US_SOLAR_DATA)) {
        const distance = Math.sqrt(
            Math.pow(region.center.lat - lat, 2) +
            Math.pow(region.center.lng - lng, 2)
        );
        
        if (distance < minDistance) {
            minDistance = distance;
            nearest = region;
        }
    }
    
    return nearest;
}

/**
 * Show info popup on map for location
 */
function showLocationInfo(lat, lng, locationName, solarHours) {
    try {
        const locInfo = generateLocationInfoPopup(lat, lng, solarHours, locationName);
        
        // Create info window content
        const infoContent = `
            <div class="solar-info-popup">
                <div class="popup-title">${locInfo.name}</div>
                <div class="popup-stat">
                    <span class="stat-label">Peak Sun Hours:</span>
                    <span class="stat-value" style="color: ${locInfo.color};">${locInfo.solarHours} hrs/day</span>
                </div>
                <div class="popup-stat">
                    <span class="stat-label">Category:</span>
                    <span class="stat-value">${locInfo.category}</span>
                </div>
                <div class="popup-stat">
                    <span class="stat-label">Recommended 2000 sq ft System:</span>
                    <span class="stat-value">${locInfo.recommendedSystem} kW</span>
                </div>
                <div class="popup-stat">
                    <span class="stat-label">Monthly Generation (avg):</span>
                    <span class="stat-value">${locInfo.monthlyGeneration.toLocaleString()} kWh</span>
                </div>
            </div>
        `;
        
        // Create info window
        const infoWindow = new google.maps.InfoWindow({
            content: infoContent,
            position: { lat: lat, lng: lng }
        });
        
        // Close other windows
        if (solarMapState.currentInfoWindow) {
            solarMapState.currentInfoWindow.close();
        }
        
        infoWindow.open(solarMapState.mapInstance);
        solarMapState.currentInfoWindow = infoWindow;
        
    } catch (error) {
        console.error('Error showing location info:', error);
    }
}

/**
 * Light theme map styling
 */
function getMapStyleLight() {
    return [
        { elementType: 'geometry', stylers: [{ color: '#f5f5f5' }] },
        { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
        { elementType: 'labels.text.fill', stylers: [{ color: '#616161' }] },
        { elementType: 'labels.text.stroke', stylers: [{ color: '#f5f5f5' }] },
        { featureType: 'administrative.land_parcel', elementType: 'labels.text.fill', stylers: [{ color: '#bdbdbd' }] },
        { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#eeeeee' }] },
        { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#757575' }] },
        { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#e5e5e5' }] },
        { featureType: 'poi.park', elementType: 'labels.text.fill', stylers: [{ color: '#9e9e9e' }] },
        { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
        { featureType: 'road.arterial', elementType: 'labels.text.fill', stylers: [{ color: '#757575' }] },
        { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#dadada' }] },
        { featureType: 'road.highway', elementType: 'labels.text.fill', stylers: [{ color: '#616161' }] },
        { featureType: 'road.local', elementType: 'labels.text.fill', stylers: [{ color: '#9e9e9e' }] },
        { featureType: 'transit.line', elementType: 'geometry', stylers: [{ color: '#e5e5e5' }] },
        { featureType: 'transit.station', elementType: 'geometry', stylers: [{ color: '#eeeeee' }] },
        { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#c9c9c9' }] },
        { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#9e9e9e' }] }
    ];
}

/**
 * Dark theme map styling
 */
function getMapStyleDark() {
    return [
        { elementType: 'geometry', stylers: [{ color: '#242f3e' }] },
        { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
        { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
        { elementType: 'labels.text.stroke', stylers: [{ color: '#242f3e' }] },
        { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#d59563' }] },
        { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#d59563' }] },
        { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#263c3f' }] },
        { featureType: 'poi.park', elementType: 'labels.text.fill', stylers: [{ color: '#6f9e99' }] },
        { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#38414e' }] },
        { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#212a37' }] },
        { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#9ca5b3' }] },
        { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#746855' }] },
        { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#1f2835' }] },
        { featureType: 'road.highway', elementType: 'labels.text.fill', stylers: [{ color: '#f3751b' }] },
        { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#2f3948' }] },
        { featureType: 'transit.station', elementType: 'labels.text.fill', stylers: [{ color: '#d59563' }] },
        { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#17263c' }] },
        { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#515c6d' }] },
        { featureType: 'water', elementType: 'labels.text.stroke', stylers: [{ color: '#17263c' }] }
    ];
}

/**
 * Placeholder for auto-response trigger (will be connected to script.js)
 */
function triggerSolarMapAutoResponse(locationName, solarHours) {
    console.log(`Solar map location selected: ${locationName} with ${solarHours} peak sun hours/day`);
    // This will be called from script.js to add an auto-response to chat
}

console.log('SolarMap module loaded');
