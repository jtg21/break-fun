import { Link as RouterLink } from 'react-router-dom'
import { useState, useEffect } from 'react'
import {
  Box,
  Heading,
  Text,
  Button,
  Container,
  Grid,
  GridItem,
  Badge,
  Flex,
  useColorModeValue,
  Skeleton,
  Icon,
  useToast,
} from '@chakra-ui/react'
import { FaRobot, FaPlus, FaTrophy } from 'react-icons/fa'
import { getAgents, Agent } from '../services/agent'

const AgentCard = ({ agent }: { agent: Agent }) => {
  const cardBg = useColorModeValue('whiteAlpha.200', 'blackAlpha.400')
  const borderColor = useColorModeValue('whiteAlpha.300', 'whiteAlpha.200')

  return (
    <Box
      borderWidth="1px"
      borderColor={borderColor}
      borderRadius="xl"
      overflow="hidden"
      bg={cardBg}
      p={4}
      position="relative"
      transition="all 0.2s"
      _hover={{
        transform: 'translateY(-2px)',
        boxShadow: 'xl',
        borderColor: 'purple.400',
      }}
    >
      <Flex justify="space-between" align="start" mb={3}>
        <Flex align="center">
          <Icon as={FaRobot} w={5} h={5} color="purple.400" mr={2} />
          <Heading size="md" isTruncated>{agent.name}</Heading>
        </Flex>
        <Flex 
          align="center" 
          bg="whiteAlpha.100" 
          px={2} 
          py={1} 
          borderRadius="lg"
          borderWidth={1}
          borderColor="yellow.500"
        >
          <Icon as={FaTrophy} w={3} h={3} color="yellow.400" mr={1} />
          <Text color="yellow.400" fontWeight="bold" fontSize="sm">
            {agent.prize_pool || '0.1'} SOL
          </Text>
        </Flex>
      </Flex>
      
      <Text color="whiteAlpha.800" mb={3} noOfLines={2} fontSize="sm">
        {agent.personality.traits || 'A mysterious AI agent...'}
      </Text>

      <Text fontSize="xs" color="whiteAlpha.600" mb={3} noOfLines={2}>
        {agent.lore.background || 'Unknown background'}
      </Text>

      <Flex justify="space-between" align="center">
        <Badge colorScheme="purple" px={2} py={1} borderRadius="md">
          Active
        </Badge>
        <Button
          as={RouterLink}
          to={`/agents/${agent.wallet_address}`}
          size="sm"
          colorScheme="purple"
          variant="outline"
          _hover={{
            bg: 'purple.500',
            color: 'white',
          }}
        >
          Chat Now
        </Button>
      </Flex>
    </Box>
  )
}

const Agents = () => {
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const toast = useToast()

  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const fetchedAgents = await getAgents()
        setAgents(fetchedAgents)
      } catch (error) {
        toast({
          title: 'Error fetching agents',
          description: error instanceof Error ? error.message : 'Failed to load agents',
          status: 'error',
          duration: 5000,
          isClosable: true,
        })
      } finally {
        setLoading(false)
      }
    }

    fetchAgents()
  }, [toast])

  return (
    <Container maxW="container.xl" py={8}>
      <Flex justify="space-between" align="center" mb={8}>
        <Box>
          <Heading size="xl" fontWeight="bold" letterSpacing="-0.02em">
            AI Agents
          </Heading>
          <Text color="whiteAlpha.700" mt={2} fontSize="lg">
            Discover and interact with unique AI personalities
          </Text>
        </Box>
        <Button
          as={RouterLink}
          to="/agents/create"
          size="lg"
          colorScheme="purple"
          leftIcon={<FaPlus />}
          _hover={{
            transform: 'translateY(-2px)',
            boxShadow: 'lg',
          }}
        >
          Create Agent
        </Button>
      </Flex>

      {loading ? (
        <Grid templateColumns="repeat(auto-fill, minmax(300px, 1fr))" gap={6}>
          {[1, 2, 3].map((i) => (
            <GridItem key={i}>
              <Skeleton height="250px" borderRadius="xl" />
            </GridItem>
          ))}
        </Grid>
      ) : agents.length > 0 ? (
        <Grid templateColumns="repeat(auto-fill, minmax(300px, 1fr))" gap={6}>
          {agents.map((agent) => (
            <GridItem key={agent.wallet_address}>
              <AgentCard agent={agent} />
            </GridItem>
          ))}
        </Grid>
      ) : (
        <Box
          borderRadius="2xl"
          borderWidth="1px"
          borderColor="whiteAlpha.200"
          p={12}
          bg="whiteAlpha.50"
          backdropFilter="blur(10px)"
          textAlign="center"
        >
          <Icon 
            as={FaRobot} 
            w={16} 
            h={16} 
            color="purple.400" 
            mb={6}
            filter="drop-shadow(0 0 12px rgba(168, 85, 247, 0.3))"
          />
          <Text 
            fontSize="xl" 
            fontWeight="medium" 
            color="whiteAlpha.900"
            mb={6}
          >
            No agents available yet
          </Text>
          <Button
            as={RouterLink}
            to="/agents/create"
            size="lg"
            colorScheme="purple"
            leftIcon={<FaPlus />}
            _hover={{
              transform: 'translateY(-2px)',
              boxShadow: 'lg',
            }}
          >
            Create Your First Agent
          </Button>
        </Box>
      )}
    </Container>
  )
}

export default Agents 