import { atom } from "nanostores";

export const $authStatus = atom<
  | {
      status:
        | "unauthenticated"
        | "loading"
        | "authenticated"
        | "forgotPassword";
    }
  | { status: "forceChangePassword" | "setupTotp" | "verifyTotp"; user: any }
  | { status: "forgotPasswordSubmit"; username: string }
>({ status: "loading" });
