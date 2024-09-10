/// <reference types="vite/client" />
  interface ImportMetaEnv {
    readonly VITE_REGION: string
  readonly VITE_API_URL: string
  readonly VITE_USER_POOL_ID: string
  readonly VITE_IDENTITY_POOL_ID: string
  readonly VITE_USER_POOL_CLIENT_ID: string
  readonly VITE_ROOT_ADMIN_GROUP: string
  readonly VITE_ADMIN_GROUP: string
  readonly VITE_AGENT_GROUP: string
  }
  interface ImportMeta {
    readonly env: ImportMetaEnv
  }