import { Link } from "wouter";
import { Shovel, Heart, Mail, Phone, MapPin } from "lucide-react";
export default function Footer() {
  return (
    <footer className="bg-muted/50 border-t">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo and Description */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Shovel className="h-6 w-6 text-primary" />
              <span className="font-bold text-lg">DigQuest</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Your premier destination for metal detecting adventures, community, and discoveries.
            </p>
          </div>
          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="font-semibold">Quick Links</h3>
            <div className="space-y-2 text-sm">
              <Link href="/forum" className="block text-muted-foreground hover:text-foreground transition-colors">
                Community Forum
              </Link>
              <Link href="/finds" className="block text-muted-foreground hover:text-foreground transition-colors">
                Finds Gallery
              </Link>
              <Link href="/map" className="block text-muted-foreground hover:text-foreground transition-colors">
                Detecting Map
              </Link>
              <Link href="/events" className="block text-muted-foreground hover:text-foreground transition-colors">
                Events
              </Link>
            </div>
          </div>
          {/* Resources */}
          <div className="space-y-4">
            <h3 className="font-semibold">Resources</h3>
            <div className="space-y-2 text-sm">
              <Link href="/wellbeing" className="block text-muted-foreground hover:text-foreground transition-colors">
                Wellbeing Hub
              </Link>
              <Link href="/guides" className="block text-muted-foreground hover:text-foreground transition-colors">
                Beginner Guides
              </Link>
              <Link href="/equipment" className="block text-muted-foreground hover:text-foreground transition-colors">
                Equipment Reviews
              </Link>
              <Link href="/legal" className="block text-muted-foreground hover:text-foreground transition-colors">
                Legal Guidelines
              </Link>
            </div>
          </div>
          {/* Contact */}
          <div className="space-y-4">
            <h3 className="font-semibold">Contact</h3>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4" />
                <span>contact@digquest.com</span>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="h-4 w-4" />
                <span>+1 (555) 123-4567</span>
              </div>
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4" />
                <span>Metal Detecting Community</span>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-8 pt-4 border-t flex flex-col md:flex-row justify-between items-center">
          <div className="text-sm text-muted-foreground">
            © 2024 DigQuest. All rights reserved.
          </div>
          <div className="flex items-center space-x-1 text-sm text-muted-foreground">
            <span>Made with</span>
            <Heart className="h-4 w-4 text-red-500" />
            <span>for the detecting community</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
