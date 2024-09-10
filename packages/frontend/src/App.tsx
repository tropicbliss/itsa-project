import { useEffect, useState } from "react";
import { AppContext, AppContextType } from "./lib/contextLib";
import Routes from "./Routes.tsx";
import { LoginForm } from "./pages/LoginContainer";
import { Navbar } from "./containers/Navbar.tsx";
import { Auth } from "aws-amplify";

export function App() {
  const [isAuthenticated, userHasAuthenticated] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(true);

  useEffect(() => {
    Auth.currentSession()
      .then(() => userHasAuthenticated(true))
      .catch(() => {})
      .finally(() => setIsAuthenticating(false));
  }, []);

  if (isAuthenticating) {
    return <></>;
  }

  return (
    <AppContext.Provider
      value={{ isAuthenticated, userHasAuthenticated } as AppContextType}
    >
      {isAuthenticated ? <AuthorizedWrapper /> : <LoginForm />}
    </AppContext.Provider>
  );
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
