export {};

declare global {
  interface Window {
    __MOVIEPAINTER_ENV?: {
      apiBaseUrl?: string;
      supabaseAnonKey?: string;
      supabasePublishableKey?: string;
      supabaseUrl?: string;
    };
  }
}
