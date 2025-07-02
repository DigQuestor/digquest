import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";
import { Find } from "@shared/schema";
import TreasureCard from "@/components/finds/TreasureCard";
import { Skeleton } from "@/components/ui/skeleton";

const FeaturedFinds = () => {
  const { data: finds, isLoading, error } = useQuery({
    queryKey: ['/api/finds'],
    select: (data: Find[]) => data.slice(0, 4), // Get only the first 4 finds
    refetchOnMount: true,  // Ensure data is fresh when component mounts
    refetchOnWindowFocus: true  // Refresh data when user returns to the window
  });

  return (
    <section className="mb-6 md:mb-12">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 md:mb-6 gap-2">
        <h2 className="font-display text-xl md:text-3xl text-earth-brown">Recent Treasures</h2>
        <Link href="/finds" className="text-forest-green hover:text-earth-brown font-semibold flex items-center transition duration-300 text-sm md:text-base">
          View All <ArrowRight className="h-3 w-3 md:h-4 md:w-4 ml-1 md:ml-2" />
        </Link>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4 mobile-grid">
        {isLoading ? (
          // Skeleton loader while loading
          Array(4).fill(0).map((_, index) => (
            <div key={index} className="bg-white rounded-lg overflow-hidden shadow-md mobile-card">
              <Skeleton className="w-full h-40 md:h-48" />
              <div className="p-3 md:p-4 card-content-mobile">
                <div className="flex justify-between items-start mb-2">
                  <Skeleton className="h-5 md:h-6 w-20 md:w-24" />
                  <Skeleton className="h-4 md:h-5 w-16 md:w-20" />
                </div>
                <Skeleton className="h-3 md:h-4 w-full mb-1" />
                <Skeleton className="h-3 md:h-4 w-3/4 mb-3" />
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <Skeleton className="h-6 w-6 md:h-8 md:w-8 rounded-full mr-2" />
                    <Skeleton className="h-3 md:h-4 w-16 md:w-20" />
                  </div>
                  <Skeleton className="h-3 md:h-4 w-12 md:w-16" />
                </div>
              </div>
            </div>
          ))
        ) : error ? (
          <div className="col-span-full p-3 md:p-4 bg-red-50 text-red-500 rounded-lg text-sm md:text-base">
            Error loading finds. Please try again later.
          </div>
        ) : finds && finds.length > 0 ? (
          finds.map((find) => (
            <TreasureCard key={find.id} find={find} />
          ))
        ) : (
          <div className="col-span-full p-3 md:p-4 bg-yellow-50 text-yellow-700 rounded-lg text-sm md:text-base">
            No treasure finds available. Be the first to add one!
          </div>
        )}
      </div>
    </section>
  );
};

export default FeaturedFinds;
