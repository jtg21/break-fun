import { useEffect, useState, useRef } from 'react'
import { useParams } from 'react-router-dom'
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  Textarea,
  useToast,
  HStack,
  Flex,
  Grid,
  Icon,
  Stat,
  StatLabel,
  StatNumber,
  StatGroup,
  Button,
  Image,
  Center,
} from '@chakra-ui/react'
import { useWallet } from '@solana/wallet-adapter-react'
import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js'
import { getAgentResponse, getAgents, Agent } from '../services/agent'
import { FaRobot, FaTrophy, FaScroll, FaUserSecret, FaWallet } from 'react-icons/fa'

const MESSAGE_COST = 0.01 // Cost per message in SOL

interface Message {
  role: 'system' | 'user' | 'assistant'
  content: string
}

const Challenge = () => {
  const { id: agentWallet } = useParams()
  const { publicKey, signTransaction } = useWallet()
  const toast = useToast()
  const [messages, setMessages] = useState<Message[]>([])
  const [prompt, setPrompt] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [agent, setAgent] = useState<Agent | null>(null)
  const chatBoxRef = useRef<HTMLDivElement>(null)
  const [agentBalance, setAgentBalance] = useState<number>(0)
  const [userBalance, setUserBalance] = useState<number>(0)

  useEffect(() => {
    const fetchAgent = async () => {
      try {
        const agents = await getAgents()
        const foundAgent = agents.find(a => a.wallet_address === agentWallet)
        if (foundAgent) {
          setAgent(foundAgent)
        }
      } catch (error) {
        console.error('Error fetching agent:', error)
      }
    }
    if (agentWallet) {
      fetchAgent()
    }
  }, [agentWallet])

  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight
    }
  }, [messages])

  const fetchBalances = async () => {
    if (!publicKey || !agentWallet) return;
    
    try {
      const connection = new Connection('https://api.devnet.solana.com');
      
      // Fetch user balance
      const userBalance = await connection.getBalance(publicKey);
      setUserBalance(userBalance / LAMPORTS_PER_SOL);
      
      // Fetch agent balance
      const agentPubkey = new PublicKey(agentWallet);
      const agentBalance = await connection.getBalance(agentPubkey);
      setAgentBalance(agentBalance / LAMPORTS_PER_SOL);
    } catch (error) {
      console.error('Error fetching balances:', error);
    }
  };

  useEffect(() => {
    fetchBalances();
    // Set up interval to refresh balances
    const interval = setInterval(fetchBalances, 5000);
    return () => clearInterval(interval);
  }, [publicKey, agentWallet]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!prompt.trim() || !publicKey || !signTransaction || !agentWallet) return

    setIsSubmitting(true)
    try {
      // Create transaction for message payment
      const connection = new Connection('https://api.devnet.solana.com')
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: new PublicKey(agentWallet),
          lamports: MESSAGE_COST * LAMPORTS_PER_SOL,
        })
      )

      // Get recent blockhash
      const { blockhash } = await connection.getRecentBlockhash()
      transaction.recentBlockhash = blockhash
      transaction.feePayer = publicKey

      // Sign and send transaction
      const signedTransaction = await signTransaction(transaction)
      const signature = await connection.sendRawTransaction(signedTransaction.serialize())
      await connection.confirmTransaction(signature)

      // Add user message to chat
      const userMessage: Message = { role: 'user', content: prompt }
      setMessages(prev => [...prev, userMessage])
      setPrompt('')

      // Get agent response
      console.log('Sending chat request:', {
        agent_wallet: agentWallet,
        user_wallet: publicKey.toString(),
        message: prompt,
      });

      const response = await getAgentResponse({
        agent_wallet: agentWallet,
        user_wallet: publicKey.toString(),
        message: prompt,
      })

      console.log('Got response:', response);

      if (response.success) {
        // Update balances if provided
        if (response.agent_balance !== undefined) setAgentBalance(response.agent_balance)
        if (response.user_balance !== undefined) setUserBalance(response.user_balance)

        // Add agent response to chat
        const agentMessage: Message = { role: 'assistant', content: response.response || '' }
        setMessages(prev => [...prev, agentMessage])

        if (response.secret_task_completed) {
          toast({
            title: 'Congratulations! 🎉',
            description: 'You have completed the secret task!',
            status: 'success',
            duration: 5000,
            isClosable: true,
          })
        }
      } else {
        throw new Error(response.message || 'Failed to get response')
      }
    } catch (error) {
      console.error('Error submitting message:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to send message',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Container maxW="container.xl" py={6}>
      {agent && (
        <Grid templateColumns="1fr 400px" gap={6} h="calc(100vh - 100px)">
          {/* Chat Section - Left Side */}
          <Box 
            borderWidth="1px"
            borderColor="whiteAlpha.200"
            borderRadius="xl"
            overflow="hidden"
            display="flex"
            flexDirection="column"
          >
            {/* Chat Header */}
            <Flex 
              p={4} 
              borderBottomWidth="1px" 
              borderColor="whiteAlpha.200"
              align="center"
              gap={4}
            >
              <Box
                w="48px"
                h="48px"
                borderRadius="full"
                overflow="hidden"
                borderWidth="1px"
                borderColor="whiteAlpha.200"
              >
                {agent.image_url ? (
                  <Image
                    src={agent.image_url}
                    alt={agent.name}
                    w="full"
                    h="full"
                    objectFit="cover"
                  />
                ) : (
                  <Center h="full">
                    <Icon as={FaRobot} w={6} h={6} color="purple.400" />
                  </Center>
                )}
              </Box>
              <Box flex={1}>
                <Heading size="md" color="white">
                  {agent.name}
                </Heading>
                <Text color="whiteAlpha.600" fontSize="sm" noOfLines={1}>
                  {agent.personality.traits}
                </Text>
              </Box>
              <Flex 
                align="center" 
                gap={2}
                borderWidth="1px"
                borderColor="yellow.500"
                borderRadius="lg"
                px={3}
                py={2}
              >
                <Icon as={FaTrophy} w={4} h={4} color="yellow.400" />
                <Text color="yellow.400" fontWeight="bold">
                  {agentBalance.toFixed(3)} SOL
                </Text>
              </Flex>
            </Flex>

            {/* Chat Messages */}
            <Box
              ref={chatBoxRef}
              p={6}
              flex={1}
              overflowY="auto"
              css={{
                '&::-webkit-scrollbar': {
                  width: '4px',
                },
                '&::-webkit-scrollbar-track': {
                  width: '6px',
                },
                '&::-webkit-scrollbar-thumb': {
                  background: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: '24px',
                },
              }}
            >
              <VStack spacing={4} align="stretch">
                {messages.map((msg, index) => (
                  <Box
                    key={index}
                    alignSelf={msg.role === 'user' ? 'flex-end' : 'flex-start'}
                    maxW="80%"
                  >
                    <Box
                      borderWidth="1px"
                      borderColor={msg.role === 'user' ? 'purple.500' : 'whiteAlpha.200'}
                      color="white"
                      px={4}
                      py={3}
                      borderRadius="xl"
                      borderBottomLeftRadius={msg.role === 'user' ? 'xl' : '0'}
                      borderBottomRightRadius={msg.role === 'user' ? '0' : 'xl'}
                    >
                      <Text fontSize="md">{msg.content}</Text>
                    </Box>
                    <Text
                      fontSize="xs"
                      color="whiteAlpha.600"
                      mt={1}
                      textAlign={msg.role === 'user' ? 'right' : 'left'}
                    >
                      {msg.role === 'user' ? 'You' : agent?.name || 'Agent'}
                    </Text>
                  </Box>
                ))}
              </VStack>
            </Box>

            <Box
              borderTopWidth="1px"
              borderColor="whiteAlpha.200"
              p={4}
            >
              <form onSubmit={handleSubmit}>
                <Flex gap={3}>
                  <Textarea
                    flex={1}
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder={`Type your message... (${MESSAGE_COST} SOL)`}
                    borderColor="whiteAlpha.200"
                    _hover={{ borderColor: "whiteAlpha.400" }}
                    _focus={{ borderColor: "purple.500", boxShadow: "none" }}
                    rows={1}
                    resize="none"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleSubmit(e)
                      }
                    }}
                  />
                  <Button
                    type="submit"
                    colorScheme="purple"
                    px={8}
                    isLoading={isSubmitting}
                    loadingText="Sending..."
                  >
                    Send
                  </Button>
                </Flex>
              </form>
            </Box>
          </Box>

          {/* Agent Info Section - Right Side */}
          <VStack spacing={6} align="stretch" h="full">
            <Box 
              borderWidth="1px"
              borderColor="whiteAlpha.200"
              borderRadius="xl"
              p={6}
            >
              <VStack spacing={6} align="stretch">
                <Box>
                  <Text color="whiteAlpha.600" fontSize="sm" mb={1}>Background</Text>
                  <Text color="whiteAlpha.800" fontSize="sm" noOfLines={2}>
                    {agent.lore.background || 'Unknown background'}
                  </Text>
                </Box>

                <HStack spacing={4}>
                  <Flex align="center">
                    <Icon as={FaScroll} w={4} h={4} color="purple.400" mr={2} />
                    <Text color="whiteAlpha.800" fontSize="sm">
                      Rules: {agent.behavior.rules || 'Standard interaction'}
                    </Text>
                  </Flex>
                  <Flex align="center">
                    <Icon as={FaUserSecret} w={4} h={4} color="purple.400" mr={2} />
                    <Text color="whiteAlpha.800" fontSize="sm">
                      Has a secret task
                    </Text>
                  </Flex>
                </HStack>

                <StatGroup 
                  borderWidth="1px"
                  borderColor="whiteAlpha.200"
                  borderRadius="lg"
                  p={3}
                >
                  <Stat>
                    <StatLabel color="whiteAlpha.700">
                      <Flex align="center">
                        <Icon as={FaWallet} w={3} h={3} mr={1} />
                        Your Balance
                      </Flex>
                    </StatLabel>
                    <StatNumber color="green.300" fontSize="lg">
                      {userBalance.toFixed(3)} SOL
                    </StatNumber>
                  </Stat>
                  <Stat>
                    <StatLabel color="whiteAlpha.700">
                      <Flex align="center">
                        <Icon as={FaTrophy} w={3} h={3} mr={1} />
                        Cost/Prompt
                      </Flex>
                    </StatLabel>
                    <StatNumber color="blue.300" fontSize="lg">
                      {MESSAGE_COST} SOL
                    </StatNumber>
                  </Stat>
                </StatGroup>
              </VStack>
            </Box>
          </VStack>
        </Grid>
      )}
    </Container>
  )
}

export default Challenge