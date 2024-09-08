import { useState } from 'react';
import { AppContext, AppContextType } from "./lib/contextLib";
import Routes from './Routes.tsx';
import { LoginForm } from './pages/LoginContainer';
import { Navbar } from './containers/Navbar.tsx';

export function App() {
    const [isAuthenticated, userHasAuthenticated] = useState(false);

    return <AppContext.Provider
        value={{ isAuthenticated, userHasAuthenticated } as AppContextType}
    >
        {isAuthenticated ? (
            <AuthorizedWrapper />
        ) : <LoginForm />}
    </AppContext.Provider>
}

function AuthorizedWrapper() {
    return <>
        <div className='sm:px-6 lg:px-8 py-3'>
            <Navbar />
            <div className='py-3'></div>
            <Routes />
        </div>
    </>
}