import { API_URL } from '../config'

export interface Challenge {
  id: number
  name: string
  personality: Record<string, any>
  lore: Record<string, any>
  behavior: Record<string, any>
  secret_task: Record<string, any>
  wallet_address: string
  creator: string
  created_at: string
  expires_at: string | null
  prompt_price: number
}

export interface CreateChallengeRequest {
  name: string
  personality: Record<string, any>
  lore: Record<string, any>
  behavior: Record<string, any>
  secret_task: Record<string, any>
  wallet_address: string
  creator: string
  prompt_price: number
  signature: string
}

export const getChallenge = async (id: string): Promise<Challenge> => {
  const response = await fetch(`${API_URL}/api/challenges/${id}/`)
  if (!response.ok) {
    throw new Error('Failed to fetch challenge')
  }
  return response.json()
}

export const getChallenges = async (): Promise<Challenge[]> => {
  const response = await fetch(`${API_URL}/api/challenges/`)
  if (!response.ok) {
    throw new Error('Failed to fetch challenges')
  }
  return response.json()
}

export const createChallenge = async (data: CreateChallengeRequest): Promise<Challenge> => {
  const response = await fetch(`${API_URL}/api/challenges/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Failed to parse error response' }))
    throw new Error(errorData.message || `Failed to create challenge: ${response.status}`)
  }

  return response.json()
}

export const getChallengeAttempts = async (userId: number, challengeId: number) => {
  const response = await fetch(`${API_URL}/api/challenges/${challengeId}/history/${userId}/`)
  if (!response.ok) {
    throw new Error('Failed to fetch attempts')
  }
  return response.json()
}

export const submitAttempt = async (userId: number, challengeId: number, prompt: string, signature: string) => {
  const response = await fetch(`${API_URL}/api/challenges/${challengeId}/chat/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      user: userId,
      prompt,
      signature,
    }),
  })

  if (!response.ok) {
    throw new Error('Failed to submit attempt')
  }

  return response.json()
} 