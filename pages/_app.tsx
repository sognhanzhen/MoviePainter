import type { AppProps } from "next/app";
import Script from "next/script";
import "../styles/globals.css";

function getRuntimeConfig() {
  return {
    apiBaseUrl: "/api",
    supabaseAnonKey: process.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "",
    supabasePublishableKey:
      process.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "",
    supabaseUrl: process.env.VITE_SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? ""
  };
}

export default function MoviePainterApp({ Component, pageProps }: AppProps) {
  const runtimeConfig = getRuntimeConfig();

  return (
    <>
      <Script id="moviepainter-runtime-config" strategy="beforeInteractive">
        {`window.__MOVIEPAINTER_ENV=${JSON.stringify(runtimeConfig)};`}
      </Script>
      <Component {...pageProps} />
    </>
  );
}
