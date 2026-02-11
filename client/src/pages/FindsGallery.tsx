import { useState, useEffect } from "react";
import { Helmet } from "react-helmet";
import { useQuery } from "@tanstack/react-query";
import { Find } from "@shared/schema";
import { Plus, Loader2, Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import TreasureCard from "@/components/finds/TreasureCard";
import UploadFindForm from "@/components/finds/UploadFindForm";
import { useAuth, findStorage } from "@/hooks/use-auth-simple";

// Time periods for filtering
const timePeriods = [
  "All Periods",
  "Roman",
  "Medieval",
  "Victorian",
  "Bronze Age",
  "Iron Age",
  "Saxon",
  "Viking",     // Added as requested
  "Byzantine Era", // Added as requested
  "Georgian",    // Added as requested
  "Modern",
  "Unknown"
];

const FindsGallery = () => {
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPeriod, setSelectedPeriod] = useState("All Periods");
  const { user } = useAuth();

  // Fetch all finds from API
  const { data: apiFinds, isLoading } = useQuery<Find[]>({
    queryKey: ['/api/finds'],
  });
  
  // No longer clearing finds on mount to preserve user data between sessions
  
  // Use API finds directly to avoid performance issues with localStorage operations
  const finds = apiFinds;

  // Filter finds based on search and period
  const filteredFinds = finds?.filter(find => {
    const matchesSearch = searchQuery 
      ? find.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (find.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
        (find.location?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
      : true;
    
    const matchesPeriod = selectedPeriod === "All Periods" 
      ? true 
      : find.period === selectedPeriod;
    
    return matchesSearch && matchesPeriod;
  });

  return (
    <>
      <Helmet>
        <title>Finds Gallery | DigQuest - Metal Detecting Treasures</title>
        <meta name="description" content="Explore amazing discoveries from metal detecting enthusiasts. View historical artifacts, coins, jewelry, and other treasures found by our community." />
        <link rel="canonical" href="https://digquest.org/finds" />
      </Helmet>

      <div className="container mx-auto px-4 md:px-6 py-8">
        <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="font-display text-4xl text-earth-brown mb-2">Treasure Finds Gallery</h1>
            <p className="text-gray-600">Explore fascinating discoveries from our community of metal detectorists</p>
          </div>
          
          {/* Always visible "Add Find" button at the top */}
          {user && (
            <Button 
              className="bg-metallic-gold hover:bg-yellow-600 text-forest-green font-semibold py-2 px-4"
              onClick={() => setIsUploadOpen(true)}
            >
              <Plus className="h-4 w-4 mr-2" /> Share Your Find
            </Button>
          )}
        </div>

        <Card className="mb-8">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-grow">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search finds by title, description or location..."
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="w-full sm:w-64 flex items-center gap-2">
                <Select
                  value={selectedPeriod}
                  onValueChange={setSelectedPeriod}
                >
                  <SelectTrigger>
                    <div className="flex items-center">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="All Periods" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    {timePeriods.map(period => (
                      <SelectItem key={period} value={period}>
                        {period}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                {/* Secondary "Add Find" button in the filter bar for easy access */}
                {user && (
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="flex-shrink-0 bg-metallic-gold/10 hover:bg-metallic-gold/20 border-metallic-gold text-forest-green"
                    onClick={() => setIsUploadOpen(true)}
                    title="Add a new find"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-12">
            <Loader2 className="h-12 w-12 animate-spin text-earth-brown mb-4" />
            <p className="text-gray-600">Loading treasure finds...</p>
          </div>
        ) : filteredFinds && filteredFinds.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredFinds.map(find => (
              <TreasureCard key={find.id} find={find} />
            ))}
          </div>
        ) : (
          <div className="bg-sand-beige/50 rounded-lg p-12 text-center">
            <h3 className="text-2xl font-display text-earth-brown mb-2">No finds to display</h3>
            <p className="text-gray-600 mb-6">
              {searchQuery || selectedPeriod !== "All Periods"
                ? "Try adjusting your search or filter"
                : "Be the first to share your treasure discoveries!"
              }
            </p>
            {user && (
              <Button 
                className="bg-metallic-gold hover:bg-yellow-600 text-forest-green font-semibold"
                onClick={() => setIsUploadOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" /> Upload Your Find
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Fixed floating action button */}
      {user && (
        <div className="fixed bottom-6 right-6 z-50">
          <Button
            className="bg-metallic-gold hover:bg-yellow-600 text-forest-green shadow-lg rounded-full w-14 h-14 flex items-center justify-center"
            onClick={() => setIsUploadOpen(true)}
            title="Share your find"
          >
            <Plus className="h-6 w-6" />
          </Button>
        </div>
      )}
      
      <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
        <DialogContent className="max-w-xl max-h-[80vh] overflow-y-auto sm:max-h-[600px]" onInteractOutside={(e) => {
          // Prevent closing when clicking on Select dropdown
          const target = e.target as HTMLElement;
          if (target.closest('[role="listbox"]') || target.closest('[data-radix-select-content]')) {
            e.preventDefault();
          }
        }}>
          <DialogTitle className="text-earth-brown font-display text-2xl">Share Your Find</DialogTitle>
          <DialogDescription>
            Upload a photo and details of your metal detecting discovery to share with the community.
            You can add multiple finds without closing this window.
          </DialogDescription>
          <div className="pb-10"> {/* Added padding to ensure save button is visible */}
            <UploadFindForm 
              // We're not auto-closing the dialog anymore to enable multiple uploads
              onFindUploaded={() => {
                // The callback still exists but doesn't close the dialog
                // This allows users to upload multiple finds in sequence
                console.log("Find uploaded successfully, keeping dialog open for more uploads");
              }} 
            />
          </div>
          <div className="flex justify-end pb-2">
            <Button 
              variant="outline"
              onClick={() => setIsUploadOpen(false)}
              className="text-sm"
            >
              Close when finished
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default FindsGallery;
