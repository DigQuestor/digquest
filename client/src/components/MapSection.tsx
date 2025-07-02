import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Search, MapPin, Coins, Waves, CheckCircle, Users, Star, AlertCircle, Loader2, ExternalLink, Trash2, Upload } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogFooter, DialogHeader } from "@/components/ui/dialog";
import { Location } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth-simple";
import AddLocationForm from "@/components/map/AddLocationForm";
import { KmlImporter } from "@/components/map/KmlImporter";
import { useToast } from "@/hooks/use-toast";
import { loadGoogleMapsAPI, initializeMap, DEFAULT_CENTER, DEFAULT_ZOOM } from "@/lib/mapService";
import { apiRequest } from "@/lib/queryClient";
import { removeLocationFromLocalStorage, clearAllLocationData } from "@/lib/storageUtils";
import { IndexedBrowser } from "@/components/IndexedBrowser";

// Import fallback map for when Google Maps API is not available
import mapFallbackSvg from "@/assets/map-fallback.svg";

// Temporary placeholder replacement
interface SimpleLocationCardProps {
  location: Location;
}

const SimpleLocationCard = ({ location }: SimpleLocationCardProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  // Create delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest(
        "DELETE", 
        `/api/locations/${id}?userId=${user?.id}`
      );
    },
    onSuccess: () => {
      // Clear ALL localStorage location data to ensure a full refresh
      clearAllLocationData();
      
      // Force the component to re-render by invalidating queries
      queryClient.invalidateQueries({ queryKey: ['/api/locations'] });
      
      // Reload the page to ensure all components update properly
      window.location.reload();
      
      toast({
        title: "Location deleted",
        description: "Location has been successfully deleted.",
      });
      setIsDeleteDialogOpen(false);
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

  const handleDelete = () => {
    deleteMutation.mutate(location.id);
  };

  const isCreator = user && location.userId === user.id;

  return (
    <Card className="p-4 mb-3 bg-sand-beige relative">
      <div className="flex justify-between">
        <h3 className="font-bold text-earth-brown">{location.name}</h3>
        <div className="flex items-center">
          {location.hasPermission && (
            <span className="text-green-600 flex items-center text-sm mr-2">
              <CheckCircle className="h-3 w-3 mr-1" /> Permission
            </span>
          )}
          {isCreator && (
            <button 
              onClick={() => setIsDeleteDialogOpen(true)}
              className="text-red-500 hover:text-red-700 transition-colors"
              title="Delete location"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
      <p className="text-sm text-forest-green mt-2">{location.description || 'No description available'}</p>
      <div className="mt-3 text-xs text-gray-500 flex justify-between items-center">
        <div>Coordinates: {location.latitude}, {location.longitude}</div>
        <Link 
          href={`/map?lat=${location.latitude}&lng=${location.longitude}`} 
          className="text-forest-green hover:text-earth-brown transition-colors flex items-center ml-2"
          title="View on map"
        >
          <ExternalLink className="h-4 w-4 mr-1" />
          <span className="text-xs font-medium">View on map</span>
        </Link>
      </div>

      {/* Delete confirmation dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Location</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the location "{location.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex justify-end space-x-2 mt-4">
            <Button 
              variant="outline" 
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={deleteMutation.isPending}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

const MapSection = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [markers, setMarkers] = useState<google.maps.Marker[]>([]);
  const [locationSearch, setLocationSearch] = useState("");
  const [isAddLocationOpen, setIsAddLocationOpen] = useState(false);
  const [isKmlImportOpen, setIsKmlImportOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [mapMessage, setMapMessage] = useState<string | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [initAttempts, setInitAttempts] = useState(0);
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Get locations from API (filtered by privacy settings)
  const { data: apiLocations = [], isLoading } = useQuery<Location[]>({
    queryKey: ['/api/locations', user?.id],
    queryFn: async () => {
      const url = user?.id ? `/api/locations?userId=${user.id}` : '/api/locations';
      console.log(`Fetching locations with URL: ${url}`);
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch locations');
      const data = await response.json();
      console.log(`Received ${data.length} locations from API`);
      return data;
    },
    enabled: !authLoading && !!user, // Only fetch when user is authenticated
  });
  
  // Get finds from API for the indexed browser
  const { data: finds = [] } = useQuery({
    queryKey: ['/api/finds'],
  });
  
  // Use API locations directly for reliable display
  const locations = apiLocations;

  // Initialize Google Maps with more robust error handling
  const initializeGoogleMap = useCallback(async () => {
    if (!mapRef.current) return;
    
    // Clear any previous errors
    setMapError(null);
    
    try {
      // Load Google Maps API if not already loaded
      await loadGoogleMapsAPI();
      
      // Set a slight delay to ensure API is fully loaded
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Mark as loaded
      setMapLoaded(true);
      
      // Use our improved map initialization function with built-in error handling
      const googleMap = initializeMap(mapRef.current, {
        center: DEFAULT_CENTER,
        zoom: DEFAULT_ZOOM
      });
      
      // Store the map reference
      setMap(googleMap);
      console.log('Google Map initialized successfully');
    } catch (error) {
      console.error('Error initializing Google Maps:', error);
      
      // Get detailed error message
      let errorMessage = 'Error initializing the map';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      setMapError(errorMessage);
      setMapLoaded(false);
      
      // Retry initialization if less than 3 attempts
      if (initAttempts < 3) {
        console.log(`Retrying map initialization (attempt ${initAttempts + 1})`);
        setInitAttempts(prev => prev + 1);
        setTimeout(() => initializeGoogleMap(), 1000);
      }
    }
  }, [initAttempts]);

  // Helper function to fetch finds with photos at specific coordinates
  const fetchRelatedFinds = async (latitude: string, longitude: string) => {
    try {
      const response = await fetch(`/api/finds?lat=${latitude}&lng=${longitude}`);
      if (response.ok) {
        const finds = await response.json();
        return finds.filter((find: any) => find.image_url);
      }
    } catch (error) {
      console.error('Error fetching related finds:', error);
    }
    return [];
  };

  // Helper function to create enhanced info window content with photos
  const createEnhancedInfoWindow = (location: Location, relatedFinds: any[]) => {
    const hasPhotos = relatedFinds.length > 0;
    
    return `
      <div class="p-3 max-w-xs">
        <h3 class="font-semibold text-base text-gray-800 mb-2">${location.name}</h3>
        
        ${location.description ? `
          <p class="text-sm text-gray-600 mb-2 leading-relaxed">${location.description}</p>
        ` : ''}
        
        <div class="flex items-center gap-2 mb-2">
          <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            ${location.type || 'General Location'}
          </span>
          ${location.hasPermission ? `
            <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
              Permission Granted
            </span>
          ` : ''}
        </div>
        
        ${hasPhotos ? `
          <div class="mt-3">
            <h4 class="text-sm font-medium text-gray-700 mb-2">Recent Finds Here:</h4>
            <div class="space-y-2">
              ${relatedFinds.slice(0, 2).map(find => `
                <div class="border rounded-lg p-2 bg-gray-50">
                  ${find.image_url ? `
                    <img src="${find.image_url}" alt="${find.title}" 
                         class="w-full h-24 object-cover rounded mb-2">
                  ` : ''}
                  <h5 class="text-xs font-medium text-gray-800">${find.title}</h5>
                  ${find.description ? `
                    <p class="text-xs text-gray-600 mt-1">${find.description.substring(0, 80)}${find.description.length > 80 ? '...' : ''}</p>
                  ` : ''}
                </div>
              `).join('')}
              ${relatedFinds.length > 2 ? `
                <p class="text-xs text-gray-500 text-center">
                  +${relatedFinds.length - 2} more finds at this location
                </p>
              ` : ''}
            </div>
          </div>
        ` : `
          <p class="text-xs text-gray-500 mt-2 italic">No finds with photos reported at this location yet.</p>
        `}
        
        <div class="mt-3 pt-2 border-t border-gray-200">
          <p class="text-xs text-gray-400">
            Coordinates: ${parseFloat(location.latitude).toFixed(6)}, ${parseFloat(location.longitude).toFixed(6)}
          </p>
        </div>
      </div>
    `;
  };

  // Add markers for metal detecting locations
  const addLocationMarkers = useCallback(() => {
    if (!map || !locations?.length) return;
    
    try {
      // Clear existing markers
      markers.forEach(marker => marker.setMap(null));
      
      // Create new markers array
      const newMarkers: google.maps.Marker[] = [];
      
      // Filter locations based on active filter
      const filteredLocations = activeFilter ? locations.filter(location => {
        switch (activeFilter) {
          case 'Roman Sites': return location.type === 'Roman Site';
          case 'Beaches': return location.type === 'Beach';
          case 'Permission Granted': return location.hasPermission === true;
          case 'Group Digs': return location.isGroupDig === true;
          default: return true;
        }
      }) : locations;
      
      // Add markers for each location
      filteredLocations.forEach(location => {
        // Skip locations without coordinates
        if (!location.latitude || !location.longitude) return;
        
        // Create position from coordinates
        const position = {
          lat: parseFloat(location.latitude),
          lng: parseFloat(location.longitude)
        };
        
        // Create marker
        const marker = new google.maps.Marker({
          position,
          map,
          title: location.name,
        });
        
        // Add click listener for location info with enhanced content
        marker.addListener('click', () => {
          // Create enhanced info window with location details
          const infoWindow = new google.maps.InfoWindow({
            content: createEnhancedInfoWindow(location, [])
          });
          infoWindow.open(map, marker);
        });
        
        // Add marker to array
        newMarkers.push(marker);
      });
      
      // Update markers state
      setMarkers(newMarkers);
    } catch (error) {
      console.error('Error adding map markers:', error);
    }
  // Remove markers from dependency array since it can cause circular updates
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, locations, activeFilter]);

  // Initialize the map when component mounts - only once on first render
  useEffect(() => {
    initializeGoogleMap();
    
    // Clean up function
    return () => {
      // Clear all markers when component unmounts
      markers.forEach(marker => marker?.setMap(null));
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  // Add location markers when map is initialized and locations are loaded
  useEffect(() => {
    if (map && locations && locations.length > 0) {
      addLocationMarkers();
    }
  // Remove addLocationMarkers from the dependency array since it references map, locations and activeFilter already
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, locations, activeFilter]);
  
  // Clear any stale location data when component loads and api returns no locations
  useEffect(() => {
    if (apiLocations && apiLocations.length === 0) {
      clearAllLocationData();
      console.log("MapSection: No locations found in API response, cleared localStorage data");
    }
  }, [apiLocations]);

  // Filter locations based on active filter
  const filteredLocations = locations.filter(location => {
    if (activeFilter === null) return true;
    
    switch (activeFilter) {
      case 'Roman Sites':
        return location.type === 'Roman Site';
      case 'Beaches':
        return location.type === 'Beach';
      case 'Permission Granted':
        return location.hasPermission === true;
      case 'Group Digs':
        return location.isGroupDig === true;
      default:
        return true;
    }
  });

  // Handle filter button clicks
  const handleFilter = (filter: string) => {
    setActiveFilter(activeFilter === filter ? null : filter);
  };
  
  // Handle search functionality
  const handleSearchLocation = () => {
    if (!map || !locationSearch.trim()) return;
    
    try {
      // Create a geocoder instance
      const geocoder = new google.maps.Geocoder();
      
      // Geocode the address
      geocoder.geocode({ 'address': locationSearch }, (
        results: any,
        status: any
      ) => {
        if (status === 'OK' && results && results.length > 0) {
          // Get first result location
          const location = results[0].geometry.location;
          
          // Center map on the result
          map.setCenter(location);
          map.setZoom(12); // Zoom in to show the area
          
          // Scroll to top of page when location is found
          window.scrollTo({ top: 0, behavior: 'smooth' });
          
          // Create a simple marker for the search result (no popup)
          const marker = new google.maps.Marker({
            position: location,
            map: map,
            title: results[0].formatted_address,
            animation: google.maps.Animation.DROP,
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              fillColor: '#4285F4',
              fillOpacity: 0.8,
              strokeWeight: 1,
              strokeColor: '#FFFFFF',
              scale: 8
            }
          });
          
          // Clear the marker after 5 seconds (no popup)
          setTimeout(() => {
            marker.setMap(null);
          }, 5000);
        } else {
          toast({
            title: "Search Error",
            description: "Could not find that location. Please try a different search.",
            variant: "destructive",
          });
        }
      });
    } catch (error) {
      console.error("Error searching location:", error);
      toast({
        title: "Search Error",
        description: "There was a problem with the search. Please try again.",
        variant: "destructive",
      });
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

  // Function to handle retry
  const handleRetryMap = () => {
    setInitAttempts(0);
    setMapError(null);
    initializeGoogleMap();
  };

  return (
    <section className="mb-6 md:mb-12">
      <div className="flex flex-col gap-4 mb-4 md:mb-6">
        <h2 className="font-display text-xl md:text-3xl text-earth-brown">Detecting Map</h2>
        
        {/* Search row */}
        <div className="flex gap-2">
          <div className="relative flex flex-1">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-3 h-4 w-4 text-earth-brown" />
              <Input
                type="text"
                placeholder="Search locations..."
                className="bg-white text-forest-green pl-10 w-full shadow-sm rounded-r-none mobile-button"
                value={locationSearch}
                onChange={(e) => setLocationSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearchLocation()}
              />
            </div>
            <Button 
              className="bg-earth-brown hover:bg-amber-800 text-sand-beige h-10 rounded-l-none flex-shrink-0"
              onClick={handleSearchLocation}
              disabled={!locationSearch.trim()}
            >
              Search
            </Button>
          </div>
        </div>
        
        {/* Action buttons row */}
        <div className="flex flex-col sm:flex-row gap-2">
          <Button 
            className="bg-amber-600 hover:bg-amber-700 text-sand-beige transition duration-300 flex items-center justify-center mobile-button"
            onClick={() => setIsKmlImportOpen(true)}
            disabled={!user}
          >
            <Upload className="h-4 w-4 mr-2" /> 
            <span className="hidden sm:inline">Import .kml/.kmi Files</span>
            <span className="sm:hidden">Import Files</span>
          </Button>
          <Button 
            className="bg-forest-green hover:bg-green-900 text-sand-beige transition duration-300 flex items-center justify-center mobile-button"
            onClick={() => setIsAddLocationOpen(true)}
            disabled={!user}
          >
            <MapPin className="h-4 w-4 mr-2" /> Add New Spot
          </Button>
        </div>
      </div>
      
      <Card className="overflow-hidden shadow-xl">
        <div className="relative">
          {mapError ? (
            // Fallback map when Google Maps fails to load
            <div className="relative h-[250px] md:h-[400px] bg-gray-200 flex items-center justify-center">
              <img 
                src={mapFallbackSvg} 
                alt="Map Fallback" 
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center p-4 md:p-6 max-w-sm md:max-w-md bg-white bg-opacity-80 rounded-lg mx-4">
                  <AlertCircle className="mx-auto h-8 w-8 md:h-12 md:w-12 text-amber-500 mb-3" />
                  <h3 className="text-lg md:text-xl font-display text-earth-brown mb-2">Map Loading Issue</h3>
                  <p className="text-sm md:text-base text-gray-600 mb-4">
                    The map couldn't be loaded, but you can still add locations.
                  </p>
                  <Button
                    onClick={handleRetryMap}
                    className="bg-forest-green hover:bg-green-900 text-sand-beige mobile-button"
                  >
                    Retry Loading
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            // Regular Google Maps display
            <>
              <div ref={mapRef} className="h-[250px] md:h-[400px] bg-gray-200 map-container" />
              {(isLoading || !mapLoaded) && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-200 bg-opacity-60">
                  <div className="text-center p-4 md:p-6">
                    <div className="animate-spin rounded-full h-8 w-8 md:h-10 md:w-10 border-t-2 border-b-2 border-earth-brown mx-auto mb-3"></div>
                    <p className="text-sm md:text-base">{isLoading ? "Loading locations..." : "Loading map..."}</p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
        

      </Card>



      <Dialog open={isAddLocationOpen} onOpenChange={setIsAddLocationOpen}>
        <DialogContent className="max-w-xl max-h-[85vh]">
          <DialogTitle>Add Detecting Location</DialogTitle>
          <DialogDescription>
            Share a new metal detecting spot with the community.
            {!mapError && " Click on the map to select the location for your detecting spot."}
          </DialogDescription>
          
          <div className="overflow-y-auto pr-1" style={{ maxHeight: 'calc(85vh - 180px)' }}>
            {(!mapLoaded && !mapError) ? (
              <div className="py-4 px-2 text-center">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-earth-brown mx-auto mb-3"></div>
                <p className="text-amber-600 mb-4">
                  Map is loading. You can still proceed with adding a location.
                </p>
              </div>
            ) : mapError ? (
              <div className="mb-4 p-3 rounded-md bg-amber-50 text-amber-800 text-sm">
                <p className="font-medium mb-1">Map Issue Detected</p>
                <p className="mb-2">The map couldn't be loaded due to a configuration issue. You can still add locations by manually entering coordinates.</p>
                <Button
                  onClick={handleRetryMap}
                  className="bg-forest-green hover:bg-green-900 text-sand-beige mr-2 text-sm"
                  size="sm"
                >
                  Retry Loading Map
                </Button>
              </div>
            ) : (
              <div className="mb-4 p-3 rounded-md bg-amber-50 text-amber-800 text-sm">
                <p className="font-medium mb-1">How to add a detecting spot:</p>
                <ol className="list-decimal ml-4 space-y-1">
                  <li>Click anywhere on the map to set the location</li>
                  <li>Fill in the details about your detecting spot</li>
                  <li>Click "Save Location" to add it to the map</li>
                </ol>
              </div>
            )}
            
            <AddLocationForm 
              map={null} // Pass null to avoid Google Maps errors
              onLocationAdded={() => {
                setIsAddLocationOpen(false);
                toast({
                  title: "Success!",
                  description: "Your detecting spot has been added to the map.",
                });
              }}
            />
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isKmlImportOpen} onOpenChange={setIsKmlImportOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Import Locations</DialogTitle>
            <DialogDescription>
              Upload a KML file from your metal detecting software to import saved locations.
            </DialogDescription>
          </DialogHeader>
          
          <KmlImporter 
            onLocationsImported={handleKmlImport}
            onClose={() => setIsKmlImportOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default MapSection;