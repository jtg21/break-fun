import axios from 'axios'
import { API_URL } from '../config'

export const connectWallet = async (walletAddress: string) => {
  try {
    const response = await axios.post(`${API_URL}/users/connect_wallet/`, {
      wallet_address: walletAddress,
    })
    return response.data
  } catch (error) {
    console.error('Error connecting wallet:', error)
    throw error
  }
}

export const getUserByWallet = async (walletAddress: string) => {
  try {
    const response = await axios.get(
      `${API_URL}/users/?wallet_address=${walletAddress}`
    )
    
    if (response.data.length === 0) {
      const newUser = await connectWallet(walletAddress)
      return newUser
    }
    
    return response.data[0]
  } catch (error) {
    console.error('Error fetching user:', error)
    throw error
  }
}

export const updateUsername = async (userId: number, username: string) => {
  try {
    const response = await axios.patch(`${API_URL}/users/${userId}/`, {
      username,
    })
    return response.data
  } catch (error) {
    console.error('Error updating username:', error)
    throw error
  }
}

export const handleWalletConnection = async (publicKey: string | null): Promise<void> => {
  if (!publicKey) {
    console.error('No public key available')
    return
  }

  try {
    // First check if user exists
    const checkResponse = await fetch(`${API_URL}/users/exists/?wallet_address=${publicKey}`, {
      method: 'GET',
    })
    const checkResult = await checkResponse.json()

    if (!checkResult.exists) {
      // Only create user if they don't exist
      const result = await fetch(`${API_URL}/users/create/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `wallet_address=${publicKey}`,
      })
      console.log('User created:', await result.json())
    } else {
      console.log('User already exists')
    }
  } catch (error) {
    console.error('Wallet connection error:', error)
  }
} 