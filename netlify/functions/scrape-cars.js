const puppeteer = require('puppeteer');
const OpenAI = require('openai');
const TelegramBot = require('node-telegram-bot-api');
const { getStorage } = require('./storage');

// Configuración de OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Configuración de Telegram
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN);

// Sistema de almacenamiento
const storage = getStorage();

// Función para analizar el perfil de referencia y extraer contexto de mercado
async function analyzeReferenceProfile() {
  let browser = null;
  
  try {
    console.log('Analizando perfil de referencia para extraer contexto...');
    
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-gpu',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor'
      ]
    });

    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    
    const profileUrl = process.env.FB_TARGET_PROFILE_URL || 'https://www.facebook.com/marketplace/profile/100008135553894/';
    
    await page.goto(profileUrl, { waitUntil: 'networkidle2', timeout: 30000 });
    await page.waitForTimeout(5000);
    
    // Scroll para cargar contenido
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });
    await page.waitForTimeout(3000);
    
    // Extraer información de contexto del perfil
    const profileContext = await page.evaluate(() => {
      const listings = [];
      const possibleSelectors = [
        '[data-testid="marketplace-item"]',
        '[role="article"]',
        'div[data-pagelet*="marketplace"]',
        'a[href*="/marketplace/item/"]'
      ];
      
      let items = [];
      for (const selector of possibleSelectors) {
        items = document.querySelectorAll(selector);
        if (items.length > 0) break;
      }
      
      items.forEach((item, index) => {
        if (index >= 20) return; // Limitar para análisis de contexto
        
        try {
          const textContent = item.textContent || '';
          const allText = textContent.toLowerCase();
          
          // Filtrar solo publicaciones de carros
          const carKeywords = ['auto', 'carro', 'vehiculo', 'vehículo', 'sedan', 'suv', 'hatchback', 'toyota', 'hyundai', 'nissan', 'kia', 'chevrolet', 'ford'];
          const hasCarKeyword = carKeywords.some(keyword => allText.includes(keyword));
          
          if (!hasCarKeyword) return;
          
          const priceMatch = textContent.match(/S\/\s*[\d,]+|PEN\s*[\d,]+|\$\s*[\d,]+|[\d,]+\s*soles?/i);
          const yearMatch = textContent.match(/\b(19|20)\d{2}\b/);
          
          const titleElement = item.querySelector('[data-testid="marketplace-item-title"]') || 
                              item.querySelector('span[dir="auto"]') ||
                              item.querySelector('h3') ||
                              item.querySelector('strong');
          
          const title = titleElement ? titleElement.textContent.trim() : textContent.substring(0, 100).trim();
          const price = priceMatch ? priceMatch[0] : null;
          const year = yearMatch ? yearMatch[0] : null;
          
          if (title && price) {
            listings.push({
              title,
              price,
              year,
              numericPrice: priceMatch ? parseInt(priceMatch[0].replace(/[^\d]/g, '')) : null
            });
          }
        } catch (error) {
          console.log('Error procesando elemento de contexto:', error);
        }
      });
      
      return listings;
    });

    // Cerrar browser antes de procesar el contexto
    if (browser) {
      await browser.close();
    }
    
    // Analizar el contexto extraído
    const context = analyzeMarketContext(profileContext);
    console.log('Contexto de mercado extraído:', context);
    
    return context;
    
  } catch (error) {
    console.error('Error analizando perfil de referencia:', error);
    
    // Asegurar que el browser se cierre en caso de error
    if (browser) {
      try {
        await browser.close();
      } catch (closeError) {
        console.error('Error cerrando browser en analyzeReferenceProfile:', closeError);
      }
    }
    
    return getDefaultContext();
  }
}

// Función para analizar el contexto del mercado basado en las publicaciones del perfil
function analyzeMarketContext(listings) {
  if (!listings || listings.length === 0) {
    return getDefaultContext();
  }
  
  // Extraer marcas más comunes
  const brands = [];
  const priceRanges = [];
  const years = [];
  
  listings.forEach(listing => {
    // Extraer marca del título
    const title = listing.title.toLowerCase();
    const commonBrands = ['toyota', 'hyundai', 'nissan', 'kia', 'chevrolet', 'ford', 'honda', 'mazda', 'suzuki', 'mitsubishi'];
    const foundBrand = commonBrands.find(brand => title.includes(brand));
    if (foundBrand) brands.push(foundBrand);
    
    // Recopilar precios
    if (listing.numericPrice && listing.numericPrice > 5000) {
      priceRanges.push(listing.numericPrice);
    }
    
    // Recopilar años
    if (listing.year) {
      years.push(parseInt(listing.year));
    }
  });
  
  // Calcular estadísticas
  const avgPrice = priceRanges.length > 0 ? Math.round(priceRanges.reduce((a, b) => a + b, 0) / priceRanges.length) : 50000;
  const minPrice = priceRanges.length > 0 ? Math.min(...priceRanges) : 20000;
  const maxPrice = priceRanges.length > 0 ? Math.max(...priceRanges) : 80000;
  const avgYear = years.length > 0 ? Math.round(years.reduce((a, b) => a + b, 0) / years.length) : 2015;
  
  // Marcas más frecuentes
  const brandCounts = {};
  brands.forEach(brand => {
    brandCounts[brand] = (brandCounts[brand] || 0) + 1;
  });
  const topBrands = Object.entries(brandCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([brand]) => brand);
  
  return {
    averagePrice: avgPrice,
    priceRange: { min: minPrice, max: maxPrice },
    averageYear: avgYear,
    topBrands: topBrands.length > 0 ? topBrands : ['toyota', 'hyundai', 'nissan'],
    totalListings: listings.length,
    marketSegment: avgPrice > 60000 ? 'premium' : avgPrice > 35000 ? 'medio' : 'económico'
  };
}

// Contexto por defecto si no se puede analizar el perfil
function getDefaultContext() {
  return {
    averagePrice: 45000,
    priceRange: { min: 20000, max: 80000 },
    averageYear: 2016,
    topBrands: ['toyota', 'hyundai', 'nissan', 'kia', 'chevrolet'],
    totalListings: 0,
    marketSegment: 'medio'
  };
}

exports.handler = async (event, context) => {
  let browser = null;
  
  try {
    console.log('Iniciando scraping de Facebook Marketplace - Perú (búsqueda general)');
    
    // Verificar variables de entorno críticas
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY no está configurada');
    }
    if (!process.env.TELEGRAM_BOT_TOKEN) {
      throw new Error('TELEGRAM_BOT_TOKEN no está configurada');
    }
    
    // Primero analizar el perfil de referencia para obtener contexto
    let marketContext;
    try {
      marketContext = await analyzeReferenceProfile();
      console.log('Contexto de mercado obtenido:', marketContext);
    } catch (profileError) {
      console.warn('Error obteniendo contexto del perfil, usando contexto por defecto:', profileError.message);
      marketContext = getDefaultContext();
    }
    
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-gpu',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor'
      ]
    });

    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    
    // Navegar a Facebook Marketplace Perú - búsqueda general de carros
    const location = process.env.FB_MARKETPLACE_LOCATION || 'peru';
    const searchQuery = 'carros autos vehiculos';
    const marketplaceUrl = `https://www.facebook.com/marketplace/${location}/search/?query=${encodeURIComponent(searchQuery)}&sortBy=creation_time_descend&exact=false`;
    
    console.log('Navegando a:', marketplaceUrl);
    await page.goto(marketplaceUrl, { waitUntil: 'networkidle2', timeout: 30000 });
    await page.waitForTimeout(5000);
    
    // Scroll para cargar más contenido
    for (let i = 0; i < 3; i++) {
      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight);
      });
      await page.waitForTimeout(2000);
    }
    
    // Configuración específica para Perú con contexto del perfil de referencia
    const maxPrice = parseInt(process.env.FB_MARKETPLACE_MAX_PRICE) || marketContext.priceRange.max;
    const minYear = parseInt(process.env.FB_MARKETPLACE_MIN_YEAR) || 2010;
    
    // Extraer publicaciones de carros del marketplace general
    const cars = await page.evaluate((maxPrice, minYear, topBrands) => {
      const items = [];
      
      // Selectores posibles para elementos del marketplace
      const possibleSelectors = [
        '[data-testid="marketplace-item"]',
        'div[role="article"]',
        'a[href*="/marketplace/item/"]',
        'div[data-pagelet*="marketplace"]'
      ];
      
      let elements = [];
      for (const selector of possibleSelectors) {
        elements = document.querySelectorAll(selector);
        if (elements.length > 0) break;
      }
      
      console.log(`Encontrados ${elements.length} elementos en marketplace`);
      
      elements.forEach((element, index) => {
        if (index >= 50) return; // Limitar número de elementos procesados
        
        try {
          const textContent = element.textContent || '';
          const allText = textContent.toLowerCase();
          
          // Filtrar solo publicaciones de carros
          const carKeywords = ['auto', 'carro', 'vehiculo', 'vehículo', 'sedan', 'suv', 'hatchback', ...topBrands];
          const hasCarKeyword = carKeywords.some(keyword => allText.includes(keyword));
          
          if (!hasCarKeyword) return;
          
          // Extraer información básica
          const priceMatch = textContent.match(/S\/\s*[\d,]+|PEN\s*[\d,]+|\$\s*[\d,]+|[\d,]+\s*soles?/i);
          const yearMatch = textContent.match(/\b(19|20)\d{2}\b/);
          
          const titleElement = element.querySelector('span[dir="auto"]') ||
                              element.querySelector('[data-testid="marketplace-item-title"]') || 
                              element.querySelector('h3') ||
                              element.querySelector('strong');
          
          const linkElement = element.querySelector('a[href*="/marketplace/item/"]') || element.closest('a');
          const href = linkElement ? linkElement.href : null;
          
          const imageElement = element.querySelector('img');
          const imageUrl = imageElement ? imageElement.src : null;
          
          const title = titleElement ? titleElement.textContent.trim() : textContent.substring(0, 100).trim();
          const price = priceMatch ? priceMatch[0] : null;
          const year = yearMatch ? parseInt(yearMatch[0]) : null;
          
          // Filtros de precio y año
          if (price) {
            const numericPrice = parseInt(price.replace(/[^\d]/g, ''));
            if (numericPrice > maxPrice || numericPrice < 5000) return; // Filtrar precios muy bajos también
          }
          
          if (year && year < minYear) return;
          
          if (title && price && href && title.length > 10) {
            items.push({
              title: title,
              price: price,
              year: year,
              url: href,
              imageUrl: imageUrl,
              description: textContent.substring(0, 300).trim(),
              numericPrice: price ? parseInt(price.replace(/[^\d]/g, '')) : null
            });
          }
        } catch (error) {
          console.log('Error procesando elemento:', error);
        }
      });
      
      return items;
    }, maxPrice, minYear, marketContext.topBrands);

    await browser.close();
    
    console.log(`Encontrados ${cars.length} carros en marketplace general`);
    
    let processedCars = 0;
    let sentToTelegram = 0;
    
    // Ordenar por precio para priorizar oportunidades
    const sortedCars = cars.sort((a, b) => (a.numericPrice || 0) - (b.numericPrice || 0));
    
    for (const car of sortedCars.slice(0, 15)) { // Procesar máximo 15 carros por ejecución
      try {
        // Verificar si ya existe en storage
        const existingCar = await storage.getCar(car.url);
        if (existingCar) {
          console.log(`Carro ya existe: ${car.title}`);
          continue;
        }
        
        // Analizar con IA usando el contexto del mercado
        const analysis = await analyzeCarWithAI(car, marketContext);
        
        // Guardar en storage
        await storage.saveCar({
          ...car,
          analysis,
          detectedAt: new Date().toISOString(),
          country: 'Peru',
          marketContext: marketContext,
          searchType: 'general_marketplace'
        });
        
        // Enviar a Telegram si es una buena oportunidad
        if (analysis.isGoodDeal) {
          await sendToTelegram(car, analysis, marketContext);
          sentToTelegram++;
        }
        
        processedCars++;
        
      } catch (error) {
        console.error(`Error procesando carro ${car.title}:`, error);
      }
    }
    
    // Cerrar browser antes de retornar
    if (browser) {
      await browser.close();
    }
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: `Scraping completado para Perú - Búsqueda General`,
        stats: {
          totalFound: cars.length,
          processed: processedCars,
          sentToTelegram: sentToTelegram,
          country: 'Peru',
          searchType: 'general_marketplace',
          marketContext: marketContext
        }
      })
    };
    
  } catch (error) {
    console.error('Error en scraping:', error);
    
    // Asegurar que el browser se cierre en caso de error
    if (browser) {
      try {
        await browser.close();
      } catch (closeError) {
        console.error('Error cerrando browser:', closeError);
      }
    }
    
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      })
    };
  }
};

async function analyzeCarWithAI(car, marketContext) {
  try {
    const minProfitMargin = parseFloat(process.env.PERU_MIN_PROFIT_MARGIN) || 0.15; // 15% mínimo
    const popularBrands = process.env.PERU_POPULAR_BRANDS?.split(',') || marketContext.topBrands;
    
    const prompt = `
Analiza este carro del marketplace peruano usando el siguiente contexto de mercado:

CONTEXTO DEL MERCADO PERUANO:
- Precio promedio del segmento: S/ ${marketContext.averagePrice}
- Rango de precios típico: S/ ${marketContext.priceRange.min} - S/ ${marketContext.priceRange.max}
- Año promedio: ${marketContext.averageYear}
- Marcas populares: ${marketContext.topBrands.join(', ')}
- Segmento de mercado: ${marketContext.marketSegment}

CARRO A ANALIZAR:
Título: ${car.title}
Precio: ${car.price}
Año: ${car.year || 'No especificado'}
Descripción: ${car.description || 'No disponible'}

CRITERIOS DE ANÁLISIS PARA PERÚ:
1. ¿Es el precio final competitivo comparado con el mercado peruano?
2. ¿Hay potencial de reventa con margen mínimo del ${(minProfitMargin * 100)}%?
3. ¿Es una marca popular en Perú?
4. ¿El año es apropiado para el mercado local?
5. ¿Representa una buena oportunidad de inversión?

Responde SOLO con un JSON válido:
{
  "isGoodDeal": boolean,
  "confidence": number (0-1),
  "estimatedMarketPrice": number,
  "profitPotential": number (porcentaje),
  "riskLevel": "bajo|medio|alto",
  "explanation": "string explicando por qué es o no una buena oportunidad",
  "marketComparison": "string comparando con el contexto del mercado",
  "recommendation": "string con recomendación específica"
}`;

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'Eres un experto en el mercado automotriz peruano. Analiza oportunidades de compra-venta de carros usados en Perú considerando precios finales, demanda local y potencial de reventa.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 300,
      temperature: 0.3
    });

    const analysisText = response.choices[0].message.content.trim();
    
    try {
      const analysis = JSON.parse(analysisText);
      return {
        ...analysis,
        marketContext: marketContext,
        analyzedAt: new Date().toISOString()
      };
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      return {
        isGoodDeal: false,
        confidence: 0,
        explanation: 'Error en análisis de IA',
        marketContext: marketContext,
        analyzedAt: new Date().toISOString()
      };
    }
    
  } catch (error) {
    console.error('Error en análisis de IA:', error);
    return {
      isGoodDeal: false,
      confidence: 0,
      explanation: 'Error en análisis de IA: ' + error.message,
      marketContext: marketContext,
      analyzedAt: new Date().toISOString()
    };
  }
}

// Función para enviar notificación a Telegram con contexto del mercado
async function sendToTelegram(car, analysis, marketContext) {
  try {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;
    
    if (!botToken || !chatId) {
      console.log('Telegram no configurado');
      return;
    }

    const bot = new TelegramBot(botToken);
    
    const message = `
🚗 *OPORTUNIDAD DETECTADA - PERÚ*

*${car.title}*

💰 *Precio:* ${car.price}
📅 *Año:* ${car.year || 'No especificado'}
🎯 *Confianza:* ${Math.round(analysis.confidence * 100)}%
📊 *Precio estimado mercado:* S/ ${analysis.estimatedMarketPrice || 'N/A'}
💹 *Potencial ganancia:* ${analysis.profitPotential || 'N/A'}%
⚠️ *Nivel de riesgo:* ${analysis.riskLevel || 'N/A'}

*Contexto del Mercado:*
📈 Precio promedio segmento: S/ ${marketContext.averagePrice}
🏷️ Segmento: ${marketContext.marketSegment}
🚙 Marcas populares: ${marketContext.topBrands.slice(0, 3).join(', ')}

*Análisis:*
${analysis.explanation}

*Comparación de Mercado:*
${analysis.marketComparison || 'Análisis comparativo no disponible'}

*Recomendación:*
${analysis.recommendation || 'Evaluar según criterios personales'}

🔗 [Ver publicación](${car.url})

⏰ Detectado: ${new Date().toLocaleString('es-PE', { timeZone: 'America/Lima' })}
🇵🇪 Búsqueda: Marketplace General Perú
`;

    await bot.sendMessage(chatId, message, { 
      parse_mode: 'Markdown',
      disable_web_page_preview: false
    });
    
    console.log(`Mensaje enviado a Telegram para: ${car.title}`);
    
  } catch (error) {
    console.error('Error enviando a Telegram:', error);
  }
}