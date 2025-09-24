// Stock Tracker PWA - Main Application
class StockTracker {
    constructor() {
        this.stocks = new Map();
        this.updateInterval = 30000; // 30 seconds
        this.apiKey = 'demo'; // Using demo API key for free tier
        this.baseUrl = 'https://www.alphavantage.co/query';
        this.init();
    }

    init() {
        this.registerServiceWorker();
        this.initPixelBlast();
        this.loadStoredStocks();
        this.bindEvents();
        this.startAutoUpdate();
    }

    // Initialize PixelBlast Background
    initPixelBlast() {
        if (typeof window.PixelBlast !== 'undefined') {
            const backgroundContainer = document.getElementById('pixelblast-background');
            if (backgroundContainer) {
                this.pixelBlast = new window.PixelBlast({
                    variant: 'circle',
                    pixelSize: 6,
                    color: '#B19EEF',
                    patternScale: 3,
                    patternDensity: 1.2,
                    pixelSizeJitter: 0.5,
                    enableRipples: true,
                    rippleSpeed: 0.4,
                    rippleThickness: 0.12,
                    rippleIntensityScale: 1.5,
                    liquid: true,
                    liquidStrength: 0.12,
                    liquidRadius: 1.2,
                    liquidWobbleSpeed: 5,
                    speed: 0.6,
                    edgeFade: 0.25,
                    transparent: true
                });
                this.pixelBlast.mount(backgroundContainer);
            }
        }
    }

    // Register Service Worker
    async registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.register('/sw.js');
                console.log('Service Worker registered successfully:', registration);
            } catch (error) {
                console.log('Service Worker registration failed:', error);
            }
        }
    }

    // Bind event listeners
    bindEvents() {
        const addStockBtn = document.getElementById('addStock');
        const stockSymbolInput = document.getElementById('stockSymbol');
        const popularStocks = document.querySelectorAll('.popular-stock');

        addStockBtn.addEventListener('click', () => this.addStock());
        stockSymbolInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.addStock();
            }
        });

        popularStocks.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const symbol = e.target.dataset.symbol;
                document.getElementById('stockSymbol').value = symbol;
                this.addStock();
            });
        });
    }

    // Add a new stock
    async addStock() {
        const symbolInput = document.getElementById('stockSymbol');
        const symbol = symbolInput.value.trim().toUpperCase();

        if (!symbol) {
            this.showError('Please enter a stock symbol');
            return;
        }

        if (this.stocks.has(symbol)) {
            this.showError('Stock already being tracked');
            return;
        }

        this.showLoading(true);
        symbolInput.value = '';

        try {
            const stockData = await this.fetchStockData(symbol);
            if (stockData) {
                this.stocks.set(symbol, stockData);
                this.renderStockCard(stockData);
                this.saveStocks();
                this.hideWelcomeMessage();
            }
        } catch (error) {
            this.showError(`Failed to fetch data for ${symbol}: ${error.message}`);
        } finally {
            this.showLoading(false);
        }
    }

    // Fetch stock data from API
    async fetchStockData(symbol) {
        // For demo purposes, we'll use mock data since Alpha Vantage requires API key
        // In production, you would use a real API key
        return new Promise((resolve) => {
            setTimeout(() => {
                const mockData = this.generateMockStockData(symbol);
                resolve(mockData);
            }, 1000);
        });

        // Real API call (uncomment when you have an API key):
        /*
        const url = `${this.baseUrl}?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${this.apiKey}`;
        
        try {
            const response = await fetch(url);
            const data = await response.json();
            
            if (data['Error Message']) {
                throw new Error(data['Error Message']);
            }
            
            const quote = data['Global Quote'];
            if (!quote || !quote['01. symbol']) {
                throw new Error('Invalid stock symbol');
            }
            
            return {
                symbol: quote['01. symbol'],
                company: await this.getCompanyName(symbol),
                price: parseFloat(quote['05. price']),
                change: parseFloat(quote['09. change']),
                changePercent: parseFloat(quote['10. change percent'].replace('%', '')),
                high: parseFloat(quote['03. high']),
                low: parseFloat(quote['04. low']),
                volume: parseInt(quote['06. volume']),
                lastUpdate: new Date().toISOString()
            };
        } catch (error) {
            throw new Error(`API Error: ${error.message}`);
        }
        */
    }

    // Generate mock stock data for demo
    generateMockStockData(symbol) {
        const companies = {
            'AAPL': 'Apple Inc.',
            'GOOGL': 'Alphabet Inc.',
            'MSFT': 'Microsoft Corporation',
            'TSLA': 'Tesla, Inc.',
            'AMZN': 'Amazon.com, Inc.',
            'META': 'Meta Platforms, Inc.',
            'NVDA': 'NVIDIA Corporation',
            'NFLX': 'Netflix, Inc.'
        };

        const basePrice = Math.random() * 500 + 50;
        const change = (Math.random() - 0.5) * 20;
        const changePercent = (change / basePrice) * 100;

        return {
            symbol: symbol,
            company: companies[symbol] || `${symbol} Corporation`,
            price: basePrice,
            change: change,
            changePercent: changePercent,
            high: basePrice + Math.random() * 10,
            low: basePrice - Math.random() * 10,
            volume: Math.floor(Math.random() * 10000000) + 1000000,
            lastUpdate: new Date().toISOString()
        };
    }

    // Get company name (mock implementation)
    async getCompanyName(symbol) {
        const companies = {
            'AAPL': 'Apple Inc.',
            'GOOGL': 'Alphabet Inc.',
            'MSFT': 'Microsoft Corporation',
            'TSLA': 'Tesla, Inc.',
            'AMZN': 'Amazon.com, Inc.'
        };
        return companies[symbol] || `${symbol} Corporation`;
    }

    // Render stock card
    renderStockCard(stockData) {
        const container = document.getElementById('stocksContainer');
        const card = document.createElement('div');
        card.className = 'stock-card';
        card.id = `stock-${stockData.symbol}`;

        const changeClass = stockData.change > 0 ? 'positive' : 
                           stockData.change < 0 ? 'negative' : 'neutral';
        const changeSymbol = stockData.change > 0 ? '↗' : 
                            stockData.change < 0 ? '↘' : '→';

        card.innerHTML = `
            <div class="stock-header">
                <div>
                    <div class="stock-symbol">${stockData.symbol}</div>
                    <div class="stock-company">${stockData.company}</div>
                </div>
                <button class="remove-stock" onclick="stockTracker.removeStock('${stockData.symbol}')">×</button>
            </div>
            <div class="stock-price">$${stockData.price.toFixed(2)}</div>
            <div class="stock-change ${changeClass}">
                <span>${changeSymbol} $${Math.abs(stockData.change).toFixed(2)}</span>
                <span>(${stockData.changePercent.toFixed(2)}%)</span>
            </div>
            <div class="stock-details">
                <div class="detail-item">
                    <div class="detail-label">High</div>
                    <div class="detail-value">$${stockData.high.toFixed(2)}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Low</div>
                    <div class="detail-value">$${stockData.low.toFixed(2)}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Volume</div>
                    <div class="detail-value">${this.formatNumber(stockData.volume)}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Updated</div>
                    <div class="detail-value">${this.formatTime(stockData.lastUpdate)}</div>
                </div>
            </div>
        `;

        container.appendChild(card);
    }

    // Remove stock
    removeStock(symbol) {
        this.stocks.delete(symbol);
        const card = document.getElementById(`stock-${symbol}`);
        if (card) {
            card.remove();
        }
        this.saveStocks();
        
        if (this.stocks.size === 0) {
            this.showWelcomeMessage();
        }
    }

    // Update all stocks
    async updateAllStocks() {
        if (this.stocks.size === 0) return;

        const updatePromises = Array.from(this.stocks.keys()).map(async (symbol) => {
            try {
                const stockData = await this.fetchStockData(symbol);
                if (stockData) {
                    this.stocks.set(symbol, stockData);
                    this.updateStockCard(stockData);
                }
            } catch (error) {
                console.error(`Failed to update ${symbol}:`, error);
            }
        });

        await Promise.all(updatePromises);
        this.saveStocks();
    }

    // Update existing stock card
    updateStockCard(stockData) {
        const card = document.getElementById(`stock-${stockData.symbol}`);
        if (!card) return;

        const changeClass = stockData.change > 0 ? 'positive' : 
                           stockData.change < 0 ? 'negative' : 'neutral';
        const changeSymbol = stockData.change > 0 ? '↗' : 
                            stockData.change < 0 ? '↘' : '→';

        card.querySelector('.stock-price').textContent = `$${stockData.price.toFixed(2)}`;
        
        const changeElement = card.querySelector('.stock-change');
        changeElement.className = `stock-change ${changeClass}`;
        changeElement.innerHTML = `
            <span>${changeSymbol} $${Math.abs(stockData.change).toFixed(2)}</span>
            <span>(${stockData.changePercent.toFixed(2)}%)</span>
        `;

        const details = card.querySelectorAll('.detail-value');
        details[0].textContent = `$${stockData.high.toFixed(2)}`;
        details[1].textContent = `$${stockData.low.toFixed(2)}`;
        details[2].textContent = this.formatNumber(stockData.volume);
        details[3].textContent = this.formatTime(stockData.lastUpdate);
    }

    // Start auto-update
    startAutoUpdate() {
        setInterval(() => {
            this.updateAllStocks();
        }, this.updateInterval);
    }

    // Show/hide loading
    showLoading(show) {
        const loading = document.getElementById('loading');
        loading.style.display = show ? 'block' : 'none';
    }

    // Show error message
    showError(message) {
        const error = document.getElementById('error');
        const errorMessage = document.getElementById('errorMessage');
        errorMessage.textContent = message;
        error.style.display = 'block';
        
        setTimeout(() => {
            error.style.display = 'none';
        }, 5000);
    }

    // Hide welcome message
    hideWelcomeMessage() {
        const welcomeMessage = document.querySelector('.welcome-message');
        if (welcomeMessage) {
            welcomeMessage.style.display = 'none';
        }
    }

    // Show welcome message
    showWelcomeMessage() {
        const welcomeMessage = document.querySelector('.welcome-message');
        if (welcomeMessage) {
            welcomeMessage.style.display = 'block';
        }
    }

    // Save stocks to localStorage
    saveStocks() {
        const stocksArray = Array.from(this.stocks.entries());
        localStorage.setItem('stockTracker_stocks', JSON.stringify(stocksArray));
    }

    // Load stocks from localStorage
    loadStoredStocks() {
        const stored = localStorage.getItem('stockTracker_stocks');
        if (stored) {
            try {
                const stocksArray = JSON.parse(stored);
                stocksArray.forEach(([symbol, stockData]) => {
                    this.stocks.set(symbol, stockData);
                    this.renderStockCard(stockData);
                });
                this.hideWelcomeMessage();
            } catch (error) {
                console.error('Failed to load stored stocks:', error);
            }
        }
    }

    // Format number with commas
    formatNumber(num) {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }

    // Format time
    formatTime(isoString) {
        const date = new Date(isoString);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.stockTracker = new StockTracker();
});

// Handle PWA install prompt
let deferredPrompt;
let installButton = null;

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    
    // Create install button
    if (!installButton) {
        installButton = document.createElement('button');
        installButton.textContent = '📱 Install App';
        installButton.className = 'install-button';
        installButton.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: linear-gradient(135deg, #B19EEF, #FF6B9D);
            color: white;
            border: none;
            border-radius: 50px;
            padding: 15px 25px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            box-shadow: 0 5px 15px rgba(177, 158, 239, 0.4);
            z-index: 1000;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.2);
            transition: all 0.3s ease;
        `;
        
        installButton.addEventListener('click', async () => {
            if (deferredPrompt) {
                deferredPrompt.prompt();
                const { outcome } = await deferredPrompt.userChoice;
                console.log(`User response to the install prompt: ${outcome}`);
                deferredPrompt = null;
                installButton.style.display = 'none';
            }
        });
        
        installButton.addEventListener('mouseenter', () => {
            installButton.style.transform = 'translateY(-2px)';
            installButton.style.boxShadow = '0 8px 20px rgba(177, 158, 239, 0.6)';
        });
        
        installButton.addEventListener('mouseleave', () => {
            installButton.style.transform = 'translateY(0)';
            installButton.style.boxShadow = '0 5px 15px rgba(177, 158, 239, 0.4)';
        });
        
        document.body.appendChild(installButton);
    }
    
    console.log('PWA install prompt available');
});

// Handle PWA installation
window.addEventListener('appinstalled', () => {
    console.log('PWA was installed');
    if (installButton) {
        installButton.style.display = 'none';
    }
    deferredPrompt = null;
});

// Check if app is already installed
window.addEventListener('load', () => {
    if (window.matchMedia('(display-mode: standalone)').matches) {
        console.log('PWA is running in standalone mode');
        if (installButton) {
            installButton.style.display = 'none';
        }
    }
});
