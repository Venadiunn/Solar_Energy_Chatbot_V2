/**
 * Solar Viewer Fallback
 * Simple static solar data visualization without Google Maps API
 * Works completely offline - no billing required!
 */

// US Solar Data by Region
const SOLAR_REGIONS = {
    'denver': {
        name: 'Denver, Colorado',
        hours: 5.4,
        category: 'Very High',
        color: '#8B0000',
        lat: 39.7392,
        lng: -104.9903,
        facts: '🌞 High altitude = less atmospheric interference\n💰 Payback: 5-7 years\n📊 Annual generation: ~7,500 kWh (5kW system)'
    },
    'phoenix': {
        name: 'Phoenix, Arizona',
        hours: 6.3,
        category: 'Very High',
        color: '#8B0000',
        lat: 33.4484,
        lng: -112.0742,
        facts: '☀️ Best solar location in USA\n💰 Payback: 4-6 years\n📊 Annual generation: ~8,500 kWh (5kW system)'
    },
    'los-angeles': {
        name: 'Los Angeles, California',
        hours: 5.9,
        category: 'Very High',
        color: '#8B0000',
        lat: 34.0522,
        lng: -118.2437,
        facts: '🌅 Consistent year-round sun\n💰 Payback: 5-8 years\n📊 Annual generation: ~8,000 kWh (5kW system)'
    },
    'st-louis': {
        name: 'St. Louis, Missouri',
        hours: 4.5,
        category: 'High',
        color: '#FF4500',
        lat: 38.6270,
        lng: -90.1994,
        facts: '⭐ Good solar location\n💰 Payback: 7-10 years\n📊 Annual generation: ~6,000 kWh (5kW system)'
    },
    'seattle': {
        name: 'Seattle, Washington',
        hours: 3.5,
        category: 'Fair',
        color: '#87CEEB',
        lat: 47.6062,
        lng: -122.3321,
        facts: '🌧️ Cloudier climate\n💰 Payback: 10-13 years\n📊 Annual generation: ~4,700 kWh (5kW system)'
    },
    'miami': {
        name: 'Miami, Florida',
        hours: 4.8,
        category: 'High',
        color: '#FF4500',
        lat: 25.7617,
        lng: -80.1918,
        facts: '🏖️ Tropical sun year-round\n💰 Payback: 6-9 years\n📊 Annual generation: ~6,500 kWh (5kW system)'
    },
    'boston': {
        name: 'Boston, Massachusetts',
        hours: 3.9,
        category: 'Moderate',
        color: '#FFD700',
        lat: 42.3601,
        lng: -71.0589,
        facts: '❄️ Seasonal variation\n💰 Payback: 8-11 years\n📊 Annual generation: ~5,200 kWh (5kW system)'
    },
    'chicago': {
        name: 'Chicago, Illinois',
        hours: 4.1,
        category: 'Moderate',
        color: '#FFD700',
        lat: 41.8781,
        lng: -87.6298,
        facts: '🏙️ Midwest location\n💰 Payback: 8-11 years\n📊 Annual generation: ~5,500 kWh (5kW system)'
    },
    'austin': {
        name: 'Austin, Texas',
        hours: 4.9,
        category: 'High',
        color: '#FF4500',
        lat: 30.2672,
        lng: -97.7431,
        facts: '⭐ Excellent sun exposure\n💰 Payback: 6-9 years\n📊 Annual generation: ~6,600 kWh (5kW system)'
    },
    'atlanta': {
        name: 'Atlanta, Georgia',
        hours: 4.3,
        category: 'High',
        color: '#FF4500',
        lat: 33.7490,
        lng: -84.3880,
        facts: '🌤️ Good solar potential\n💰 Payback: 7-10 years\n📊 Annual generation: ~5,800 kWh (5kW system)'
    }
};

let currentSelectedRegion = 'st-louis';

/**
 * Initialize the fallback solar viewer
 */
function initializeSolarViewerFallback() {
    console.log('Initializing Solar Viewer (Fallback Mode - No API)');
    renderSolarRegionGrid();
    selectRegion('st-louis');
}

/**
 * Render the grid of solar regions
 */
function renderSolarRegionGrid() {
    const container = document.getElementById('solarMapCanvas');
    if (!container) return;
    
    let html = '<div class="solar-grid">';
    
    for (const [key, region] of Object.entries(SOLAR_REGIONS)) {
        const isSelected = key === currentSelectedRegion ? 'selected' : '';
        html += `
            <div class="solar-card ${isSelected}" onclick="selectRegion('${key}')">
                <div class="solar-card-color" style="background-color: ${region.color}"></div>
                <div class="solar-card-name">${region.name}</div>
                <div class="solar-card-hours">${region.hours} hrs/day</div>
                <div class="solar-card-category">${region.category}</div>
            </div>
        `;
    }
    
    html += '</div>';
    container.innerHTML = html;
    
    // Add CSS if not already there
    if (!document.getElementById('solar-viewer-styles')) {
        const style = document.createElement('style');
        style.id = 'solar-viewer-styles';
        style.innerHTML = `
            .solar-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
                gap: 12px;
                padding: 16px;
                background: var(--bg-secondary);
                border-radius: 8px;
            }
            
            .solar-card {
                padding: 12px;
                border: 2px solid transparent;
                border-radius: 8px;
                cursor: pointer;
                background: var(--bg-tertiary);
                transition: all 0.3s ease;
                text-align: center;
            }
            
            .solar-card:hover {
                transform: translateY(-2px);
                border-color: currentColor;
            }
            
            .solar-card.selected {
                border-color: #4CAF50;
                box-shadow: 0 0 8px rgba(76, 175, 80, 0.3);
                background: var(--bg-accent);
            }
            
            .solar-card-color {
                width: 100%;
                height: 30px;
                border-radius: 4px;
                margin-bottom: 8px;
            }
            
            .solar-card-name {
                font-weight: 600;
                font-size: 12px;
                margin-bottom: 4px;
                word-break: break-word;
            }
            
            .solar-card-hours {
                font-size: 14px;
                font-weight: bold;
                color: #4CAF50;
            }
            
            .solar-card-category {
                font-size: 11px;
                color: var(--text-secondary);
                margin-top: 4px;
            }
        `;
        document.head.appendChild(style);
    }
}

/**
 * Select a region and show details
 */
function selectRegion(regionKey) {
    currentSelectedRegion = regionKey;
    const region = SOLAR_REGIONS[regionKey];
    
    if (!region) return;
    
    // Update cards
    renderSolarRegionGrid();
    
    // Update info panel
    const infoPanel = document.getElementById('mapInfoPanel');
    if (infoPanel) {
        infoPanel.innerHTML = `
            <div style="padding: 16px; background: var(--bg-secondary); border-radius: 8px;">
                <div style="font-size: 18px; font-weight: bold; margin-bottom: 12px; color: #4CAF50;">
                    ☀️ ${region.name}
                </div>
                <div style="font-size: 24px; font-weight: bold; margin-bottom: 16px; color: ${region.color};">
                    ${region.hours} peak sun hours/day
                </div>
                <div style="background: ${region.color}22; padding: 12px; border-radius: 6px; margin-bottom: 12px;">
                    <div style="font-weight: 600; margin-bottom: 8px;">Category: ${region.category}</div>
                    <div style="font-size: 12px; white-space: pre-wrap; line-height: 1.6;">
                        ${region.facts}
                    </div>
                </div>
                <div style="font-size: 12px; color: var(--text-secondary);">
                    💡 This is based on average annual solar irradiance data
                </div>
            </div>
        `;
    }
}

/**
 * Search for a region by name
 */
function searchSolarRegion(query) {
    const normalized = query.toLowerCase();
    
    for (const [key, region] of Object.entries(SOLAR_REGIONS)) {
        if (region.name.toLowerCase().includes(normalized)) {
            selectRegion(key);
            return true;
        }
    }
    
    return false;
}

/**
 * Populate region dropdown
 */
function populateSolarRegionSelect() {
    const select = document.getElementById('solarRegionSelect');
    if (!select) return;
    
    for (const [key, region] of Object.entries(SOLAR_REGIONS)) {
        const option = document.createElement('option');
        option.value = key;
        option.textContent = region.name;
        select.appendChild(option);
    }
}

/**
 * Handle region select change
 */
function changeSolarRegion(regionKey) {
    if (regionKey) {
        selectRegion(regionKey);
    }
}

/**
 * No-op for layer toggle (fallback doesn't have layers)
 */
function toggleSolarMapLayer(layerType) {
    console.log('Layer toggle (not available in fallback mode):', layerType);
}
