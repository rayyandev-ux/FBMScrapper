# 🚗 FBM Car Scraper

Bot inteligente que monitorea Facebook Marketplace para encontrar las mejores oportunidades de carros usando análisis de IA y notificaciones automáticas por Telegram.

## ✨ Características

- 🔍 **Scraping Automático**: Monitorea Facebook Marketplace cada 2 horas
- 🤖 **Análisis con IA**: Utiliza OpenAI GPT para evaluar cada vehículo
- 📱 **Notificaciones Telegram**: Alertas instantáneas de buenas oportunidades
- 🚀 **Serverless**: Funciona completamente en Netlify Functions
- 💾 **Sistema de Almacenamiento**: Evita duplicados y mantiene historial
- 📊 **Dashboard Web**: Interfaz para monitorear estadísticas
- ⚙️ **Altamente Configurable**: Personaliza criterios de búsqueda y análisis

## 🏗️ Arquitectura

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│  Facebook       │    │   Netlify        │    │   OpenAI        │
│  Marketplace    │◄──►│   Functions      │◄──►│   GPT API       │
│                 │    │                  │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │   Telegram      │
                       │   Bot API       │
                       └─────────────────┘
```

## 🚀 Inicio Rápido

### 1. Clonar el Repositorio
```bash
git clone https://github.com/tu-usuario/fbm-car-scraper.git
cd fbm-car-scraper
npm install
```

### 2. Configurar Variables de Entorno
Copia `.env.example` a `.env` y completa:
```bash
cp .env.example .env
```

### 3. Desplegar en Netlify
1. Conecta tu repositorio a Netlify
2. Configura las variables de entorno en Netlify
3. Despliega automáticamente

📖 **[Ver Guía Completa de Configuración](setup-guide.md)**

## 🔧 Configuración

### Variables de Entorno Requeridas

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `OPENAI_API_KEY` | API Key de OpenAI | `sk-...` |
| `TELEGRAM_BOT_TOKEN` | Token del bot de Telegram | `123456:ABC-DEF...` |
| `TELEGRAM_CHAT_ID` | ID del chat/grupo de Telegram | `-1001234567890` |

### Variables de Entorno Opcionales

| Variable | Descripción | Valor por Defecto |
|----------|-------------|-------------------|
| `FB_MARKETPLACE_LOCATION` | Ciudad para buscar | `bogota` |
| `FB_MARKETPLACE_MAX_PRICE` | Precio máximo | `50000` |
| `FB_MARKETPLACE_MIN_YEAR` | Año mínimo | `2015` |
| `AI_ANALYSIS_CRITERIA` | Criterios para IA | Ver `.env.example` |

## 📱 Uso

### Ejecución Automática
El bot se ejecuta automáticamente cada 2 horas usando Netlify Scheduled Functions.

### Ejecución Manual
- **Web**: Visita tu sitio y haz clic en "🧪 Probar Bot"
- **API**: `POST /.netlify/functions/scrape-cars`
- **Local**: `netlify dev` y luego hacer POST al endpoint local

### Monitoreo
- **Dashboard**: Interfaz web con estadísticas en tiempo real
- **API Stats**: `GET /.netlify/functions/storage/stats`
- **Logs**: Panel de funciones en Netlify

## 🤖 Análisis de IA

El bot utiliza OpenAI GPT-3.5-turbo para analizar cada vehículo considerando:

- ✅ Marca y modelo del vehículo
- ✅ Año y precio
- ✅ Potencial de reventa
- ✅ Relación precio-valor
- ✅ Criterios personalizados definidos por ti

### Ejemplo de Análisis
```json
{
  "isGoodDeal": true,
  "explanation": "Toyota Corolla 2019 con precio competitivo...",
  "score": 8,
  "reasons": [
    "Marca confiable con buen valor de reventa",
    "Precio por debajo del promedio del mercado",
    "Año reciente con tecnología actualizada"
  ]
}
```

## 📊 API Endpoints

### Scraping Principal
```
POST /.netlify/functions/scrape-cars
```

### Estadísticas
```
GET /.netlify/functions/storage/stats
GET /.netlify/functions/storage/export
POST /.netlify/functions/storage/import
```

## 🛠️ Desarrollo Local

```bash
# Instalar dependencias
npm install

# Instalar Netlify CLI
npm install -g netlify-cli

# Ejecutar en modo desarrollo
netlify dev

# Probar función
curl -X POST http://localhost:8888/.netlify/functions/scrape-cars
```

## 📦 Estructura del Proyecto

```
fbm-car-scraper/
├── netlify/
│   └── functions/
│       ├── scrape-cars.js      # Función principal
│       └── storage.js          # Sistema de almacenamiento
├── public/
│   └── index.html              # Dashboard web
├── package.json                # Dependencias
├── netlify.toml               # Configuración Netlify
├── .env.example               # Variables de entorno ejemplo
├── setup-guide.md             # Guía de configuración
└── README.md                  # Este archivo
```

## 🔒 Seguridad y Mejores Prácticas

- ✅ Variables de entorno para credenciales sensibles
- ✅ Rate limiting para APIs externas
- ✅ Manejo de errores robusto
- ✅ Logs detallados para debugging
- ✅ Validación de datos de entrada
- ✅ Timeouts configurables

## 🚨 Limitaciones y Consideraciones

### Facebook Marketplace
- Facebook puede cambiar su estructura HTML
- Posibles limitaciones de rate limiting
- Requiere navegador headless (Puppeteer)

### OpenAI API
- Costos por uso (aproximadamente $0.002 por análisis)
- Rate limits según tu plan
- Requiere créditos en la cuenta

### Netlify Functions
- Timeout máximo de 10 segundos (plan gratuito)
- 125,000 invocaciones gratuitas por mes
- Memoria limitada para almacenamiento en memoria

## 🔄 Actualizaciones y Mantenimiento

### Monitoreo Recomendado
- Revisar logs semanalmente
- Verificar funcionamiento del scraping
- Monitorear costos de OpenAI
- Actualizar criterios de análisis según el mercado

### Actualizaciones
```bash
git pull origin main
# Netlify desplegará automáticamente
```

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver `LICENSE` para más detalles.

## 🆘 Soporte

- 📖 [Guía de Configuración Completa](setup-guide.md)
- 🐛 [Reportar Bug](https://github.com/tu-usuario/fbm-car-scraper/issues)
- 💡 [Solicitar Feature](https://github.com/tu-usuario/fbm-car-scraper/issues)

## 🙏 Agradecimientos

- [Netlify](https://netlify.com) - Hosting serverless
- [OpenAI](https://openai.com) - API de inteligencia artificial
- [Puppeteer](https://pptr.dev) - Web scraping
- [Telegram Bot API](https://core.telegram.org/bots/api) - Notificaciones

---

⭐ Si este proyecto te ayuda, ¡dale una estrella en GitHub!

🚗 ¡Feliz búsqueda de carros! 🎉