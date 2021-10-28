import React, { useContext, useEffect } from 'react'
import { identifyUser } from 'services/analytics'
import { UseWalletProvider, useWallet } from 'use-wallet'
import { Wallet } from 'use-wallet/dist/cjs/types'
import { updateAPMContext, useAPM } from './elasticAPM'

// Any is a workaround so TS doesn't ask for a filled out default
const WalletAugmentedContext = React.createContext<Wallet | any>({})

const useWalletAugmented = (): Wallet => {
  return useContext(WalletAugmentedContext)
}

const WalletAugmented: React.FC<unknown> = ({ children }) => {
  const wallet = useWallet()

  useEffect(() => {
    if (
      wallet.status === 'connected' &&
      typeof wallet.account === 'string' &&
      wallet.connector &&
      wallet.networkName
    ) {
      identifyUser(wallet.account, wallet.networkName, wallet.connector)
    }
  }, [wallet.networkName, wallet.connector, wallet.status, wallet.account])

  const { apm } = useAPM()
  useEffect(() => {
    updateAPMContext(apm, wallet.networkName!)
  }, [apm, wallet.networkName])

  return (
    <WalletAugmentedContext.Provider value={wallet}>
      {children}
    </WalletAugmentedContext.Provider>
  )
}

export const connectors = [
  {
    id: 'injected',
    properties: {
      chainId: [1, 4]
    }
  },
  {
    id: 'frame',
    properties: {
      chainId: 1
    }
  }
]

const useWalletConnectors = connectors.reduce(
  (current: any, connector: any) => {
    current[connector.id] = connector.properties || {}
    return current
  },
  {}
)

const WalletProvider: React.FC<unknown> = ({ children }) => {
  return (
    <UseWalletProvider connectors={useWalletConnectors}>
      <WalletAugmented>{children}</WalletAugmented>
    </UseWalletProvider>
  )
}

export { useWalletAugmented as useWallet, WalletProvider }