import { Switch, Route, useLocation } from "wouter";
import { useEffect } from "react";
import { queryClient } from "@/lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ui/theme-provider";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Navigation from "@/components/Navigation";
import DonationBanner from "@/components/DonationBanner";
import Home from "@/pages/Home";
import Forum from "@/pages/Forum";
import ForumPostDetail from "@/pages/ForumPostDetail";
import FindsGallery from "@/pages/FindsGallery";
import FindDetail from "@/pages/FindDetail";
import DetectingMap from "@/pages/DetectingMap";
import ARRoutes from "@/pages/ARRoutes";
import Wellbeing from "@/pages/Wellbeing";
import ProfileEdit from "@/pages/ProfileEdit";
import Events from "@/pages/Events";
import EventDetail from "@/pages/EventDetail";
import EmailVerification from "@/pages/EmailVerification";
import DiggersMatch from "@/pages/DiggersMatch";
import SocialDashboard from "@/pages/SocialDashboard";
import NotFound from "@/pages/not-found";

function Router() {
  const [location] = useLocation();
  
  // Update canonical URL for each page
  useEffect(() => {
    const canonical = document.querySelector('link[rel="canonical"]');
    if (canonical) {
      canonical.setAttribute('href', `https://digquest.org${location}`);
    }
  }, [location]);
  
  // Only scroll to top on route changes (not for all location updates)
  useEffect(() => {
    // Only scroll to top when navigating between different pages
    if (location !== window.location.pathname) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [location]);
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow bg-sand-beige">
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/forum" component={Forum} />
          <Route path="/forum/post/:id" component={ForumPostDetail} />
          <Route path="/finds" component={FindsGallery} />
          <Route path="/finds/:id" component={FindDetail} />
          <Route path="/map" component={DetectingMap} />
          <Route path="/ar-routes" component={ARRoutes} />
          <Route path="/wellbeing" component={Wellbeing} />
          <Route path="/social" component={SocialDashboard} />
          <Route path="/diggers-match" component={DiggersMatch} />
          <Route path="/events" component={Events} />
          <Route path="/events/:id" component={EventDetail} />
          <Route path="/profile/edit" component={ProfileEdit} />
          <Route path="/verify-email" component={EmailVerification} />
          <Route component={NotFound} />
        </Switch>
      </main>
      <Footer />
      <DonationBanner />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="digquest-theme">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;