import { useEffect } from "react";
import Routes from "./Routes.tsx";
import { LoginForm } from "./pages/LoginContainer";
import { Navbar } from "./containers/Navbar.tsx";
import { Auth } from "aws-amplify";
import { $authStatus } from "./lib/contextLib.ts";
import { useStore } from '@nanostores/react'

export function App() {
  const authStatus = useStore($authStatus)

  useEffect(() => {
    Auth.currentSession()
      .then(() => $authStatus.set({status: "authenticated"}))
      .catch(() => $authStatus.set({status: "unauthenticated"}))
  }, []);

  switch (authStatus.status) {
    case "authenticated":
      return <AuthorizedWrapper />
    case "unauthenticated":
      return <LoginForm />
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
