import { toaster } from "@/components/ui/toaster";

import { MutationCache, QueryCache, QueryClient } from "@tanstack/react-query";

type Error = {
  status: string;
  message?: string;
  description?: string;
};

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false,
    },
  },
  queryCache: new QueryCache({
    onError: (error: unknown, query) => {
      const err = error as Error;

      // Skip showing toaster for 401 errors
      if (err.status === "401") return;

      toaster.error({
        title: err.message ?? "Could not load content",
        description:
          err.description ?? "Something went wrong while fetching data.",
      });
      console.error("Query Error:", err, "Query:", query);
    },
  }),
  mutationCache: new MutationCache({
    onError: (error: unknown, _variables, _context, mutation) => {
      const err = error as Error;
      toaster.error({
        title: err.message ?? "Could not complete action",
        description:
          err.description ?? "Something went wrong while saving changes.",
      });
      console.error("Mutation Error:", err, "Mutation:", mutation);
    },
  }),
});
