/**
 * DigiPin Algorithm - Frontend Implementation
 * Works offline without internet connection
 */

// DIGIPIN 4x4 grid definition
const DIGIPIN_GRID = [
  ['F', 'C', '9', '8'],
  ['J', '3', '2', '7'],
  ['K', '4', '5', '6'],
  ['L', 'M', 'P', 'T']
] as const;

// Geographic bounds (latitude and longitude limits for India)
const BOUNDS = {
  minLat: 2.5,
  maxLat: 38.5,
  minLon: 63.5,
  maxLon: 99.5
} as const;

/**
 * Encodes latitude and longitude into a 10-digit alphanumeric DIGIPIN
 * Works offline - no internet required
 */
export function getDigiPin(lat: number, lon: number): string {
  // Validate input
  if (lat < BOUNDS.minLat || lat > BOUNDS.maxLat) {
    throw new Error('Latitude out of Indian boundaries (2.5° to 38.5°)');
  }
  if (lon < BOUNDS.minLon || lon > BOUNDS.maxLon) {
    throw new Error('Longitude out of Indian boundaries (63.5° to 99.5°)');
  }
  
  let minLat = BOUNDS.minLat;
  let maxLat = BOUNDS.maxLat;
  let minLon = BOUNDS.minLon;
  let maxLon = BOUNDS.maxLon;
  
  let digiPin = "";
  
  // Iterate for 10 levels of refinement
  for (let level = 1; level <= 10; level++) {
    const latDiv = (maxLat - minLat) / 4.0;
    const lonDiv = (maxLon - minLon) / 4.0;

    // Compute grid row and column.
    // Row calculation uses reversed logic to map the latitude correctly.
    let row = 3 - Math.floor((lat - minLat) / latDiv);
    let col = Math.floor((lon - minLon) / lonDiv);
    
    // Clamp row and col between 0 and 3
    row = Math.max(0, Math.min(row, 3));
    col = Math.max(0, Math.min(col, 3));
    
    digiPin += DIGIPIN_GRID[row][col];
    
    // Insert hyphens after the 3rd and 6th characters
    if (level === 3 || level === 6) {
      digiPin += '-';
    }
    
    // Update the bounds for the next level.
    const oldMinLat = minLat;
    const oldMinLon = minLon;

    maxLat = oldMinLat + latDiv * (4 - row);
    minLat = oldMinLat + latDiv * (3 - row);
    
    minLon = oldMinLon + lonDiv * col;
    maxLon = minLon + lonDiv;
  }

  return digiPin;
}

/**
 * Decodes a DIGIPIN back into its central latitude and longitude
 * Works offline - no internet required
 */
export function getLatLngFromDigiPin(digiPin: string): { latitude: number; longitude: number } {
  // Remove hyphens
  const pin = digiPin.replace(/-/g, "");
  if (pin.length !== 10) {
    throw new Error('Invalid DIGIPIN format - must be 10 characters');
  }
  
  let minLat: number = BOUNDS.minLat;
  let maxLat: number = BOUNDS.maxLat;
  let minLon: number = BOUNDS.minLon;
  let maxLon: number = BOUNDS.maxLon;
  
  // Process each of the 10 characters to narrow the bounding box
  for (let i = 0; i < 10; i++) {
    const char = pin[i];
    let found = false;
    let ri = -1, ci = -1;

    // Locate the character in the DIGIPIN_GRID
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        if (DIGIPIN_GRID[r][c] === char) {
          ri = r;
          ci = c;
          found = true;
          break;
        }
      }
      if (found) break;
    }

    if (!found) {
      throw new Error(`Invalid character '${char}' in DIGIPIN`);
    }
    
    const latDiv = (maxLat - minLat) / 4.0;
    const lonDiv = (maxLon - minLon) / 4.0;
    
    const lat1 = maxLat - latDiv * (ri + 1);
    const lat2 = maxLat - latDiv * ri;
    const lon1 = minLon + lonDiv * ci;
    const lon2 = minLon + lonDiv * (ci + 1);
    
    // Update the bounding box bounds
    minLat = lat1;
    maxLat = lat2;
    minLon = lon1;
    maxLon = lon2;
  }
      
  const centerLat = (minLat + maxLat) / 2.0;
  const centerLon = (minLon + maxLon) / 2.0;

  return {
    latitude: parseFloat(centerLat.toFixed(6)),
    longitude: parseFloat(centerLon.toFixed(6))
  };
}

/**
 * Validates if coordinates are within Indian boundaries
 */
export function isWithinIndianBounds(lat: number, lon: number): boolean {
  return lat >= BOUNDS.minLat && lat <= BOUNDS.maxLat && 
         lon >= BOUNDS.minLon && lon <= BOUNDS.maxLon;
}

/**
 * Gets the user's current location and generates DIGIPIN
 * Works offline after location is obtained
 * React Native version using expo-location
 */
import * as Location from 'expo-location';

export async function getCurrentDigiPin(): Promise<{ digiPin: string; latitude: number; longitude: number; error?: string }> {
  try {
    // Request permission
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      return { 
        digiPin: '', 
        latitude: 0, 
        longitude: 0, 
        error: 'Location permission denied' 
      };
    }

    // Get current position
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });

    const { latitude, longitude } = location.coords;
    
    try {
      if (!isWithinIndianBounds(latitude, longitude)) {
        return { 
          digiPin: '', 
          latitude, 
          longitude, 
          error: 'Location is outside Indian boundaries' 
        };
      }

      const digiPin = getDigiPin(latitude, longitude);
      return { digiPin, latitude, longitude };
    } catch (error) {
      return { 
        digiPin: '', 
        latitude, 
        longitude, 
        error: error instanceof Error ? error.message : 'DIGIPIN generation failed' 
      };
    }
  } catch (error) {
    return { 
      digiPin: '', 
      latitude: 0, 
      longitude: 0, 
      error: error instanceof Error ? error.message : 'Location access failed' 
    };
  }
}