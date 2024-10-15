import { atom } from "nanostores";

export const $authStatus = atom<
  | { status: "unauthenticated" | "loading" | "authenticated" }
  | { status: "forceChangePassword"; email: string }
>({ status: "loading" });
