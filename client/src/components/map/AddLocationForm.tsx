import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, MapPin } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth-simple";
import { useQueryClient } from "@tanstack/react-query";

// Form schema for location
const locationFormSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters").max(100, "Name cannot exceed 100 characters"),
  description: z.string().optional(),
  latitude: z.string().min(1, "Latitude is required"),
  longitude: z.string().min(1, "Longitude is required"),
  type: z.string().min(1, "Type is required"),
  hasPermission: z.boolean().default(false),
  isGroupDig: z.boolean().default(false),
  isShared: z.boolean().default(false),
});

type LocationFormValues = z.infer<typeof locationFormSchema>;

// Location types for the select dropdown
const locationTypes = [
  "Roman Site",
  "Beach",
  "Field",
  "Woodland",
  "Park",
  "Farmland",
  "Historical Site",
  "Other"
];

interface AddLocationFormProps {
  onLocationAdded?: () => void;
  onSuccess?: () => void;
  map?: google.maps.Map | null;
  userPosition?: {lat: number, lng: number} | null;
}

const AddLocationForm = ({ onLocationAdded, onSuccess, map, userPosition }: AddLocationFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [manualCoordinatesEntered, setManualCoordinatesEntered] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState<google.maps.LatLng | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const currentMarkerRef = useRef<google.maps.Marker | null>(null);

  const form = useForm<LocationFormValues>({
    resolver: zodResolver(locationFormSchema),
    defaultValues: {
      name: "",
      description: "",
      latitude: "",
      longitude: "",
      type: "",
      hasPermission: false,
      isGroupDig: false,
      isShared: false,
    },
  });

  // Update form when map is clicked to set coordinates or manual entry
  // Pre-fill coordinates if userPosition is provided
  useEffect(() => {
    if (userPosition && !form.getValues("latitude") && !form.getValues("longitude")) {
      form.setValue("latitude", userPosition.lat.toString());
      form.setValue("longitude", userPosition.lng.toString());
      
      toast({
        title: "Coordinates Set",
        description: "Using your current location. You can click elsewhere on the map to change."
      });
    }
  }, [userPosition, form, toast]);

  // Setup map click handlers
  useEffect(() => {
    if (!map) return;

    let clickListener: google.maps.MapsEventListener | null = null;
    
    try {
      // Add click listener to map
      clickListener = map.addListener("click", (e: google.maps.MapMouseEvent) => {
        if (e.latLng) {
          try {
            // Clear any existing marker
            if (currentMarkerRef.current) {
              currentMarkerRef.current.setMap(null);
            }
            
            setSelectedPosition(e.latLng);
            
            // Update form values with coordinates
            form.setValue("latitude", e.latLng.lat().toString());
            form.setValue("longitude", e.latLng.lng().toString());
            
            // Show a temporary marker at the clicked position
            try {
              const marker = new google.maps.Marker({
                position: e.latLng,
                map,
                title: "Selected Location",
                animation: google.maps.Animation.DROP,
                icon: {
                  path: google.maps.SymbolPath.CIRCLE,
                  fillColor: '#CD5C5C',
                  fillOpacity: 1,
                  strokeWeight: 0,
                  scale: 8
                }
              });
              
              // Keep reference to current marker for later cleanup
              currentMarkerRef.current = marker;
            } catch (markerError) {
              console.error("Error creating marker:", markerError);
              // Continue without a marker if it fails
            }
            
            toast({
              title: "✅ Coordinates Set!",
              description: `Location: ${e.latLng.lat().toFixed(6)}, ${e.latLng.lng().toFixed(6)}`,
              className: "bg-green-600 text-white border-green-700 font-semibold",
              duration: 3000,
            });
          } catch (error) {
            console.error("Error handling map click:", error);
            toast({
              title: "Warning",
              description: "There was an issue selecting the location. Try entering coordinates manually.",
              variant: "destructive",
            });
          }
        }
      });
    } catch (listenerError) {
      console.error("Error setting up map click listener:", listenerError);
    }

    // Clean up listener when component unmounts
    return () => {
      try {
        if (clickListener) {
          google.maps.event.removeListener(clickListener);
        }
        
        // Clear marker when component unmounts
        if (currentMarkerRef.current) {
          currentMarkerRef.current.setMap(null);
        }
      } catch (cleanupError) {
        console.error("Error cleaning up map resources:", cleanupError);
      }
    };
  }, [map, form, toast]);

  const onSubmit = async (data: LocationFormValues) => {
    if (!user) {
      toast({
        title: "❌ Authentication Required",
        description: "Please log in to add a location.",
        variant: "destructive",
        className: "bg-red-600 text-white border-red-700 font-bold text-lg",
        duration: 6000,
      });
      return;
    }

    // Validate coordinates
    if (!data.latitude || !data.longitude) {
      toast({
        title: "⚠️ Missing Coordinates",
        description: "You must click on the map or enter latitude and longitude coordinates manually.",
        variant: "destructive",
        className: "bg-red-600 text-white border-red-700 font-bold text-lg",
        duration: 6000,
      });
      return;
    }

    // Additional validation for required fields
    if (!data.name) {
      toast({
        title: "⚠️ Missing Spot Name",
        description: "Please enter a name for this detecting spot.",
        variant: "destructive",
        className: "bg-red-600 text-white border-red-700 font-bold text-lg",
        duration: 6000,
      });
      return;
    }

    if (!data.type) {
      toast({
        title: "⚠️ Missing Location Type",
        description: "Please select a location type from the dropdown.",
        variant: "destructive",
        className: "bg-red-600 text-white border-red-700 font-bold text-lg",
        duration: 6000,
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Include user ID in the submission and ensure proper null handling
      const locationData = {
        name: data.name,
        description: data.description || null,
        latitude: data.latitude,
        longitude: data.longitude,
        type: data.type || null, 
        hasPermission: data.hasPermission || false,
        isGroupDig: data.isGroupDig || false,
        isShared: data.isShared || false,
        userId: user.id,
      };

      console.log("Submitting location data:", locationData);
      
      // Use direct fetch for more control over the request
      const response = await fetch('/api/locations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(locationData),
        credentials: 'include', // Important: send session cookies
      });

      let createdLocation;
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        
        console.error("❌ Location save failed:", response.status, errorData);
        
        // Handle authentication errors specifically
        if (response.status === 401) {
          toast({
            title: "⚠️ Authentication Error",
            description: errorData.message || "Please log in to add a location.",
            variant: "destructive",
            duration: 4000,
          });
          // Trigger auth state refresh
          window.dispatchEvent(new Event('auth-changed'));
          setIsSubmitting(false);
          return;
        }
        
        // Show detailed error message
        toast({
          title: "❌ Failed to Save Location",
          description: errorData.message || `Server error: ${response.status}`,
          variant: "destructive",
          duration: 8000,
          className: "bg-red-600 text-white border-red-700 font-bold"
        });
        
        setIsSubmitting(false);
        throw new Error(errorData.message || 'Failed to add location');
      }
      
      createdLocation = await response.json();
      
      // Log the created location
      if (createdLocation) {
        console.log("Created location:", createdLocation);
        
        // Also save to localStorage for both map components to use
        // First, get existing locations from both storage keys
        const mapLocations = JSON.parse(localStorage.getItem('map_locations') || '[]');
        const detectingMapLocations = JSON.parse(localStorage.getItem('detectingMapLocations') || '[]');
        
        // Add the new location to both storage arrays
        mapLocations.push(createdLocation);
        detectingMapLocations.push(createdLocation);
        
        // Save back to localStorage with both keys
        localStorage.setItem('map_locations', JSON.stringify(mapLocations));
        localStorage.setItem('detectingMapLocations', JSON.stringify(detectingMapLocations));
        console.log("Saved location to both localStorage keys for cross-page visibility");
      } else {
        console.warn("No location data returned from server");
      }
      
      toast({
        title: "✅ Success!",
        description: "Your detecting spot has been added to the map! You should see a pin marker appear.",
        duration: 5000,
        className: "bg-green-600 text-white border-green-700 font-bold text-lg"
      });
      
      // Reset form and invalidate queries to refresh data
      form.reset();
      setSelectedPosition(null);
      
      // If there was a temporary marker, remove it
      if (currentMarkerRef.current) {
        currentMarkerRef.current.setMap(null);
        currentMarkerRef.current = null;
      }
      
      // Invalidate ALL location queries (including those with userId parameter)
      console.log("🔄 Invalidating all location queries...");
      await queryClient.invalidateQueries({ 
        predicate: (query) => {
          // Invalidate any query that starts with '/api/locations'
          return Array.isArray(query.queryKey) && 
                 query.queryKey.length > 0 && 
                 query.queryKey[0] === '/api/locations';
        }
      });
      
      // Force refetch to ensure markers update immediately
      console.log("✅ Refetching location queries...");
      await queryClient.refetchQueries({ 
        predicate: (query) => {
          return Array.isArray(query.queryKey) && 
                 query.queryKey.length > 0 && 
                 query.queryKey[0] === '/api/locations';
        }
      });
      
      // Small delay to ensure map updates before closing dialog
      await new Promise(resolve => setTimeout(resolve, 300));
      
      console.log("🎉 Location added and markers should now be visible!");
      
      // Call either of the success callbacks provided
      if (onLocationAdded) {
        onLocationAdded();
      }
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Error submitting location:", error);
      toast({
        title: "❌ Error Adding Location",
        description: error instanceof Error ? error.message : "There was a problem adding your location. Please try again.",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Check if form has valid latitude and longitude
  const hasValidCoordinates = () => {
    const lat = form.getValues("latitude");
    const lng = form.getValues("longitude");
    return lat && lng && lat.trim() !== "" && lng.trim() !== "";
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {!isSubmitting && !selectedPosition && !hasValidCoordinates() && (
          <div className="bg-blue-50 border-2 border-blue-400 text-blue-800 p-4 rounded-md text-sm mb-4 flex items-start">
            <MapPin className="h-6 w-6 mr-3 flex-shrink-0 mt-0.5 text-blue-600" />
            <div>
              <p className="font-bold text-base mb-1">📍 Set Location Coordinates</p>
              {map ? (
                <p><strong>Click anywhere on the map</strong> to set the pin location, or enter coordinates manually below.</p>
              ) : (
                <p>Map is loading... You can enter coordinates manually below while you wait.</p>
              )}
            </div>
          </div>
        )}
        
        {!isSubmitting && selectedPosition && (
          <div className="bg-green-50 border-2 border-green-400 text-green-800 p-3 rounded-md text-sm mb-4 flex items-center">
            <MapPin className="h-5 w-5 mr-2 flex-shrink-0 text-green-600" />
            <p className="font-semibold">✅ Location coordinates set! You can click the map again to change it.</p>
          </div>
        )}
        
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-base font-bold">Spot Name <span className="text-red-600">*</span></FormLabel>
              <FormControl>
                <Input 
                  placeholder="e.g. Roman Field, Beach by the Cliffs" 
                  className="border-2"
                  {...field} 
                />
              </FormControl>
              <FormMessage className="font-bold text-red-600" />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Describe this detecting location... What type of finds might be here? Any access details?" 
                  className="min-h-20" 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="space-y-2">
          <div className="text-sm text-amber-700 bg-amber-50 p-3 rounded-md mb-2">
            <p className="font-medium mb-1">About Location Coordinates:</p>
            {map ? (
              <p>You can click on the map to set coordinates or enter them manually below.</p>
            ) : (
              <p>Map is currently unavailable. You can manually enter coordinates below.</p>
            )}
            <p className="text-xs mt-1">
              Find coordinates on Google Maps by right-clicking a location and selecting "What's here?"
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="latitude"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-bold">Latitude <span className="text-red-600">*</span></FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g. 54.093409" 
                      className="border-2"
                      {...field} 
                      onChange={(e) => {
                        field.onChange(e);
                        if (selectedPosition) {
                          // Clear selected position if user manually edits
                          setSelectedPosition(null);
                          if (currentMarkerRef.current) {
                            try {
                              currentMarkerRef.current.setMap(null);
                              currentMarkerRef.current = null;
                            } catch (error) {
                              console.error("Error removing marker:", error);
                            }
                          }
                        }
                        // Force form validation update when coordinates change
                        form.trigger("latitude");
                        form.trigger("longitude");
                      }}
                    />
                  </FormControl>
                  <FormMessage className="font-bold text-red-600" />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="longitude"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-bold">Longitude <span className="text-red-600">*</span></FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g. -2.89479" 
                      className="border-2" 
                      {...field} 
                      onChange={(e) => {
                        field.onChange(e);
                        if (selectedPosition) {
                          // Clear selected position if user manually edits
                          setSelectedPosition(null);
                          if (currentMarkerRef.current) {
                            try {
                              currentMarkerRef.current.setMap(null);
                              currentMarkerRef.current = null;
                            } catch (error) {
                              console.error("Error removing marker:", error);
                            }
                          }
                        }
                        // Force form validation update when coordinates change
                        form.trigger("latitude");
                        form.trigger("longitude");
                      }}
                    />
                  </FormControl>
                  <FormMessage className="font-bold text-red-600" />
                </FormItem>
              )}
            />
          </div>
        </div>
        
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-base font-bold">Location Type <span className="text-red-600">*</span></FormLabel>
              <Select 
                onValueChange={field.onChange}
                value={field.value}
              >
                <FormControl>
                  <SelectTrigger className="border-2">
                    <SelectValue placeholder="⬇️ Click here to select type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent 
                  position="popper" 
                  className="z-[100] bg-white"
                  onInteractOutside={(e) => e.preventDefault()}
                >
                  {locationTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage className="font-bold text-red-600" />
            </FormItem>
          )}
        />
        
        <div className="space-y-2">
          <FormField
            control={form.control}
            name="hasPermission"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <FormLabel className="font-normal cursor-pointer">
                  I have permission to detect at this location
                </FormLabel>
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="isGroupDig"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <FormLabel className="font-normal cursor-pointer">
                  This is a group dig site (open to community members)
                </FormLabel>
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="isShared"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 bg-blue-50">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel className="font-semibold cursor-pointer text-base">
                    🌍 Share this location with the community
                  </FormLabel>
                  <p className="text-sm text-gray-600">
                    <strong>Unchecked (default):</strong> Private - only you can see this location<br/>
                    <strong>Checked:</strong> Public - visible to all detectorists on the map
                  </p>
                </div>
              </FormItem>
            )}
          />
        </div>
        
        <div className="space-y-4">
          {!isSubmitting && (
            <div className={`p-4 rounded-lg border-2 mb-4 ${!selectedPosition && !hasValidCoordinates() ? 'bg-red-50 text-red-800 border-red-300' : 'bg-green-50 text-green-800 border-green-300'}`}>
              <p className="font-bold text-lg mb-2">
                {!selectedPosition && !hasValidCoordinates() ? "⚠️ Coordinates Required!" : "✅ Ready to Save!"}
              </p>
              <p className="font-medium">
                {!selectedPosition && !hasValidCoordinates()
                  ? "To save this location, you MUST: 1) Click on the map where you want to place the pin, OR 2) Manually type latitude and longitude numbers in the boxes above."
                  : selectedPosition 
                    ? "✓ Location selected on map. The Save Location button is now active!"
                    : "✓ Coordinates entered manually. The Save Location button is now active!"}
              </p>
            </div>
          )}
          
          <div className="flex justify-between">
            <Button 
              type="button" 
              variant="outline"
              onClick={() => {
                if (currentMarkerRef.current) {
                  currentMarkerRef.current.setMap(null);
                }
                setSelectedPosition(null);
                form.setValue("latitude", "");
                form.setValue("longitude", "");
              }}
              disabled={!selectedPosition && !hasValidCoordinates()}
              className="border-gray-300 text-gray-600"
            >
              Clear Location
            </Button>
            
            <Button 
              type="submit" 
              className={`font-bold text-base ${
                isSubmitting || (!selectedPosition && !hasValidCoordinates())
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700 text-white animate-pulse'
              }`}
              disabled={isSubmitting || (!selectedPosition && !hasValidCoordinates())}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Adding Location...
                </>
              ) : (!selectedPosition && !hasValidCoordinates()) ? (
                "❌ Save Disabled - Add Coordinates First"
              ) : (
                "💾 Save Location to Map"
              )}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
};

export default AddLocationForm;
