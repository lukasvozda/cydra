/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly DFX_NETWORK: string
  readonly CANISTER_ID_BACKEND: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
