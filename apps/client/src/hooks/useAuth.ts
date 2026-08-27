import { useAuthStore } from '../store/authStore';

export const useAuth = () => {
  const { user, isLoggingIn, isRegistering, error, login, register, logout, clearError } = useAuthStore();
  return { user, isLoggingIn, isRegistering, loginError: error, login, register, logout, clearError };
};

export const useCurrentUser = () => {
  const { user, isLoading } = useAuthStore();
  return { user, isLoading };
};

export const useIsAdmin = () => {
  const user = useAuthStore((s) => s.user);
  return user?.role === 'ADMIN';
};