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
              title: "Location Selected",
              description: "Coordinates have been set for your detecting spot.",
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
        title: "Authentication Required",
        description: "Please log in to add a location.",
        variant: "destructive",
      });
      return;
    }

    // Validate coordinates
    if (!data.latitude || !data.longitude) {
      toast({
        title: "Missing Coordinates",
        description: "Please provide both latitude and longitude coordinates.",
        variant: "destructive",
      });
      return;
    }

    // Additional validation for required fields
    if (!data.name) {
      toast({
        title: "Missing Information",
        description: "Please provide a name for this detecting spot.",
        variant: "destructive",
      });
      return;
    }

    if (!data.type) {
      toast({
        title: "Missing Information",
        description: "Please select a location type.",
        variant: "destructive",
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
      });

      let createdLocation;
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to add location');
      } else {
        createdLocation = await response.json();
      }
      
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
        title: "Success!",
        description: "Your detecting spot has been added to the map!",
      });
      
      // Reset form and invalidate queries to refresh data
      form.reset();
      setSelectedPosition(null);
      
      // If there was a temporary marker, remove it
      if (currentMarkerRef.current) {
        currentMarkerRef.current.setMap(null);
        currentMarkerRef.current = null;
      }
      
      queryClient.invalidateQueries({ queryKey: ['/api/locations'] });
      
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
        title: "Error",
        description: error instanceof Error ? error.message : "There was a problem adding your location. Please try again.",
        variant: "destructive",
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
        {!selectedPosition && !hasValidCoordinates() && (
          <div className="bg-amber-50 text-amber-700 p-3 rounded-md text-sm mb-4 flex items-start">
            <MapPin className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
            <div>
              {map ? "Please click on the map to select the location or enter coordinates manually." : "Please enter location coordinates manually."}
            </div>
          </div>
        )}
        
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Spot Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Roman Field, Beach by the Cliffs" {...field} />
              </FormControl>
              <FormMessage />
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
                  <FormLabel>Latitude</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g. 54.093409" 
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
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="longitude"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Longitude</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g. -2.89479" 
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
                  <FormMessage />
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
              <FormLabel>Location Type</FormLabel>
              <Select 
                onValueChange={field.onChange}
                value={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select location type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent position="popper" className="z-[100]">
                  {locationTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
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
              <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <FormLabel className="font-normal cursor-pointer">
                  Share location with other detectorists (unchecked = private, only visible to you)
                </FormLabel>
              </FormItem>
            )}
          />
        </div>
        
        <div className="space-y-4">
          <div className={`p-3 rounded-md text-sm mb-4 ${!selectedPosition && !hasValidCoordinates() ? 'bg-amber-50 text-amber-700' : 'bg-green-50 text-green-700'}`}>
            <p className="font-medium">
              {!selectedPosition && !hasValidCoordinates() ? "Important:" : "Location Information"}
            </p>
            <p>
              {!selectedPosition && !hasValidCoordinates()
                ? "Please either click on the map to select a location or manually enter valid latitude and longitude coordinates."
                : selectedPosition 
                  ? "Location has been selected on the map. You can now save this detecting spot."
                  : "Coordinates have been manually entered. You can now save this detecting spot."}
            </p>
          </div>
          
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
              className="bg-metallic-gold hover:bg-amber-600 text-forest-green font-medium"
              disabled={isSubmitting || (!selectedPosition && !hasValidCoordinates())}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Adding...
                </>
              ) : (
                "Save Location"
              )}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
};

export default AddLocationForm;
