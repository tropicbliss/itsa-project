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
      <div className="sm:px-6 lg:px-8 py-3">
        <Navbar />
        <div className="py-3"></div>
        <Routes />
      </div>
    </>
  );
}
