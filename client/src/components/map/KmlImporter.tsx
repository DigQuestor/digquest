import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileText, AlertCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface KmlLocation {
  name: string;
  description?: string;
  coordinates: {
    lat: number;
    lng: number;
  };
}

interface KmlImporterProps {
  onLocationsImported: (locations: KmlLocation[]) => void;
  onClose: () => void;
}

export function KmlImporter({ onLocationsImported, onClose }: KmlImporterProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const parseKmlFile = async (file: File): Promise<KmlLocation[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const xmlText = e.target?.result as string;
          const parser = new DOMParser();
          const xmlDoc = parser.parseFromString(xmlText, "text/xml");
          
          // Check for parsing errors
          const parseError = xmlDoc.querySelector("parsererror");
          if (parseError) {
            throw new Error("Invalid KML/XML format");
          }
          
          const locations: KmlLocation[] = [];
          
          // Parse Placemarks (standard KML format)
          const placemarks = xmlDoc.querySelectorAll("Placemark");
          
          placemarks.forEach((placemark) => {
            const nameElement = placemark.querySelector("name");
            const descElement = placemark.querySelector("description");
            const coordsElement = placemark.querySelector("coordinates");
            
            if (nameElement && coordsElement) {
              const name = nameElement.textContent?.trim() || "Imported Location";
              const description = descElement?.textContent?.trim() || "";
              const coordsText = coordsElement.textContent?.trim();
              
              if (coordsText) {
                // KML coordinates are in format: longitude,latitude,altitude
                const coords = coordsText.split(',');
                if (coords.length >= 2) {
                  const lng = parseFloat(coords[0]);
                  const lat = parseFloat(coords[1]);
                  
                  if (!isNaN(lat) && !isNaN(lng)) {
                    locations.push({
                      name,
                      description: description || undefined,
                      coordinates: { lat, lng }
                    });
                  }
                }
              }
            }
          });
          
          // Also try to parse waypoints (common in .kmi files)
          const waypoints = xmlDoc.querySelectorAll("wpt, waypoint");
          
          waypoints.forEach((waypoint) => {
            const name = waypoint.getAttribute("name") || 
                        waypoint.querySelector("name")?.textContent?.trim() || 
                        "Waypoint";
            const lat = parseFloat(waypoint.getAttribute("lat") || "0");
            const lng = parseFloat(waypoint.getAttribute("lon") || "0");
            
            if (!isNaN(lat) && !isNaN(lng)) {
              const desc = waypoint.querySelector("desc")?.textContent?.trim() ||
                          waypoint.querySelector("description")?.textContent?.trim();
              
              locations.push({
                name,
                description: desc || undefined,
                coordinates: { lat, lng }
              });
            }
          });
          
          resolve(locations);
        } catch (error) {
          reject(new Error("Failed to parse KML file: " + (error instanceof Error ? error.message : "Unknown error")));
        }
      };
      
      reader.onerror = () => {
        reject(new Error("Failed to read file"));
      };
      
      reader.readAsText(file);
    });
  };

  const handleFileSelect = async (file: File) => {
    // Validate file type
    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith('.kml') && !fileName.endsWith('.kmi') && !fileName.endsWith('.xml')) {
      toast({
        title: "Invalid File Type",
        description: "Please select a .kml, .kmi, or .xml file.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please select a file smaller than 10MB.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      const locations = await parseKmlFile(file);
      
      if (locations.length === 0) {
        toast({
          title: "No Locations Found",
          description: "The file doesn't contain any valid location data.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Import Successful",
        description: `Found ${locations.length} location${locations.length > 1 ? 's' : ''} in the file.`,
      });

      onLocationsImported(locations);
      onClose();
    } catch (error) {
      console.error("Error parsing KML file:", error);
      toast({
        title: "Import Failed",
        description: error instanceof Error ? error.message : "Failed to parse the file.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Import Locations
        </CardTitle>
        <CardDescription>
          Upload a .kml, .kmi, or .xml file to import detecting locations
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            dragActive 
              ? 'border-forest-green bg-green-50' 
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <p className="text-sm text-gray-600 mb-2">
            Drag and drop your KML file here, or
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={handleBrowseClick}
            disabled={isProcessing}
          >
            Browse Files
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".kml,.kmi,.xml"
            className="hidden"
            onChange={handleFileInputChange}
          />
        </div>

        <div className="bg-amber-50 p-3 rounded-md">
          <div className="flex items-start">
            <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 mr-2" />
            <div className="text-sm text-amber-700">
              <p className="font-medium mb-1">Supported formats:</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>.kml files from Google Earth or other mapping apps</li>
                <li>.kmi files from Garrett metal detector software</li>
                <li>.xml files with location waypoints</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="flex space-x-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="flex-1"
            disabled={isProcessing}
          >
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}