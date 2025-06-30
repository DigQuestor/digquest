// Map Service for handling Google Maps loading and initialization
// This centralizes map handling to avoid duplicate loading

// Define the google maps script ID
const GOOGLE_MAPS_SCRIPT_ID = 'google-maps-script';

// Track the loading state
let isLoading = false;
let isLoaded = false;
let loadError: string | null = null;

// Track callbacks to execute when API is loaded
const callbacks: Array<() => void> = [];

/**
 * Load the Google Maps API if not already loaded
 * Returns a promise that resolves when API is loaded
 */
export const loadGoogleMapsAPI = (): Promise<void> => {
  // If already loaded, resolve immediately
  if (isLoaded) {
    return Promise.resolve();
  }
  
  // If already loading, return a promise that resolves when loading completes
  if (isLoading) {
    return new Promise((resolve, reject) => {
      callbacks.push(() => {
        if (loadError) {
          reject(new Error(loadError));
        } else {
          resolve();
        }
      });
    });
  }
  
  // Start loading
  isLoading = true;
  
  return new Promise((resolve, reject) => {
    // Check if script already exists
    if (document.getElementById(GOOGLE_MAPS_SCRIPT_ID)) {
      isLoaded = true;
      isLoading = false;
      resolve();
      return;
    }

    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    
    if (!apiKey) {
      const error = 'Google Maps API key is missing';
      console.error(error);
      loadError = error;
      isLoading = false;
      reject(new Error(error));
      return;
    }
    
    // Add callback to execute when loaded
    callbacks.push(() => {
      if (loadError) {
        reject(new Error(loadError));
      } else {
        resolve();
      }
    });
    
    // Create script element
    const script = document.createElement('script');
    script.id = GOOGLE_MAPS_SCRIPT_ID;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    
    // Handle loading events
    script.onload = () => {
      // Give browser a moment to fully process the loaded script
      setTimeout(() => {
        console.log('Google Maps API loaded successfully');
        
        // Verify that the Map constructor is available
        if (typeof google !== 'undefined' && google.maps && typeof google.maps.Map === 'function') {
          isLoaded = true;
          isLoading = false;
          loadError = null;
          
          // Execute all callbacks
          callbacks.forEach(callback => callback());
          // Clear callbacks
          callbacks.length = 0;
        } else {
          const error = 'Google Maps API loaded but Map constructor is not available';
          console.error(error);
          loadError = error;
          isLoading = false;
          
          // Execute all callbacks with error
          callbacks.forEach(callback => callback());
          // Clear callbacks
          callbacks.length = 0;
        }
      }, 500); // Half-second delay to ensure everything is initialized
    };
    
    script.onerror = () => {
      const error = 'Failed to load Google Maps API';
      console.error(error);
      loadError = error;
      isLoading = false;
      
      // Execute all callbacks
      callbacks.forEach(callback => callback());
      // Clear callbacks
      callbacks.length = 0;
    };
    
    // Add script to document
    document.head.appendChild(script);
  });
};

// Default map center for the UK
export const DEFAULT_CENTER = { lat: 54.093409, lng: -2.89479 };
export const DEFAULT_ZOOM = 6;

/**
 * Create a fallback div for when map cannot be loaded
 * Returns a div with an error message
 */
const createFallbackMapElement = (
  mapElement: HTMLElement,
  errorMessage: string
): void => {
  // Clear existing content
  mapElement.innerHTML = '';
  
  // Add error styling
  mapElement.style.display = 'flex';
  mapElement.style.flexDirection = 'column';
  mapElement.style.alignItems = 'center';
  mapElement.style.justifyContent = 'center';
  mapElement.style.padding = '20px';
  mapElement.style.backgroundColor = '#f8f9fa';
  mapElement.style.border = '1px solid #dee2e6';
  mapElement.style.borderRadius = '4px';
  
  // Create error icon
  const errorIcon = document.createElement('div');
  errorIcon.innerHTML = '⚠️';
  errorIcon.style.fontSize = '48px';
  errorIcon.style.marginBottom = '16px';
  
  // Create error title
  const errorTitle = document.createElement('h3');
  errorTitle.textContent = 'Map Error';
  errorTitle.style.margin = '0 0 8px 0';
  errorTitle.style.color = '#dc3545';
  
  // Create error message
  const errorText = document.createElement('p');
  errorText.textContent = errorMessage;
  errorText.style.margin = '0';
  errorText.style.textAlign = 'center';
  
  // Add elements to the container
  mapElement.appendChild(errorIcon);
  mapElement.appendChild(errorTitle);
  mapElement.appendChild(errorText);
};

/**
 * Safe wrapper for creating a Google Map
 * Returns a map or throws an informative error
 */
export const initializeMap = (
  mapElement: HTMLElement, 
  options: Partial<any> = {}
): any => {
  if (!mapElement) {
    console.error('Map element is null or undefined');
    throw new Error('Map container element not found');
  }
  
  try {
    // Check if Google Maps API is available
    if (typeof google === 'undefined') {
      const error = 'Google Maps API is not loaded';
      createFallbackMapElement(mapElement, error);
      throw new Error(error);
    }
    
    // Check if maps object is available
    if (!google.maps) {
      const error = 'Google Maps object is not available';
      createFallbackMapElement(mapElement, error);
      throw new Error(error);
    }
    
    // Check if Map constructor is available
    if (typeof google.maps.Map !== 'function') {
      const error = 'Google Maps Map constructor is not available';
      createFallbackMapElement(mapElement, error);
      throw new Error(error);
    }
    
    // Use a simple object for map options to avoid type errors
    const mapOptions = {
      center: options.center || DEFAULT_CENTER,
      zoom: options.zoom || DEFAULT_ZOOM,
      mapTypeId: 'terrain',
      mapTypeControl: true,
      mapTypeControlOptions: {
        style: 1, // HORIZONTAL_BAR
        position: 2 // TOP_CENTER
      },
      streetViewControl: false,
      fullscreenControl: true,
      fullscreenControlOptions: {
        position: 6 // RIGHT_BOTTOM
      },
      zoomControl: true,
      zoomControlOptions: {
        position: 5 // RIGHT_CENTER
      }
    };
    
    // Try to create the map
    try {
      const map = new google.maps.Map(mapElement, mapOptions);
      console.log('Google Map initialized successfully');
      return map;
    } catch (mapError) {
      console.error('Error creating map instance:', mapError);
      
      // Try with absolute minimum options as fallback
      try {
        console.log('Trying with minimal map options...');
        const minimalOptions = {
          center: DEFAULT_CENTER,
          zoom: DEFAULT_ZOOM
        };
        
        const fallbackMap = new google.maps.Map(mapElement, minimalOptions);
        console.log('Google Map initialized with fallback options');
        return fallbackMap;
      } catch (fallbackError) {
        // If all else fails, create a fallback map element
        const errorMessage = 'Failed to create map: ' + 
          (mapError instanceof Error ? mapError.message : 'Unknown error');
        createFallbackMapElement(mapElement, errorMessage);
        throw new Error(errorMessage);
      }
    }
  } catch (error) {
    console.error('Failed to initialize Google Maps:', error);
    const errorMessage = 'Failed to initialize map: ' + 
      (error instanceof Error ? error.message : 'Unknown error');
    createFallbackMapElement(mapElement, errorMessage);
    throw new Error(errorMessage);
  }
};