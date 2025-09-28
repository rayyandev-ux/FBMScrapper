// Sistema de almacenamiento simple para evitar duplicados
// En producción, considera usar una base de datos como Supabase, MongoDB Atlas, etc.

class SimpleStorage {
  constructor() {
    this.processedListings = new Map();
    this.maxStorageSize = 1000; // Máximo 1000 elementos en memoria
  }

  // Verificar si un listing ya fue procesado
  isProcessed(listingId) {
    return this.processedListings.has(listingId);
  }

  // Marcar un listing como procesado
  markAsProcessed(listingId, listingData = {}) {
    // Si alcanzamos el límite, eliminar los más antiguos
    if (this.processedListings.size >= this.maxStorageSize) {
      const oldestKey = this.processedListings.keys().next().value;
      this.processedListings.delete(oldestKey);
    }

    this.processedListings.set(listingId, {
      ...listingData,
      processedAt: new Date().toISOString(),
      timestamp: Date.now()
    });
  }

  // Obtener estadísticas
  getStats() {
    return {
      totalProcessed: this.processedListings.size,
      oldestEntry: this.getOldestEntry(),
      newestEntry: this.getNewestEntry()
    };
  }

  getOldestEntry() {
    if (this.processedListings.size === 0) return null;
    const entries = Array.from(this.processedListings.values());
    return entries.reduce((oldest, current) => 
      current.timestamp < oldest.timestamp ? current : oldest
    );
  }

  getNewestEntry() {
    if (this.processedListings.size === 0) return null;
    const entries = Array.from(this.processedListings.values());
    return entries.reduce((newest, current) => 
      current.timestamp > newest.timestamp ? current : newest
    );
  }

  // Limpiar entradas antiguas (más de 7 días)
  cleanOldEntries() {
    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    const keysToDelete = [];

    for (const [key, value] of this.processedListings.entries()) {
      if (value.timestamp < sevenDaysAgo) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.processedListings.delete(key));
    
    return {
      deletedCount: keysToDelete.length,
      remainingCount: this.processedListings.size
    };
  }

  // Exportar datos (para backup)
  exportData() {
    return {
      processedListings: Object.fromEntries(this.processedListings),
      exportedAt: new Date().toISOString(),
      totalEntries: this.processedListings.size
    };
  }

  // Importar datos (para restaurar backup)
  importData(data) {
    if (data && data.processedListings) {
      this.processedListings = new Map(Object.entries(data.processedListings));
      return {
        success: true,
        importedCount: this.processedListings.size
      };
    }
    return {
      success: false,
      error: 'Invalid data format'
    };
  }
}

// Instancia global del storage
const storage = new SimpleStorage();

// Función para obtener el storage
exports.getStorage = () => storage;

// Handler para endpoint de estadísticas
exports.handler = async (event, context) => {
  const { httpMethod, path } = event;

  try {
    switch (httpMethod) {
      case 'GET':
        if (path.includes('/stats')) {
          return {
            statusCode: 200,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
              stats: storage.getStats(),
              cleanupResult: storage.cleanOldEntries()
            })
          };
        }
        
        if (path.includes('/export')) {
          return {
            statusCode: 200,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify(storage.exportData())
          };
        }
        
        return {
          statusCode: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          },
          body: JSON.stringify({
            message: 'Storage API funcionando',
            endpoints: [
              '/stats - Obtener estadísticas',
              '/export - Exportar datos'
            ]
          })
        };

      case 'POST':
        if (path.includes('/import')) {
          const data = JSON.parse(event.body);
          const result = storage.importData(data);
          
          return {
            statusCode: result.success ? 200 : 400,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify(result)
          };
        }
        
        return {
          statusCode: 404,
          body: JSON.stringify({ error: 'Endpoint no encontrado' })
        };

      default:
        return {
          statusCode: 405,
          body: JSON.stringify({ error: 'Método no permitido' })
        };
    }
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Error interno del servidor',
        details: error.message
      })
    };
  }
};