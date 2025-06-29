import { useState } from "react";
import { X, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
export default function DonationBanner() {
  const [isVisible, setIsVisible] = useState(true);
  if (!isVisible) return null;
  return (
    <Card className="mx-4 mb-4 border-l-4 border-l-primary bg-gradient-to-r from-primary/5 to-primary/10">
      <CardContent className="flex items-center justify-between p-4">
        <div className="flex items-center space-x-3">
          <Heart className="h-6 w-6 text-red-500 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="font-semibold text-foreground">
              Support DigQuest Community
            </h3>
            <p className="text-sm text-muted-foreground">
              Help us maintain this platform and support the metal detecting community
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            size="sm" 
            className="bg-primary hover:bg-primary/90"
            onClick={() => {
              // Would integrate with donation system
              console.log("Donation clicked");
            }}
          >
            Donate
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsVisible(false)}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
