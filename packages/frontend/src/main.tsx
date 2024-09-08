import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { BrowserRouter as Router } from "react-router-dom";
import { Amplify } from "aws-amplify";
import config from "./config.ts";
import { Toaster } from "@/components/ui/toaster"
import { ThemeProvider } from './components/theme-provider.tsx';
import { App } from './App.tsx';

Amplify.configure({
  Auth: {
    mandatorySignIn: true,
    region: config.cognito.REGION,
    userPoolId: config.cognito.USER_POOL_ID,
    identityPoolId: config.cognito.IDENTITY_POOL_ID,
    userPoolWebClientId: config.cognito.APP_CLIENT_ID,
  },
  API: {
    endpoints: [
      {
        name: "api",
        endpoint: config.apiGateway.URL,
        region: config.apiGateway.REGION,
      },
    ],
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Router>
      <ThemeProvider storageKey="vite-ui-theme">
        <App />
      </ThemeProvider>
      <Toaster />
    </Router>
  </StrictMode>,
)
