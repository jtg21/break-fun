import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Container,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  VStack,
  useToast,
  Text,
  Heading,
  Button,
} from '@chakra-ui/react'
import { useWallet } from '@solana/wallet-adapter-react'
import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js'
import { createAgent } from '../services/agent'

const BANK_WALLET = "EdRDscSG1rj1aj1DJ22USAV7yTphEZgM7RJ4it6vPhSw"
const BANK_SHARE = 0.01 // 10% to bank

interface FormData {
  name: string
  personality: {
    traits: string
    characteristics: string
  }
  lore: {
    background: string
    story: string
  }
  behavior: {
    rules: string
    guidelines: string
  }
  secret_task: {
    task: string
    condition: string
    value: string
  }
  prize_pool: number
  expires_at: string
  image_url: string
  cost_per_prompt: number
}

const CreateChallenge = () => {
  const navigate = useNavigate()
  const toast = useToast()
  const { publicKey, signTransaction } = useWallet()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState<FormData>({
    name: '',
    personality: {
      traits: '',
      characteristics: '',
    },
    lore: {
      background: '',
      story: '',
    },
    behavior: {
      rules: '',
      guidelines: '',
    },
    secret_task: {
      task: '',
      condition: '',
      value: '',
    },
    prize_pool: 0.1,
    expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    image_url: '',
    cost_per_prompt: 0.01,
  })

  const handleInputChange = (
    section: keyof FormData,
    field: string,
    value: string
  ) => {
    setFormData(prev => ({
      ...prev,
      [section]: typeof prev[section] === 'object' ? {
        ...(prev[section] as Record<string, string>),
        [field]: value,
      } : value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!publicKey || !signTransaction) {
      toast({
        title: 'Error',
        description: 'Please connect your wallet',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
      return
    }

    // Validate prize pool
    if (formData.prize_pool < 0.1) {
      toast({
        title: 'Error',
        description: 'Prize pool must be at least 0.1 SOL',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
      return
    }

    setIsSubmitting(true)
    try {
      console.log('Creating agent with data:', {
        wallet_address: publicKey.toString(),
        name: formData.name,
        personality: formData.personality,
        lore: formData.lore,
        behavior: formData.behavior,
        secret_task: formData.secret_task,
        expires_at: new Date(formData.expires_at).toISOString(),
      })

      // Create agent first to get its wallet address
      const agentResponse = await createAgent({
        wallet_address: publicKey.toString(),
        name: formData.name,
        personality: formData.personality,
        lore: formData.lore,
        behavior: formData.behavior,
        secret_task: formData.secret_task,
        expires_at: new Date(formData.expires_at).toISOString(),
        image_url: '',  // Add empty string as default
        cost_per_prompt: 0.01  // Add default cost per prompt
      })

      console.log('Agent creation response:', agentResponse)

      if (!agentResponse.success || !agentResponse.agent?.wallet_address) {
        throw new Error(`Failed to create agent: ${JSON.stringify(agentResponse)}`)
      }

      const agentWallet = new PublicKey(agentResponse.agent.wallet_address)
      console.log('Agent wallet created:', agentWallet.toString())

      // Handle payments
      const connection = new Connection('https://api.devnet.solana.com')
      
      // Calculate total cost (platform fee + prize pool)
      const totalCost = BANK_SHARE + formData.prize_pool
      console.log('Total cost:', totalCost, 'SOL')
      
      // Check balance
      const balance = await connection.getBalance(publicKey)
      console.log('Current balance:', balance / LAMPORTS_PER_SOL, 'SOL')
      
      if (balance < totalCost * LAMPORTS_PER_SOL) {
        throw new Error(`Insufficient balance. You need ${totalCost} SOL. Current balance: ${balance / LAMPORTS_PER_SOL} SOL`)
      }

      // Create transaction for bank payment (platform fee)
      const bankTransaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: new PublicKey(BANK_WALLET),
          lamports: BANK_SHARE * LAMPORTS_PER_SOL,
        })
      )

      // Create transaction for agent payment (prize pool)
      const agentTransaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: agentWallet,
          lamports: formData.prize_pool * LAMPORTS_PER_SOL,
        })
      )

      // Get recent blockhash
      const { blockhash } = await connection.getRecentBlockhash()
      console.log('Got blockhash:', blockhash)
      
      // Set up bank transaction
      bankTransaction.recentBlockhash = blockhash
      bankTransaction.feePayer = publicKey
      
      // Set up agent transaction
      agentTransaction.recentBlockhash = blockhash
      agentTransaction.feePayer = publicKey

      console.log('Sending bank transaction...')
      // Sign and send bank transaction
      const signedBankTx = await signTransaction(bankTransaction)
      const bankSignature = await connection.sendRawTransaction(signedBankTx.serialize())
      console.log('Bank transaction signature:', bankSignature)
      await connection.confirmTransaction(bankSignature)
      console.log('Bank transaction confirmed')

      console.log('Sending agent transaction...')
      // Sign and send agent transaction
      const signedAgentTx = await signTransaction(agentTransaction)
      const agentSignature = await connection.sendRawTransaction(signedAgentTx.serialize())
      console.log('Agent transaction signature:', agentSignature)
      await connection.confirmTransaction(agentSignature)
      console.log('Agent transaction confirmed')

      toast({
        title: 'Agent Created',
        description: `Your AI agent has been created with a prize pool of ${formData.prize_pool} SOL`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      })

      // Navigate to the agent's chat page
      navigate(`/agents/${agentResponse.agent.wallet_address}`)
    } catch (err) {
      console.error('Detailed error:', err)
      const error = err as Error
      toast({
        title: 'Error',
        description: error.message || 'Failed to create agent',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Container maxW="container.md" py={8}>
      <VStack spacing={8} align="stretch">
        <Box>
          <Heading size="lg">Create a New AI Agent</Heading>
          <Text color="gray.500" mt={2}>
            Create an AI agent with personality, lore, and a secret task.
            Cost: {BANK_SHARE} SOL platform fee + {formData.prize_pool} SOL prize pool
          </Text>
        </Box>

        <form onSubmit={handleSubmit}>
          <VStack spacing={6} align="stretch">
            <FormControl isRequired>
              <FormLabel>Agent Name</FormLabel>
              <Input
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Give your AI agent a name"
              />
            </FormControl>

            <Box p={4} borderWidth={1} borderRadius="md">
              <Heading size="md" mb={4}>Personality</Heading>
              <VStack spacing={4}>
                <FormControl isRequired>
                  <FormLabel>Traits</FormLabel>
                  <Textarea
                    value={formData.personality.traits}
                    onChange={(e) => handleInputChange('personality', 'traits', e.target.value)}
                    placeholder="List the agent's personality traits"
                    rows={3}
                  />
                </FormControl>
                <FormControl isRequired>
                  <FormLabel>Characteristics</FormLabel>
                  <Textarea
                    value={formData.personality.characteristics}
                    onChange={(e) => handleInputChange('personality', 'characteristics', e.target.value)}
                    placeholder="Describe the agent's unique characteristics"
                    rows={3}
                  />
                </FormControl>
              </VStack>
            </Box>

            <Box p={4} borderWidth={1} borderRadius="md">
              <Heading size="md" mb={4}>Lore</Heading>
              <VStack spacing={4}>
                <FormControl isRequired>
                  <FormLabel>Background</FormLabel>
                  <Textarea
                    value={formData.lore.background}
                    onChange={(e) => handleInputChange('lore', 'background', e.target.value)}
                    placeholder="Provide the agent's background story"
                    rows={4}
                  />
                </FormControl>
                <FormControl isRequired>
                  <FormLabel>Story</FormLabel>
                  <Textarea
                    value={formData.lore.story}
                    onChange={(e) => handleInputChange('lore', 'story', e.target.value)}
                    placeholder="Tell the agent's story"
                    rows={4}
                  />
                </FormControl>
              </VStack>
            </Box>

            <Box p={4} borderWidth={1} borderRadius="md">
              <Heading size="md" mb={4}>Behavior</Heading>
              <VStack spacing={4}>
                <FormControl isRequired>
                  <FormLabel>Rules</FormLabel>
                  <Textarea
                    value={formData.behavior.rules}
                    onChange={(e) => handleInputChange('behavior', 'rules', e.target.value)}
                    placeholder="Define the agent's behavioral rules"
                    rows={4}
                  />
                </FormControl>
                <FormControl isRequired>
                  <FormLabel>Guidelines</FormLabel>
                  <Textarea
                    value={formData.behavior.guidelines}
                    onChange={(e) => handleInputChange('behavior', 'guidelines', e.target.value)}
                    placeholder="Set guidelines for the agent's behavior"
                    rows={4}
                  />
                </FormControl>
              </VStack>
            </Box>

            <Box p={4} borderWidth={1} borderRadius="md">
              <Heading size="md" mb={4}>Secret Task</Heading>
              <VStack spacing={4}>
                <FormControl isRequired>
                  <FormLabel>Task Description</FormLabel>
                  <Textarea
                    value={formData.secret_task.task}
                    onChange={(e) => handleInputChange('secret_task', 'task', e.target.value)}
                    placeholder="Describe the secret task"
                    rows={3}
                  />
                </FormControl>
                <FormControl isRequired>
                  <FormLabel>Success Condition</FormLabel>
                  <Input
                    value={formData.secret_task.condition}
                    onChange={(e) => handleInputChange('secret_task', 'condition', e.target.value)}
                    placeholder="What condition indicates success? (e.g., 'contains')"
                  />
                </FormControl>
                <FormControl isRequired>
                  <FormLabel>Success Value</FormLabel>
                  <Input
                    value={formData.secret_task.value}
                    onChange={(e) => handleInputChange('secret_task', 'value', e.target.value)}
                    placeholder="What value indicates success? (e.g., 'YES')"
                  />
                </FormControl>
              </VStack>
            </Box>

            <Box p={4} borderWidth={1} borderRadius="md">
              <Heading size="md" mb={4}>Agent Settings</Heading>
              <VStack spacing={4}>
                <FormControl isRequired>
                  <FormLabel>Prize Pool (SOL)</FormLabel>
                  <Input
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={formData.prize_pool}
                    onChange={(e) => setFormData(prev => ({ ...prev, prize_pool: parseFloat(e.target.value) }))}
                    placeholder="Enter prize pool amount in SOL"
                  />
                </FormControl>
                <FormControl isRequired>
                  <FormLabel>Expiration Date</FormLabel>
                  <Input
                    type="date"
                    value={formData.expires_at}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setFormData(prev => ({ ...prev, expires_at: e.target.value }))}
                  />
                </FormControl>
              </VStack>
            </Box>

            <Button
              type="submit"
              colorScheme="purple"
              size="lg"
              isLoading={isSubmitting}
              loadingText="Creating..."
            >
              Create Agent
            </Button>
          </VStack>
        </form>
      </VStack>
    </Container>
  )
}

export default CreateChallenge 