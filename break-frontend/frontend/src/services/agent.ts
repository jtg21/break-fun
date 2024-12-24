import { API_URL, ENDPOINTS } from '../config'

export interface Message {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface AgentResponse {
  success: boolean
  message?: string
  response?: string
  secret_task_completed?: boolean
  agent_balance?: number
  user_balance?: number
}

export interface CreateAgentRequest {
  wallet_address: string
  name: string
  personality: Record<string, any>
  lore: Record<string, any>
  behavior: Record<string, any>
  secret_task: Record<string, any>
  expires_at: string
  image_url: string
  cost_per_prompt: number
}

export interface CreateUserRequest {
  wallet_address: string
}

export interface ChatRequest {
  agent_wallet: string
  user_wallet: string
  message: string
}

export interface Agent {
  wallet_address: string
  name: string
  personality: Record<string, any>
  lore: Record<string, any>
  behavior: Record<string, any>
  secret_task: Record<string, any>
  created_at: string
  expires_at: string
  prize_pool?: number
  image_url?: string
  cost_per_prompt?: number
}

export const createUser = async (data: CreateUserRequest): Promise<{ success: boolean; message: string }> => {
  const formData = new FormData()
  formData.append('wallet_address', data.wallet_address)

  const response = await fetch(ENDPOINTS.createUser, {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.message || 'Failed to create user')
  }

  return response.json()
}

export const createAgent = async (data: CreateAgentRequest): Promise<{ success: boolean; message: string; agent?: any }> => {
  console.log('Creating agent with request:', data)
  try {
    const formData = new FormData()
    formData.append('wallet_address', data.wallet_address)
    formData.append('name', data.name)
    formData.append('personality', JSON.stringify(data.personality))
    formData.append('lore', JSON.stringify(data.lore))
    formData.append('behavior', JSON.stringify(data.behavior))
    formData.append('secret_task', JSON.stringify(data.secret_task))
    formData.append('expires_at', data.expires_at)
    formData.append('image_url', data.image_url)
    formData.append('cost_per_prompt', data.cost_per_prompt.toString())

    console.log('FormData entries:')
    for (let [key, value] of formData.entries()) {
      console.log(key, ':', value)
    }

    const response = await fetch(`${API_URL}/agents/create/`, {
      method: 'POST',
      body: formData,
    })

    console.log('Response status:', response.status)
    const responseData = await response.json()
    console.log('Response data:', responseData)

    if (!response.ok || !responseData.success) {
      throw new Error(responseData.message || `HTTP error! status: ${response.status}`)
    }

    return responseData
  } catch (error) {
    console.error('Error in createAgent:', error)
    throw error
  }
}

export const getAgentResponse = async (data: ChatRequest): Promise<AgentResponse> => {
  try {
    console.log('Raw request data:', data);
    const formData = new FormData()
    formData.append('agent_wallet', data.agent_wallet)
    formData.append('user_wallet', data.user_wallet)
    formData.append('message', data.message)

    // Log the actual FormData entries
    console.log('FormData entries:');
    const formDataObj: Record<string, any> = {};
    formData.forEach((value, key) => {
      formDataObj[key] = value;
      console.log(`${key}: ${value}`);
    });
    console.log('FormData as object:', formDataObj);

    console.log('Sending request to:', ENDPOINTS.agentChat);
    const response = await fetch(ENDPOINTS.agentChat, {
      method: 'POST',
      body: formData,
    })

    const responseData = await response.json();
    console.log('Response data:', responseData);

    if (!response.ok) {
      throw new Error(responseData.message || `HTTP error! status: ${response.status}`)
    }

    return responseData
  } catch (error) {
    console.error('Error getting agent response:', error)
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to get agent response',
    }
  }
}

export const testAPI = async (): Promise<{ success: boolean; message: string }> => {
  const response = await fetch(ENDPOINTS.test, {
    method: 'POST',
  })

  if (!response.ok) {
    throw new Error('Failed to test API')
  }

  return response.json()
}

export const getAgents = async (): Promise<Agent[]> => {
  try {
    const response = await fetch(`${API_URL}/agents/list/`, {
      method: 'GET',
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    console.log('Fetched agents:', data)
    
    // Transform the response data to match the Agent interface
    const agents = (data.agents || []).map((agent: any) => ({
      wallet_address: agent.wallet_address,
      name: agent.name,
      personality: agent.personality || {},
      lore: agent.lore || {},
      behavior: agent.behavior || {},
      secret_task: agent.secret_task || {},
      created_at: agent.created_at || new Date().toISOString(),
      expires_at: agent.expires_at,
      image_url: agent.image_url || '',
      cost_per_prompt: agent.cost_per_prompt || 0.01
    }))

    return agents
  } catch (error) {
    console.error('Error fetching agents:', error)
    return []
  }
} 