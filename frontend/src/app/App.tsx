import { RouterProvider } from "react-router";
import { ThemeProvider } from "@mui/material/styles";
import { Auth0Provider } from "@auth0/auth0-react";
import { router } from "./routes";
import { theme } from "./theme";

export default function App() {
  const domain = import.meta.env.VITE_AUTH0_DOMAIN || "dev-clfi6t361gyrqlsw.us.auth0.com";
  const clientId = import.meta.env.VITE_AUTH0_CLIENT_ID || "wsZI4UzWjp8bc5bjxt3C7RnDbzZGXstu";
  const audience = import.meta.env.VITE_AUTH0_AUDIENCE || "https://inmob2-api";

  return (
    <Auth0Provider
      domain={domain}
      clientId={clientId}
      authorizationParams={{
        redirect_uri: window.location.origin, // Esto detecta si estás en Railway o Local de forma automática
        audience: audience,
      }}
    >
      <ThemeProvider theme={theme}>
        <RouterProvider router={router} />
      </ThemeProvider>
    </Auth0Provider>
  );
}
