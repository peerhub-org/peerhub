import { Alert, AlertColor, Snackbar } from '@mui/material'
import { createContext, useState, ReactNode, useContext } from 'react'
import { SNACKBAR_DEFAULT_TIMEOUT_MS } from '@shared/application/config/appConstants'

type SnackBarContextActions = {
  showSnackBar: (message: string, severity: AlertColor, timeout?: number) => void
}

const SnackBarContext = createContext<SnackBarContextActions | undefined>(undefined)

interface SnackBarContextProviderProps {
  children: ReactNode
}

const SnackBarProvider = ({ children }: SnackBarContextProviderProps) => {
  const [open, setOpen] = useState<boolean>(false)
  const [message, setMessage] = useState<string>('')
  const [snackbarTimeout, setSnackbarTimeout] = useState<number>(SNACKBAR_DEFAULT_TIMEOUT_MS)
  const [alertColor, setAlertColor] = useState<AlertColor>('info')

  const showSnackBar = (text: string, color: AlertColor, duration?: number) => {
    setMessage(text)
    setAlertColor(color)
    setOpen(true)
    if (duration) {
      setSnackbarTimeout(duration)
    }
  }

  const handleClose = () => {
    setOpen(false)
    setAlertColor('info')
    setSnackbarTimeout(SNACKBAR_DEFAULT_TIMEOUT_MS)
  }

  return (
    <SnackBarContext.Provider value={{ showSnackBar }}>
      <Snackbar open={open} autoHideDuration={snackbarTimeout} onClose={handleClose}>
        <Alert onClose={handleClose} severity={alertColor}>
          {message}
        </Alert>
      </Snackbar>
      {children}
    </SnackBarContext.Provider>
  )
}

const useSnackBar = (): SnackBarContextActions => {
  const context = useContext(SnackBarContext)

  if (!context) {
    throw new Error('useSnackBar must be used within a SnackBarProvider')
  }

  return context
}

export { SnackBarProvider, useSnackBar }
