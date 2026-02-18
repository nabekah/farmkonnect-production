import { trpc } from "@/lib/trpc";
import { UNAUTHED_ERR_MSG } from '@shared/const';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink, TRPCClientError } from "@trpc/client";
import { createRoot } from "react-dom/client";
import superjson from "superjson";
import App from "./App";
import { getLoginUrl } from "./const";
import "./index.css";
import { CartProvider } from "@/contexts/CartContext";
import { ThemeColorProvider } from "@/contexts/ThemeColorContext";
import { OfflineQueueProvider } from "@/contexts/OfflineQueueContext";
import { ToastProvider } from "@/contexts/ToastContext";
import { NotificationHistoryProvider } from "@/contexts/NotificationHistoryContext";

const queryClient = new QueryClient();

const redirectToLoginIfUnauthorized = (error: unknown) => {
  if (!(error instanceof TRPCClientError)) return;
  if (typeof window === "undefined") return;

  const isUnauthorized = error.message === UNAUTHED_ERR_MSG;

  if (!isUnauthorized) return;

  // Don't redirect on root page or landing page - allow unauthenticated access
  const currentPath = window.location.pathname;
  if (currentPath === "/" || currentPath === "") return;

  window.location.href = getLoginUrl();
};

queryClient.getQueryCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.query.state.error;
    redirectToLoginIfUnauthorized(error);
    console.error("[API Query Error]", error);
  }
});

queryClient.getMutationCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.mutation.state.error;
    redirectToLoginIfUnauthorized(error);
    console.error("[API Mutation Error]", error);
  }
});

const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: "/api/trpc",
      transformer: superjson,
      fetch(input, init) {
        return globalThis.fetch(input, {
          ...(init ?? {}),
          credentials: "include",
        });
      },
    }),
  ],
});

createRoot(document.getElementById("root")!).render(
  <trpc.Provider client={trpcClient} queryClient={queryClient}>
    <QueryClientProvider client={queryClient}>
      <ThemeColorProvider>
        <ToastProvider>
          <NotificationHistoryProvider>
            <OfflineQueueProvider>
              <CartProvider>
                <App />
              </CartProvider>
            </OfflineQueueProvider>
          </NotificationHistoryProvider>
        </ToastProvider>
      </ThemeColorProvider>
    </QueryClientProvider>
  </trpc.Provider>
);
