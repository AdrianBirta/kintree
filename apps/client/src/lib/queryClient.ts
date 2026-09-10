import { QueryClient } from '@tanstack/react-query';

// O singură instanță de QueryClient pentru toată aplicația — se creează o
// dată, la nivel de modul, și se dă mai departe prin <QueryClientProvider>
// din main.tsx.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Datele sunt considerate "proaspete" 30 de secunde — cât timp nu au
      // trecut, navigarea între pagini NU mai declanșează un request nou,
      // ci reutilizează direct ce e deja în cache. O mutație (create/update/
      // link/unlink/etc.) invalidează explicit cheile afectate și forțează
      // un refetch imediat, indiferent de staleTime.
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});