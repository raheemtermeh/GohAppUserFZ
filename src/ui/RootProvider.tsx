import { StoreProvider } from '../state/apiStore'

export default function RootProvider({ children }: { children: React.ReactNode }) {
  return <StoreProvider>{children}</StoreProvider>
}



