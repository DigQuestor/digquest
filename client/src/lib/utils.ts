import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return format(dateObj, "MMM d, yyyy");
}

export function formatTimeAgo(date: Date | string): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return formatDistanceToNow(dateObj, { addSuffix: true });
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
}

// Custom icons related to metal detecting
export const customIcons: Record<string, string> = {
  detector: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M12 2v6M6 8h12M8 8v10a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V8M4 14h2M18 14h2M4 18h2M18 18h2M9 22h6"/>
  </svg>`,
  shovel: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M12 2v8M10 6h4M9 10h6M8 10v10a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V10"/>
  </svg>`,
  coin: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="12" cy="12" r="8"/>
    <circle cx="12" cy="12" r="3"/>
    <line x1="12" y1="4" x2="12" y2="6"/>
    <line x1="12" y1="18" x2="12" y2="20"/>
    <line x1="4" y1="12" x2="6" y2="12"/>
    <line x1="18" y1="12" x2="20" y2="12"/>
  </svg>`,
  treasure: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M4 8h16v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8z"/>
    <path d="M8 8V6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
    <path d="M10 12l2 2 2-2"/>
  </svg>`,
  compass: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>
  </svg>`,
};

// Generate gradient class for background
export function getGradientClass(index: number): string {
  const gradients = [
    "bg-gradient-to-r from-earth-brown/70 to-transparent",
    "bg-gradient-to-r from-forest-green/70 to-transparent",
    "bg-gradient-to-r from-metallic-gold/70 to-transparent",
    "bg-gradient-to-r from-rust-orange/70 to-transparent",
  ];
  
  return gradients[index % gradients.length];
}

// Get random avatar URL for testing purposes
export function getAvatarUrl(seed: string | number): string {
  return `https://api.dicebear.com/7.x/personas/svg?seed=${seed}`;
}

// Format location name for display
export function formatLocation(location: string): string {
  if (!location) return "Unknown Location";
  
  return location
    .split(",")[0]
    .trim();
}

// Get period badge color
export function getPeriodBadgeColor(period: string): string {
  const periods: Record<string, string> = {
    "Roman": "bg-red-600 text-white",
    "Medieval": "bg-blue-600 text-white",
    "Victorian": "bg-purple-600 text-white",
    "Bronze Age": "bg-amber-600 text-white",
    "Iron Age": "bg-orange-600 text-white",
    "Saxon": "bg-green-600 text-white",
    "Modern": "bg-gray-600 text-white",
    "Unknown": "bg-gray-400 text-white"
  };
  
  return periods[period] || periods["Unknown"];
}

// Filter locations by type
export function filterLocationsByType(locations: any[], filterType: string | null): any[] {
  if (!filterType) return locations;
  
  return locations.filter(location => location.type === filterType);
}

// Parse URL parameters
export function parseUrlParams(url: string): Record<string, string> {
  const params: Record<string, string> = {};
  const paramString = url.split('?')[1];
  
  if (!paramString) return params;
  
  const paramPairs = paramString.split('&');
  
  for (const pair of paramPairs) {
    const [key, value] = pair.split('=');
    params[key] = decodeURIComponent(value);
  }
  
  return params;
}
