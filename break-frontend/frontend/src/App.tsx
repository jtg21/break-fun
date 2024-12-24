import { ChakraProvider, ColorModeScript } from '@chakra-ui/react'
import {
  ConnectionProvider,
  WalletProvider,
  useWallet,
} from '@solana/wallet-adapter-react'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'
import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets'
import { clusterApiUrl } from '@solana/web3.js'
import { useEffect, useMemo } from 'react'
import AppRouter from './routes/AppRouter'
import theme from './theme'
import { handleWalletConnection } from './services/wallet'

// Import Solana wallet styles
import '@solana/wallet-adapter-react-ui/styles.css'

function WalletConnectionHandler({ children }: { children: React.ReactNode }) {
  const { publicKey } = useWallet()

  useEffect(() => {
    if (publicKey) {
      handleWalletConnection(publicKey.toString())
    }
  }, [publicKey])

  return <>{children}</>
}

function App() {
  // You can also provide a custom RPC endpoint
  const endpoint = useMemo(() => clusterApiUrl('devnet'), [])

  // @solana/wallet-adapter-wallets includes all the adapters but supports tree shaking and lazy loading --
  // Only the wallets you configure here will be compiled into your application, and only the dependencies
  // of wallets that your users connect to will be loaded
  const wallets = useMemo(() => [new PhantomWalletAdapter()], [])

  return (
    <ChakraProvider theme={theme}>
      <ColorModeScript initialColorMode={theme.config.initialColorMode} />
      <ConnectionProvider endpoint={endpoint}>
        <WalletProvider wallets={wallets} autoConnect>
          <WalletModalProvider>
            <WalletConnectionHandler>
              <AppRouter />
            </WalletConnectionHandler>
          </WalletModalProvider>
        </WalletProvider>
      </ConnectionProvider>
    </ChakraProvider>
  )
}

export default App
