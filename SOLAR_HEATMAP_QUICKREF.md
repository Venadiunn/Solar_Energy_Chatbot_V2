# ⚡ Solar Heatmap Quick Reference

## 🎯 What It Does
Interactive solar potential map showing peak sun hours across US cities using Leaflet.js + OpenStreetMap (no Google Maps API).

## 🚀 Quick Start

### For Users
1. **Open Map:** Click "📍 View Map" button OR say "show me the solar map" in chat
2. **Explore:** Click cities to see peak sun hours, generation estimates, savings
3. **Search:** Type city name in search box
4. **Compare:** Click city markers to see detailed data in sidebar

### For Developers
1. **Open Map:** Call `showSolarMap()`
2. **Initialize:** `initializeSolarHeatmap()` creates Leaflet instance
3. **Select Region:** `selectSolarRegion('denver')`
4. **Toggle Layers:** `toggleSolarLayer('heatmap')`
5. **Search:** `searchSolarLocation('phoenix')`

## 📍 15 Cities Included

| City | Sun Hours | Category | Payback |
|------|-----------|----------|---------|
| 🏆 Phoenix, AZ | 6.3 | Very High | 4-6 yrs |
| Denver, CO | 5.4 | Very High | 5-7 yrs |
| Los Angeles, CA | 5.9 | Very High | 5-8 yrs |
| Las Vegas, NV | 6.1 | Very High | 4-7 yrs |
| Austin, TX | 5.2 | Very High | 6-9 yrs |
| Houston, TX | 4.9 | High | 7-10 yrs |
| Miami, FL | 4.8 | High | 7-10 yrs |
| St. Louis, MO | 4.5 | High | 7-10 yrs |
| Atlanta, GA | 4.4 | High | 8-11 yrs |
| New York, NY | 4.0 | Moderate | 8-12 yrs |
| Boston, MA | 4.0 | Moderate | 8-12 yrs |
| Chicago, IL | 3.8 | Fair | 9-12 yrs |
| Portland, OR | 3.7 | Fair | 10-13 yrs |
| Seattle, WA | 3.5 | Fair | 10-14 yrs |
| San Diego, CA | 5.8 | Very High | 5-8 yrs |

## 🎨 Color Scale

```
🔴 Very High  (6.0+)     - Dark Red
🟠 High       (5.0-5.4)  - Orange
🟡 Moderate   (4.0-4.4)  - Gold
🔵 Fair       (3.5-3.9)  - Sky Blue
🩵 Low        (<3.5)     - Light Blue
```

## 📊 Data Shown Per Location

- ☀️ **Peak Sun Hours:** Daily average
- ⚡ **Daily Generation:** kWh (5kW system)
- 📈 **Monthly Generation:** kWh average
- 💰 **Annual Savings:** Estimated dollars
- ⏱️ **Payback Period:** Years until ROI
- 🔌 **System Size:** Recommended kW

## 🔑 Key Features

| Feature | How to Use |
|---------|-----------|
| **Auto-Open Map** | Say "solar potential", "peak sun", "sunlight", etc. |
| **Auto-Jump City** | Mention city name like "Denver" or "Phoenix" |
| **Search Box** | Type city in map search bar |
| **View Details** | Click city marker, then "View Details" |
| **Click Marker** | See quick popup with key info |
| **Theme Toggle** | Map adapts to light/dark mode automatically |
| **Offline Mode** | Works without internet (cached data) |
| **Persistent View** | Last map location saved automatically |
| **Mobile Ready** | Full responsive design |
| **Compare Mode** | [Future] Compare 2 regions side-by-side |

## 🛠️ Technical Stack

| Component | Technology |
|-----------|-----------|
| **Map Framework** | Leaflet.js 1.9.4 |
| **Map Tiles** | OpenStreetMap |
| **Heatmap Layer** | Leaflet.heat 0.2.0 |
| **Styling** | CSS custom properties |
| **Storage** | Browser localStorage |
| **Data Source** | Preprocessed in code |
| **APIs Required** | None (fully offline!) |

## 💾 localStorage Used

```javascript
solarMapPreferences  // Last viewed location + zoom
solarDataCache       // Solar data for offline use
```

## 🔗 File Locations

```
solarHeatmap.js      (706 lines) - Main heatmap logic
script.js            (Enhanced)  - showSolarMap(), auto-detection
style.css            (Enhanced)  - 450+ lines of styling
index.html           (v3.0)      - CDN links, version bump
```

## 🎯 Auto-Detection Keywords

### Map Suggestion Triggers
- "sunlight" or "peak sun"
- "solar potential" or "solar resources"
- "sun hours" or "solar irradiance"
- "regional solar" or "location solar"
- "comparing solar" or "solar difference"

### City Auto-Jump Triggers
- City names: Denver, Phoenix, Las Vegas, Austin, etc.
- State names: Colorado, Arizona, Texas, etc.

## 📱 Responsive Sizes

| Device | Width | Layout |
|--------|-------|--------|
| Desktop | >768px | Side-by-side map + sidebar |
| Tablet | 481-768px | Stacked, 2-column grid |
| Mobile | <480px | Full-screen modal |

## 🚦 Status Indicators

| Indicator | Meaning |
|-----------|---------|
| 🔴 Dark Red | Very High solar (6.0+ kWh/m²/day) |
| 🟠 Orange | High solar (5.0-5.4) |
| 🟡 Gold | Moderate solar (4.0-4.4) |
| 🔵 Blue | Fair solar (3.5-3.9) |
| 🩵 Light Blue | Low solar (<3.5) |

## ✨ Example Conversation

```
User: "Is Austin good for solar?"

Bot: "Austin is a great solar location! It gets about 5.2 peak 
sun hours daily. Want to see how Austin compares to other areas? 
I can show you our Interactive Solar Map with detailed solar 
potential data."

User: "Yes, show me the map"

Bot: "Here's the Interactive Solar Map for you!"
[Map opens and auto-jumps to Austin]
[Sidebar shows: 5.2 hours/day, $1,680/year savings, 6.0 kW system, 6-9 year payback]

User: "How about Denver?"

Bot: "Great question! Let me show you Denver."
[Map pans to Denver]
[Sidebar updates: 5.4 hours/day, $1,800/year savings, 6.0 kW system, 5-7 year payback]
```

## 🐛 Common Issues & Fixes

| Issue | Solution |
|-------|----------|
| Map not showing | Refresh page, check CDN links |
| No heatmap overlay | Verify Leaflet.heat loaded |
| Popups not working | Clear browser cache |
| Slow on mobile | Close other tabs, disable animations |
| Data not updating | localStorage.clear(), refresh |

## 🔄 Fallback Behavior

```
Try to load Leaflet.js
    ↓
If available → Use interactive heatmap
If NOT available → Use card viewer (solarViewerFallback.js)
    ↓
Always have fallback ready
No broken UI possible
```

## 📈 Financial Calculations

For a typical **5kW system**:

**Formula:**
- Daily Gen (kWh) = Peak Sun Hours × 5kW × 0.75 (efficiency)
- Annual Gen (kWh) = Daily Gen × 365
- Annual Savings = Annual Gen × $0.12/kWh × 0.80 (grid factor)

**Example (Phoenix):**
- Daily: 6.3 × 5 × 0.75 = 23.6 kWh
- Annual: 23.6 × 365 = 8,614 kWh
- Savings: 8,614 × $0.12 × 0.80 = **$825/year**

## 🎮 Keyboard Shortcuts

| Action | Method |
|--------|--------|
| Open Map | Click button / Chat trigger |
| Zoom In | +/- buttons or scroll wheel |
| Pan | Click & drag |
| Close Map | Click ✕ button |
| Theme Toggle | Use app theme button (affects map) |

## 🌐 Browser Support

- ✅ Chrome/Edge 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Mobile Safari iOS 14+
- ✅ Chrome Android

## 📊 Development Tips

### Add New City
1. Add to `SOLAR_DATA_CACHE` in solarHeatmap.js
2. Include: lat, lng, hours, category, generation, payback, system
3. Update `cityPatterns` in script.js checkAndAutoSearchMap()
4. Redeploy

### Customize Colors
1. Edit `SOLAR_COLOR_SCALE` in solarHeatmap.js
2. Change HEX values for any threshold
3. Update gradient in L.heatLayer() options
4. Test on heatmap overlay

### Modify Styling
1. Edit Leaflet sections in style.css
2. Search for `.solar-map-` or `.leaflet-`
3. Test responsive breakpoints
4. Deploy

## 🎓 Learning Resources

- **Leaflet.js Docs:** https://leafletjs.com/
- **OpenStreetMap:** https://www.openstreetmap.org/
- **Leaflet.heat Plugin:** https://github.com/Leaflet/Leaflet.heat

---

**Version:** 3.0  
**Status:** ✅ Production Ready  
**Last Updated:** Nov 10, 2025
