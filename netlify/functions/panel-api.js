const fs = require('fs').promises;
const path = require('path');

// Panel API for FB Marketplace Bot
exports.handler = async (event, context) => {
    // Enable CORS
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Content-Type': 'application/json'
    };

    // Handle preflight requests
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: ''
        };
    }

    try {
        const { httpMethod, path: requestPath, body } = event;
        const parsedBody = body ? JSON.parse(body) : {};

        // Route handling
        switch (httpMethod) {
            case 'GET':
                return await handleGet(requestPath, headers);
            case 'POST':
                return await handlePost(requestPath, parsedBody, headers);
            case 'PUT':
                return await handlePut(requestPath, parsedBody, headers);
            default:
                return {
                    statusCode: 405,
                    headers,
                    body: JSON.stringify({ error: 'Method not allowed' })
                };
        }
    } catch (error) {
        console.error('Panel API Error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                error: 'Internal server error',
                message: error.message 
            })
        };
    }
};

// GET handlers
async function handleGet(requestPath, headers) {
    const pathSegments = requestPath.split('/').filter(Boolean);
    const endpoint = pathSegments[pathSegments.length - 1];

    switch (endpoint) {
        case 'stats':
            return await getStats(headers);
        case 'logs':
            return await getLogs(headers);
        case 'cars':
            return await getRecentCars(headers);
        case 'config':
            return await getConfig(headers);
        case 'market-context':
            return await getMarketContext(headers);
        case 'status':
            return await getSystemStatus(headers);
        default:
            return {
                statusCode: 404,
                headers,
                body: JSON.stringify({ error: 'Endpoint not found' })
            };
    }
}

// POST handlers
async function handlePost(requestPath, body, headers) {
    const pathSegments = requestPath.split('/').filter(Boolean);
    const endpoint = pathSegments[pathSegments.length - 1];

    switch (endpoint) {
        case 'run-bot':
            return await runBot(headers);
        case 'test-bot':
            return await testBot(headers);
        case 'refresh-context':
            return await refreshMarketContext(headers);
        default:
            return {
                statusCode: 404,
                headers,
                body: JSON.stringify({ error: 'Endpoint not found' })
            };
    }
}

// PUT handlers
async function handlePut(requestPath, body, headers) {
    const pathSegments = requestPath.split('/').filter(Boolean);
    const endpoint = pathSegments[pathSegments.length - 1];

    switch (endpoint) {
        case 'config':
            return await updateConfig(body, headers);
        default:
            return {
                statusCode: 404,
                headers,
                body: JSON.stringify({ error: 'Endpoint not found' })
            };
    }
}

// Statistics functions
async function getStats(headers) {
    try {
        const statsPath = '/tmp/bot-stats.json';
        
        try {
            const statsData = await fs.readFile(statsPath, 'utf8');
            const stats = JSON.parse(statsData);
            
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    success: true,
                    stats: {
                        totalCars: stats.totalCars || 0,
                        sentToTelegram: stats.sentToTelegram || 0,
                        avgPrice: stats.avgPrice || 0,
                        successRate: stats.totalCars > 0 ? 
                            Math.round((stats.sentToTelegram / stats.totalCars) * 100) : 0,
                        lastUpdate: stats.lastUpdate || new Date().toISOString()
                    }
                })
            };
        } catch (error) {
            // Return default stats if file doesn't exist
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    success: true,
                    stats: {
                        totalCars: 0,
                        sentToTelegram: 0,
                        avgPrice: 0,
                        successRate: 0,
                        lastUpdate: new Date().toISOString()
                    }
                })
            };
        }
    } catch (error) {
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                success: false, 
                error: 'Failed to get stats',
                message: error.message 
            })
        };
    }
}

// Logs functions
async function getLogs(headers) {
    try {
        const logsPath = '/tmp/bot-logs.json';
        
        try {
            const logsData = await fs.readFile(logsPath, 'utf8');
            const logs = JSON.parse(logsData);
            
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    success: true,
                    logs: logs.slice(0, 50) // Return last 50 logs
                })
            };
        } catch (error) {
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    success: true,
                    logs: []
                })
            };
        }
    } catch (error) {
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                success: false, 
                error: 'Failed to get logs',
                message: error.message 
            })
        };
    }
}

// Cars functions
async function getRecentCars(headers) {
    try {
        const carsPath = '/tmp/recent-cars.json';
        
        try {
            const carsData = await fs.readFile(carsPath, 'utf8');
            const cars = JSON.parse(carsData);
            
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    success: true,
                    cars: cars.slice(0, 10) // Return last 10 cars
                })
            };
        } catch (error) {
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    success: true,
                    cars: []
                })
            };
        }
    } catch (error) {
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                success: false, 
                error: 'Failed to get cars',
                message: error.message 
            })
        };
    }
}

// Configuration functions
async function getConfig(headers) {
    try {
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                config: {
                    maxPrice: process.env.FB_MARKETPLACE_MAX_PRICE || 80000,
                    minYear: process.env.FB_MARKETPLACE_MIN_YEAR || 2010,
                    maxItems: process.env.MAX_ITEMS_PER_RUN || 15,
                    minProfit: process.env.PERU_MIN_PROFIT_MARGIN || 15,
                    searchQuery: process.env.SEARCH_QUERY || 'carros autos',
                    location: process.env.FB_MARKETPLACE_LOCATION || 'lima-peru'
                }
            })
        };
    } catch (error) {
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                success: false, 
                error: 'Failed to get config',
                message: error.message 
            })
        };
    }
}

async function updateConfig(configData, headers) {
    try {
        // In a real implementation, you would update environment variables
        // For now, we'll just validate and return success
        
        const validConfig = {
            maxPrice: parseInt(configData.maxPrice) || 80000,
            minYear: parseInt(configData.minYear) || 2010,
            maxItems: parseInt(configData.maxItems) || 15,
            minProfit: parseInt(configData.minProfit) || 15
        };

        // Save to temporary storage (in production, update env vars)
        const configPath = '/tmp/bot-config.json';
        await fs.writeFile(configPath, JSON.stringify(validConfig, null, 2));

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                message: 'Configuration updated successfully',
                config: validConfig
            })
        };
    } catch (error) {
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                success: false, 
                error: 'Failed to update config',
                message: error.message 
            })
        };
    }
}

// Market context functions
async function getMarketContext(headers) {
    try {
        const contextPath = '/tmp/market-context.json';
        
        try {
            const contextData = await fs.readFile(contextPath, 'utf8');
            const context = JSON.parse(contextData);
            
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    success: true,
                    context
                })
            };
        } catch (error) {
            // Return default context
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    success: true,
                    context: {
                        avgPrice: 45000,
                        priceRange: { min: 25000, max: 80000 },
                        avgYear: 2018,
                        topBrands: ['Toyota', 'Hyundai', 'Nissan'],
                        segment: 'medio',
                        lastUpdate: new Date().toISOString()
                    }
                })
            };
        }
    } catch (error) {
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                success: false, 
                error: 'Failed to get market context',
                message: error.message 
            })
        };
    }
}

async function refreshMarketContext(headers) {
    try {
        // Call the real scrape-cars function to analyze reference profile
        const scrapeResponse = await fetch(`${process.env.URL || 'http://localhost:8888'}/.netlify/functions/scrape-cars`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                action: 'analyze-profile-only',
                profileUrl: process.env.FB_TARGET_PROFILE_URL
            })
        });

        if (!scrapeResponse.ok) {
            throw new Error(`Failed to analyze profile: ${scrapeResponse.status}`);
        }

        const scrapeData = await scrapeResponse.json();
        
        if (!scrapeData.success || !scrapeData.stats || !scrapeData.stats.marketContext) {
            throw new Error('No market context returned from profile analysis');
        }

        const context = scrapeData.stats.marketContext;
        
        // Save context to storage
        const contextPath = '/tmp/market-context.json';
        await fs.writeFile(contextPath, JSON.stringify(context, null, 2));

        await addLog(`Market context refreshed: ${context.totalListings} listings analyzed`, 'info');

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                message: 'Market context refreshed successfully',
                context: context
            })
        };
    } catch (error) {
        await addLog(`Market context refresh error: ${error.message}`, 'error');
        
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                success: false, 
                error: 'Failed to refresh market context',
                message: error.message 
            })
        };
    }
}

// Bot control functions
async function runBot(headers) {
    try {
        // Import and run the scrape-cars function
        const scrapeCars = require('./scrape-cars');
        
        // Create a mock event for the scrape function
        const mockEvent = {
            httpMethod: 'POST',
            headers: {},
            body: null
        };
        
        const result = await scrapeCars.handler(mockEvent, {});
        
        if (result.statusCode === 200) {
            const resultData = JSON.parse(result.body);
            
            // Update stats
            await updateStats({
                totalCars: resultData.totalCars || 0,
                sentToTelegram: resultData.sentToTelegram || 0,
                avgPrice: resultData.avgPrice || 0
            });
            
            // Add log
            await addLog(`Bot executed: ${resultData.totalCars || 0} cars analyzed, ${resultData.sentToTelegram || 0} sent to Telegram`, 'success');
            
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    success: true,
                    message: 'Bot executed successfully',
                    result: resultData
                })
            };
        } else {
            throw new Error('Bot execution failed');
        }
    } catch (error) {
        await addLog(`Bot execution error: ${error.message}`, 'error');
        
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                success: false, 
                error: 'Failed to run bot',
                message: error.message 
            })
        };
    }
}

async function testBot(headers) {
    try {
        // Call the real scrape-cars function for testing
        const scrapeResponse = await fetch(`${process.env.URL || 'http://localhost:8888'}/.netlify/functions/scrape-cars`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                action: 'test-run',
                maxItems: 3 // Limit for testing
            })
        });

        if (!scrapeResponse.ok) {
            throw new Error(`Scrape function failed: ${scrapeResponse.status}`);
        }

        const scrapeData = await scrapeResponse.json();
        
        if (!scrapeData.success) {
            throw new Error(scrapeData.error || 'Scrape function returned error');
        }

        const result = {
            totalCars: scrapeData.stats?.totalFound || 0,
            processed: scrapeData.stats?.processed || 0,
            sentToTelegram: scrapeData.stats?.sentToTelegram || 0,
            country: scrapeData.stats?.country || 'Peru',
            searchType: scrapeData.stats?.searchType || 'general_marketplace',
            testMode: true,
            marketContext: scrapeData.stats?.marketContext
        };

        await addLog(`Test completed: ${result.totalCars} cars found, ${result.processed} processed, ${result.sentToTelegram} sent to Telegram`, 'info');

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                message: 'Test completed successfully',
                result: result
            })
        };
    } catch (error) {
        await addLog(`Test error: ${error.message}`, 'error');
        
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                success: false, 
                error: 'Failed to test bot',
                message: error.message 
            })
        };
    }
}

// System status
async function getSystemStatus(headers) {
    try {
        const status = {
            connected: true,
            botRunning: false,
            lastExecution: new Date().toISOString(),
            version: '1.0.0',
            environment: process.env.NODE_ENV || 'production'
        };

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                status
            })
        };
    } catch (error) {
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                success: false, 
                error: 'Failed to get system status',
                message: error.message 
            })
        };
    }
}

// Utility functions
async function updateStats(newStats) {
    try {
        const statsPath = '/tmp/bot-stats.json';
        let currentStats = {
            totalCars: 0,
            sentToTelegram: 0,
            avgPrice: 0,
            executions: 0
        };

        try {
            const existingData = await fs.readFile(statsPath, 'utf8');
            currentStats = JSON.parse(existingData);
        } catch (error) {
            // File doesn't exist, use defaults
        }

        // Update stats
        currentStats.totalCars += newStats.totalCars || 0;
        currentStats.sentToTelegram += newStats.sentToTelegram || 0;
        currentStats.executions += 1;
        
        // Calculate average price
        if (newStats.avgPrice && newStats.avgPrice > 0) {
            currentStats.avgPrice = Math.round(
                (currentStats.avgPrice * (currentStats.executions - 1) + newStats.avgPrice) / currentStats.executions
            );
        }
        
        currentStats.lastUpdate = new Date().toISOString();

        await fs.writeFile(statsPath, JSON.stringify(currentStats, null, 2));
    } catch (error) {
        console.error('Failed to update stats:', error);
    }
}

async function addLog(message, type = 'info') {
    try {
        const logsPath = '/tmp/bot-logs.json';
        let logs = [];

        try {
            const existingData = await fs.readFile(logsPath, 'utf8');
            logs = JSON.parse(existingData);
        } catch (error) {
            // File doesn't exist, use empty array
        }

        const logEntry = {
            timestamp: new Date().toISOString(),
            message,
            type
        };

        logs.unshift(logEntry);

        // Keep only last 100 logs
        if (logs.length > 100) {
            logs = logs.slice(0, 100);
        }

        await fs.writeFile(logsPath, JSON.stringify(logs, null, 2));
    } catch (error) {
        console.error('Failed to add log:', error);
    }
}