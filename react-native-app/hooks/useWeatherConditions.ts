import { useState, useEffect, useCallback } from 'react';
import { weatherApiService, LocationConditions } from '../services/weatherApi';

export function useWeatherConditions() {
  const [conditions, setConditions] = useState<LocationConditions | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchConditionsByCoordinates = async (lat: number, lon: number) => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await weatherApiService.getLocationConditions(lat, lon);
      setConditions(data);
    } catch (err) {
      console.error('Error fetching weather conditions:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch weather data');
    } finally {
      setLoading(false);
    }
  };

  const fetchConditionsByDigiPin = async (digiPin: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await weatherApiService.getConditionsByDigiPin(digiPin);
      setConditions(data);
    } catch (err) {
      console.error('Error fetching weather conditions by DigiPIN:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch weather data');
    } finally {
      setLoading(false);
    }
  };

  const refreshConditions = useCallback(async () => {
    if (conditions?.location?.coordinates) {
      try {
        await fetchConditionsByCoordinates(
          conditions.location.coordinates.lat, 
          conditions.location.coordinates.lon
        );
      } catch (error) {
        console.error('Error refreshing conditions:', error);
      }
    }
  }, [conditions?.location?.coordinates?.lat, conditions?.location?.coordinates?.lon]);

  // Auto-refresh every 1 minute (60000ms) to keep data current
  useEffect(() => {
    let refreshInterval: ReturnType<typeof setInterval> | undefined;
    
    if (conditions?.location?.coordinates) {
      refreshInterval = setInterval(() => {
        console.log('🔄 Auto-refreshing weather conditions...');
        refreshConditions();
      }, 60000); // 1 minute
    }

    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, [conditions?.location?.coordinates, refreshConditions]);

  return {
    conditions,
    loading,
    error,
    fetchConditionsByCoordinates,
    fetchConditionsByDigiPin,
    refreshConditions,
  };
}