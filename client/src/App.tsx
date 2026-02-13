import { Switch, Route, useLocation } from "wouter";
import { useEffect, Suspense, lazy } from "react";
import { queryClient } from "@/lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { Loader2 } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Navigation from "@/components/Navigation";
import Home from "@/pages/Home";

const Forum = lazy(() => import("@/pages/Forum"));
const ForumPostDetail = lazy(() => import("@/pages/ForumPostDetail"));
const FindsGallery = lazy(() => import("@/pages/FindsGallery"));
const FindDetail = lazy(() => import("@/pages/FindDetail"));
const DetectingMap = lazy(() => import("@/pages/DetectingMap"));
const ARRoutes = lazy(() => import("@/pages/ARRoutes"));
const Wellbeing = lazy(() => import("@/pages/Wellbeing"));
const ProfileEdit = lazy(() => import("@/pages/ProfileEdit"));
const Events = lazy(() => import("@/pages/Events"));
const EventCreate = lazy(() => import("@/pages/EventCreate"));
const EventDetail = lazy(() => import("@/pages/EventDetail"));
const EmailVerification = lazy(() => import("@/pages/EmailVerification"));
const DiggersMatch = lazy(() => import("@/pages/DiggersMatch"));
const SocialDashboard = lazy(() => import("@/pages/SocialDashboard"));
const NotFound = lazy(() => import("@/pages/not-found"));

function Router() {
  const [location] = useLocation();

  useEffect(() => {
    const prefetchers: Array<() => Promise<unknown>> = [
      () => import("@/pages/Forum"),
      () => import("@/pages/ForumPostDetail"),
      () => import("@/pages/FindsGallery"),
      () => import("@/pages/FindDetail"),
      () => import("@/pages/DetectingMap"),
      () => import("@/pages/ARRoutes"),
      () => import("@/pages/Wellbeing"),
      () => import("@/pages/SocialDashboard"),
      () => import("@/pages/DiggersMatch"),
      () => import("@/pages/Events"),
      () => import("@/pages/EventCreate"),
      () => import("@/pages/EventDetail"),
      () => import("@/pages/ProfileEdit"),
      () => import("@/pages/EmailVerification"),
      () => import("@/pages/not-found"),
    ];

    const prefetchRoutes = () => {
      prefetchers.forEach((loadChunk, index) => {
        window.setTimeout(() => {
          void loadChunk();
        }, index * 120);
      });
    };

    const requestIdle = (window as Window & {
      requestIdleCallback?: (callback: IdleRequestCallback) => number;
      cancelIdleCallback?: (handle: number) => void;
    }).requestIdleCallback;

    const cancelIdle = (window as Window & {
      requestIdleCallback?: (callback: IdleRequestCallback) => number;
      cancelIdleCallback?: (handle: number) => void;
    }).cancelIdleCallback;

    if (requestIdle) {
      const idleHandle = requestIdle(() => prefetchRoutes());
      return () => {
        if (cancelIdle) {
          cancelIdle(idleHandle);
        }
      };
    }

    const timeoutHandle = window.setTimeout(prefetchRoutes, 900);
    return () => window.clearTimeout(timeoutHandle);
  }, []);

  useEffect(() => {
    const prefetchCoreData = () => {
      const warmups = [
        queryClient.prefetchQuery({ queryKey: ["/api/posts"] }),
        queryClient.prefetchQuery({ queryKey: ["/api/finds"] }),
        queryClient.prefetchQuery({ queryKey: ["/api/events"] }),
        queryClient.prefetchQuery({ queryKey: ["/api/categories"] }),
      ];

      void Promise.allSettled(warmups);
    };

    const requestIdle = (window as Window & {
      requestIdleCallback?: (callback: IdleRequestCallback) => number;
      cancelIdleCallback?: (handle: number) => void;
    }).requestIdleCallback;

    const cancelIdle = (window as Window & {
      requestIdleCallback?: (callback: IdleRequestCallback) => number;
      cancelIdleCallback?: (handle: number) => void;
    }).cancelIdleCallback;

    if (requestIdle) {
      const idleHandle = requestIdle(() => prefetchCoreData());
      return () => {
        if (cancelIdle) {
          cancelIdle(idleHandle);
        }
      };
    }

    const timeoutHandle = window.setTimeout(prefetchCoreData, 1300);
    return () => window.clearTimeout(timeoutHandle);
  }, []);
  
  // Update canonical URL for each page
  useEffect(() => {
    const canonical = document.querySelector('link[rel="canonical"]');
    if (canonical) {
      canonical.setAttribute('href', `https://digquest.org${location}`);
    }
  }, [location]);
  
  // Scroll to top on route changes
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [location]);
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <Navigation />
      <main className="flex-grow bg-sand-beige">
        <Suspense
          fallback={
            <div className="container mx-auto px-4 py-12 flex justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-forest-green" />
            </div>
          }
        >
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
            <Route path="/events/create" component={EventCreate} />
            <Route path="/events/:id" component={EventDetail} />
            <Route path="/profile/edit" component={ProfileEdit} />
            <Route path="/verify-email" component={EmailVerification} />
            <Route component={NotFound} />
          </Switch>
        </Suspense>
      </main>
      <Footer />
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