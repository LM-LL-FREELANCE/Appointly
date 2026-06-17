import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { MantineProvider } from '@mantine/core'
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import '@mantine/core/styles.css'
import '@mantine/dates/styles.css'
import './index.css'
import App from './App.jsx'
import { appTheme, cssVariablesResolver } from './theme.js'
// import { appTheme, cssVariablesResolver } from './theme.js'
const queryClient = new QueryClient()
createRoot(document.getElementById('root')).render(
  <StrictMode>
    theme={appTheme} cssVariablesResolver={cssVariablesResolver}
    <MantineProvider defaultColorScheme="light">
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </QueryClientProvider>
    </MantineProvider>
  </StrictMode>,
)
