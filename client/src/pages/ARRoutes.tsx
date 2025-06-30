import { useState, useEffect, useRef } from "react";
import { Helmet } from "react-helmet";
import { Camera, MapPin, Navigation, Settings, Compass, Target, Route } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

const ARRoutes = () => {
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [cameraActive, setCameraActive] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [deviceOrientation, setDeviceOrientation] = useState({ alpha: 0, beta: 0, gamma: 0 });
  const [userLocation, setUserLocation] = useState<{ lat: number, lng: number } | null>(null);
  const [nearbyRoutes, setNearbyRoutes] = useState<any[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<any | null>(null);
  const [showPreferences, setShowPreferences] = useState(false);

  // Sample nearby routes (in real app, this would come from API based on user location)
  const sampleRoutes = [
    {
      id: 1,
      name: "Ancient Roman Path",
      distance: 250,
      direction: 45,
      difficulty: "easy",
      estimatedDuration: 90,
      terrainType: "field",
      historicalPeriods: ["Roman", "Medieval"],
      description: "Historical detecting route through Roman settlement area with high potential for coin finds."
    },
    {
      id: 2,
      name: "Victorian Village Circuit",
      distance: 180,
      direction: 120,
      difficulty: "moderate", 
      estimatedDuration: 120,
      terrainType: "mixed",
      historicalPeriods: ["Victorian", "Georgian"],
      description: "Loop route through old village boundaries, excellent for Victorian artifacts and buttons."
    },
    {
      id: 3,
      name: "Medieval Market Route",
      distance: 400,
      direction: 290,
      difficulty: "challenging",
      estimatedDuration: 180,
      terrainType: "woodland",
      historicalPeriods: ["Medieval", "Saxon"],
      description: "Historic market town approach with documented finds of medieval coins and jewelry."
    }
  ];

  // Request camera access
  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play();
      }
      
      setStream(mediaStream);
      setCameraActive(true);
      
      toast({
        title: "Camera activated!",
        description: "Point your camera around to see detecting route overlays.",
      });
    } catch (error) {
      console.error('Error accessing camera:', error);
      toast({
        title: "Camera access required",
        description: "Please allow camera access to use AR route recommendations.",
        variant: "destructive"
      });
    }
  };

  // Stop camera
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setCameraActive(false);
  };

  // Get user location
  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          setNearbyRoutes(sampleRoutes);
          toast({
            title: "Location found!",
            description: "Loading personalized routes for your area.",
          });
        },
        (error) => {
          console.error('Geolocation error:', error);
          toast({
            title: "Location needed",
            description: "Please enable location services for personalized route recommendations.",
            variant: "destructive"
          });
        }
      );
    }
  };

  // Handle device orientation for AR
  useEffect(() => {
    const handleOrientation = (event: DeviceOrientationEvent) => {
      setDeviceOrientation({
        alpha: event.alpha || 0,
        beta: event.beta || 0,
        gamma: event.gamma || 0
      });
    };

    if (typeof DeviceOrientationEvent !== 'undefined' && typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
      // iOS 13+ requires permission
      (DeviceOrientationEvent as any).requestPermission()
        .then((response: string) => {
          if (response === 'granted') {
            window.addEventListener('deviceorientation', handleOrientation);
          }
        });
    } else {
      // Android and older iOS
      window.addEventListener('deviceorientation', handleOrientation);
    }

    return () => {
      window.removeEventListener('deviceorientation', handleOrientation);
    };
  }, []);

  // Calculate route overlay position based on direction and device orientation
  const getRouteOverlayStyle = (route: any) => {
    const relativeDirection = route.direction - deviceOrientation.alpha;
    const normalizedDirection = ((relativeDirection % 360) + 360) % 360;
    
    // Convert to screen position (simplified)
    const screenX = (normalizedDirection / 360) * 100;
    const distanceOpacity = Math.max(0.3, 1 - (route.distance / 1000));
    
    return {
      left: `${screenX}%`,
      opacity: distanceOpacity,
      transform: `translateX(-50%)`,
    };
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-500';
      case 'moderate': return 'bg-yellow-500';  
      case 'challenging': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <>
      <Helmet>
        <title>AR Route Recommendations | Personalized Detecting Routes</title>
        <meta name="description" content="Use augmented reality to discover personalized metal detecting routes based on your preferences and location." />
        <link rel="canonical" href="https://digquest.org/ar-routes" />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-forest-green to-earth-brown">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-sand-beige mb-4">
              AR Route Recommendations
            </h1>
            <p className="text-sand-beige/90 text-lg max-w-2xl mx-auto">
              Discover personalized detecting routes with augmented reality overlays showing directions, 
              difficulty levels, and historical significance right through your camera!
            </p>
          </div>

          {!cameraActive ? (
            // Setup screen
            <div className="space-y-6">
              <Card className="max-w-md mx-auto">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Camera className="h-5 w-5" />
                    Start AR Experience
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-gray-600">
                    Enable camera and location access to see personalized route recommendations 
                    overlaid on your surroundings.
                  </p>
                  
                  <div className="space-y-3">
                    <Button 
                      onClick={getUserLocation}
                      className="w-full bg-earth-brown hover:bg-amber-800"
                      disabled={!!userLocation}
                    >
                      <MapPin className="h-4 w-4 mr-2" />
                      {userLocation ? "Location Found" : "Enable Location"}
                    </Button>
                    
                    <Button 
                      onClick={startCamera}
                      className="w-full bg-forest-green hover:bg-green-900"
                      disabled={!userLocation}
                    >
                      <Camera className="h-4 w-4 mr-2" />
                      Start AR Camera
                    </Button>
                  </div>

                  <Button
                    variant="outline"
                    onClick={() => setShowPreferences(true)}
                    className="w-full"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Customize Preferences
                  </Button>
                </CardContent>
              </Card>

              {/* Route Preview Cards */}
              {nearbyRoutes.length > 0 && (
                <div className="space-y-4">
                  <h2 className="text-2xl font-bold text-sand-beige text-center">
                    Routes Near You
                  </h2>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {nearbyRoutes.map((route) => (
                      <Card key={route.id} className="bg-white/90 backdrop-blur">
                        <CardHeader>
                          <CardTitle className="text-lg">{route.name}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="flex items-center gap-2">
                            <Navigation className="h-4 w-4" />
                            <span className="text-sm">{route.distance}m away</span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Badge className={getDifficultyColor(route.difficulty)}>
                              {route.difficulty}
                            </Badge>
                            <span className="text-sm">{route.estimatedDuration} min</span>
                          </div>
                          
                          <div className="flex flex-wrap gap-1">
                            {route.historicalPeriods.map((period: string) => (
                              <Badge key={period} variant="secondary" className="text-xs">
                                {period}
                              </Badge>
                            ))}
                          </div>
                          
                          <p className="text-sm text-gray-600">{route.description}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            // AR Camera View
            <div className="relative">
              <Card className="overflow-hidden">
                <div className="relative aspect-video bg-black">
                  <video
                    ref={videoRef}
                    className="w-full h-full object-cover"
                    autoPlay
                    playsInline
                    muted
                  />
                  
                  {/* AR Overlays */}
                  {nearbyRoutes.map((route) => (
                    <div
                      key={route.id}
                      className="absolute top-1/2 transform -translate-y-1/2 cursor-pointer"
                      style={getRouteOverlayStyle(route)}
                      onClick={() => setSelectedRoute(route)}
                    >
                      <div className="bg-black/80 text-white p-3 rounded-lg backdrop-blur-sm border-2 border-white/50">
                        <div className="flex items-center gap-2 mb-1">
                          <Target className="h-4 w-4" />
                          <span className="font-semibold text-sm">{route.name}</span>
                        </div>
                        <div className="text-xs space-y-1">
                          <div className="flex items-center gap-1">
                            <Compass className="h-3 w-3" />
                            <span>{route.distance}m</span>
                            <Badge className={`${getDifficultyColor(route.difficulty)} text-xs px-1 py-0`}>
                              {route.difficulty}
                            </Badge>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {route.historicalPeriods.slice(0, 2).map((period: string) => (
                              <span key={period} className="bg-white/20 px-1 rounded text-xs">
                                {period}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Camera controls overlay */}
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-4">
                    <Button
                      onClick={stopCamera}
                      variant="secondary"
                      size="sm"
                      className="bg-black/50 text-white hover:bg-black/70"
                    >
                      Stop Camera
                    </Button>
                    <Button
                      onClick={() => setShowPreferences(true)}
                      variant="secondary"
                      size="sm"
                      className="bg-black/50 text-white hover:bg-black/70"
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Compass indicator */}
                  <div className="absolute top-4 right-4 bg-black/50 text-white p-2 rounded-full">
                    <Compass 
                      className="h-6 w-6" 
                      style={{ transform: `rotate(${deviceOrientation.alpha}deg)` }}
                    />
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* Route Detail Dialog */}
          <Dialog open={!!selectedRoute} onOpenChange={() => setSelectedRoute(null)}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Route className="h-5 w-5" />
                  {selectedRoute?.name}
                </DialogTitle>
                <DialogDescription>
                  {selectedRoute?.description}
                </DialogDescription>
              </DialogHeader>
              
              {selectedRoute && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Distance:</span>
                      <p>{selectedRoute.distance}m away</p>
                    </div>
                    <div>
                      <span className="font-medium">Duration:</span>
                      <p>{selectedRoute.estimatedDuration} minutes</p>
                    </div>
                    <div>
                      <span className="font-medium">Difficulty:</span>
                      <Badge className={getDifficultyColor(selectedRoute.difficulty)}>
                        {selectedRoute.difficulty}
                      </Badge>
                    </div>
                    <div>
                      <span className="font-medium">Terrain:</span>
                      <p className="capitalize">{selectedRoute.terrainType}</p>
                    </div>
                  </div>
                  
                  <div>
                    <span className="font-medium text-sm">Historical Periods:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedRoute.historicalPeriods.map((period: string) => (
                        <Badge key={period} variant="secondary">
                          {period}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <Button className="flex-1 bg-forest-green hover:bg-green-900">
                      Start Route
                    </Button>
                    <Button variant="outline" className="flex-1">
                      Save for Later
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>

          {/* Preferences Dialog */}
          <Dialog open={showPreferences} onOpenChange={setShowPreferences}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Route Preferences</DialogTitle>
                <DialogDescription>
                  Customize your route recommendations based on your detecting preferences.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Preference settings would go here - experience level, preferred historical periods, 
                  maximum distance, terrain types, accessibility requirements, etc.
                </p>
                
                <div className="flex justify-end">
                  <Button onClick={() => setShowPreferences(false)}>
                    Save Preferences
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </>
  );
};

export default ARRoutes;