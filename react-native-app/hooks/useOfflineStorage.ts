import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export function useOfflineStorage<T>(key: string, defaultValue: T) {
  const [data, setData] = useState<T>(defaultValue);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [key]);

  const loadData = async () => {
    try {
      const storedData = await AsyncStorage.getItem(key);
      if (storedData) {
        setData(JSON.parse(storedData));
      }
    } catch (error) {
      console.error(`Error loading ${key}:`, error);
    } finally {
      setLoading(false);
    }
  };

  const saveData = async (newData: T) => {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(newData));
      setData(newData);
    } catch (error) {
      console.error(`Error saving ${key}:`, error);
    }
  };

  const clearData = async () => {
    try {
      await AsyncStorage.removeItem(key);
      setData(defaultValue);
    } catch (error) {
      console.error(`Error clearing ${key}:`, error);
    }
  };

  return {
    data,
    loading,
    saveData,
    clearData,
    refresh: loadData,
  };
}