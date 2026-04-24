import { useInternetIdentity } from "@caffeineai/core-infrastructure";

export interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  principal: string | null;
  login: () => void;
  logout: () => void;
}

export function useAuth(): AuthState {
  const {
    isAuthenticated,
    isLoggingIn,
    isInitializing,
    identity,
    login,
    clear,
  } = useInternetIdentity();

  const isLoading = isLoggingIn || isInitializing;
  const principal = identity ? identity.getPrincipal().toText() : null;

  return {
    isAuthenticated,
    isLoading,
    principal,
    login,
    logout: clear,
  };
}
