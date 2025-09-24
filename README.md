# Stock Tracker PWA

A Progressive Web App (PWA) for tracking stock prices with beautiful animations, glassmorphism design, and interactive WebGL background effects.

## Features

- 📱 **Progressive Web App** - Installable on mobile and desktop
- 🔄 **Real-time Updates** - Auto-refreshes stock data every 30 seconds
- 💾 **Offline Support** - Works offline with cached data
- 📊 **Stock Details** - Shows price, change, high/low, volume
- 🎨 **Modern UI** - Beautiful gradient design with glassmorphism effects
- 📱 **Responsive** - Works on all device sizes
- ⚡ **Fast Loading** - Optimized with service worker caching

## Quick Start

1. **Start the server:**
   ```bash
   python3 server.py
   ```

2. **Open in browser:**
   - Navigate to `http://localhost:8000`
   - The browser should open automatically

3. **Add stocks:**
   - Enter stock symbols (e.g., AAPL, GOOGL, MSFT)
   - Click "Add Stock" or press Enter
   - Use the popular stock buttons for quick access

## PWA Installation

### Desktop (Chrome/Edge)
1. Look for the install icon in the address bar
2. Click "Install Stock Tracker PWA"
3. The app will be added to your applications

### Mobile (Android)
1. Open in Chrome browser
2. Tap the menu (three dots)
3. Select "Add to Home screen"
4. The app will appear on your home screen

### Mobile (iOS)
1. Open in Safari browser
2. Tap the share button
3. Select "Add to Home Screen"
4. The app will appear on your home screen

## Demo Data

The app currently uses mock data for demonstration purposes. To use real stock data:

1. Get a free API key from [Alpha Vantage](https://www.alphavantage.co/support/#api-key)
2. Replace the `apiKey` in `app.js` with your actual key
3. Uncomment the real API code in the `fetchStockData` method

## File Structure

```
stock/
├── index.html          # Main HTML file
├── styles.css          # CSS styles
├── app.js             # JavaScript application
├── sw.js              # Service worker
├── manifest.json      # PWA manifest
├── icon-192.png       # App icon (192x192)
├── icon-512.png       # App icon (512x512)
├── server.py          # Development server
└── README.md          # This file
```

## Technologies Used

- **HTML5** - Semantic markup
- **CSS3** - Modern styling with gradients and animations
- **JavaScript (ES6+)** - Application logic
- **Service Worker** - Offline functionality and caching
- **Web App Manifest** - PWA installation
- **Python** - Development server

## Browser Support

- Chrome 68+
- Firefox 60+
- Safari 11.1+
- Edge 79+

## Features in Detail

### Stock Tracking
- Add multiple stocks by symbol
- Real-time price updates
- Change indicators (positive/negative)
- Detailed information (high, low, volume)

### PWA Features
- **Installable** - Can be installed like a native app
- **Offline Support** - Works without internet connection
- **Responsive** - Adapts to any screen size
- **Fast Loading** - Cached resources for quick access

### User Interface
- **Modern Design** - Glassmorphism and gradient effects
- **Intuitive** - Easy to use interface
- **Accessible** - Keyboard navigation support
- **Mobile-First** - Optimized for mobile devices

## Development

To modify the app:

1. Edit the relevant files (HTML, CSS, JS)
2. Refresh the browser to see changes
3. The service worker will cache updates automatically

## API Integration

To integrate with real stock APIs:

1. **Alpha Vantage** (Free tier available)
2. **Yahoo Finance API** (Unofficial)
3. **IEX Cloud** (Paid service)
4. **Finnhub** (Free tier available)

## License

This project is open source and available under the MIT License.

## Contributing

Feel free to submit issues and enhancement requests!
