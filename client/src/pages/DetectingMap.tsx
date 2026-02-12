import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Helmet } from "react-helmet";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { Location } from "@shared/schema";
import { Search, MapPin, Coins, Waves, CheckCircle, Users, Star, Loader2, UserCircle, Ruler, X, Trash2, ExternalLink, Upload } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogHeader, DialogFooter } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
// import { Slider } from "@/components/ui/slider"; // Using native HTML input instead
import { Checkbox } from "@/components/ui/checkbox";
import AddLocationForm from "@/components/map/AddLocationForm";
import { KmlImporter } from "@/components/map/KmlImporter";
import { useAuth } from "@/hooks/use-auth-simple";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

import { loadGoogleMapsAPI, initializeMap, DEFAULT_CENTER, DEFAULT_ZOOM } from "@/lib/mapService";
import { removeLocationFromLocalStorage, clearAllLocationData } from "@/lib/storageUtils";

const DetectingMap = () => {
  // DOM references
  const mapRef = useRef<HTMLDivElement>(null);
  
  // Map state
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [markers, setMarkers] = useState<google.maps.Marker[]>([]);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  
  // Delete location state
  const [deleteLocationId, setDeleteLocationId] = useState<number | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  // UI state
  const [locationSearch, setLocationSearch] = useState("");
  const [isAddLocationOpen, setIsAddLocationOpen] = useState(false);
  const [isKmlImportOpen, setIsKmlImportOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [mapMessage, setMapMessage] = useState<string | null>(null);
  const [distanceFilter, setDistanceFilter] = useState<number | null>(null);
  const [userPosition, setUserPosition] = useState<{lat: number, lng: number} | null>(null);
  const [userLocationMarker, setUserLocationMarker] = useState<google.maps.Marker | null>(null);
  const [showOnlyMyLocations, setShowOnlyMyLocations] = useState(false);
  
  // Use refs for tracking state that shouldn't cause rerenders
  const mapInitializedRef = useRef(false);
  const geolocationRequestedRef = useRef(false);
  
  // Services
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Delete location mutation
  const deleteMutation = useMutation({
    mutationFn: async (locationId: number) => {
      return await apiRequest(
        "DELETE", 
        `/api/locations/${locationId}?userId=${user?.id}`
      );
    },
    onSuccess: () => {
      // Clear ALL localStorage location data to ensure a complete reset
      clearAllLocationData();
      
      // Force the component to re-render by invalidating queries
      queryClient.invalidateQueries({ queryKey: ['/api/locations'] });
      
      // Force complete refresh to ensure all components update
      window.location.reload();
      
      toast({
        title: "Location deleted",
        description: "Location has been successfully deleted.",
      });
      setIsDeleteDialogOpen(false);
      setDeleteLocationId(null);
    },
    onError: (error) => {
      console.error("Error deleting location:", error);
      toast({
        title: "Error",
        description: "Failed to delete location. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  // Handle opening delete dialog
  const handleDeleteClick = (locationId: number) => {
    setDeleteLocationId(locationId);
    setIsDeleteDialogOpen(true);
  };
  
  // Handle confirm delete
  const handleConfirmDelete = () => {
    if (deleteLocationId !== null) {
      deleteMutation.mutate(deleteLocationId);
    }
  };

  // Function to handle KML import
  const handleKmlImport = async (importedLocations: Array<{name: string, description?: string, coordinates: {lat: number, lng: number}}>) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to import locations.",
        variant: "destructive",
      });
      return;
    }

    let successCount = 0;
    let errorCount = 0;

    for (const importedLocation of importedLocations) {
      try {
        const locationData = {
          name: importedLocation.name,
          description: importedLocation.description || null,
          latitude: importedLocation.coordinates.lat.toString(),
          longitude: importedLocation.coordinates.lng.toString(),
          userId: user.id,
          isPrivate: true, // KML imports should be private by default
        };

        const response = await fetch('/api/locations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(locationData),
        });

        if (response.ok) {
          successCount++;
        } else {
          errorCount++;
        }
      } catch (error) {
        errorCount++;
        console.error("Error importing location:", importedLocation.name, error);
      }
    }

    // Refresh the locations data
    queryClient.invalidateQueries({ queryKey: ['/api/locations'] });

    // Show result toast
    if (successCount > 0) {
      toast({
        title: "Import Complete",
        description: `Successfully imported ${successCount} location${successCount > 1 ? 's' : ''}${errorCount > 0 ? `. ${errorCount} failed to import.` : '.'}`,
      });
    } else {
      toast({
        title: "Import Failed",
        description: "No locations could be imported. Please check the file format.",
        variant: "destructive",
      });
    }
  };
  
  // Load locations data
  const { data: apiLocations = [], isLoading } = useQuery<Location[]>({
    queryKey: ['/api/locations', user?.id],
    queryFn: async () => {
      const url = user?.id ? `/api/locations?userId=${user.id}` : '/api/locations';
      console.log(`DetectingMap: Fetching locations with URL: ${url}`);
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch locations');
      const data = await response.json();
      console.log(`DetectingMap: Received ${data.length} locations from API`);
      return data;
    },
    enabled: !authLoading && !!user, // Only fetch when user is authenticated
  });
  
  // Use API locations directly for reliable display
  const locations = apiLocations;
  
  // Calculate distance between two points in kilometers
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2); 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    return R * c; // Distance in km
  };
  
  // No longer loading from localStorage - relying on server persistence
  
  // Initialize Google Maps - only once
  const initializeGoogleMap = useCallback(async () => {
    // Skip if already initialized or no container
    if (mapInitializedRef.current || !mapRef.current) return;
    
    // Mark as initialized to prevent multiple attempts
    mapInitializedRef.current = true;
    
    // Clear any previous errors
    setMapError(null);
    
    // First check if there are URL parameters for a specific location
    const urlLocation = parseLocationFromURL();
    
    try {
      console.log("Loading Google Maps API...");
      await loadGoogleMapsAPI();
      
      setMapLoaded(true);
      
      // Create the map with UK coordinates or the coordinates from URL
      const ukCenter = { lat: 54.093409, lng: -2.89479 };
      const initialCenter = urlLocation || ukCenter;
      const initialZoom = urlLocation ? 14 : 6; // Zoom in more if specific location
      
      console.log("Map initializing with center:", initialCenter);
      
      const googleMap = initializeMap(mapRef.current, {
        center: initialCenter,
        zoom: initialZoom
      });
      
      // Store the map reference
      setMap(googleMap);
      console.log('Google Map initialized successfully');
      
      // Set the position for filtering - either from URL or default UK
      const positionToUse = urlLocation || ukCenter;
      setUserPosition(positionToUse);
      
      // Create a marker for the current center location
      const marker = new google.maps.Marker({
        position: positionToUse,
        map: googleMap,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          fillColor: '#4285F4', // Google blue
          fillOpacity: 1,
          strokeWeight: 2,
          strokeColor: '#FFFFFF',
          scale: 10
        },
        title: urlLocation ? "Saved Location" : "Default UK Location"
      });
      
      // If URL contains a location, add a special highlight marker
      if (urlLocation) {
        // Create a highlighted marker for the URL location
        const highlightMarker = new google.maps.Marker({
          position: urlLocation,
          map: googleMap,
          animation: google.maps.Animation.DROP,
          title: "Selected Location"
        });
        
        // Store this marker to be cleared later
        const newMarkers = [...markers, highlightMarker];
        setMarkers(newMarkers);
        
        // Location centered without notification
      }
      
      // Store reference to the marker
      setUserLocationMarker(marker);
      
      // Set up search box if available
      try {
        setupSearchBox(googleMap);
      } catch (searchError) {
        console.warn('Search functionality not available:', searchError);
      }
      
    } catch (error) {
      console.error('Error initializing Google Maps:', error);
      setMapError(error instanceof Error ? error.message : 'Unknown map error');
      setMapLoaded(false);
      mapInitializedRef.current = false; // Allow retry
    }
  }, []);
  
  // Setup search box functionality
  const setupSearchBox = useCallback((googleMap: google.maps.Map) => {
    const searchInput = document.querySelector('input[placeholder="Search locations..."]') as HTMLInputElement;
    if (!searchInput || !googleMap || !google.maps.places) return;
    
    try {
      // Create the search box with UK bias
      const searchBoxOptions = {
        bounds: new google.maps.LatLngBounds(
          new google.maps.LatLng(49.9, -8.0), // SW corner of UK
          new google.maps.LatLng(60.9, 2.0)   // NE corner of UK
        )
      };
      
      const searchBox = new google.maps.places.SearchBox(searchInput, searchBoxOptions);
      
      // Update bounds when the map changes
      googleMap.addListener('bounds_changed', () => {
        const bounds = googleMap.getBounds();
        if (bounds && searchBox.setBounds) {
          searchBox.setBounds(bounds);
        }
      });
      
      // Handle place selection
      searchBox.addListener('places_changed', () => {
        const places = searchBox.getPlaces();
        
        // If no places found, try geocoding with UK bias
        if (!places || places.length === 0) {
          const searchText = searchInput.value;
          if (searchText && google.maps.Geocoder) {
            const geocoder = new google.maps.Geocoder();
            geocoder.geocode({
              address: searchText,
              region: 'uk' // Bias toward UK results
            }, (results, status) => {
              if (status === google.maps.GeocoderStatus.OK && results && results.length > 0) {
                handleGeocodeResults(results[0], googleMap);
              } else {
                toast({
                  title: "Location not found",
                  description: "Try adding 'UK' to your search term",
                  variant: "destructive"
                });
              }
            });
          }
          return;
        }
        
        // Process the places found
        const bounds = new google.maps.LatLngBounds();
        let markersToAdd: google.maps.Marker[] = [];
        
        // Clear any previous search markers
        markers.forEach(marker => {
          if (marker.getTitle?.()?.startsWith('Search:')) {
            marker.setMap(null);
          }
        });
        
        // Add markers for each place
        places.forEach(place => {
          if (!place.geometry || !place.geometry.location) return;
          
          const marker = new google.maps.Marker({
            map: googleMap,
            title: `Search: ${place.name}`,
            position: place.geometry.location,
            animation: google.maps.Animation.DROP
          });
          
          markersToAdd.push(marker);
          
          if (place.geometry.viewport) {
            bounds.union(place.geometry.viewport);
          } else {
            bounds.extend(place.geometry.location);
          }
        });
        
        // Update markers state
        setMarkers(prev => [...prev.filter(m => !m.getTitle?.()?.startsWith('Search:')), ...markersToAdd]);
        
        // Fit bounds to show all markers
        googleMap.fitBounds(bounds);
        
        // Show toast
        toast({
          title: "Locations found",
          description: `Found ${places.length} matching locations`
        });
      });
    } catch (error) {
      console.error("Error setting up search box:", error);
    }
  }, [markers, toast]);
  
  // Handle geocoded results
  const handleGeocodeResults = useCallback((result: any, googleMap: google.maps.Map) => {
    if (!result || !result.geometry || !result.geometry.location) return;
    
    const position = result.geometry.location;
    
    // Clear previous search markers
    markers.forEach(marker => {
      if (marker.getTitle?.()?.startsWith('Search:')) {
        marker.setMap(null);
      }
    });
    
    // Create marker
    const marker = new google.maps.Marker({
      map: googleMap,
      title: `Search: ${result.formatted_address}`,
      position: position,
      animation: google.maps.Animation.DROP
    });
    
    // Update markers state
    setMarkers(prev => [...prev.filter(m => !m.getTitle?.()?.startsWith('Search:')), marker]);
    
    // Center map
    googleMap.setCenter(position);
    googleMap.setZoom(12);
    
    // Show success toast
    toast({
      title: "✅ Location Found!",
      description: `Found "${result.formatted_address}"`,
      duration: 3000,
      className: "bg-green-600 text-white border-green-700 font-semibold"
    });
  }, [markers, toast]);
  
  // Get user's location
  const getUserLocation = useCallback(() => {
    // Skip if already requested, map not loaded, or geolocation not available
    if (geolocationRequestedRef.current || !map || !('geolocation' in navigator)) return;
    
    // Mark as requested to prevent multiple calls
    geolocationRequestedRef.current = true;
    
    toast({
      title: "📍 Finding Your Location...",
      description: "Please allow location access when prompted to center the map on your position.",
      duration: 4000,
      className: "bg-blue-600 text-white border-blue-700 font-semibold"
    });
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userLoc = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        
        setUserPosition(userLoc);
        
        if (map) {
          map.setCenter(userLoc);
          map.setZoom(14);
          
          // Remove previous user location marker
          if (userLocationMarker) {
            userLocationMarker.setMap(null);
          }
          
          // Add new marker
          const marker = new google.maps.Marker({
            position: userLoc,
            map,
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              fillColor: '#4285F4',
              fillOpacity: 1,
              strokeWeight: 2,
              strokeColor: '#FFFFFF',
              scale: 10
            },
            title: "Your Location"
          });
          
          setUserLocationMarker(marker);
          
          try {
            localStorage.setItem('user_location', JSON.stringify(userLoc));
          } catch (error) {
            console.warn('Could not save user location to localStorage:', error);
          }
          
          toast({
            title: "✅ Location Found!",
            description: "The map has been centered on your current location.",
            duration: 3000,
            className: "bg-green-600 text-white border-green-700 font-semibold text-lg"
          });
        }
      },
      (error) => {
        console.log("Error getting user location:", error);
        
        toast({
          title: "⚠️ Location Access Denied",
          description: "Using default UK location. Please allow location access in your browser settings for better results.",
          variant: "destructive",
          duration: 5000
        });
      }
    );
  }, [map, toast, userLocationMarker]);
  
  // Parse URL parameters for location coordinates
  const parseLocationFromURL = useCallback(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const lat = urlParams.get('lat');
      const lng = urlParams.get('lng');
      
      if (lat && lng) {
        console.log(`Found coordinates in URL: lat=${lat}, lng=${lng}`);
        return {
          lat: parseFloat(lat),
          lng: parseFloat(lng)
        };
      }
    } catch (error) {
      console.error("Error parsing URL parameters:", error);
    }
    return null;
  }, []);
  
  // Initialize map once when component mounts
  useEffect(() => {
    if (!mapInitializedRef.current) {
      console.log("Initial map loading...");
      initializeGoogleMap();
    }
    
    // Add an event listener for URL changes via history navigation (back/forward buttons)
    const handleURLChange = () => {
      console.log("URL changed, checking for location parameters");
      if (map) {
        const urlLocation = parseLocationFromURL();
        if (urlLocation) {
          // If we have location parameters, center the map (the other effect will handle markers)
          map.setCenter(urlLocation);
          map.setZoom(14);
        }
      }
    };
    
    // Listen for navigation events
    window.addEventListener('popstate', handleURLChange);
    
    // Clean up
    return () => {
      window.removeEventListener('popstate', handleURLChange);
    };
  }, [initializeGoogleMap, map, parseLocationFromURL]);
  
  // Request geolocation with a delay after map initializes (but not if we have URL params)
  useEffect(() => {
    if (map && !geolocationRequestedRef.current) {
      // First check if there are URL parameters for location
      const urlLocation = parseLocationFromURL();
      
      // Only request geolocation if no URL parameters are present
      if (!urlLocation) {
        const timer = setTimeout(() => {
          getUserLocation();
        }, 2000);
        
        return () => clearTimeout(timer);
      } else {
        // Mark as requested to prevent geolocation popup when already using URL location
        geolocationRequestedRef.current = true;
      }
    }
  }, [map, getUserLocation, parseLocationFromURL]);
  
  // Handle URL changes when the component is already mounted
  useEffect(() => {
    // Skip if map not initialized yet
    if (!map) return;
    
    // Check for location parameters in URL
    const urlLocation = parseLocationFromURL();
    if (urlLocation) {
      console.log("URL location detected, centering map:", urlLocation);
      
      // Center the map on the URL location
      map.setCenter(urlLocation);
      map.setZoom(14);
      
      // Clear existing highlight markers
      markers.forEach(marker => {
        if (marker.getTitle?.()?.includes("Selected Location")) {
          marker.setMap(null);
        }
      });
      
      // Add a new highlight marker
      const highlightMarker = new google.maps.Marker({
        position: urlLocation,
        map,
        animation: google.maps.Animation.DROP,
        title: "Selected Location"
      });
      
      // Update markers state
      setMarkers(prev => [...prev.filter(m => !m.getTitle?.()?.includes("Selected Location")), highlightMarker]);
      
      // Location centered without notification
    }
  }, [map, parseLocationFromURL, markers, toast]);
  
  // Track the last known locations to avoid unnecessary re-renders
  const lastLocationsRef = useRef<Location[] | null>(null);
  
  // Clear any stale location data when component loads and api returns no locations
  useEffect(() => {
    if (locations && locations.length === 0) {
      clearAllLocationData();
      console.log("No locations found in API response, cleared localStorage data");
    }
  }, [locations]);
  
  // Set up global handler for the delete button in infowindow
  useEffect(() => {
    // Create global function to handle delete button clicks in info windows
    window.handleDeleteLocationClick = (locationId: number) => {
      handleDeleteClick(locationId);
    };
    
    // Clean up when component unmounts
    return () => {
      // TypeScript-safe way to remove a property from window
      window.handleDeleteLocationClick = undefined as any;
    };
  }, []);
  
  // Add location markers when map is initialized and locations change
  useEffect(() => {
    if (!map || !locations) {
      console.log("🗺️ Skipping marker render - map:", !!map, "locations:", locations?.length || 0);
      return;
    }
    
    // Skip if locations haven't actually changed (prevents flashing)
    if (lastLocationsRef.current === locations) {
      console.log("📍 Locations unchanged, skipping marker update");
      return;
    }
    
    // Update the reference to current locations
    lastLocationsRef.current = locations;
    
    // Clear existing markers
    console.log(`🗑️ Clearing ${markers.length} existing markers`);
    markers.forEach(marker => marker.setMap(null));
    
    // Create new markers array
    const newMarkers: google.maps.Marker[] = [];
    
    console.log(`🎯 Rendering ${locations.length} locations on map`);
    
    // Get filtered locations
    const filteredLocations = locations.filter(location => {
      // Skip invalid locations
      if (!location.latitude || !location.longitude) return false;
      
      // Filter by category
      let passesFilter = true;
      if (activeFilter !== null) {
        switch (activeFilter) {
          case 'Roman Sites':
            passesFilter = location.type === 'Roman Site';
            break;
          case 'Beaches':
            passesFilter = location.type === 'Beach';
            break;
          case 'Fields':
            passesFilter = location.type === 'Field';
            break;
          case 'Woodlands':
            passesFilter = location.type === 'Woodland';
            break;
          case 'Parks':
            passesFilter = location.type === 'Park';
            break;
          case 'Farmlands':
            passesFilter = location.type === 'Farmland';
            break;
          case 'Historical Sites':
            passesFilter = location.type === 'Historical Site';
            break;
          case 'Permission Granted':
            passesFilter = location.hasPermission === true;
            break;
          case 'Group Digs':
            passesFilter = location.isGroupDig === true;
            break;
          case 'My Locations':
            // Handle string or number comparison safely by converting both to strings
            passesFilter = user ? String(location.userId) === String(user.id) : false;
            break;
          case 'Nearby Locations':
            if (userPosition && distanceFilter) {
              const distance = calculateDistance(
                userPosition.lat, 
                userPosition.lng, 
                parseFloat(location.latitude), 
                parseFloat(location.longitude)
              );
              passesFilter = distance <= distanceFilter;
            }
            break;
          default:
            passesFilter = true;
        }
      }
      
      // Filter by ownership
      if (passesFilter && showOnlyMyLocations && user) {
        // Handle string or number comparison safely by converting both to strings
        passesFilter = String(location.userId) === String(user.id);
      }
      
      // Filter by distance
      if (passesFilter && userPosition && distanceFilter && activeFilter !== 'Nearby Locations') {
        const distance = calculateDistance(
          userPosition.lat, 
          userPosition.lng, 
          parseFloat(location.latitude), 
          parseFloat(location.longitude)
        );
        passesFilter = distance <= distanceFilter;
      }
      
      return passesFilter;
    });
    
    // Add markers for each location
    filteredLocations.forEach(location => {
      // Skip locations without coordinates
      if (!location.latitude || !location.longitude) return;
      
      // Create position
      const position = {
        lat: parseFloat(location.latitude),
        lng: parseFloat(location.longitude)
      };
      
      // Determine marker icon
      let icon = {
        path: google.maps.SymbolPath.CIRCLE,
        fillColor: '#8B4513', // Default brown
        fillOpacity: 1,
        strokeWeight: 1,
        strokeColor: '#FFFFFF',
        scale: 8
      };
      
      // Customize icon based on type
      if (location.type === 'Roman Site') {
        icon.fillColor = '#CD5C5C';
      } else if (location.type === 'Beach') {
        icon.fillColor = '#4682B4';
      } else if (location.isGroupDig) {
        icon.fillColor = '#9370DB';
      }
      
      // Create marker (disable animation to prevent flickering)
      const marker = new google.maps.Marker({
        position,
        map,
        title: location.name,
        icon,
        // Only animate new markers, not existing ones
        animation: undefined
      });
      
      // Check if current user is the creator of this location
      const isCreator = user && location.userId === user.id;
      
      // Create info window with delete button for creator
      const infoWindow = new google.maps.InfoWindow({
        content: `
          <div style="padding: 8px; max-width: 200px;">
            <div style="display: flex; justify-content: space-between; align-items: start; gap: 8px;">
              <h3 style="margin: 0 0 8px; font-weight: bold; flex: 1;">${location.name}</h3>
              ${isCreator ? 
                `<button 
                  id="delete-location-${location.id}" 
                  style="background: #dc2626; border: none; cursor: pointer; color: white; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; white-space: nowrap; display: flex; align-items: center; gap: 4px;"
                  title="Delete this location"
                  onclick="window.handleDeleteLocationClick(${location.id})"
                >🗑️ Delete</button>` 
              : ''}
            </div>
            <p style="margin: 0 0 4px; font-size: 14px;">${location.description || 'No description available'}</p>
            <div style="margin-top: 8px; font-size: 12px;">
              ${location.type ? `<span style="background-color: #f3e8d6; padding: 2px 6px; border-radius: 10px; margin-right: 4px;">${location.type}</span>` : ''}
              ${location.hasPermission ? '<span style="background-color: #e8f5e9; padding: 2px 6px; border-radius: 10px; margin-right: 4px;">Permission ✓</span>' : ''}
              ${location.isGroupDig ? '<span style="background-color: #e3f2fd; padding: 2px 6px; border-radius: 10px;">Group Dig</span>' : ''}
            </div>
          </div>
        `
      });
      
      // Add click listener
      marker.addListener('click', () => {
        infoWindow.open(map, marker);
      });
      
      // Add to array
      newMarkers.push(marker);
    });
    
    console.log(`✅ Created ${newMarkers.length} markers (filtered from ${locations.length} total locations)`);
    if (newMarkers.length < locations.length) {
      console.log(`   ℹ️ ${locations.length - newMarkers.length} locations filtered out by current filters`);
    }
    
    // Update markers state
    setMarkers(newMarkers);
    
  // Using markers as a dependency here causes unnecessary re-renders and flashing
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, locations, activeFilter, userPosition, distanceFilter, showOnlyMyLocations, user, calculateDistance]);
  
  // Function to delete a location
  const deleteLocation = async (locationId: number) => {
    try {
      // Call the API to delete the location
      await fetch(`/api/locations/${locationId}`, {
        method: 'DELETE',
      });
      
      // Update the local state to remove the location
      const updatedLocations = locations?.filter(loc => loc.id !== locationId) || [];
      queryClient.setQueryData(['/api/locations'], updatedLocations);
      
      // No longer using localStorage for locations
      
      // Show a success toast
      toast({
        title: "Location deleted",
        description: "The location has been removed from the map."
      });
      
      // Add markers for the updated locations
      addLocationMarkers();
    } catch (error) {
      console.error('Error deleting location:', error);
      toast({
        title: "Delete failed",
        description: "Could not delete the location. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  // Function to add location markers
  const addLocationMarkers = useCallback(() => {
    if (!map || !locations) return;
    
    // Clear existing markers
    markers.forEach(marker => marker.setMap(null));
    
    // Create new markers array
    const newMarkers: google.maps.Marker[] = [];
    
    // Filter locations
    const filteredLocations = locations.filter(location => {
      // Filter logic here (same as above)
      let passesFilter = true;
      // ... (omitted for brevity)
      return passesFilter;
    });
    
    // Add markers
    filteredLocations.forEach(location => {
      // Create marker logic (same as above)
      // ... (omitted for brevity)
    });
    
    // Update markers state
    setMarkers(newMarkers);
  }, [map, locations, markers, activeFilter, userPosition, distanceFilter, showOnlyMyLocations, user, calculateDistance]);
  
  // Render component
  return (
    <>
      <Helmet>
        <title>Metal Detecting Map | Find Detecting Locations</title>
        <meta name="description" content="Interactive map for metal detecting enthusiasts to find and share detecting locations across the UK." />
        <link rel="canonical" href="https://digquest.org/map" />
      </Helmet>
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-3xl font-bold">Interactive Detecting Map</h1>
          <Link href="/ar-routes">
            <Button variant="outline" className="flex items-center gap-2">
              <span>AR Routes</span>
              <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">BETA</span>
            </Button>
          </Link>
        </div>
        
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Map filters */}
          <div className="w-full lg:w-1/4 space-y-4">
            <Card>
              <CardContent className="p-4">
                <h2 className="text-xl font-semibold mb-4">Search & Filters</h2>
                
                <div className="relative mb-4">
                  <Input
                    type="text"
                    placeholder="Search locations..."
                    value={locationSearch}
                    onChange={(e) => setLocationSearch(e.target.value)}
                    className="pl-10"
                  />
                  <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                </div>
                
                <div className="space-y-2 mb-4">
                  <h3 className="text-md font-medium mb-2">Location Types</h3>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant={activeFilter === 'Roman Sites' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setActiveFilter(activeFilter === 'Roman Sites' ? null : 'Roman Sites')}
                      className="justify-start"
                    >
                      <MapPin className="mr-2 h-4 w-4 text-red-500" />
                      Roman Sites
                    </Button>
                    
                    <Button
                      variant={activeFilter === 'Beaches' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setActiveFilter(activeFilter === 'Beaches' ? null : 'Beaches')}
                      className="justify-start"
                    >
                      <Waves className="mr-2 h-4 w-4 text-blue-500" />
                      Beaches
                    </Button>
                    
                    <Button
                      variant={activeFilter === 'Fields' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setActiveFilter(activeFilter === 'Fields' ? null : 'Fields')}
                      className="justify-start"
                    >
                      <MapPin className="mr-2 h-4 w-4 text-green-500" />
                      Fields
                    </Button>
                    
                    <Button
                      variant={activeFilter === 'Woodlands' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setActiveFilter(activeFilter === 'Woodlands' ? null : 'Woodlands')}
                      className="justify-start"
                    >
                      <MapPin className="mr-2 h-4 w-4 text-emerald-700" />
                      Woodlands
                    </Button>
                  
                    <Button
                      variant={activeFilter === 'Permission Granted' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setActiveFilter(activeFilter === 'Permission Granted' ? null : 'Permission Granted')}
                      className="justify-start"
                    >
                      <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                      Permission
                    </Button>
                    
                    <Button
                      variant={activeFilter === 'Group Digs' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setActiveFilter(activeFilter === 'Group Digs' ? null : 'Group Digs')}
                      className="justify-start"
                    >
                      <Users className="mr-2 h-4 w-4 text-purple-500" />
                      Group Digs
                    </Button>
                    
                    <Button
                      variant={activeFilter === 'Historical Sites' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setActiveFilter(activeFilter === 'Historical Sites' ? null : 'Historical Sites')}
                      className="justify-start"
                    >
                      <MapPin className="mr-2 h-4 w-4 text-amber-700" />
                      Historical
                    </Button>
                    
                    <Button
                      variant={activeFilter === 'Farmlands' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setActiveFilter(activeFilter === 'Farmlands' ? null : 'Farmlands')}
                      className="justify-start"
                    >
                      <MapPin className="mr-2 h-4 w-4 text-yellow-600" />
                      Farmlands
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-2 mb-4">
                  <h3 className="text-md font-medium mb-2">Special Filters</h3>
                  
                  <div className="space-y-2">
                    <Button
                      variant={activeFilter === 'My Locations' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setActiveFilter(activeFilter === 'My Locations' ? null : 'My Locations')}
                      className="w-full justify-start"
                      disabled={!user}
                    >
                      <Star className="mr-2 h-4 w-4 text-yellow-500" />
                      My Locations
                    </Button>
                    
                    <Button
                      variant={activeFilter === 'Nearby Locations' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => {
                        if (activeFilter !== 'Nearby Locations') {
                          setActiveFilter('Nearby Locations');
                          setDistanceFilter(10); // Default to 10km
                        } else {
                          setActiveFilter(null);
                          setDistanceFilter(null);
                        }
                      }}
                      className="w-full justify-start"
                      disabled={!userPosition}
                    >
                      <MapPin className="mr-2 h-4 w-4 text-blue-500" />
                      Nearby Locations
                    </Button>
                    
                    {activeFilter === 'Nearby Locations' && (
                      <div className="p-2 bg-slate-100 rounded-md">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm">Distance (km)</span>
                          <span className="text-sm font-medium">{distanceFilter}km</span>
                        </div>
                        
                        <input
                          type="range"
                          value={distanceFilter || 10}
                          min={1}
                          max={100}
                          step={1}
                          onChange={(e) => setDistanceFilter(parseInt(e.target.value))}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                        />
                      </div>
                    )}
                    
                    <div className="flex items-center space-x-2 pt-2">
                      <Checkbox
                        id="showOnlyMyLocations"
                        checked={showOnlyMyLocations}
                        onCheckedChange={(checked) => setShowOnlyMyLocations(checked === true)}
                        disabled={!user}
                      />
                      <Label htmlFor="showOnlyMyLocations">Only my locations</Label>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Button 
                    variant="default" 
                    className="w-full"
                    onClick={() => getUserLocation()}
                  >
                    <MapPin className="mr-2 h-4 w-4" />
                    Find My Location
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => setIsAddLocationOpen(true)}
                    disabled={!user}
                  >
                    <MapPin className="mr-2 h-4 w-4" />
                    Add New Spot
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => setIsKmlImportOpen(true)}
                    disabled={!user}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Import .kml/.kmi Files
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <h2 className="text-xl font-semibold mb-2">Location Guide</h2>
                
                <div className="space-y-2 text-sm">
                  <div className="flex items-center">
                    <div className="w-4 h-4 rounded-full bg-red-400 mr-2"></div>
                    <span>Roman Sites</span>
                  </div>
                  
                  <div className="flex items-center">
                    <div className="w-4 h-4 rounded-full bg-blue-400 mr-2"></div>
                    <span>Beaches</span>
                  </div>
                  
                  <div className="flex items-center">
                    <div className="w-4 h-4 rounded-full bg-purple-400 mr-2"></div>
                    <span>Group Digs</span>
                  </div>
                  
                  <div className="flex items-center">
                    <div className="w-4 h-4 rounded-full bg-brown-400 mr-2"></div>
                    <span>Other Locations</span>
                  </div>
                  
                  <div className="flex items-center pt-2">
                    <div className="w-4 h-4 rounded-full bg-blue-500 mr-2 border border-white"></div>
                    <span>Your Location</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Map container */}
          <div className="w-full lg:w-3/4">
            <div className="relative bg-white rounded-lg overflow-hidden shadow-md h-[600px]">
              {/* Map loading state */}
              {!mapLoaded && !mapError && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-100 z-10">
                  <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-primary" />
                    <p className="text-lg font-medium">Loading map...</p>
                  </div>
                </div>
              )}
              
              {/* Map error state */}
              {mapError && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-100 z-10">
                  <div className="text-center p-4 max-w-md">
                    <div className="bg-red-100 p-3 rounded-full inline-flex mx-auto mb-3">
                      <X className="h-6 w-6 text-red-600" />
                    </div>
                    <h3 className="text-lg font-bold mb-2">Map Error</h3>
                    <p className="text-sm text-gray-600 mb-4">{mapError}</p>
                    <Button onClick={() => {
                      setMapError(null);
                      mapInitializedRef.current = false;
                      initializeGoogleMap();
                    }}>
                      Retry
                    </Button>
                  </div>
                </div>
              )}
              
              {/* Map messages */}
              {mapMessage && (
                <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 bg-white py-2 px-4 rounded-md shadow-md">
                  <p className="text-sm">{mapMessage}</p>
                </div>
              )}
              
              {/* The actual map container */}
              <div 
                id="map-container" 
                ref={mapRef} 
                className="w-full h-full" 
                style={{ pointerEvents: 'auto', zIndex: 1 }}
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* Add location dialog */}
      <Dialog open={isAddLocationOpen} onOpenChange={setIsAddLocationOpen} modal={false}>
        <DialogContent 
          className="sm:max-w-md max-h-[80vh] overflow-y-auto pointer-events-auto"
          onInteractOutside={(e) => {
            // Prevent dialog from closing when clicking on Select dropdowns or the map
            const target = e.target as HTMLElement;
            if (target.closest('[role="listbox"]') || 
                target.closest('[data-radix-popper-content-wrapper]') ||
                target.closest('#map-container') ||
                mapRef.current?.contains(target) ||
                target.tagName === 'CANVAS') {
              e.preventDefault();
            }
          }}
          onPointerDownOutside={(e) => {
            // Also prevent closing on pointer down outside (for map clicks)
            const target = e.target as HTMLElement;
            if (target.closest('#map-container') ||
                mapRef.current?.contains(target) ||
                target.tagName === 'CANVAS') {
              e.preventDefault();
            }
          }}
        >
          <DialogTitle>Add New Detecting Location</DialogTitle>
          <DialogDescription className="space-y-2">
            <p>Share a detecting location with the community. Provide details to help others find great spots.</p>
            <p className="font-semibold text-blue-600">💡 Tip: Click directly on the map to set your location coordinates!</p>
          </DialogDescription>
          
          <div className="pb-10"> {/* Added padding to ensure save button is visible */}
            <AddLocationForm 
              onSuccess={() => {
                setIsAddLocationOpen(false);
                toast({
                  title: "📍 Location Successfully Added!",
                  description: "Your detecting spot is now on the map and visible to the community. You should see a pin marker at your chosen location.",
                  duration: 5000,
                  className: "bg-green-600 text-white border-green-700 font-semibold"
                });
              }} 
              userPosition={userPosition}
              map={map}
            />
          </div>
        </DialogContent>
      </Dialog>
      
      {/* KML Import dialog */}
      <Dialog open={isKmlImportOpen} onOpenChange={setIsKmlImportOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Import Locations from KML/KMI Files</DialogTitle>
            <DialogDescription>
              Upload KML or KMI files from metal detecting apps like Garrett or other detecting software to import your saved locations.
            </DialogDescription>
          </DialogHeader>
          <KmlImporter 
            onLocationsImported={handleKmlImport}
            onClose={() => setIsKmlImportOpen(false)}
          />
        </DialogContent>
      </Dialog>
      
      {/* Delete location confirmation dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-red-600 flex items-center gap-2">
              <span>⚠️</span> Permanently Delete This Location?
            </DialogTitle>
            <DialogDescription className="text-base space-y-3">
              {deleteLocationId && locations && (
                <>
                  <div className="p-2 bg-gray-100 rounded border border-gray-300">
                    <p className="font-semibold text-gray-900">
                      "{locations.find(loc => loc.id === deleteLocationId)?.name}"
                    </p>
                  </div>
                  <div className="p-3 bg-red-50 border border-red-200 rounded">
                    <p className="font-semibold text-red-900 mb-2">This will permanently delete:</p>
                    <ul className="list-disc list-inside space-y-1 text-red-800 text-sm">
                      <li>The location marker from the map</li>
                      <li>All saved location details and notes</li>
                      <li>This location will be removed for all users</li>
                    </ul>
                  </div>
                  <p className="font-bold text-gray-900">This action CANNOT be undone!</p>
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex justify-end space-x-2 mt-4">
            <Button 
              variant="outline" 
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={deleteMutation.isPending}
              className="font-semibold"
            >
              No, Keep This Location
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleConfirmDelete}
              disabled={deleteMutation.isPending}
              className="bg-red-600 hover:bg-red-700 text-white font-semibold"
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : "Yes, Permanently Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default DetectingMap;