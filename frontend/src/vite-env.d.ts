/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_APP_TITLE: string;
  readonly VITE_APP_VERSION: string;
  readonly VITE_DEFAULT_MAP_CENTER_LAT: string;
  readonly VITE_DEFAULT_MAP_CENTER_LNG: string;
  readonly VITE_DEFAULT_MAP_ZOOM: string;
  readonly VITE_DEFAULT_SEARCH_RADIUS: string;
  readonly VITE_DEV_MODE: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}