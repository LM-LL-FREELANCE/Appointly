import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { MantineProvider } from '@mantine/core'
import '@mantine/core/styles.css'
import '@mantine/dates/styles.css'
import './index.css'
import App from './App.jsx'
// import { appTheme, cssVariablesResolver } from './theme.js'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* theme={appTheme} cssVariablesResolver={cssVariablesResolver} */}
    <MantineProvider defaultColorScheme="light">
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </MantineProvider>
  </StrictMode>,
)
