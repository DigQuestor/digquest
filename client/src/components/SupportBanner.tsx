import { useState } from "react";
import { X, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function SupportBanner() {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  const handleDonateClick = () => {
    // Open contact email with donation subject
    window.location.href = "mailto:danishnest@gmail.com?subject=DigQuest Community Support&body=Hello! I would like to support the DigQuest community. Please let me know how I can contribute.";
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 pointer-events-none">
      <Card className="mx-auto max-w-4xl border-l-4 border-l-green-600 bg-gradient-to-r from-green-50 to-green-100 shadow-lg pointer-events-auto">
        <CardContent className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-3">
            <Heart className="h-6 w-6 text-red-500 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">
                Support DigQuest Community
              </h3>
              <p className="text-sm text-gray-600">
                Help us maintain this platform and support the metal detecting community
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button 
              size="sm" 
              className="bg-green-600 hover:bg-green-700 text-white"
              onClick={handleDonateClick}
            >
              Donate
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsVisible(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}