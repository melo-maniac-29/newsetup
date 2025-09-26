// Weather API Configuration
export const WEATHER_CONFIG = {
  // OpenWeatherMap API - Free tier: 1000 calls/day
  OPENWEATHER_API_KEY: 'your_openweather_api_key_here',
  OPENWEATHER_BASE_URL: 'https://api.openweathermap.org/data/2.5',

  // WeatherAPI.com - Free tier: 1 million calls/month
  WEATHERAPI_KEY: 'ac9b73f84d344ad38ff170527252609',
  WEATHERAPI_BASE_URL: 'https://api.weatherapi.com/v1',

  // OpenStreetMap Nominatim - Free (no key required)
  NOMINATIM_BASE_URL: 'https://nominatim.openstreetmap.org',

  // API Configuration
  REQUEST_TIMEOUT: 10000, // 10 seconds
  RETRY_ATTEMPTS: 2,
  CACHE_DURATION: 10 * 60 * 1000, // 10 minutes in milliseconds
};

// Instructions for getting API keys:
// 
// 1. OpenWeatherMap (https://openweathermap.org/api):
//    - Sign up for free account
//    - Go to API Keys section
//    - Copy your default API key
//    - Free tier: 1,000 calls/day, 60 calls/minute
//
// 2. WeatherAPI.com (https://www.weatherapi.com/):
//    - Sign up for free account
//    - Go to your dashboard
//    - Copy your API key
//    - Free tier: 1 million calls/month
//
// 3. For production:
//    - Store API keys in environment variables
//    - Use expo-constants or expo-secure-store
//    - Never commit real API keys to version control