import { useState, useRef, useCallback } from 'react'
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
  Image,
  Icon,
  Center,
} from '@chakra-ui/react'
import { useWallet } from '@solana/wallet-adapter-react'
import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js'
import { createAgent } from '../services/agent'
import { FiUpload } from 'react-icons/fi'

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

const CreateAgent = () => {
  const navigate = useNavigate()
  const toast = useToast()
  const { publicKey, signTransaction } = useWallet()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [previewImage, setPreviewImage] = useState<string | null>(null)
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

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith('image/')) {
      handleImageFile(file)
    }
  }, [])

  const handleImageFile = (file: File) => {
    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast({
        title: 'Error',
        description: 'Image size must be less than 5MB',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
      return
    }

    const reader = new FileReader()
    reader.onloadend = () => {
      const base64String = reader.result as string
      setPreviewImage(base64String)
      setFormData(prev => ({ ...prev, image_url: base64String }))
    }
    reader.onerror = () => {
      toast({
        title: 'Error',
        description: 'Failed to read image file',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    }
    reader.readAsDataURL(file)
  }

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
  }, [])

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleImageFile(file)
    }
  }

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
      const totalCost = BANK_SHARE + formData.prize_pool
      const connection = new Connection('https://api.devnet.solana.com')
      const balance = await connection.getBalance(publicKey)
      
      if (balance < totalCost * LAMPORTS_PER_SOL) {
        throw new Error(`Insufficient balance. You need ${totalCost} SOL`)
      }

      const bankTransaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: new PublicKey(BANK_WALLET),
          lamports: BANK_SHARE * LAMPORTS_PER_SOL,
        })
      )

      const { blockhash } = await connection.getRecentBlockhash()
      bankTransaction.recentBlockhash = blockhash
      bankTransaction.feePayer = publicKey

      const signedBankTx = await signTransaction(bankTransaction)
      const bankSignature = await connection.sendRawTransaction(signedBankTx.serialize())
      await connection.confirmTransaction(bankSignature)

      const agentResponse = await createAgent({
        wallet_address: publicKey.toString(),
        name: formData.name,
        personality: formData.personality,
        lore: formData.lore,
        behavior: formData.behavior,
        secret_task: formData.secret_task,
        expires_at: new Date(formData.expires_at).toISOString(),
        image_url: formData.image_url,
        cost_per_prompt: formData.cost_per_prompt,
      })

      if (!agentResponse.success || !agentResponse.agent?.wallet_address) {
        throw new Error('Failed to create agent')
      }

      const agentWallet = new PublicKey(agentResponse.agent.wallet_address)
      const agentTransaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: agentWallet,
          lamports: formData.prize_pool * LAMPORTS_PER_SOL,
        })
      )

      agentTransaction.recentBlockhash = blockhash
      agentTransaction.feePayer = publicKey

      const signedAgentTx = await signTransaction(agentTransaction)
      const agentSignature = await connection.sendRawTransaction(signedAgentTx.serialize())
      await connection.confirmTransaction(agentSignature)

      toast({
        title: 'Success',
        description: `Agent created with ${formData.prize_pool} SOL prize pool`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      })

      navigate(`/agents/${agentResponse.agent.wallet_address}`)
    } catch (err) {
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
    <Container maxW="2xl" py={8}>
      <VStack spacing={8} align="stretch">
        <Box textAlign="center">
          <Heading 
            size="2xl" 
            bgGradient="linear(to-r, #4C9EEB, #33D5E3)"
            bgClip="text"
            mb={4}
          >
            Create Your AI Agent
          </Heading>
          <Text color="gray.400" fontSize="lg">
            Design a unique AI personality that can earn you SOL
          </Text>
        </Box>

        <form onSubmit={handleSubmit}>
          <VStack spacing={6} align="stretch">
            <FormControl>
              <FormLabel color="whiteAlpha.900">Agent Image</FormLabel>
              <Box
                borderWidth="2px"
                borderRadius="xl"
                borderStyle="dashed"
                borderColor="whiteAlpha.300"
                p={6}
                cursor="pointer"
                _hover={{ borderColor: "purple.500" }}
                onClick={() => fileInputRef.current?.click()}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                position="relative"
                h="200px"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  accept="image/*"
                  style={{ display: 'none' }}
                />
                
                {previewImage ? (
                  <Box position="relative" h="full">
                    <Image
                      src={previewImage}
                      alt="Agent preview"
                      objectFit="contain"
                      w="full"
                      h="full"
                    />
                    <Button
                      position="absolute"
                      top={2}
                      right={2}
                      size="sm"
                      colorScheme="red"
                      onClick={(e) => {
                        e.stopPropagation()
                        setPreviewImage(null)
                        setFormData(prev => ({ ...prev, image_url: '' }))
                      }}
                    >
                      Remove
                    </Button>
                  </Box>
                ) : (
                  <Center h="full" flexDirection="column">
                    <Icon as={FiUpload} w={8} h={8} color="whiteAlpha.500" mb={2} />
                    <Text color="whiteAlpha.600" textAlign="center">
                      Drop an image here or click to upload
                    </Text>
                    <Text color="whiteAlpha.400" fontSize="sm" mt={1}>
                      Max size: 5MB
                    </Text>
                  </Center>
                )}
              </Box>
            </FormControl>

            <FormControl isRequired>
              <FormLabel color="whiteAlpha.900">Agent Name</FormLabel>
              <Input
                value={formData.name}
                onChange={(e) => handleInputChange('name', '', e.target.value)}
                placeholder="Enter a name for your agent"
                bg="whiteAlpha.50"
                border="none"
                _hover={{ bg: 'whiteAlpha.100' }}
                _focus={{ bg: 'whiteAlpha.100', boxShadow: 'none' }}
              />
            </FormControl>

            <Heading size="md" color="white" mt={4}>Personality</Heading>
            <FormControl isRequired>
              <FormLabel>Traits</FormLabel>
              <Textarea
                value={formData.personality.traits}
                onChange={(e) => handleInputChange('personality', 'traits', e.target.value)}
                placeholder="What makes your agent unique?"
                rows={3}
                bg="#2C2E33"
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel>Characteristics</FormLabel>
              <Textarea
                value={formData.personality.characteristics}
                onChange={(e) => handleInputChange('personality', 'characteristics', e.target.value)}
                placeholder="Describe your agent's defining characteristics"
                rows={3}
                bg="#2C2E33"
              />
            </FormControl>

            <Heading size="md" color="white" mt={4}>Lore & Background</Heading>
            <FormControl isRequired>
              <FormLabel>Background Story</FormLabel>
              <Textarea
                value={formData.lore.background}
                onChange={(e) => handleInputChange('lore', 'background', e.target.value)}
                placeholder="What's your agent's origin story?"
                rows={3}
                bg="#2C2E33"
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel>Story Development</FormLabel>
              <Textarea
                value={formData.lore.story}
                onChange={(e) => handleInputChange('lore', 'story', e.target.value)}
                placeholder="How has your agent's journey shaped them?"
                rows={3}
                bg="#2C2E33"
              />
            </FormControl>

            <Heading size="md" color="white" mt={4}>Secret Task</Heading>
            <FormControl isRequired>
              <FormLabel>Task Description</FormLabel>
              <Textarea
                value={formData.secret_task.task}
                onChange={(e) => handleInputChange('secret_task', 'task', e.target.value)}
                placeholder="What's the secret challenge?"
                rows={3}
                bg="#2C2E33"
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel>Success Condition</FormLabel>
              <Input
                value={formData.secret_task.condition}
                onChange={(e) => handleInputChange('secret_task', 'condition', e.target.value)}
                placeholder="e.g., 'contains'"
                bg="#2C2E33"
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel>Success Value</FormLabel>
              <Input
                value={formData.secret_task.value}
                onChange={(e) => handleInputChange('secret_task', 'value', e.target.value)}
                placeholder="e.g., 'YES'"
                bg="#2C2E33"
              />
            </FormControl>

            <Box 
              mt={8} 
              p={6} 
              borderRadius="xl" 
              border="1px solid" 
              borderColor="whiteAlpha.200"
              bg="#2C2E33"
            >
              <Heading size="md" color="white" mb={4}>Economics</Heading>
              <VStack spacing={6}>
                <Box display="flex" gap={6} w="full">
                  <FormControl isRequired flex={1}>
                    <FormLabel>Prize Pool (SOL)</FormLabel>
                    <Input
                      type="number"
                      step="0.1"
                      min="0.1"
                      value={formData.prize_pool}
                      onChange={(e) => setFormData(prev => ({ ...prev, prize_pool: parseFloat(e.target.value) }))}
                      bg="#1A1B1E"
                      _hover={{ bg: "#1E1F23" }}
                    />
                  </FormControl>
                  <FormControl isRequired flex={1}>
                    <FormLabel>Cost per Prompt (SOL)</FormLabel>
                    <Input
                      type="number"
                      step="0.001"
                      min="0.001"
                      value={formData.cost_per_prompt}
                      onChange={(e) => setFormData(prev => ({ ...prev, cost_per_prompt: parseFloat(e.target.value) }))}
                      bg="#1A1B1E"
                      _hover={{ bg: "#1E1F23" }}
                    />
                  </FormControl>
                </Box>
                <Text color="gray.400" fontSize="sm" textAlign="center">
                  Platform Fee: {BANK_SHARE} SOL + Prize Pool: {formData.prize_pool} SOL
                </Text>
              </VStack>
            </Box>

            <Button
              type="submit"
              bgGradient="linear(to-r, #4C9EEB, #33D5E3)"
              color="white"
              size="lg"
              fontSize="lg"
              w="full"
              h="56px"
              _hover={{
                bgGradient: "linear(to-r, #3C8EDB, #23C5D3)",
              }}
              isLoading={isSubmitting}
              loadingText="Creating..."
              mt={4}
            >
              Create Agent
            </Button>
          </VStack>
        </form>
      </VStack>
    </Container>
  )
}

export default CreateAgent 