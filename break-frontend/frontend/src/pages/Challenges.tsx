import { useEffect, useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import {
  Box,
  Container,
  Heading,
  Text,
  SimpleGrid,
  VStack,
  Button,
  Badge,
  useColorModeValue,
} from '@chakra-ui/react'
import { API_URL } from '../config'

interface Agent {
  id: number
  name: string
  wallet_address: string
  expires_at: string
  creator: {
    wallet_address: string
  }
}

const Challenges = () => {
  const [agents, setAgents] = useState<Agent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const cardBg = useColorModeValue('white', 'gray.800')

  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const response = await fetch(`${API_URL}/agents/list/`)
        if (!response.ok) {
          throw new Error('Failed to fetch agents')
        }
        const data = await response.json()
        setAgents(data.agents || [])
      } catch (error) {
        console.error('Error fetching agents:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchAgents()
  }, [])

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={8} align="stretch">
        <Box>
          <Heading size="lg">Available Agents</Heading>
          <Text color="gray.500" mt={2}>
            Chat with AI agents and try to discover their secret tasks!
          </Text>
        </Box>

        <Button
          as={RouterLink}
          to="/challenges/create"
          colorScheme="purple"
          size="lg"
          maxW="300px"
        >
          Create New Agent
        </Button>

        {isLoading ? (
          <Text>Loading agents...</Text>
        ) : agents.length === 0 ? (
          <Text>No agents available. Be the first to create one!</Text>
        ) : (
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
            {agents.map((agent) => (
              <Box
                key={agent.wallet_address}
                p={6}
                bg={cardBg}
                borderRadius="lg"
                borderWidth={1}
                _hover={{ transform: 'translateY(-2px)', transition: '0.2s' }}
              >
                <VStack align="stretch" spacing={4}>
                  <Heading size="md">{agent.name}</Heading>
                  <Text fontSize="sm" color="gray.500">
                    Created by: {agent.creator.wallet_address.slice(0, 8)}...
                  </Text>
                  <Badge colorScheme="purple">
                    Expires: {new Date(agent.expires_at).toLocaleDateString()}
                  </Badge>
                  <Button
                    as={RouterLink}
                    to={`/agents/${agent.wallet_address}`}
                    colorScheme="blue"
                    size="sm"
                  >
                    Chat with Agent
                  </Button>
                </VStack>
              </Box>
            ))}
          </SimpleGrid>
        )}
      </VStack>
    </Container>
  )
}

export default Challenges 