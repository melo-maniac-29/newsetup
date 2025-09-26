// Weather API Service with disaster risk assessment
// Uses WeatherAPI.com as primary (your key: ac9b73f84d344ad38ff170527252609)

export interface WeatherConditions {
  temperature: number;
  humidity: number;
  pressure: number;
  windSpeed: number;
  windDirection: number;
  visibility: number;
  weatherMain: string;
  weatherDescription: string;
  cloudCover: number;
}

export interface AirQualityData {
  aqi: number;
  co: number;
  no2: number;
  o3: number;
  so2: number;
  pm2_5: number;
  pm10: number;
  status: string;
}

export interface DisasterRiskData {
  flood: 'low' | 'medium' | 'high';
  heatWave: 'low' | 'medium' | 'high';
  storm: 'low' | 'medium' | 'high';
  airPollution: 'low' | 'medium' | 'high';
}

export interface LocationConditions {
  location: {
    name: string;
    country: string;
    region: string;
    coordinates: { lat: number; lon: number };
  };
  weather: WeatherConditions;
  airQuality: AirQualityData;
  disasterRisks: DisasterRiskData;
  alerts: string[];
  lastUpdated: string;
}

class WeatherApiService {
  private WEATHERAPI_COM_KEY = 'ac9b73f84d344ad38ff170527252609';
  private WEATHERAPI_BASE = 'https://api.weatherapi.com/v1';
  private OPENWEATHER_API_KEY = 'your_openweather_api_key_here'; // Backup API
  private WEATHER_BASE_URL = 'https://api.openweathermap.org/data/2.5';
  private NOMINATIM_BASE = 'https://nominatim.openstreetmap.org';

  async getLocationConditions(lat: number, lon: number): Promise<LocationConditions> {
    console.log('🌍 Fetching conditions for coordinates:', lat, lon);
    
    try {
      // Get weather data (primary API)
      const weatherData = await this.fetchWeatherData(lat, lon);
      
      // Get air quality data
      const airQualityData = await this.fetchAirQuality(lat, lon);
      
      // Calculate disaster risks
      const disasterRisks = this.calculateDisasterRisks(weatherData, airQualityData);
      
      // Get location info
      const locationInfo = await this.getLocationInfo(lat, lon);
      
      // Generate alerts
      const alerts = this.generateAlerts(weatherData, disasterRisks);

      return {
        location: {
          name: locationInfo.name || 'Unknown Location',
          country: locationInfo.country || 'Unknown Country',
          region: locationInfo.region || '',
          coordinates: { lat, lon }
        },
        weather: weatherData,
        airQuality: airQualityData,
        disasterRisks,
        alerts,
        lastUpdated: new Date().toISOString(),
      };
      
    } catch (error) {
      console.error('Error fetching location conditions:', error);
      // Return fallback data
      return this.getFallbackConditions(lat, lon);
    }
  }

  async getConditionsByDigiPin(digiPin: string): Promise<LocationConditions> {
    try {
      const coordinates = await this.digiPinToCoordinates(digiPin);
      return await this.getLocationConditions(coordinates.lat, coordinates.lon);
    } catch (error) {
      console.error('Error converting DigiPIN to coordinates:', error);
      throw new Error('Invalid DigiPIN or unable to fetch location data');
    }
  }

  private async fetchWeatherData(lat: number, lon: number): Promise<WeatherConditions> {
    try {
      // Primary: WeatherAPI.com (your key)
      const response = await fetch(
        `${this.WEATHERAPI_BASE}/current.json?key=${this.WEATHERAPI_COM_KEY}&q=${lat},${lon}&aqi=no`
      );
      
      if (!response.ok) {
        throw new Error(`WeatherAPI error: ${response.status}`);
      }
      
      const data = await response.json();
      
      return {
        temperature: data.current.temp_c,
        humidity: data.current.humidity,
        pressure: data.current.pressure_mb,
        windSpeed: data.current.wind_kph / 3.6, // Convert to m/s
        windDirection: data.current.wind_degree || 0,
        visibility: data.current.vis_km,
        weatherMain: data.current.condition.text,
        weatherDescription: data.current.condition.text,
        cloudCover: data.current.cloud,
      };
      
    } catch (error) {
      console.log('Weather API failed, using fallback...');
      // Return demo data instead of calling another API
      return {
        temperature: 28,
        humidity: 65,
        pressure: 1013,
        windSpeed: 5.5,
        windDirection: 180,
        visibility: 10,
        weatherMain: 'Partly Cloudy',
        weatherDescription: 'partly cloudy',
        cloudCover: 40,
      };
    }
  }

  private async fetchAirQuality(lat: number, lon: number): Promise<AirQualityData> {
    try {
      const response = await fetch(
        `${this.WEATHERAPI_BASE}/current.json?key=${this.WEATHERAPI_COM_KEY}&q=${lat},${lon}&aqi=yes`
      );
      
      if (!response.ok) {
        throw new Error(`Air quality API error: ${response.status}`);
      }
      
      const data = await response.json();
      const aqi = data.current.air_quality;
      
      return {
        aqi: Math.round(aqi.us_epa_index || 50),
        co: aqi.co || 0,
        no2: aqi.no2 || 0,
        o3: aqi.o3 || 0,
        so2: aqi.so2 || 0,
        pm2_5: aqi.pm2_5 || 0,
        pm10: aqi.pm10 || 0,
        status: this.getAirQualityStatus(aqi.us_epa_index || 50),
      };
    } catch (error) {
      // Return fallback air quality data
      return {
        aqi: 50,
        co: 0.1,
        no2: 10,
        o3: 60,
        so2: 5,
        pm2_5: 15,
        pm10: 25,
        status: 'Moderate',
      };
    }
  }

  private calculateDisasterRisks(weather: WeatherConditions, airQuality: AirQualityData): DisasterRiskData {
    // Flood risk assessment
    let floodRisk: 'low' | 'medium' | 'high' = 'low';
    if (weather.weatherMain.toLowerCase().includes('rain') || weather.humidity > 85) {
      floodRisk = weather.windSpeed > 10 ? 'high' : 'medium';
    }

    // Heat wave assessment
    let heatWaveRisk: 'low' | 'medium' | 'high' = 'low';
    if (weather.temperature > 35) {
      heatWaveRisk = 'high';
    } else if (weather.temperature > 30) {
      heatWaveRisk = 'medium';
    }

    // Storm risk assessment
    let stormRisk: 'low' | 'medium' | 'high' = 'low';
    if (weather.windSpeed > 15 || weather.weatherMain.toLowerCase().includes('storm')) {
      stormRisk = 'high';
    } else if (weather.windSpeed > 8 || weather.cloudCover > 80) {
      stormRisk = 'medium';
    }

    // Air pollution risk
    let airPollutionRisk: 'low' | 'medium' | 'high' = 'low';
    if (airQuality.aqi > 150) {
      airPollutionRisk = 'high';
    } else if (airQuality.aqi > 100) {
      airPollutionRisk = 'medium';
    }

    return {
      flood: floodRisk,
      heatWave: heatWaveRisk,
      storm: stormRisk,
      airPollution: airPollutionRisk,
    };
  }

  private generateAlerts(weather: WeatherConditions, risks: DisasterRiskData): string[] {
    const alerts: string[] = [];
    
    if (risks.heatWave === 'high') {
      alerts.push('🌡️ Extreme heat warning - Stay hydrated and avoid outdoor activities');
    }
    
    if (risks.storm === 'high') {
      alerts.push('⛈️ Severe weather alert - Strong winds and storms expected');
    }
    
    if (risks.flood === 'high') {
      alerts.push('🌊 Flood risk - Heavy rainfall may cause flooding');
    }
    
    if (risks.airPollution === 'high') {
      alerts.push('😷 Air quality hazard - Wear masks and limit outdoor exposure');
    }
    
    if (weather.visibility < 2) {
      alerts.push('🌫️ Low visibility warning - Reduced visibility conditions');
    }
    
    return alerts;
  }

  private async getLocationInfo(lat: number, lon: number) {
    try {
      const response = await fetch(
        `${this.NOMINATIM_BASE}/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10&addressdetails=1`
      );
      
      if (!response.ok) {
        throw new Error('Location service error');
      }
      
      const data = await response.json();
      
      return {
        name: data.address?.city || data.address?.town || data.address?.village || 'Unknown',
        country: data.address?.country || 'Unknown',
        region: data.address?.state || data.address?.region || '',
      };
    } catch (error) {
      return {
        name: 'Location',
        country: 'Unknown',
        region: '',
      };
    }
  }

  private async digiPinToCoordinates(digiPin: string): Promise<{lat: number, lon: number}> {
    // Demo implementation - replace with actual DigiPIN conversion logic
    // For now, return Mumbai coordinates
    return {
      lat: 19.0760,
      lon: 72.8777,
    };
  }

  private getAirQualityStatus(aqi: number): string {
    if (aqi <= 50) return 'Good';
    if (aqi <= 100) return 'Moderate';
    if (aqi <= 150) return 'Unhealthy for Sensitive Groups';
    if (aqi <= 200) return 'Unhealthy';
    if (aqi <= 300) return 'Very Unhealthy';
    return 'Hazardous';
  }

  private getFallbackConditions(lat: number, lon: number): LocationConditions {
    return {
      location: {
        name: 'Demo Location',
        country: 'India',
        region: 'Maharashtra',
        coordinates: { lat, lon }
      },
      weather: {
        temperature: 28,
        humidity: 65,
        pressure: 1013,
        windSpeed: 5.5,
        windDirection: 180,
        visibility: 10,
        weatherMain: 'Partly Cloudy',
        weatherDescription: 'partly cloudy',
        cloudCover: 40,
      },
      airQuality: {
        aqi: 75,
        co: 0.1,
        no2: 15,
        o3: 65,
        so2: 8,
        pm2_5: 20,
        pm10: 30,
        status: 'Moderate',
      },
      disasterRisks: {
        flood: 'low',
        heatWave: 'medium',
        storm: 'low',
        airPollution: 'medium',
      },
      alerts: ['Demo mode - Real weather data unavailable'],
      lastUpdated: new Date().toISOString(),
    };
  }
}

export const weatherApiService = new WeatherApiService();