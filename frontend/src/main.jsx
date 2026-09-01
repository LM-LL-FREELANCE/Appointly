import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { MantineProvider } from '@mantine/core'
import { QueryClient, QueryClientProvider, MutationCache } from "@tanstack/react-query"
import { ReactQueryDevtools } from "@tanstack/react-query-devtools"
import '@mantine/core/styles.css'
import '@mantine/dates/styles.css'
import '@mantine/schedule/styles.css'
import './index.css'
import App from './App.jsx'
import { appTheme, cssVariablesResolver } from './theme.js'
import { Notifications, notifications } from '@mantine/notifications'
import { IconX } from '@tabler/icons-react'
import '@mantine/core/styles.css'
import '@mantine/notifications/styles.css'

const queryClient = new QueryClient({
  mutationCache: new MutationCache({
    onError: (error, _variables, _context, mutation) => {
      if (mutation.meta?.silent) return
      notifications.show({
        id: "errorNotification",
        color: 'red',
        icon: <IconX size={16} />,
        title: 'Error',
        message: error.message || 'Ocurrió un error inesperado',
        autoClose: 4000,
        position: 'top-right',
      })
    }
  })
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <MantineProvider theme={appTheme} cssVariablesResolver={cssVariablesResolver}
      defaultColorScheme="light">
      <Notifications />
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>

    </MantineProvider>
  </StrictMode>
)
