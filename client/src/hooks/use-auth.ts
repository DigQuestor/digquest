// Temporary stub implementation
export function useAuth() {
  return {
    user: null,
    login: async () => {},
    register: async () => {},
    logout: () => {},
    isLoading: false
  };
}

// AuthProvider is temporarily removed
export function AuthProvider({ children }: { children: React.ReactNode }) {
  return children;
}