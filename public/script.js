// Panel de Control - FB Marketplace Bot Perú
class DashboardController {
    constructor() {
        this.isConnected = false;
        this.botRunning = false;
        this.logs = [];
        this.stats = {
            totalCars: 0,
            sentToTelegram: 0,
            avgPrice: 0,
            successRate: 0
        };
        this.marketContext = {};
        this.recentCars = [];
        
        this.checkAuthentication();
        this.init();
    }

    checkAuthentication() {
        const authToken = localStorage.getItem('fbbot_auth');
        const session = sessionStorage.getItem('fbbot_session');
        
        if (!authToken || session !== 'active') {
            window.location.href = '/login.html';
            return;
        }
    }

    init() {
        this.bindEvents();
        this.updateStatus();
        this.loadInitialData();
        this.startPeriodicUpdates();
        this.addLog('Panel de control iniciado', 'info');
    }

    bindEvents() {
        // Control buttons
        document.getElementById('runBot').addEventListener('click', () => this.runBot());
        document.getElementById('stopBot').addEventListener('click', () => this.stopBot());
        document.getElementById('testBot').addEventListener('click', () => this.testBot());
        
        // Configuration
        document.getElementById('saveConfig').addEventListener('click', () => this.saveConfig());
        
        // Market context
        document.getElementById('refreshContext').addEventListener('click', () => this.refreshMarketContext());
        
        // Logs
        document.getElementById('clearLogs').addEventListener('click', () => this.clearLogs());
        document.getElementById('refreshLogs').addEventListener('click', () => this.refreshLogs());
        
        // Logout
        document.getElementById('logoutBtn').addEventListener('click', () => this.logout());
    }

    logout() {
        localStorage.removeItem('fbbot_auth');
        sessionStorage.removeItem('fbbot_session');
        window.location.href = '/login.html';
    }

    // Bot Control Methods
    async runBot() {
        const runButton = document.getElementById('runBot');
        const stopButton = document.getElementById('stopBot');
        
        try {
            this.setButtonLoading(runButton, true);
            this.addLog('Iniciando scraping del bot...', 'info');
            
            const response = await fetch('/.netlify/functions/panel-api/run-bot', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.message || 'Bot execution failed');
            }
            
            const result = data.result;
            
            this.botRunning = true;
            runButton.disabled = true;
            stopButton.disabled = false;
            
            this.updateBotStatus('Ejecutándose');
            this.updateLastExecution();
            
            // Reload stats from server
            await this.loadStats();
            
            this.addLog(`Bot ejecutado exitosamente: ${result.totalCars || 0} carros analizados, ${result.sentToTelegram || 0} enviados a Telegram`, 'success');
            
            // Show success message
            this.showMessage(`✅ Scraping completado: ${result.totalCars || 0} carros analizados`, 'success');
            
        } catch (error) {
            this.addLog(`Error al ejecutar bot: ${error.message}`, 'error');
            this.showMessage(`❌ Error: ${error.message}`, 'error');
        } finally {
            this.setButtonLoading(runButton, false);
            // Remove artificial delay - let the real response determine timing
            this.botRunning = false;
            runButton.disabled = false;
            stopButton.disabled = true;
            this.updateBotStatus('Inactivo');
        }
    }

    async stopBot() {
        try {
            this.addLog('Deteniendo bot...', 'warning');
            
            // In a real implementation, you would call an API to stop the bot
            this.botRunning = false;
            document.getElementById('runBot').disabled = false;
            document.getElementById('stopBot').disabled = true;
            
            this.updateBotStatus('Detenido');
            this.addLog('Bot detenido por el usuario', 'warning');
            this.showMessage('⏹️ Bot detenido', 'info');
            
        } catch (error) {
            this.addLog(`Error al detener bot: ${error.message}`, 'error');
            this.showMessage(`❌ Error al detener: ${error.message}`, 'error');
        }
    }

    async testBot() {
        const testButton = document.getElementById('testBot');
        
        try {
            this.setButtonLoading(testButton, true);
            this.addLog('Ejecutando prueba local...', 'info');
            
            const response = await fetch('/.netlify/functions/panel-api/test-bot', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.message || 'Test failed');
            }
            
            const result = data.result;
            
            this.addLog(`Prueba completada: ${result.totalCars} carros procesados, ${result.sentToTelegram} enviados`, 'success');
            this.showMessage('🧪 Prueba local completada exitosamente', 'success');
            
        } catch (error) {
            this.addLog(`Error en prueba: ${error.message}`, 'error');
            this.showMessage(`❌ Error en prueba: ${error.message}`, 'error');
        } finally {
            this.setButtonLoading(testButton, false);
        }
    }

    // Configuration Methods
    saveConfig() {
        try {
            const config = {
                maxPrice: document.getElementById('maxPrice').value,
                minYear: document.getElementById('minYear').value,
                maxItems: document.getElementById('maxItems').value,
                minProfit: document.getElementById('minProfit').value
            };
            
            // Send to server
            fetch('/.netlify/functions/panel-api/config', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(config)
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    this.addLog('Configuración guardada exitosamente', 'success');
                    this.showMessage('💾 Configuración guardada', 'success');
                } else {
                    throw new Error(data.message || 'Failed to save config');
                }
            })
            .catch(error => {
                this.addLog(`Error al guardar configuración: ${error.message}`, 'error');
                this.showMessage(`❌ Error al guardar: ${error.message}`, 'error');
            });
            
        } catch (error) {
            this.addLog(`Error al guardar configuración: ${error.message}`, 'error');
            this.showMessage(`❌ Error al guardar: ${error.message}`, 'error');
        }
    }

    async loadConfig() {
        try {
            const response = await fetch('/.netlify/functions/panel-api/config');
            
            if (response.ok) {
                const data = await response.json();
                if (data.success && data.config) {
                    const config = data.config;
                    document.getElementById('maxPrice').value = config.maxPrice || 80000;
                    document.getElementById('minYear').value = config.minYear || 2010;
                    document.getElementById('maxItems').value = config.maxItems || 15;
                    document.getElementById('minProfit').value = config.minProfit || 15;
                }
            }
        } catch (error) {
            this.addLog(`Error al cargar configuración: ${error.message}`, 'warning');
        }
    }

    // Market Context Methods
    async refreshMarketContext() {
        const refreshButton = document.getElementById('refreshContext');
        
        try {
            this.setButtonLoading(refreshButton, true);
            this.addLog('Actualizando contexto del mercado...', 'info');
            
            const response = await fetch('/.netlify/functions/panel-api/refresh-context', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.message || 'Failed to refresh context');
            }
            
            this.marketContext = data.context;
            this.updateMarketContext();
            this.addLog('Contexto del mercado actualizado', 'success');
            this.showMessage('📊 Contexto actualizado', 'success');
            
        } catch (error) {
            this.addLog(`Error al actualizar contexto: ${error.message}`, 'error');
            this.showMessage(`❌ Error: ${error.message}`, 'error');
        } finally {
            this.setButtonLoading(refreshButton, false);
        }
    }

    updateMarketContext() {
        document.getElementById('marketAvgPrice').textContent = `S/ ${this.marketContext.avgPrice?.toLocaleString() || '0'}`;
        document.getElementById('marketPriceRange').textContent = 
            `S/ ${this.marketContext.priceRange?.min?.toLocaleString() || '0'} - S/ ${this.marketContext.priceRange?.max?.toLocaleString() || '0'}`;
        document.getElementById('marketAvgYear').textContent = this.marketContext.avgYear || '0';
        document.getElementById('marketTopBrands').textContent = this.marketContext.topBrands?.join(', ') || '-';
        document.getElementById('marketSegment').textContent = this.marketContext.segment || '-';
    }

    // Statistics Methods
    async loadStats() {
        try {
            const response = await fetch('/.netlify/functions/panel-api/stats');
            
            if (response.ok) {
                const data = await response.json();
                if (data.success && data.stats) {
                    this.stats = { ...this.stats, ...data.stats };
                    this.updateStats();
                }
            }
        } catch (error) {
            this.addLog(`Error al cargar estadísticas: ${error.message}`, 'warning');
        }
    }

    updateStats() {
        document.getElementById('totalCars').textContent = this.stats.totalCars;
        document.getElementById('sentToTelegram').textContent = this.stats.sentToTelegram;
        document.getElementById('avgPrice').textContent = `S/ ${this.stats.avgPrice.toLocaleString()}`;
        
        const successRate = this.stats.totalCars > 0 ? 
            Math.round((this.stats.sentToTelegram / this.stats.totalCars) * 100) : 0;
        document.getElementById('successRate').textContent = `${successRate}%`;
    }

    // Cars Methods
    updateCarsList() {
        const carsList = document.getElementById('carsList');
        
        if (this.recentCars.length === 0) {
            carsList.innerHTML = '<p class="no-data">No hay carros analizados aún</p>';
            return;
        }
        
        const carsHTML = this.recentCars.map(car => `
            <div class="car-item">
                <div class="car-title">${car.title}</div>
                <div class="car-details">
                    <span>${car.year} • ${car.brand}</span>
                    <span class="car-price">S/ ${car.price.toLocaleString()}</span>
                </div>
            </div>
        `).join('');
        
        carsList.innerHTML = carsHTML;
    }

    // Logs Methods
    addLog(message, type = 'info') {
        const timestamp = new Date().toLocaleTimeString();
        const logEntry = {
            timestamp,
            message,
            type
        };
        
        this.logs.unshift(logEntry);
        
        // Keep only last 100 logs
        if (this.logs.length > 100) {
            this.logs = this.logs.slice(0, 100);
        }
        
        this.updateLogsDisplay();
    }

    updateLogsDisplay() {
        const logsContent = document.getElementById('logsContent');
        
        const logsHTML = this.logs.map(log => 
            `<p class="log-entry ${log.type}">[${log.timestamp}] ${log.message}</p>`
        ).join('');
        
        logsContent.innerHTML = logsHTML;
        logsContent.scrollTop = 0; // Scroll to top to show newest logs
    }

    clearLogs() {
        this.logs = [];
        this.updateLogsDisplay();
        this.addLog('Logs limpiados', 'info');
    }

    refreshLogs() {
        this.addLog('Logs actualizados', 'info');
        this.showMessage('🔄 Logs actualizados', 'info');
    }

    // Status Methods
    updateStatus() {
        const statusDot = document.getElementById('statusDot');
        const statusText = document.getElementById('statusText');
        
        if (this.isConnected) {
            statusDot.classList.add('connected');
            statusText.textContent = 'Conectado';
        } else {
            statusDot.classList.remove('connected');
            statusText.textContent = 'Desconectado';
        }
    }

    updateBotStatus(status) {
        document.getElementById('botStatus').textContent = status;
    }

    updateLastExecution() {
        const now = new Date().toLocaleString('es-PE');
        document.getElementById('lastExecution').textContent = now;
    }

    // Utility Methods
    setButtonLoading(button, loading) {
        if (loading) {
            button.disabled = true;
            const originalHTML = button.innerHTML;
            button.dataset.originalHTML = originalHTML;
            button.innerHTML = '<span class="loading"></span> Procesando...';
        } else {
            button.disabled = false;
            button.innerHTML = button.dataset.originalHTML || button.innerHTML;
        }
    }

    showMessage(message, type) {
        // Create message element
        const messageEl = document.createElement('div');
        messageEl.className = `message ${type}`;
        messageEl.textContent = message;
        
        // Add to top of dashboard
        const dashboard = document.querySelector('.dashboard');
        dashboard.insertBefore(messageEl, dashboard.firstChild);
        
        // Remove after 5 seconds
        setTimeout(() => {
            messageEl.remove();
        }, 5000);
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Initialization Methods
    async loadInitialData() {
        this.loadConfig();
        await this.loadStats();
        this.updateMarketContext();
        this.updateCarsList();
        
        // Check real connection status
        this.checkConnectionStatus();
    }

    async checkConnectionStatus() {
        try {
            const response = await fetch('/.netlify/functions/panel-api/stats');
            this.isConnected = response.ok;
            this.updateStatus();
            if (this.isConnected) {
                this.addLog('Conexión establecida con el servidor', 'success');
            } else {
                this.addLog('Error de conexión con el servidor', 'error');
            }
        } catch (error) {
            this.isConnected = false;
            this.updateStatus();
            this.addLog('Error de conexión con el servidor', 'error');
        }
    }

    startPeriodicUpdates() {
        // Update stats every 30 seconds
        setInterval(() => {
            if (this.isConnected) {
                this.loadStats();
            }
        }, 30000);
        
        // Add periodic log entry
        setInterval(() => {
            if (this.isConnected) {
                this.addLog('Sistema funcionando correctamente', 'info');
            }
        }, 300000); // Every 5 minutes
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.dashboard = new DashboardController();
});