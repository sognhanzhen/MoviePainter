type RuntimeConfig = {
  apiBaseUrl: string;
  supabaseAnonKey: string;
  supabasePublishableKey: string;
  supabaseUrl: string;
};

function readConfig(): RuntimeConfig {
  if (typeof window === "undefined") {
    return {
      apiBaseUrl: "/api",
      supabaseAnonKey: "",
      supabasePublishableKey: "",
      supabaseUrl: ""
    };
  }

  const config = window.__MOVIEPAINTER_ENV;

  return {
    apiBaseUrl: config?.apiBaseUrl?.trim() || "/api",
    supabaseAnonKey: config?.supabaseAnonKey?.trim() || "",
    supabasePublishableKey: config?.supabasePublishableKey?.trim() || "",
    supabaseUrl: config?.supabaseUrl?.trim() || ""
  };
}

export const runtimeConfig = readConfig();
