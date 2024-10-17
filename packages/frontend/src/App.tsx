import { useEffect } from "react";
import Routes from "./Routes.tsx";
import { LoginForm } from "./pages/LoginContainer";
import { Navbar } from "./containers/Navbar.tsx";
import { Auth } from "aws-amplify";
import { $authStatus } from "./lib/contextLib.ts";
import { useStore } from '@nanostores/react'
import { ForceChangePasswordContainer } from "./pages/ForceChangePasswordContainer.tsx";
import { SetupTotpContainer } from "./pages/SetupTotpContainer.tsx";
import { LoginTotpContainer } from "./pages/LoginTotpContainer.tsx";
import { ForgotPasswordContainer } from "./pages/ForgotPasswordContainer.tsx";
import { ForgotPasswordSubmitContainer } from "./pages/ForgotPasswordSubmitContainer.tsx";

export function App() {
  const authStatus = useStore($authStatus)

  useEffect(() => {
    Auth.currentSession()
      .then(() => $authStatus.set({ status: "authenticated" }))
      .catch(() => $authStatus.set({ status: "unauthenticated" }))
  }, []);

  switch (authStatus.status) {
    case "authenticated":
      return <AuthorizedWrapper />
    case "unauthenticated":
      return <LoginForm />
    case "forceChangePassword":
      return <ForceChangePasswordContainer user={authStatus.user} />
    case "setupTotp":
      return <SetupTotpContainer user={authStatus.user} />
    case "verifyTotp":
      return <LoginTotpContainer user={authStatus.user} />
    case "forgotPassword":
      return <ForgotPasswordContainer />
    case "forgotPasswordSubmit":
      return <ForgotPasswordSubmitContainer username={authStatus.username} />
    default:
      return <></>
  }
}

function AuthorizedWrapper() {
  return (
    <>
      <div className="flex min-h-screen w-full flex-col">
        <Navbar />
        <main className="p-4 md:p-8">
          <Routes />
        </main>
      </div>
    </>
  );
}
