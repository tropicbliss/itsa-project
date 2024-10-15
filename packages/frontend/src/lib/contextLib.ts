import { atom } from "nanostores";

export const $authStatus = atom<
  | { status: "unauthenticated" | "loading" | "authenticated" }
  | { status: "forceChangePassword" | "setupTotp" | "verifyTotp"; user: any }
>({ status: "loading" });
