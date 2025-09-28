# Guía de Configuración - Facebook Marketplace Car Scraper

## Descripción
Bot automatizado que analiza carros en Facebook Marketplace Perú usando IA para detectar oportunidades de reventa. El bot utiliza un perfil de referencia para entender el contexto del mercado y luego busca carros en general en el marketplace.

## Funcionalidades Principales
- 🔍 **Análisis de Contexto**: Extrae información del perfil de referencia para entender tipos de carros y precios del mercado
- 🚗 **Búsqueda General**: Busca carros en todo Facebook Marketplace Perú, no solo en un perfil específico
- 🤖 **Análisis IA**: Evalúa cada carro usando el contexto del mercado peruano
- 📱 **Notificaciones Telegram**: Envía alertas de oportunidades detectadas
- 💾 **Almacenamiento**: Evita duplicados y mantiene historial

## Configuración Inicial

### 1. Variables de Entorno Básicas
Crea un archivo `.env` con:

```env
# Configuración de OpenAI
OPENAI_API_KEY=tu_api_key_de_openai

# Configuración de Telegram
TELEGRAM_BOT_TOKEN=tu_bot_token_de_telegram
TELEGRAM_CHAT_ID=tu_chat_id_de_telegram

# Configuración de Facebook Marketplace - PERÚ
FB_MARKETPLACE_LOCATION=peru
FB_MARKETPLACE_MAX_PRICE=80000
FB_MARKETPLACE_MIN_YEAR=2010

# Perfil de referencia para análisis de contexto (NO para scraping directo)
FB_TARGET_PROFILE_URL=https://www.facebook.com/marketplace/profile/100008135553894/

# Configuración específica para mercado peruano
PERU_MIN_PROFIT_MARGIN=0.15
PERU_CURRENCY=PEN
PERU_POPULAR_BRANDS=toyota,hyundai,nissan,kia,chevrolet,ford,honda,mazda

# Criterios de análisis IA para Perú
AI_ANALYSIS_CRITERIA=Analizar precios finales, potencial de reventa en mercado peruano, demanda local, comparación con precios de mercado, facilidad de reventa en Lima y provincias

# Configuración de búsqueda general
SEARCH_QUERY=carros autos vehiculos
SEARCH_TYPE=general_marketplace
MAX_ITEMS_PER_RUN=15
```

### 2. Configuración de APIs

#### OpenAI API
1. Ve a [OpenAI Platform](https://platform.openai.com/)
2. Crea una cuenta y obtén tu API key
3. Agrega créditos a tu cuenta
4. Copia la API key a `OPENAI_API_KEY`

#### Telegram Bot
1. Habla con [@BotFather](https://t.me/botfather) en Telegram
2. Crea un nuevo bot con `/newbot`
3. Copia el token a `TELEGRAM_BOT_TOKEN`
4. Para obtener el Chat ID:
   - Envía un mensaje a tu bot
   - Ve a `https://api.telegram.org/bot<TU_TOKEN>/getUpdates`
   - Busca el `chat.id` y cópialo a `TELEGRAM_CHAT_ID`

## Deployment en Netlify

### 1. Preparación
```bash
npm install
```

### 2. Deploy
1. Conecta tu repositorio a Netlify
2. Configura las variables de entorno en Netlify Dashboard
3. Deploy automático se activará

### 3. Configurar Función Programada
En Netlify Dashboard:
- Functions → scrape-cars
- Configurar trigger programado (ej: cada 30 minutos)

## Cómo Funciona el Bot

### Proceso de Análisis
1. **Extracción de Contexto**: 
   - Analiza el perfil de referencia especificado
   - Extrae información sobre tipos de carros, precios promedio, marcas populares
   - Calcula estadísticas del mercado (precio promedio, rango, segmento)

2. **Búsqueda General**:
   - Busca carros en todo Facebook Marketplace Perú
   - Usa términos generales: "carros autos vehiculos"
   - Aplica filtros de precio y año

3. **Análisis IA**:
   - Compara cada carro con el contexto del mercado
   - Evalúa potencial de reventa usando el contexto extraído
   - Considera marcas populares y precios competitivos

4. **Notificación**:
   - Envía a Telegram solo las mejores oportunidades
   - Incluye contexto del mercado en el mensaje
   - Proporciona análisis detallado y recomendaciones

### Criterios de Evaluación
- **Precio competitivo**: Comparado con el promedio del contexto
- **Marca popular**: Basado en las marcas del perfil de referencia
- **Potencial de ganancia**: Mínimo 15% de margen
- **Año apropiado**: Según configuración (mín. 2010)

## Configuración Específica para Perú

### Variables Adicionales para Mercado Peruano
```env
# Margen mínimo de ganancia esperado (15%)
PERU_MIN_PROFIT_MARGIN=0.15

# Moneda local
PERU_CURRENCY=PEN

# Marcas más populares en Perú
PERU_POPULAR_BRANDS=toyota,hyundai,nissan,kia,chevrolet,ford,honda,mazda
```

### Configuración del Perfil Específico

El bot está configurado para monitorear un perfil específico de Facebook Marketplace:
- **Perfil objetivo**: `https://www.facebook.com/marketplace/profile/100008135553894/`
- **Enfoque**: Carros con precios finales (no negociables)
- **Objetivo**: Encontrar oportunidades de reventa con margen mínimo del 15%

### Criterios de Análisis IA para Perú

La IA evalúa cada carro considerando:

1. **Precio Final**: Todos los precios son finales (no negociables)
2. **Margen de Reventa**: Mínimo 15% de ganancia potencial
3. **Marcas Populares**: Toyota, Hyundai, Nissan, Kia, Chevrolet, Ford, Honda, Mazda
4. **Mercado Local**: Demanda en Lima y provincias
5. **Depreciación**: Considerando el mercado peruano
6. **Costos de Mantenimiento**: Facilidad de conseguir repuestos
7. **Facilidad de Reventa**: Qué tan rápido se puede vender

### Formato de Notificación Telegram

Las notificaciones incluyen información específica para Perú:

```
🚗 OPORTUNIDAD DE REVENTA - PERÚ 🇵🇪

📋 [Título del carro]
💰 Precio: [Precio en soles]
📅 Año: [Año del vehículo]
🔗 Link: [Enlace a la publicación]

🤖 ANÁLISIS IA:
⭐ Puntuación: [1-10]/10
💡 Explicación: [Análisis detallado]

📊 DETALLES:
💵 Precio estimado de mercado: [Precio de mercado]
📈 Potencial de ganancia: [Estimación de ganancia]
⚠️ Nivel de riesgo: [bajo/medio/alto]

✅ Razones:
• [Razón 1]
• [Razón 2]
• [Razón 3]

🏷️ Fuente: Perfil específico Facebook Marketplace
🌍 País: Perú
⏰ Detectado: [Fecha y hora en zona horaria de Lima]
```

### Configuración de Horarios

El bot está configurado para ejecutarse cada 2 horas, considerando:
- **Zona horaria**: America/Lima (UTC-5)
- **Horarios activos**: 24/7 para no perder oportunidades
- **Frecuencia**: Cada 2 horas para balance entre detección rápida y límites de API

### Pruebas Específicas para Perú

Para probar el bot con la configuración peruana:

1. **Prueba Manual**:
   ```bash
   curl -X POST https://tu-sitio.netlify.app/.netlify/functions/scrape-cars
   ```

2. **Verificar Variables**:
   - Confirma que `FB_TARGET_PROFILE_URL` apunte al perfil correcto
   - Verifica que `PERU_MIN_PROFIT_MARGIN` esté configurado
   - Asegúrate de que `PERU_POPULAR_BRANDS` incluya las marcas relevantes

3. **Monitoreo**:
   - Revisa los logs de Netlify para errores de scraping
   - Confirma que los mensajes de Telegram lleguen en español
   - Verifica que los precios se detecten correctamente en soles

### Consideraciones Especiales

1. **Detección de Precios**: El bot busca patrones como:
   - `S/ 25,000`
   - `PEN 25000`
   - `25,000 soles`
   - `$ 25,000` (dólares)

2. **Filtros de Calidad**: Solo analiza publicaciones que contengan palabras clave de carros en español

3. **Marcas Populares**: Prioriza marcas con buena demanda en el mercado peruano

4. **Análisis de Riesgo**: Considera factores específicos del mercado peruano como disponibilidad de repuestos y facilidad de reventa

### Solución de Problemas Específicos

**Problema**: No se detectan carros del perfil
- **Solución**: Verifica que el perfil sea público y tenga publicaciones activas

**Problema**: Precios no se detectan correctamente
- **Solución**: Revisa los patrones de regex para precios en soles peruanos

**Problema**: IA no considera el contexto peruano
- **Solución**: Ajusta `AI_ANALYSIS_CRITERIA` y `PERU_POPULAR_BRANDS`

### Optimización para Perú

1. **Horarios Peak**: Considera ajustar la frecuencia durante horarios de mayor actividad (6 PM - 10 PM)
2. **Días de la Semana**: Los fines de semana suelen tener más actividad en Marketplace
3. **Estacionalidad**: Considera ajustar criterios según la época del año (bonos, gratificaciones)

Esta configuración está optimizada específicamente para el mercado automotriz peruano y el perfil objetivo proporcionado.

### 4. Personalizar Criterios de Búsqueda

Modifica estas variables según tus necesidades:

- **FB_MARKETPLACE_LOCATION**: Ciudad donde buscar (ej: "bogota", "medellin", "cali")
- **FB_MARKETPLACE_MAX_PRICE**: Precio máximo en pesos colombianos
- **FB_MARKETPLACE_MIN_YEAR**: Año mínimo del vehículo
- **AI_ANALYSIS_CRITERIA**: Criterios específicos para el análisis de IA

### 5. Deploy y Activación

1. Haz push de tu código a GitHub
2. Netlify desplegará automáticamente
3. El bot se ejecutará cada 2 horas automáticamente
4. También puedes ejecutarlo manualmente desde la interfaz web

## 🧪 Probar el Bot

### Método 1: Interfaz Web
1. Ve a tu sitio de Netlify (ej: `https://tu-sitio.netlify.app`)
2. Haz clic en "🧪 Probar Bot"

### Método 2: Endpoint Directo
```bash
curl -X POST https://tu-sitio.netlify.app/.netlify/functions/scrape-cars
```

### Método 3: Netlify CLI (Local)
```bash
npm install -g netlify-cli
netlify dev
# En otra terminal:
curl -X POST http://localhost:8888/.netlify/functions/scrape-cars
```

## 📊 Monitoreo y Estadísticas

### Ver Estadísticas
- **Web**: Botón "📊 Ver Estadísticas" en la interfaz
- **API**: `GET /.netlify/functions/storage/stats`

### Exportar Datos
- **API**: `GET /.netlify/functions/storage/export`

## ⚙️ Configuración Avanzada

### Cambiar Frecuencia de Ejecución

Edita `netlify.toml`:
```toml
[[functions]]
  name = "scrape-cars"
  schedule = "0 */1 * * *"  # Cada hora
  # schedule = "0 8,12,16,20 * * *"  # 4 veces al día
```

### Personalizar Análisis de IA

Modifica la variable `AI_ANALYSIS_CRITERIA` con criterios más específicos:

```
AI_ANALYSIS_CRITERIA=Busco carros Toyota o Honda, modelo 2018 o superior, con menos de 80,000 km, precio entre $25,000,000 y $45,000,000, sin reportes de accidentes, que tengan buen potencial de reventa en 1-2 años
```

## 🚨 Solución de Problemas

### Bot no encuentra carros
- Verifica que `FB_MARKETPLACE_LOCATION` sea correcta
- Ajusta `FB_MARKETPLACE_MAX_PRICE` y `FB_MARKETPLACE_MIN_YEAR`
- Facebook puede cambiar su estructura, revisa los logs

### No llegan mensajes a Telegram
- Verifica que el bot esté añadido al grupo
- Confirma que `TELEGRAM_CHAT_ID` sea correcto (negativo para grupos)
- Revisa que `TELEGRAM_BOT_TOKEN` sea válido

### Error de OpenAI
- Verifica que tengas créditos en tu cuenta de OpenAI
- Confirma que `OPENAI_API_KEY` sea válida
- Revisa los límites de rate limiting

### Función timeout
- Facebook Marketplace puede ser lento
- Considera reducir el número de carros analizados por ejecución
- Revisa los logs de Netlify para más detalles

## 📝 Logs y Debugging

### Ver Logs en Netlify
1. Ve a tu sitio en Netlify
2. **Functions** > **scrape-cars**
3. Revisa los logs de ejecución

### Logs Locales
```bash
netlify dev
# Los logs aparecerán en la consola
```

## 🔒 Seguridad

- ✅ Nunca commits las API keys al repositorio
- ✅ Usa variables de entorno en Netlify
- ✅ Revisa regularmente el uso de tu API de OpenAI
- ✅ Mantén actualizado el token de Telegram

## 📞 Soporte

Si tienes problemas:
1. Revisa los logs de Netlify
2. Verifica todas las variables de entorno
3. Prueba cada componente por separado
4. Consulta la documentación de las APIs utilizadas

¡Tu bot está listo para encontrar las mejores oportunidades de carros! 🎉