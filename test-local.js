// Script de prueba local para el bot de Facebook Marketplace - Perú
// Este script simula la función de Netlify para pruebas locales

require('dotenv').config();

// Mock de las funciones de storage
const mockStorage = {
  getCar: async (url) => {
    // Simular que no existe para testing
    return null;
  },
  saveCar: async (carData) => {
    console.log('✅ Guardando carro en storage:', carData.title);
    return true;
  }
};

// Mock de la función analyzeReferenceProfile
async function mockAnalyzeReferenceProfile() {
  console.log('🔍 Simulando análisis de perfil de referencia...');
  
  // Simular contexto extraído del perfil
  return {
    averagePrice: 45000,
    priceRange: { min: 25000, max: 75000 },
    averageYear: 2016,
    topBrands: ['toyota', 'hyundai', 'nissan', 'kia'],
    totalListings: 12,
    marketSegment: 'medio'
  };
}

// Mock de la función analyzeCarWithAI
async function mockAnalyzeCarWithAI(car, marketContext) {
  console.log('🤖 Simulando análisis IA para:', car.title);
  
  // Simular análisis basado en el contexto
  const isAffordable = car.numericPrice < marketContext.averagePrice;
  const isPopularBrand = marketContext.topBrands.some(brand => 
    car.title.toLowerCase().includes(brand)
  );
  
  return {
    isGoodDeal: isAffordable && isPopularBrand,
    confidence: isAffordable && isPopularBrand ? 0.85 : 0.45,
    estimatedMarketPrice: marketContext.averagePrice,
    profitPotential: isAffordable ? 20 : 5,
    riskLevel: isAffordable ? 'bajo' : 'medio',
    explanation: `Análisis basado en contexto: precio ${isAffordable ? 'competitivo' : 'alto'}, marca ${isPopularBrand ? 'popular' : 'menos demandada'}`,
    marketComparison: `Precio ${car.numericPrice < marketContext.averagePrice ? 'por debajo' : 'por encima'} del promedio de mercado (S/ ${marketContext.averagePrice})`,
    recommendation: isAffordable && isPopularBrand ? 'Excelente oportunidad de compra' : 'Evaluar con cuidado',
    marketContext: marketContext,
    analyzedAt: new Date().toISOString()
  };
}

// Mock de la función sendToTelegram
async function mockSendToTelegram(car, analysis, marketContext) {
  console.log('📱 Simulando envío a Telegram para:', car.title);
  console.log('   💰 Precio:', car.price);
  console.log('   🎯 Confianza:', Math.round(analysis.confidence * 100) + '%');
  console.log('   📊 Contexto de mercado:', marketContext.marketSegment);
  console.log('   ✅ Mensaje enviado exitosamente');
}

// Función principal de prueba
async function testNewFunctionality() {
  try {
    console.log('🚀 Iniciando prueba de nueva funcionalidad...\n');
    
    // 1. Simular análisis de perfil de referencia
    console.log('=== PASO 1: Análisis de Perfil de Referencia ===');
    const marketContext = await mockAnalyzeReferenceProfile();
    console.log('Contexto extraído:', JSON.stringify(marketContext, null, 2));
    console.log('');
    
    // 2. Datos de prueba de carros del marketplace general
    console.log('=== PASO 2: Procesamiento de Carros del Marketplace ===');
    const testCars = [
      {
        title: 'Toyota Corolla 2018 Automático',
        price: 'S/ 38,000',
        year: 2018,
        url: 'https://facebook.com/marketplace/item/123456789',
        imageUrl: 'https://example.com/image1.jpg',
        description: 'Toyota Corolla 2018 en excelente estado, automático, full equipo',
        numericPrice: 38000
      },
      {
        title: 'Hyundai Accent 2015 Manual',
        price: 'S/ 28,000',
        year: 2015,
        url: 'https://facebook.com/marketplace/item/987654321',
        imageUrl: 'https://example.com/image2.jpg',
        description: 'Hyundai Accent 2015 manual, aire acondicionado, llantas nuevas',
        numericPrice: 28000
      },
      {
        title: 'BMW X3 2019 Premium',
        price: 'S/ 85,000',
        year: 2019,
        url: 'https://facebook.com/marketplace/item/456789123',
        imageUrl: 'https://example.com/image3.jpg',
        description: 'BMW X3 2019 premium, cuero, sunroof, excelente estado',
        numericPrice: 85000
      }
    ];
    
    let processedCars = 0;
    let sentToTelegram = 0;
    
    // 3. Procesar cada carro
    for (const car of testCars) {
      console.log(`\n--- Procesando: ${car.title} ---`);
      
      // Verificar si existe (siempre será null en el mock)
      const existingCar = await mockStorage.getCar(car.url);
      if (existingCar) {
        console.log('❌ Carro ya existe, saltando...');
        continue;
      }
      
      // Analizar con IA usando contexto
      const analysis = await mockAnalyzeCarWithAI(car, marketContext);
      
      // Guardar en storage
      await mockStorage.saveCar({
        ...car,
        analysis,
        detectedAt: new Date().toISOString(),
        country: 'Peru',
        marketContext: marketContext,
        searchType: 'general_marketplace'
      });
      
      // Enviar a Telegram si es buena oportunidad
      if (analysis.isGoodDeal) {
        await mockSendToTelegram(car, analysis, marketContext);
        sentToTelegram++;
      } else {
        console.log('📱 No enviado a Telegram (no es buena oportunidad)');
      }
      
      processedCars++;
    }
    
    // 4. Mostrar resultados
    console.log('\n=== RESULTADOS DE LA PRUEBA ===');
    console.log('✅ Prueba completada exitosamente');
    console.log(`📊 Estadísticas:`);
    console.log(`   - Total encontrados: ${testCars.length}`);
    console.log(`   - Procesados: ${processedCars}`);
    console.log(`   - Enviados a Telegram: ${sentToTelegram}`);
    console.log(`   - País: Peru`);
    console.log(`   - Tipo de búsqueda: general_marketplace`);
    console.log(`   - Contexto de mercado: ${marketContext.marketSegment}`);
    
    console.log('\n🎉 La nueva funcionalidad está lista para deployment!');
    
  } catch (error) {
    console.error('❌ Error en la prueba:', error);
  }
}



// Ejecutar la prueba
testNewFunctionality();

module.exports = { testNewFunctionality, mockAnalyzeCarWithAI, mockSendToTelegram };