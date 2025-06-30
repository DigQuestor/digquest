import { Link } from "wouter";
import { Helmet } from "react-helmet";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Home, Search, MapPin, MessageCircle } from "lucide-react";

export default function NotFound() {
  return (
    <>
      <Helmet>
        <title>Page Not Found - DigQuest</title>
        <meta name="description" content="The page you're looking for doesn't exist. Return to DigQuest and continue your metal detecting journey." />
      </Helmet>
      
      <div className="min-h-screen bg-gradient-to-b from-sand-beige via-cream to-gold-accent/10 py-12">
        <div className="container mx-auto px-4 max-w-2xl">
          <Card className="text-center bg-white/90 backdrop-blur-sm border-earth-brown/20">
            <CardHeader className="pb-4">
              <div className="mx-auto w-20 h-20 bg-earth-brown/10 rounded-full flex items-center justify-center mb-4">
                <Search className="h-10 w-10 text-earth-brown" />
              </div>
              <CardTitle className="text-3xl font-bold text-forest-green mb-2">
                404 - Page Not Found
              </CardTitle>
              <p className="text-lg text-gray-600">
                Looks like this treasure is buried too deep! We couldn't find the page you're looking for.
              </p>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <p className="text-gray-600">
                Don't worry - there's plenty more to discover on DigQuest. Try one of these popular destinations:
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Link href="/">
                  <Button variant="outline" className="w-full h-auto p-4 flex flex-col items-center gap-2 hover:bg-forest-green/5">
                    <Home className="h-5 w-5 text-forest-green" />
                    <span>Home</span>
                  </Button>
                </Link>
                
                <Link href="/forum">
                  <Button variant="outline" className="w-full h-auto p-4 flex flex-col items-center gap-2 hover:bg-forest-green/5">
                    <MessageCircle className="h-5 w-5 text-forest-green" />
                    <span>Forum</span>
                  </Button>
                </Link>
                
                <Link href="/finds">
                  <Button variant="outline" className="w-full h-auto p-4 flex flex-col items-center gap-2 hover:bg-forest-green/5">
                    <Search className="h-5 w-5 text-forest-green" />
                    <span>Finds Gallery</span>
                  </Button>
                </Link>
                
                <Link href="/detecting-map">
                  <Button variant="outline" className="w-full h-auto p-4 flex flex-col items-center gap-2 hover:bg-forest-green/5">
                    <MapPin className="h-5 w-5 text-forest-green" />
                    <span>Detecting Map</span>
                  </Button>
                </Link>
              </div>
              
              <div className="pt-4">
                <Link href="/">
                  <Button size="lg" className="bg-forest-green hover:bg-forest-green/90">
                    <Home className="h-5 w-5 mr-2" />
                    Return to DigQuest
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}