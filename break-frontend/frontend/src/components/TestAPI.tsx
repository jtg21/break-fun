import React, { useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { createUser, testAPI } from '../services/agent'

const TestAPI: React.FC = () => {
  const { publicKey, connected } = useWallet()
  const [testResult, setTestResult] = useState<string>('')
  const [userResult, setUserResult] = useState<string>('')

  const handleTestAPI = async () => {
    try {
      const result = await testAPI()
      setTestResult(JSON.stringify(result, null, 2))
    } catch (error) {
      console.error('Test API error:', error)
      setTestResult(`Error: ${error instanceof Error ? error.message : JSON.stringify(error)}`)
    }
  }

  const handleCreateUser = async () => {
    if (!publicKey) {
      setUserResult('Please connect your wallet first')
      return
    }

    try {
      const result = await createUser({
        wallet_address: publicKey.toString(),
      })
      setUserResult(JSON.stringify(result, null, 2))
    } catch (error) {
      console.error('Create user error:', error)
      setUserResult(`Error: ${error instanceof Error ? error.message : JSON.stringify(error)}`)
    }
  }

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Test API Connection</h2>
      
      <div className="mb-4">
        <WalletMultiButton className="mb-4" />
        {connected && publicKey && (
          <p className="text-sm text-gray-600">
            Connected wallet: {publicKey.toString()}
          </p>
        )}
      </div>

      <div className="space-y-4">
        <div>
          <button
            onClick={handleTestAPI}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Test API Connection
          </button>
          {testResult && (
            <pre className="mt-2 p-2 bg-gray-100 rounded overflow-auto">
              {testResult}
            </pre>
          )}
        </div>

        <div>
          <button
            onClick={handleCreateUser}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
            disabled={!connected}
          >
            Create User
          </button>
          {userResult && (
            <pre className="mt-2 p-2 bg-gray-100 rounded overflow-auto">
              {userResult}
            </pre>
          )}
        </div>
      </div>
    </div>
  )
}

export default TestAPI 