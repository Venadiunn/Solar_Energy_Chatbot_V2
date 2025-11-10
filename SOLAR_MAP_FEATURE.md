# Interactive Solar Map Feature Documentation

## 🎯 Overview

The **Interactive Solar Map** is a Google Maps-based visualization tool that displays solar irradiance (peak sun hours per day) across US regions. It integrates seamlessly with the SolarBot chatbot, allowing users to explore solar potential by location and make data-driven decisions.

## ✨ Key Features

### 1. **Heatmap Visualization**

- Displays solar irradiance as a color-coded heatmap
- Color scale ranges from light blue (low solar potential) to dark red (very high)
- Interactive heatmap layers that respond to map interactions
- Smooth opacity and radius adjustments for optimal visibility

### 2. **Location Search & Geocoding**

- Search for any city or address in the United States
- Auto-complete suggestions from pre-loaded regional data
- Full geocoding support via Google Maps API
- Real-time location information display

### 3. **Solar Data Display**

- Peak sun hours per day for each location
- Solar category classification (Very High, High, Moderate, Fair, Low)
- Recommended system size calculations (based on 2,000 sq ft home)
- Estimated monthly/annual generation in kWh
- Color-coded system recommendations

### 4. **Interactive Controls**

- **Layer Toggle**: Switch between heatmap and marker visualizations
- **Region Dropdown**: Jump to pre-configured US regions
- **Legend Panel**: Color scale reference with labels
- **Comparison Tool**: Compare selected location with St. Louis average
- **Info Panel**: Detailed data for clicked locations

### 5. **Responsive Design**

- Adapts to desktop, tablet, and mobile screens
- Touch-friendly controls for mobile users
- Modal overlay with proper z-indexing
- Gestural support (pan, zoom, pinch)

### 6. **Theme Support**

- Light theme styling (warm solar colors)
- Dark theme styling (modern dark UI)
- Real-time theme switching with map style updates
- Consistent with main chatbot UI

### 7. **Data Persistence**

- Saves last viewed location and zoom level
- Persists user preferences in localStorage
- Remembers selected layer type (heatmap vs markers)
- Restores session state on map reopening

## 📊 Solar Data Coverage

### Pre-loaded Regional Data

The map includes solar irradiance data for 11 major US regions:

| Region          | City            | Peak Sun Hours/Day | Category  |
| --------------- | --------------- | ------------------ | --------- |
| St. Louis Metro | St. Louis, MO   | 4.5                | High      |
| Kansas City     | Kansas City, MO | 4.4                | High      |
| Springfield     | Springfield, MO | 4.3                | High      |
| Chicago         | Chicago, IL     | 4.1                | Moderate  |
| Denver          | Denver, CO      | 5.4                | Very High |
| Phoenix         | Phoenix, AZ     | 6.3                | Very High |
| Los Angeles     | Los Angeles, CA | 5.9                | Very High |
| Seattle         | Seattle, WA     | 3.5                | Fair      |
| Miami           | Miami, FL       | 5.2                | Very High |
| Boston          | Boston, MA      | 3.9                | Fair      |
| Atlanta         | Atlanta, GA     | 4.6                | High      |
| Austin          | Austin, TX      | 5.1                | Very High |

### Solar Color Scale

```
Dark Red (#8B0000)   → Very High (5.5+ kWh/m²/day)
Orange Red (#FF4500) → High (4.5-5.4)
Gold (#FFD700)       → Moderate (4.0-4.4)
Sky Blue (#87CEEB)   → Fair (3.0-3.9)
Light Blue (#ADD8E6) → Low (<3.0)
```

## 🔧 Technical Architecture

### Files & Structure

```
├── index.html              # Solar map modal HTML + Google Maps script
├── script.js               # Integration functions & triggers
├── solarMap.js             # Core solar map module (380+ lines)
├── style.css               # Modal styling & responsive CSS (400+ lines)
└── SOLAR_MAP_FEATURE.md    # This documentation
```

### Core Module: `solarMap.js`

Contains ~380 lines of modular JavaScript with:

- **Configuration**: `SOLAR_MAP_CONFIG` - API keys, map settings
- **Data**: `US_SOLAR_DATA` - Regional solar irradiance data
- **Color Scale**: `SOLAR_COLOR_SCALE` - Heatmap color mappings
- **State Management**: `solarMapState` - Map instance and user state
- **Calculation Functions**:
  - `calculateSystemSizeForLocation()` - Recommend system size
  - `estimateMonthlyGeneration()` - Predict monthly kWh
  - `getSolarColorForValue()` - Map irradiance to color
  - `getSolarCategoryLabel()` - Classify solar potential
- **Data Functions**:
  - `getSolarDataByRegion()` - Lookup regional data
  - `searchSolarLocation()` - Find by name/query
  - `findNearestSolarRegion()` - Proximity search
  - `getAllSolarRegions()` - List all regions
- **Persistence**:
  - `loadMapPreferences()` - Restore from localStorage
  - `saveMapPreferences()` - Save user state
- **Map Functions**:
  - `initializeSolarMap()` - Create map instance
  - `addHeatmapLayer()` - Render heatmap
  - `handleMapClick()` - Process clicks
  - `showLocationInfo()` - Display popups
  - `getMapStyleLight()` / `getMapStyleDark()` - Theme styling

### Integration Points: `script.js`

Added ~150 lines of integration code:

- **UI Functions**:

  - `showSolarMap()` - Open modal & initialize
  - `closeSolarMap()` - Close modal & save state
  - `populateRegionDropdown()` - Load region options
  - `changeMapRegion()` - Handle region selection
  - `searchMapLocation()` - Search functionality
  - `displayLocationInfo()` - Update info panel
  - `toggleMapLayer()` - Switch heatmap/markers
  - `compareLocations()` - Comparison tool

- **Chatbot Integration**:

  - Auto-trigger map when AI mentions "solar map"
  - Fallback rule-based triggers for map-related queries
  - Suggestion button in chat UI
  - Auto-response when user clicks map location

- **System Prompt Enhancement**:
  - Keywords for natural map suggestions
  - Guidelines for transparent map recommendations
  - Context-aware messaging

### Styling: `style.css`

Added 400+ lines of CSS:

- **Modal Container**: Backdrop, centering, animations
- **Header Section**: Title, close button, responsive layout
- **Controls Panel**: Search box, region dropdown, layer toggles
- **Map Canvas**: Full-width Google Maps container
- **Sidebar**: Legend, info panel, comparison tool
- **Responsive Breakpoints**: Tablet (1024px), mobile (768px)
- **Dark Theme Support**: Alternative colors for night mode

## 🚀 Usage Guide

### For Users

1. **Open the Map**

   - Click the "📍 View Solar Map" suggestion button
   - Or mention "solar map", "map", "location", "sunlight" in chat
   - AI can also suggest the map naturally

2. **Explore Regions**

   - Use region dropdown to jump to major cities
   - Or search by address/city name in search box
   - Heatmap updates dynamically

3. **View Location Details**

   - Click anywhere on the map
   - Info popup shows:
     - Peak sun hours/day
     - Solar category
     - Recommended system size
     - Estimated monthly generation
   - Details also appear in right sidebar

4. **Switch Views**

   - Click "🔥 Heatmap" for gradient visualization
   - Click "📍 Markers" to see individual data points
   - Legend shows color scale

5. **Compare Areas**

   - Click on a location
   - See comparison with St. Louis average
   - Click "Compare My Area →" for detailed analysis

6. **Return to Chat**
   - Close modal with ✕ button
   - Any location clicked triggers auto-response from bot

### For Developers

#### Opening the Map Programmatically

```javascript
// In script.js
showSolarMap();
```

#### Getting Solar Data

```javascript
// Get data for a region
const stLouisData = getSolarDataByRegion("st-louis-metro");
console.log(stLouisData.solarHours); // 4.5

// Search for a location
const denver = searchSolarLocation("Denver");
console.log(denver.name); // 'Denver, Colorado'

// Get all regions
const regions = getAllSolarRegions();
```

#### Calculating Recommendations

```javascript
// Recommend system size for location
const systemSize = calculateSystemSizeForLocation(4.5, 2000);
console.log(systemSize); // 5 kW

// Estimate monthly generation
const monthlyKwh = estimateMonthlyGeneration(5, 4.5);
console.log(monthlyKwh); // ~527 kWh
```

#### Saving/Loading Preferences

```javascript
// Save current map state
saveMapPreferences();

// Load previous state
loadMapPreferences();
```

#### Handling Map Clicks

```javascript
// Triggered automatically when user clicks map
// triggerSolarMapAutoResponse(locationName, solarHours)
// Adds AI response to chat with localized data
```

#### Extending with New Regions

Add to `US_SOLAR_DATA` in `solarMap.js`:

```javascript
US_SOLAR_DATA["my-region"] = {
  name: "My City, State",
  center: { lat: 35.1234, lng: -88.5678 },
  solarHours: 4.8,
  data: [
    { lat: 35.1234, lng: -88.5678, value: 4.8 },
    // ... more points
  ],
};
```

## 🔌 API Requirements

### Google Maps API

- **Key**: Uses existing key from `script.js`
- **Libraries**:
  - `visualization` - For heatmap layers
  - `places` - For geocoding
- **Permissions**:
  - Maps JavaScript API
  - Geocoding API
  - Street View API (optional)

### Data Sources

- Pre-loaded US solar irradiance data (public averages)
- Can be extended with:
  - NREL Solar Resource Data API
  - Open-Meteo API
  - NASA POWER API

## 🛡️ Error Handling

- **Map Not Found**: Graceful error if modal doesn't exist
- **API Failure**: Fallback to static pre-loaded data
- **Geocoding Errors**: Toast notification with retry option
- **Network Issues**: Offline mode uses cached data
- **Location Lookup**: Returns nearest region if exact match not found

## 📱 Responsive Behavior

- **Desktop (>1024px)**: Full sidebar + map
- **Tablet (768-1024px)**: Responsive layout
- **Mobile (<768px)**:
  - Stacked sidebar below map
  - Touch-friendly controls
  - Swipeable panels
  - Full-screen map on click

## 🎨 Customization

### Change Default Center

```javascript
// In solarMap.js
SOLAR_MAP_CONFIG.defaultCenter = { lat: 40.7128, lng: -74.006 }; // NYC
```

### Adjust Heatmap Appearance

```javascript
SOLAR_MAP_CONFIG.heatmapRadius = 50; // Larger radius
SOLAR_MAP_CONFIG.heatmapOpacity = 0.8; // More transparent
```

### Modify Color Scale

```javascript
// In solarMap.js
SOLAR_COLOR_SCALE.high.range = [4.2, 5.5]; // New range
SOLAR_COLOR_SCALE.high.color = "#FF6347"; // New color
```

## 📈 Performance Optimizations

- **Lazy Loading**: Map only initializes when modal opens
- **Heatmap Caching**: Reuses layer data when available
- **LocalStorage**: Saves preferences to reduce API calls
- **Efficient Rendering**: Uses Google Maps native methods
- **Event Throttling**: Debounced search & region changes

## 🧪 Testing Checklist

### Functionality

- ✅ Modal opens/closes properly
- ✅ Search finds locations
- ✅ Heatmap displays correctly
- ✅ Markers show when toggled
- ✅ Info popup shows on click
- ✅ Colors match irradiance values
- ✅ Legend displays correctly
- ✅ Comparison tool works
- ✅ localStorage saves/restores state

### Browser Compatibility

- ✅ Chrome (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Edge (latest)
- ✅ Mobile Safari (iOS)
- ✅ Chrome Mobile (Android)

### Responsiveness

- ✅ Desktop layout (1440x900)
- ✅ Tablet layout (768x1024)
- ✅ Mobile layout (375x667)
- ✅ Touch interactions work
- ✅ Gestures (pan, zoom, pinch) work

### Integration

- ✅ Chatbot can open map
- ✅ AI suggests map naturally
- ✅ Suggestion buttons work
- ✅ Auto-response triggers on click
- ✅ Theme switching works
- ✅ Keyboard navigation works

## 🚀 Deployment

### Firebase Deployment

```bash
# Commit changes
git add -A
git commit -m "Add Solar Map feature"

# Push to GitHub
git push origin main

# Deploy to Firebase
firebase deploy --project klppp-4de82
```

### Live URLs

- **Main**: https://klppp-4de82.web.app
- **GitHub Pages**: https://venadiunn.github.io/Solar_Energy_Chatbot_V2/

## 🔮 Future Enhancements

### Phase 2: Enhanced Visualization

- [ ] Real-time weather overlay
- [ ] Temperature data layer
- [ ] Cloud cover predictions
- [ ] Seasonal comparison slider
- [ ] Satellite imagery integration

### Phase 3: Advanced Features

- [ ] Google Project Sunroof data
- [ ] Roof-specific shading analysis
- [ ] Neighborhood solar adoption stats
- [ ] Community comparison rankings
- [ ] Timeline: historical trends

### Phase 4: User Tools

- [ ] Draw polygon for area estimation
- [ ] Multi-location comparison table
- [ ] Export map as PDF/image
- [ ] Share location links
- [ ] Integration with Google Earth
- [ ] AR view for roof analysis

### Phase 5: Data Integration

- [ ] Real-time NREL data API
- [ ] Weather forecast overlay
- [ ] Utility rate data
- [ ] Incentive database by ZIP
- [ ] Local solar company listings

## 📞 Support & Feedback

For issues, suggestions, or feature requests:

1. Check existing GitHub issues
2. Test in latest browser version
3. Clear browser cache (Ctrl+Shift+Delete)
4. Check console for errors (F12)
5. Report with browser/OS info

## 📄 License

Part of Solar Energy Chatbot V2 project. See main LICENSE file.

---

**Last Updated**: November 10, 2025  
**Version**: 1.0 (Initial Release)  
**Status**: ✅ Production Ready
