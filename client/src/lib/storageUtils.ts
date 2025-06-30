import { Location, Post, Find, Event } from "@shared/schema";

// Define storage keys for localStorage
export const LOCATIONS_STORAGE_KEY = 'map_locations';
export const DETECTING_LOCATIONS_KEY = 'detectingMapLocations';
export const FORUM_POSTS_KEY = 'forum_posts';
export const FINDS_STORAGE_KEY = 'finds_data';
export const EVENTS_STORAGE_KEY = 'events_data';
export const USER_CACHE_KEY = 'user_cache';

/**
 * Helper function to safely parse JSON from localStorage
 */
export function safelyParseJSON<T>(key: string, defaultValue: T): T {
  try {
    const storedData = localStorage.getItem(key);
    return storedData ? JSON.parse(storedData) : defaultValue;
  } catch (error) {
    console.error(`Error parsing data from localStorage key '${key}':`, error);
    return defaultValue;
  }
}

/**
 * Removes a location from localStorage
 * This ensures that deleted locations are also removed from client storage
 */
export function removeLocationFromLocalStorage(locationId: number): void {
  try {
    // Handle map_locations
    const storedLocations = localStorage.getItem(LOCATIONS_STORAGE_KEY);
    if (storedLocations) {
      const parsedLocations = JSON.parse(storedLocations);
      const filteredLocations = parsedLocations.filter((loc: Location) => loc.id !== locationId);
      localStorage.setItem(LOCATIONS_STORAGE_KEY, JSON.stringify(filteredLocations));
    }
    
    // Handle detectingMapLocations
    const detectingMapLocations = localStorage.getItem(DETECTING_LOCATIONS_KEY);
    if (detectingMapLocations) {
      const parsedDetectingLocations = JSON.parse(detectingMapLocations);
      const filteredDetectingLocations = parsedDetectingLocations
        .filter((loc: Location) => loc.id !== locationId);
      localStorage.setItem(DETECTING_LOCATIONS_KEY, JSON.stringify(filteredDetectingLocations));
    }
  } catch (error) {
    console.error("Error removing location from localStorage:", error);
  }
}

/**
 * Clear user cache from localStorage
 * This ensures that deleted users are removed from cached data
 */
export function clearUserCache(): void {
  try {
    localStorage.removeItem(USER_CACHE_KEY);
    console.log("User cache cleared from localStorage");
  } catch (error) {
    console.error("Error clearing user cache:", error);
  }
}

/**
 * Remove a specific user from cache
 */
export function removeUserFromCache(userId: number): void {
  try {
    const cachedUsers = localStorage.getItem(USER_CACHE_KEY);
    if (cachedUsers) {
      const users = JSON.parse(cachedUsers);
      const filteredUsers = users.filter((user: any) => user.id !== userId);
      localStorage.setItem(USER_CACHE_KEY, JSON.stringify(filteredUsers));
      console.log(`User ${userId} removed from cache`);
    }
  } catch (error) {
    console.error("Error removing user from cache:", error);
  }
}

/**
 * Completely clears all location data from localStorage
 * Use this function when you need to force a clean slate
 */
export function clearAllLocationData(): void {
  try {
    localStorage.removeItem(LOCATIONS_STORAGE_KEY);
    localStorage.removeItem(DETECTING_LOCATIONS_KEY);
    console.log("All location data cleared from localStorage");
  } catch (error) {
    console.error("Error clearing location data from localStorage:", error);
  }
}

/**
 * Gets forum posts from localStorage for cross-device synchronization
 * @returns Array of posts from localStorage
 */
export function getStoredForumPosts(): Post[] {
  const posts = safelyParseJSON<Post[]>(FORUM_POSTS_KEY, []);
  console.log(`Loaded ${posts.length} posts from localStorage`);
  return posts;
}

/**
 * Gets events from localStorage for persistence
 * @returns Array of events from localStorage
 */
export function getStoredEvents(): Event[] {
  const events = safelyParseJSON<Event[]>(EVENTS_STORAGE_KEY, []);
  console.log(`Loaded ${events.length} events from localStorage`);
  return events;
}

/**
 * Saves events to localStorage for persistence
 * @param events Array of events to save
 */
export function saveEventsToStorage(events: Event[]): void {
  try {
    localStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(events));
    console.log(`Saved ${events.length} events to localStorage`);
  } catch (error) {
    console.error("Error saving events to localStorage:", error);
  }
}

/**
 * Saves a forum post to localStorage for cross-device synchronization
 * @param post The post to save
 */
export function saveForumPost(post: Post): void {
  try {
    // Deep clone the post object to avoid reference issues
    const postToSave = JSON.parse(JSON.stringify(post));
    
    // Get existing stored posts
    const storedPosts = getStoredForumPosts();
    
    // Create a map for deduplication
    const postsMap = new Map<number, Post>();
    
    // Add existing posts
    storedPosts.forEach(p => postsMap.set(p.id, p));
    
    // Verify that the post object is valid before saving
    if (!postToSave.id || !postToSave.title || !postToSave.content) {
      console.error("Invalid post object, cannot save to localStorage:", postToSave);
      return;
    }
    
    // Add the new post, overwriting if it already exists
    postsMap.set(postToSave.id, postToSave);
    
    // Convert back to array and save to localStorage
    const updatedPosts = Array.from(postsMap.values());
    
    // Sort by created_at before saving
    updatedPosts.sort((a, b) => {
      // Make sure we have valid created_at dates and convert them to timestamps
      const dateAStr = a.created_at || new Date().toISOString();
      const dateBStr = b.created_at || new Date().toISOString();
      
      const dateA = new Date(dateAStr).getTime();
      const dateB = new Date(dateBStr).getTime();
      
      return dateB - dateA; // Newest first
    });
    
    localStorage.setItem(FORUM_POSTS_KEY, JSON.stringify(updatedPosts));
    
    console.log("Saved forum post to localStorage, total posts:", updatedPosts.length);
    
    // Debug: List post titles for verification
    console.log("Post titles in localStorage:", updatedPosts.map(p => p.title));
  } catch (error) {
    console.error("Failed to save forum post to localStorage:", error);
  }
}

/**
 * Removes a forum post from localStorage
 * @param postId The ID of the post to remove
 */
export function removeForumPost(postId: number): void {
  try {
    const storedPosts = getStoredForumPosts();
    const filteredPosts = storedPosts.filter(post => post.id !== postId);
    localStorage.setItem(FORUM_POSTS_KEY, JSON.stringify(filteredPosts));
    console.log(`Removed post with ID ${postId} from localStorage`);
  } catch (error) {
    console.error("Failed to remove forum post from localStorage:", error);
  }
}

/**
 * Gets all finds from localStorage
 * @returns Array of finds from localStorage
 */
export function getStoredFinds(): Find[] {
  try {
    const storedFinds = localStorage.getItem(FINDS_STORAGE_KEY);
    if (storedFinds) {
      const parsedFinds = JSON.parse(storedFinds);
      
      // Convert date strings back to Date objects for consistency
      return parsedFinds.map((find: any) => {
        if (typeof find.created_at === 'string') {
          find.created_at = new Date(find.created_at);
        }
        return find;
      });
    }
    return [];
  } catch (error) {
    console.error("Failed to parse stored finds:", error);
    localStorage.removeItem(FINDS_STORAGE_KEY);
    return [];
  }
}

/**
 * Saves finds to localStorage
 * @param finds Array of finds to save
 */
export function saveFindsToStorage(finds: Find[]): void {
  try {
    localStorage.setItem(FINDS_STORAGE_KEY, JSON.stringify(finds));
    console.log(`Saved ${finds.length} finds to localStorage`);
  } catch (error) {
    console.error("Failed to save finds to localStorage:", error);
  }
}

/**
 * Chunked storage implementation to avoid localStorage size limits
 * This system breaks down finds into smaller chunks for reliable storage
 */

// Storage key for find IDs list
const FINDS_IDS_KEY = 'finds_ids_list';

/**
 * Save a single find to chunked storage
 * @param find Find object to save
 */
function saveChunkedFind(find: Find): void {
  try {
    // Ensure we have an ID
    if (!find.id) {
      console.error('Cannot save find without ID', find);
      return;
    }
    
    // Save the individual find to its own key
    const findKey = `${FINDS_STORAGE_KEY}_${find.id}`;
    localStorage.setItem(findKey, JSON.stringify(find));
    
    // Update the IDs list
    const idsList = getStoredFindIds();
    if (!idsList.includes(find.id)) {
      idsList.push(find.id);
      localStorage.setItem(FINDS_IDS_KEY, JSON.stringify(idsList));
    }
    
    console.log(`Saved find ${find.id} to chunked storage`);
  } catch (error) {
    console.error(`Error saving find ${find.id} to chunked storage:`, error);
  }
}

/**
 * Get list of all stored find IDs
 */
function getStoredFindIds(): number[] {
  try {
    const ids = localStorage.getItem(FINDS_IDS_KEY);
    return ids ? JSON.parse(ids) : [];
  } catch (error) {
    console.error('Error getting stored find IDs:', error);
    return [];
  }
}

/**
 * Get a single find from chunked storage
 * @param id Find ID to retrieve
 */
function getChunkedFind(id: number): Find | null {
  try {
    const findKey = `${FINDS_STORAGE_KEY}_${id}`;
    const findData = localStorage.getItem(findKey);
    return findData ? JSON.parse(findData) : null;
  } catch (error) {
    console.error(`Error getting find ${id} from chunked storage:`, error);
    return null;
  }
}

/**
 * Remove a single find from chunked storage
 * @param id Find ID to remove
 */
function removeChunkedFind(id: number): void {
  try {
    // Remove the individual find
    const findKey = `${FINDS_STORAGE_KEY}_${id}`;
    localStorage.removeItem(findKey);
    
    // Update the IDs list
    const idsList = getStoredFindIds();
    const updatedIds = idsList.filter(findId => findId !== id);
    localStorage.setItem(FINDS_IDS_KEY, JSON.stringify(updatedIds));
    
    console.log(`Removed find ${id} from chunked storage`);
  } catch (error) {
    console.error(`Error removing find ${id} from chunked storage:`, error);
  }
}

/**
 * Clear all finds from chunked storage
 */
export function clearAllFinds(): void {
  try {
    // Get all find IDs
    const idsList = getStoredFindIds();
    
    // Remove each individual find
    idsList.forEach(id => {
      const findKey = `${FINDS_STORAGE_KEY}_${id}`;
      localStorage.removeItem(findKey);
    });
    
    // Clear the IDs list
    localStorage.removeItem(FINDS_IDS_KEY);
    
    // Also clear the legacy storage
    localStorage.removeItem(FINDS_STORAGE_KEY);
    
    console.log('Cleared all finds from storage');
  } catch (error) {
    console.error('Error clearing all finds from storage:', error);
  }
}

/**
 * Synchronizes local finds with server
 * @param serverFinds Finds from server
 */
export function syncFindsWithServer(serverFinds: Find[]): Find[] {
  try {
    // Get locally stored finds with the new chunked method
    const localFinds: Find[] = [];
    const idsList = getStoredFindIds();
    
    // Load each find from chunked storage
    idsList.forEach(id => {
      const find = getChunkedFind(id);
      if (find) {
        localFinds.push(find);
      }
    });
    
    if (localFinds.length === 0 && serverFinds.length === 0) {
      console.log("No finds to synchronize");
      return [];
    }
    
    // Create a map of server finds by ID for easy lookup
    const serverFindMap = new Map(serverFinds.map(find => [find.id, find]));
    
    // Filter out local finds that are already in server finds
    const uniqueLocalFinds = localFinds.filter(localFind => !serverFindMap.has(localFind.id));
    
    if (uniqueLocalFinds.length > 0) {
      console.log(`Found ${uniqueLocalFinds.length} local finds not on server`);
      
      // For now, just merge them in memory
      const combinedFinds = [...serverFinds, ...uniqueLocalFinds];
      
      // Save finds to storage (simplified to reduce performance impact)
      saveFindsToStorage(combinedFinds);
      
      console.log(`Synchronized and saved ${combinedFinds.length} total finds to storage`);
      return combinedFinds;
    } else {
      // No unique local finds, save server finds to storage (simplified)
      saveFindsToStorage(serverFinds);
      
      console.log(`Saved ${serverFinds.length} server finds to storage`);
      return serverFinds;
    }
  } catch (error) {
    console.error("Error synchronizing finds:", error);
    return serverFinds;
  }
}

/**
 * Adds a find to localStorage and attempts to sync with server
 * @param find Find to add
 */
export function addFindToStorage(find: Find): void {
  try {
    if (!find.id) {
      console.error("Cannot add find without an ID", find);
      return;
    }
    
    // Use the chunked storage system
    saveChunkedFind(find);
    
    // Also update the legacy storage for backward compatibility
    const existingFinds = getStoredFinds();
    
    // Check if the find already exists and remove it to avoid duplicates
    const filteredFinds = existingFinds.filter(existingFind => existingFind.id !== find.id);
    
    // Add the new find at the beginning (newest first)
    const updatedFinds = [find, ...filteredFinds];
    saveFindsToStorage(updatedFinds);
    
    console.log(`Added find with ID ${find.id} to storage systems`);
  } catch (error) {
    console.error("Failed to add find to storage:", error);
  }
}

/**
 * Removes a find from storage by ID
 * @param id Find ID to remove
 */
export function removeFindFromStorage(id: number): void {
  try {
    // Remove from chunked storage
    removeChunkedFind(id);
    
    // Also remove from legacy storage for backward compatibility
    const existingFinds = getStoredFinds();
    const filteredFinds = existingFinds.filter(find => find.id !== id);
    saveFindsToStorage(filteredFinds);
    
    console.log(`Removed find with ID ${id} from all storage systems`);
  } catch (error) {
    console.error(`Failed to remove find ${id} from storage:`, error);
  }
}

/**
 * Synchronizes local locations with server
 * @param serverLocations Locations from server
 */
export function syncLocationsWithServer(serverLocations: Location[]): Location[] {
  try {
    // Get locally stored locations from both storage keys
    const mapLocations = safelyParseJSON<Location[]>(LOCATIONS_STORAGE_KEY, []);
    const detectingMapLocations = safelyParseJSON<Location[]>(DETECTING_LOCATIONS_KEY, []);
    
    // Combine local locations from both keys
    const localLocationsMap = new Map<number, Location>();
    
    // Add locations from both sources to the map
    [...mapLocations, ...detectingMapLocations].forEach(location => {
      localLocationsMap.set(location.id, location);
    });
    
    const localLocations = Array.from(localLocationsMap.values());
    
    if (localLocations.length === 0 && serverLocations.length === 0) {
      console.log("No locations to synchronize");
      return [];
    }
    
    // Create a map of server locations by ID for easy lookup
    const serverLocationsMap = new Map(serverLocations.map(location => [location.id, location]));
    
    // Filter out local locations that are already in server locations
    const uniqueLocalLocations = localLocations.filter(local => !serverLocationsMap.has(local.id));
    
    if (uniqueLocalLocations.length > 0) {
      console.log(`Found ${uniqueLocalLocations.length} local locations not on server`);
      
      // Merge them in memory
      const combinedLocations = [...serverLocations, ...uniqueLocalLocations];
      
      // Save to both localStorage keys
      localStorage.setItem(LOCATIONS_STORAGE_KEY, JSON.stringify(combinedLocations));
      localStorage.setItem(DETECTING_LOCATIONS_KEY, JSON.stringify(combinedLocations));
      
      console.log(`Synchronized and saved ${combinedLocations.length} total locations to localStorage`);
      return combinedLocations;
    } else {
      // No unique local locations, save server locations to localStorage
      localStorage.setItem(LOCATIONS_STORAGE_KEY, JSON.stringify(serverLocations));
      localStorage.setItem(DETECTING_LOCATIONS_KEY, JSON.stringify(serverLocations));
      
      console.log(`Saved ${serverLocations.length} server locations to localStorage`);
      return serverLocations;
    }
  } catch (error) {
    console.error("Error synchronizing locations:", error);
    return serverLocations;
  }
}