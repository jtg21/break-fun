import { useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import {
  Box,
  Container,
  VStack,
  Button,
  Text,
  useToast,
  Heading,
  Code,
  Divider,
  HStack,
} from '@chakra-ui/react'
import { testAPI, createUser } from '../services/agent'

const TestAPI = () => {
  const { publicKey } = useWallet()
  const [response, setResponse] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const toast = useToast()

  const handleTestAPI = async () => {
    setIsLoading(true)
    try {
      const result = await testAPI()
      setResponse(result)
      
      toast({
        title: 'API Test Response',
        description: result.message,
        status: 'success',
        duration: 3000,
      })
    } catch (error) {
      console.error('API Test Error:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to test API',
        status: 'error',
        duration: 5000,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateUser = async () => {
    if (!publicKey) {
      toast({
        title: 'Error',
        description: 'Please connect your wallet first',
        status: 'error',
        duration: 5000,
      })
      return
    }

    setIsLoading(true)
    try {
      const result = await createUser({
        wallet_address: publicKey.toString(),
      })
      setResponse(result)
      
      toast({
        title: 'User Created',
        description: result.message,
        status: 'success',
        duration: 3000,
      })
    } catch (error) {
      console.error('Create User Error:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create user',
        status: 'error',
        duration: 5000,
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Container maxW="container.lg" py={8}>
      <VStack spacing={6} align="stretch">
        <Heading>API Test Interface</Heading>
        
        <Box>
          <Text mb={2}>Wallet Status:</Text>
          <Code p={4} borderRadius="md">
            {publicKey ? `Connected: ${publicKey.toString()}` : 'Not connected'}
          </Code>
        </Box>

        <HStack spacing={4}>
          <Button
            colorScheme="purple"
            onClick={handleTestAPI}
            isLoading={isLoading}
            loadingText="Testing..."
          >
            Test API Connection
          </Button>

          <Button
            colorScheme="green"
            onClick={handleCreateUser}
            isLoading={isLoading}
            loadingText="Creating..."
            isDisabled={!publicKey}
          >
            Create User
          </Button>
        </HStack>

        {response && (
          <Box>
            <Heading size="md" mb={2}>Response:</Heading>
            <Divider my={4} />
            <Code p={4} borderRadius="md" whiteSpace="pre-wrap">
              {JSON.stringify(response, null, 2)}
            </Code>
          </Box>
        )}
      </VStack>
    </Container>
  )
}

export default TestAPI 