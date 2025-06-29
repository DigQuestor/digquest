import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { 
  Shovel, 
  Users, 
  Camera, 
  Map, 
  Heart, 
  Calendar,
  TrendingUp,
  Star
} from "lucide-react";
export default function Home() {
  useEffect(() => {
    document.title = "DigQuest - Metal Detecting Community";
  }, []);
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary/10 via-primary/5 to-background py-20 px-4">
        <div className="container mx-auto text-center">
          <div className="flex justify-center mb-6">
            <Shovel className="h-16 w-16 text-primary" />
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
            Welcome to DigQuest
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join the ultimate metal detecting community. Share finds, discover locations, 
            connect with fellow detectorists, and embark on your treasure hunting journey.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <Link href="/forum">
                <Users className="h-5 w-5 mr-2" />
                Join Community
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/finds">
                <Camera className="h-5 w-5 mr-2" />
                View Finds
              </Link>
            </Button>
          </div>
        </div>
      </section>
      {/* Features Grid */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            Everything You Need for Metal Detecting
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-6 w-6 text-primary" />
                  Community Forum
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Connect with thousands of metal detecting enthusiasts. Share tips, 
                  ask questions, and learn from experienced detectorists.
                </p>
              </CardContent>
            </Card>
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Camera className="h-6 w-6 text-primary" />
                  Finds Gallery
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Showcase your amazing discoveries. Upload photos of your finds 
                  and get them authenticated by the community.
                </p>
              </CardContent>
            </Card>
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Map className="h-6 w-6 text-primary" />
                  Interactive Maps
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Discover the best detecting locations. Share coordinates and 
                  find new hunting grounds near you.
                </p>
              </CardContent>
            </Card>
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="h-6 w-6 text-primary" />
                  Wellbeing Hub
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Metal detecting for mental health and wellbeing. Access resources 
                  and connect with others who share this therapeutic hobby.
                </p>
              </CardContent>
            </Card>
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-6 w-6 text-primary" />
                  Events & Meetups
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Join local detecting events and rallies. Organize group hunts 
                  and meet fellow enthusiasts in your area.
                </p>
              </CardContent>
            </Card>
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-6 w-6 text-primary" />
                  Track Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Monitor your detecting achievements, track your finds, 
                  and see your progress over time with detailed statistics.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
      {/* Stats Section */}
      <section className="bg-muted/50 py-16 px-4">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl font-bold mb-12">Join Our Growing Community</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-2">
              <div className="text-4xl font-bold text-primary">5,000+</div>
              <div className="text-muted-foreground">Active Members</div>
            </div>
            <div className="space-y-2">
              <div className="text-4xl font-bold text-primary">25,000+</div>
              <div className="text-muted-foreground">Finds Shared</div>
            </div>
            <div className="space-y-2">
              <div className="text-4xl font-bold text-primary">1,200+</div>
              <div className="text-muted-foreground">Detecting Locations</div>
            </div>
          </div>
        </div>
      </section>
      {/* CTA Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6">
            Ready to Start Your Journey?
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join thousands of metal detecting enthusiasts and discover the joy 
            of treasure hunting in a supportive community.
          </p>
          <Button size="lg" asChild>
            <Link href="/forum">
              <Star className="h-5 w-5 mr-2" />
              Get Started Today
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
