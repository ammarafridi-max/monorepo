"use client";

import { useState, Suspense } from "react";
import { SessionProvider } from "next-auth/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { InsuranceProvider } from "../../contexts/InsuranceContext.js";
import { UserAuthProvider } from "../../contexts/UserAuthContext.js";
import { CurrencyProvider } from "../../contexts/CurrencyContext.js";

export default function Providers({ children }) {

  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            retry: 1,
          },
        },
      }),
  );

  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        <UserAuthProvider>
          <CurrencyProvider>
            <Suspense>
              <InsuranceProvider>{children}</InsuranceProvider>
            </Suspense>
          </CurrencyProvider>
        </UserAuthProvider>
      </QueryClientProvider>
    </SessionProvider>
  );
}
