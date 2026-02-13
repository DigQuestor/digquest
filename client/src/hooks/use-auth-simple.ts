import { ReactNode, useState, useEffect } from "react";
import { User } from "@shared/schema";

// Define storage keys for localStorage
const USER_STORAGE_KEY = "metal_detecting_user";
const FINDS_STORAGE_KEY = "metal_detecting_finds";
const PRESET_USER_KEY = "digquestor_profile";
const ALL_USERS_CACHE_KEY = "metal_detecting_users_cache";

// Helper function to safely stringify Date objects
const safeStringify = (obj: any) => {
  return JSON.stringify(obj, (key, value) => {
    if (key === 'created_at' && value instanceof Date) {
      return value.toISOString();
    }
    return value;
  });
};

/**
 * Helper functions to manage a cache of all users
 */
const userCache = {
  // Get all users from the cache
  getAllUsers: (): User[] => {
    try {
      const storedUsers = localStorage.getItem(ALL_USERS_CACHE_KEY);
      if (storedUsers) {
        const users = JSON.parse(storedUsers) as User[];
        
        // Convert date strings back to Date objects
        return users.map((user) => {
          if (typeof user.created_at === 'string') {
            user.created_at = new Date(user.created_at);
          }
          return user;
        });
      }
      return [];
    } catch (error) {
      console.error("Failed to parse stored users:", error);
      localStorage.removeItem(ALL_USERS_CACHE_KEY);
      return [];
    }
  },
  
  // Get a specific user by ID
  getUserById: (userId: number): User | undefined => {
    const users = userCache.getAllUsers();
    return users.find(user => user.id === userId);
  },
  
  // Add a user to the cache
  addUser: (user: User) => {
    try {
      const existingUsers = userCache.getAllUsers();
      
      // Check if user already exists
      const existingIndex = existingUsers.findIndex(u => u.id === user.id);
      
      // If user exists, update it; otherwise add the new user
      if (existingIndex >= 0) {
        existingUsers[existingIndex] = user;
      } else {
        existingUsers.push(user);
      }
      
      localStorage.setItem(ALL_USERS_CACHE_KEY, safeStringify(existingUsers));
      console.log(`User #${user.id} (${user.username}) cached successfully`);
    } catch (error) {
      console.error("Failed to cache user:", error);
    }
  },

  // Sync cache with server data to remove deleted users
  syncWithServer: (serverUsers: User[]) => {
    try {
      // Replace cache with fresh server data
      localStorage.setItem(ALL_USERS_CACHE_KEY, safeStringify(serverUsers));
      console.log(`User cache synced with server. ${serverUsers.length} users cached.`);
    } catch (error) {
      console.error("Failed to sync user cache with server:", error);
    }
  },

  // Clear all cached users
  clearCache: () => {
    try {
      localStorage.removeItem(ALL_USERS_CACHE_KEY);
      console.log("User cache cleared");
    } catch (error) {
      console.error("Failed to clear user cache:", error);
    }
  }
};

/**
 * This function gets the preset profile for DigQuestor to ensure consistency
 */
const getPresetProfile = (username: string): User => {
  // Try to get from localStorage first
  try {
    const storedProfile = localStorage.getItem(PRESET_USER_KEY);
    if (storedProfile) {
      const profile = JSON.parse(storedProfile);
      console.log("Found preset profile in localStorage");
      return {
        ...profile,
        created_at: new Date()
      };
    }
  } catch (error) {
    console.error("Error loading preset profile:", error);
  }
  
  // Return a default profile if none is found
  return {
    id: 1,
    username: username || "DigQuestor",
    email: "danishnest@gmail.com",
    password: "password123",
    isEmailVerified: true,
    emailVerificationToken: null,
    emailVerificationExpires: null,
    avatarUrl: `https://api.dicebear.com/7.x/personas/svg?seed=${username || "DigQuestor"}`,
    bio: "I'm a metal detecting enthusiast who loves exploring the countryside!",
    created_at: new Date()
  };
};

// Export helper functions for finds persistence
export const findStorage = {
  // Save finds to localStorage
  saveFinds: (finds: any[]) => {
    try {
      localStorage.setItem(FINDS_STORAGE_KEY, safeStringify(finds));
    } catch (error) {
      console.error("Failed to save finds to localStorage:", error);
    }
  },
  
  // Get finds from localStorage
  getFinds: () => {
    try {
      const storedFinds = localStorage.getItem(FINDS_STORAGE_KEY);
      if (storedFinds) {
        const parsedFinds = JSON.parse(storedFinds);
        
        // Convert date strings back to Date objects
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
  },
  
  // Add a single find to localStorage
  addFind: (find: any) => {
    try {
      const existingFinds = findStorage.getFinds();
      const updatedFinds = [find, ...existingFinds];
      findStorage.saveFinds(updatedFinds);
    } catch (error) {
      console.error("Failed to add find to localStorage:", error);
    }
  },
  
  // Remove a specific find by ID from localStorage
  removeFind: (id: number) => {
    try {
      const existingFinds = findStorage.getFinds();
      const updatedFinds = existingFinds.filter((find: any) => find.id !== id);
      findStorage.saveFinds(updatedFinds);
      console.log(`Removed find with ID ${id} from localStorage`);
      return true;
    } catch (error) {
      console.error("Failed to remove find from localStorage:", error);
      return false;
    }
  },
  
  // Update a specific find by ID in localStorage
  updateFind: (id: number, updatedData: Partial<any>) => {
    try {
      const existingFinds = findStorage.getFinds();
      const updatedFinds = existingFinds.map((find: any) => {
        if (find.id === id) {
          return { ...find, ...updatedData };
        }
        return find;
      });
      findStorage.saveFinds(updatedFinds);
      console.log(`Updated find with ID ${id} in localStorage`);
      return true;
    } catch (error) {
      console.error("Failed to update find in localStorage:", error);
      return false;
    }
  },
  
  // Clear all finds from localStorage
  clearFinds: () => {
    try {
      localStorage.removeItem(FINDS_STORAGE_KEY);
      console.log("Cleared all finds from localStorage");
    } catch (error) {
      console.error("Failed to clear finds from localStorage:", error);
    }
  }
};

/**
 * Simplified auth hook for development
 * Handles user authentication with localStorage persistence
 */
// Export the userCache for use in other components
export { userCache };

export function useAuth() {
  // Create state to track the current user
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // We no longer use a default mock user - we create users with specific values
  // This ensures consistent behavior and proper persistence of all user attributes
  
  // Load user from localStorage on initialization
  useEffect(() => {
    const initializeAuth = async () => {
      setIsLoading(true);
      
      try {
        // Fetch all users from the server to populate our cache
        console.log("Fetching all users to update cache...");
        const response = await fetch('/api/users');
        if (response.ok) {
          const users = await response.json();
          userCache.syncWithServer(users);
        }
      } catch (error) {
        console.error("Error fetching users for cache:", error);
      }
      
      try {
        // Mark first visit but don't prevent authentication  
        const isFirstVisit = !localStorage.getItem('site_visited');
        if (isFirstVisit) {
          console.log("First visit detected - marking as visited");
          localStorage.setItem('site_visited', 'true');
        }
        
        // Check for active server session first
        console.log("Checking for active server session...");
        const sessionResponse = await fetch('/api/auth/user', {
          credentials: 'include'
        });
        
        if (sessionResponse.ok) {
          const serverUser = await sessionResponse.json();
          console.log("Active server session found for:", serverUser.username);
          
          if (typeof serverUser.created_at === 'string') {
            serverUser.created_at = new Date(serverUser.created_at);
          }
          
          localStorage.setItem(USER_STORAGE_KEY, safeStringify(serverUser));
          userCache.addUser(serverUser);
          setUser(serverUser);
          setIsLoading(false);
          return;
        } else {
          console.log("No active server session found");
        }
        
        // Fallback: Check localStorage for saved user
        const storedUser = localStorage.getItem(USER_STORAGE_KEY);
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          
          if (parsedUser && parsedUser.username) {
            if (typeof parsedUser.created_at === 'string') {
              parsedUser.created_at = new Date(parsedUser.created_at);
            }
            
            console.log("User loaded from storage:", parsedUser.username);
            
            if (parsedUser.username === "DigQuestor") {
              fetch(`/api/users/${parsedUser.id}`)
                .then(response => response.json())
                .then(freshUser => {
                  console.log("Fetched fresh DigQuestor data with avatar:", freshUser.avatarUrl);
                  setUser(freshUser);
                  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(freshUser));
                })
                .catch(error => {
                  console.error("Error fetching fresh user data:", error);
                  setUser(parsedUser);
                });
            } else {
              if (parsedUser.avatarUrl) {
                const avatarPreview = parsedUser.avatarUrl.substring(0, 30) + "...";
                console.log("Loaded avatar URL from storage:", avatarPreview);
              } else {
                console.log("No avatar URL found in stored user data");
              }
              setUser(parsedUser);
            }
          }
        }
      } catch (error) {
        console.error("Failed to initialize auth:", error);
        localStorage.removeItem(USER_STORAGE_KEY);
      } finally {
        setIsLoading(false);
      }
    };
    
    initializeAuth();
  }, []);
  
  // Listen for auth changes from other instances of the hook
  useEffect(() => {
    const handleAuthChange = async () => {
      console.log("Auth change detected, refreshing user state...");
      
      // Check for active server session
      try {
        const sessionResponse = await fetch('/api/auth/user', {
          credentials: 'include'
        });
        
        if (sessionResponse.ok) {
          const serverUser = await sessionResponse.json();
          console.log("Refreshed user from server session:", serverUser.username);
          
          if (typeof serverUser.created_at === 'string') {
            serverUser.created_at = new Date(serverUser.created_at);
          }
          
          setUser(serverUser);
          return;
        }
      } catch (error) {
        console.error("Error refreshing user from server:", error);
      }
      
      // Fallback to localStorage
      const storedUser = localStorage.getItem(USER_STORAGE_KEY);
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        if (typeof parsedUser.created_at === 'string') {
          parsedUser.created_at = new Date(parsedUser.created_at);
        }
        console.log("Refreshed user from localStorage:", parsedUser.username);
        setUser(parsedUser);
      } else {
        setUser(null);
      }
    };
    
    // Listen for custom auth change events
    window.addEventListener('auth-changed', handleAuthChange);
    
    return () => {
      window.removeEventListener('auth-changed', handleAuthChange);
    };
  }, []);
  
  // Function to handle login
  const login = async (username: string, password: string) => {
    try {
      console.log("Logging in as:", username);
      
      // Only use the preset approach for DigQuestor to ensure consistency
      if (username.toLowerCase() === "digquestor" && username !== "DigQuestor") {
        console.log("Converting username to proper case 'DigQuestor'");
        username = "DigQuestor"; // Ensure consistent casing
      }
      
      if (username === "DigQuestor") {
        // For DigQuestor, use server-side authentication to establish proper session
        console.log("Attempting server-side login for DigQuestor...");
        
        try {
          const loginResponse = await fetch('/api/users/login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include', // Include cookies for session
            body: JSON.stringify({ username, password }),
          });
          
          if (!loginResponse.ok) {
            const errorData = await loginResponse.json();
            if (errorData.accountNotFound) {
              throw new Error('Account not found. If you previously had an account, it may have been removed during cleanup. Please register a new account to continue using DigQuest.');
            }
            throw new Error(errorData.message || 'Login failed. Invalid credentials.');
          }
          
          const userData = await loginResponse.json();
          console.log("Server login successful for DigQuestor:", userData);
          
          // Ensure created_at is a Date object
          if (typeof userData.created_at === 'string') {
            userData.created_at = new Date(userData.created_at);
          }
          
          // Save the user data
          localStorage.setItem(USER_STORAGE_KEY, safeStringify(userData));
          localStorage.setItem(PRESET_USER_KEY, safeStringify(userData));
          
          // Add to the user cache
          userCache.addUser(userData);
          
          setUser(userData);
          
          // Notify other hook instances of auth change
          window.dispatchEvent(new Event('auth-changed'));
          
          console.log("DigQuestor logged in successfully with server session");
          return userData;
          
        } catch (error) {
          console.error("Server login failed for DigQuestor:", error);
          throw error;
        }
      } else {
        try {
          // First generate a consistent avatar URL for this user
          const avatarUrl = `https://api.dicebear.com/7.x/personas/svg?seed=${username}`;
            
          // Check if user already exists in the system
          console.log(`Checking if user ${username} exists...`);
          const response = await fetch(`/api/users/by-username/${username}`);
          
          if (response.ok) {
            // User exists, use login API
            console.log(`User ${username} exists, attempting to log in...`);
            const loginResponse = await fetch('/api/users/login', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              credentials: 'include', // Include cookies for session
              body: JSON.stringify({ username, password }),
            });
            
            if (!loginResponse.ok) {
              const errorData = await loginResponse.json();
              if (errorData.emailVerificationRequired) {
                throw new Error('Email verification required. Please check your inbox and click the verification link before logging in.');
              }
              if (errorData.accountNotFound) {
                throw new Error('Account not found. If you previously had an account, it may have been removed during cleanup. Please register a new account to continue using DigQuest.');
              }
              throw new Error(errorData.message || 'Login failed. Invalid credentials.');
            }
            
            const userData = await loginResponse.json();
            console.log(`Login successful for ${username}:`, userData);
            
            // Ensure created_at is a Date object
            if (typeof userData.created_at === 'string') {
              userData.created_at = new Date(userData.created_at);
            }
            
            // Save the user to localStorage
            localStorage.setItem(USER_STORAGE_KEY, safeStringify(userData));
            
            // Add to the user cache
            userCache.addUser(userData);
            
            // Update state
            setUser(userData);
            
            // Notify other hook instances of auth change
            window.dispatchEvent(new Event('auth-changed'));
            
            console.log("User logged in successfully:", username);
            return userData;
            
          } else if (response.status === 404) {
            // User doesn't exist, they need to sign up first
            throw new Error('Account not found. Please use the Sign Up button to create an account first.');
          } else {
            // Some other error occurred
            throw new Error('Unable to check user existence. Please try again.');
          }
        } catch (error) {
          console.error("Registration/login error:", error);
          throw error;
        }
      }
    } catch (error) {
      console.error("Login error:", error);
      throw new Error("Failed to log in. Please try again.");
    }
  };
  
  // Function to handle logout
  const logout = async () => {
    try {
      // Before clearing, save the DigQuestor profile if it exists
      const storedUser = localStorage.getItem(USER_STORAGE_KEY);
      if (storedUser) {
        try {
          const userData = JSON.parse(storedUser);
          if (userData.username?.toLowerCase() === "digquestor" && userData.avatarUrl) {
            console.log("Preserving DigQuestor profile before logout");
            // Save to the preset storage which persists across sessions
            localStorage.setItem(PRESET_USER_KEY, safeStringify(userData));
          }
        } catch (e) {
          console.error("Error preserving profile during logout:", e);
        }
      }
      
      // Call server logout endpoint to clear session
      try {
        await fetch('/api/users/logout', {
          method: 'POST',
          credentials: 'include',
        });
      } catch (e) {
        console.error("Server logout failed:", e);
      }
      
      // Clear user from localStorage
      localStorage.removeItem(USER_STORAGE_KEY);
      
      // DON'T reset the site_visited flag - this prevents proper signup flow
      // The site_visited flag should only be cleared on actual fresh deployment
      // localStorage.removeItem('site_visited');
      
      // Also clear finds and other user-related data
      findStorage.clearFinds();
      
      // Update state first
      setUser(null);
      
      // Notify other hook instances of auth change
      window.dispatchEvent(new Event('auth-changed'));
      
      console.log("User logged out successfully");
      
      // Redirect to homepage after logout
      window.location.href = "/";
    } catch (error) {
      console.error("Logout error:", error);
    }
  };
  
  // Function to update the current user
  const updateUser = async (updatedData: Partial<User>) => {
    if (!user) {
      throw new Error("No user is logged in");
    }
    
    // Create updated user object by merging current user with updates
    const updatedUser = {
      ...user,
      ...updatedData,
      // Ensure we keep the same ID
      id: user.id
    };
    
    // Special handling for avatar URL updates to ensure it's saved correctly
    if (updatedData.avatarUrl) {
      console.log("Updating user with new avatar URL:", updatedData.avatarUrl.substring(0, 50) + "...");
      
      // Make sure URL wasn't truncated if it's a data URL
      if (updatedData.avatarUrl.startsWith('data:') && updatedData.avatarUrl !== updatedUser.avatarUrl) {
        updatedUser.avatarUrl = updatedData.avatarUrl;
      }
    }
    
    try {
      // Send update to server API to ensure data is persisted
      console.log(`Sending profile update to server for user ID ${user.id}`);
      const response = await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedData),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to update user profile on server');
      }
      
      // Get the server's updated user data
      const serverUpdatedUser = await response.json();
      console.log("Server confirmed profile update:", serverUpdatedUser);
      
      // Use server data to ensure we have the most up-to-date information
      const finalUserData = {
        ...updatedUser,
        ...serverUpdatedUser,
        avatarUrl: updatedData.avatarUrl ?? serverUpdatedUser.avatarUrl ?? updatedUser.avatarUrl
      };
      
      // Save the updated user to localStorage
      localStorage.setItem(USER_STORAGE_KEY, safeStringify(finalUserData));
      
      // Add to the user cache (for all users)
      userCache.addUser(finalUserData);
      
      // For DigQuestor user, also update the preset profile storage
      // This is what persists across sessions
      if (finalUserData.username.toLowerCase() === "digquestor") {
        localStorage.setItem(PRESET_USER_KEY, safeStringify(finalUserData));
        console.log("Updated DigQuestor's persistent profile");
        
        // Double verify we have the avatar URL stored correctly
        try {
          const storedProfile = localStorage.getItem(PRESET_USER_KEY);
          if (storedProfile) {
            const parsed = JSON.parse(storedProfile);
            if (parsed.avatarUrl !== finalUserData.avatarUrl) {
              console.warn("Avatar URL mismatch, forcing update");
              parsed.avatarUrl = finalUserData.avatarUrl;
              localStorage.setItem(PRESET_USER_KEY, safeStringify(parsed));
            }
          }
        } catch (error) {
          console.error("Error verifying avatar storage:", error);
        }
      }
      
      // Update state
      setUser(finalUserData);
      
      // Notify other hook instances of auth change
      window.dispatchEvent(new Event('auth-changed'));
      
      console.log("User profile updated:", finalUserData.username);
      
      // Print what's in localStorage to debug
      try {
        const storedUser = localStorage.getItem(USER_STORAGE_KEY);
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          console.log("Verified localStorage update - avatar:", 
            parsedUser.avatarUrl ? parsedUser.avatarUrl.substring(0, 50) + "..." : "no avatar");
        }
        
        // Also verify the preset storage if this is DigQuestor
        if (finalUserData.username.toLowerCase() === "digquestor") {
          const presetUser = localStorage.getItem(PRESET_USER_KEY);
          if (presetUser) {
            const parsedPreset = JSON.parse(presetUser);
            console.log("Verified PRESET profile storage - avatar:", 
              parsedPreset.avatarUrl ? parsedPreset.avatarUrl.substring(0, 50) + "..." : "no avatar");
          }
        }
      } catch (error) {
        console.error("Error checking localStorage after update:", error);
      }
      
      return finalUserData;
    } catch (error) {
      console.error("Error updating user profile:", error);
      // Still update local state even if server update fails
      localStorage.setItem(USER_STORAGE_KEY, safeStringify(updatedUser));
      setUser(updatedUser);
      return updatedUser;
    }
  };

  // Function to delete a user account
  const deleteUser = async () => {
    if (!user) {
      throw new Error("No user is logged in");
    }
    
    try {
      // Only allow deletion of non-DigQuestor accounts
      if (user.username.toLowerCase() === "digquestor") {
        throw new Error("Cannot delete the default account");
      }
      
      // Make API call to delete user and their data
      const response = await fetch(`/api/users/${user.id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete account");
      }
      
      // Remove user from localStorage
      localStorage.removeItem(USER_STORAGE_KEY);
      
      // Clear user state
      setUser(null);
      
      console.log("User account deleted successfully");
      
      return true;
    } catch (error) {
      console.error("Error deleting user account:", error);
      throw error;
    }
  };

  return {
    user,
    isLoading,
    login,
    logout,
    updateUser,
    deleteUser
  };
}


/**
 * Simple auth provider that just passes children through
 */
export function AuthProvider(props: { children: ReactNode }): ReactNode {
  return props.children;
}
