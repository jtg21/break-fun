import { useEffect, useState } from 'react'
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  Badge,
  SimpleGrid,
  Image,
  Stat,
  StatLabel,
  StatNumber,
  useColorModeValue,
  Divider,
} from '@chakra-ui/react'
import { useWallet } from '@solana/wallet-adapter-react'
import axios from 'axios'

interface User {
  id: number
  wallet_address: string
  username: string
  points: number
}

interface UserBadge {
  id: number
  badge: {
    name: string
    description: string
    image_url: string
  }
  earned_at: string
}

interface Attempt {
  id: number
  challenge: {
    title: string
    difficulty: string
    points: number
  }
  is_successful: boolean
  created_at: string
}

const Profile = () => {
  const { publicKey } = useWallet()
  const [user, setUser] = useState<User | null>(null)
  const [badges, setBadges] = useState<UserBadge[]>([])
  const [attempts, setAttempts] = useState<Attempt[]>([])
  const bgColor = useColorModeValue('white', 'gray.800')

  useEffect(() => {
    const fetchUserData = async () => {
      if (!publicKey) return

      try {
        // Fetch user data
        const userResponse = await axios.get(
          `http://localhost:8000/api/users/?wallet_address=${publicKey.toString()}`
        )
        if (userResponse.data.length > 0) {
          setUser(userResponse.data[0])
          
          // Fetch user badges
          const badgesResponse = await axios.get(
            `http://localhost:8000/api/user-badges/?user_id=${userResponse.data[0].id}`
          )
          setBadges(badgesResponse.data)

          // Fetch user attempts
          const attemptsResponse = await axios.get(
            `http://localhost:8000/api/attempts/?user=${userResponse.data[0].id}`
          )
          setAttempts(attemptsResponse.data)
        }
      } catch (error) {
        console.error('Error fetching user data:', error)
      }
    }

    fetchUserData()
  }, [publicKey])

  if (!user) {
    return null
  }

  return (
    <Container maxW="container.xl">
      <VStack spacing={8} align="stretch">
        {/* User Stats */}
        <Box p={6} bg={bgColor} borderRadius="lg" boxShadow="md">
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
            <Stat>
              <StatLabel>Wallet Address</StatLabel>
              <StatNumber fontSize="md">
                {user.wallet_address.slice(0, 6)}...
                {user.wallet_address.slice(-4)}
              </StatNumber>
            </Stat>
            <Stat>
              <StatLabel>Username</StatLabel>
              <StatNumber>{user.username || 'Anonymous'}</StatNumber>
            </Stat>
            <Stat>
              <StatLabel>Total Points</StatLabel>
              <StatNumber>{user.points}</StatNumber>
            </Stat>
          </SimpleGrid>
        </Box>

        {/* Badges */}
        <Box>
          <Heading size="md" mb={4}>
            Earned Badges
          </Heading>
          <SimpleGrid columns={{ base: 2, md: 4 }} spacing={6}>
            {badges.map((userBadge) => (
              <Box
                key={userBadge.id}
                p={4}
                bg={bgColor}
                borderRadius="lg"
                boxShadow="md"
                textAlign="center"
              >
                <Image
                  src={userBadge.badge.image_url}
                  alt={userBadge.badge.name}
                  boxSize="100px"
                  mx="auto"
                  mb={2}
                />
                <Text fontWeight="bold">{userBadge.badge.name}</Text>
                <Text fontSize="sm">{userBadge.badge.description}</Text>
              </Box>
            ))}
          </SimpleGrid>
        </Box>

        <Divider />

        {/* Recent Attempts */}
        <Box>
          <Heading size="md" mb={4}>
            Recent Attempts
          </Heading>
          <VStack spacing={4} align="stretch">
            {attempts.map((attempt) => (
              <Box
                key={attempt.id}
                p={4}
                bg={bgColor}
                borderRadius="lg"
                boxShadow="md"
              >
                <HStack justify="space-between">
                  <VStack align="start" spacing={1}>
                    <Text fontWeight="bold">{attempt.challenge.title}</Text>
                    <Badge
                      colorScheme={attempt.is_successful ? 'green' : 'gray'}
                    >
                      {attempt.is_successful ? 'Successful' : 'Unsuccessful'}
                    </Badge>
                  </VStack>
                  <VStack align="end" spacing={1}>
                    <Badge colorScheme="purple">
                      {attempt.challenge.points} points
                    </Badge>
                    <Text fontSize="sm">
                      {new Date(attempt.created_at).toLocaleDateString()}
                    </Text>
                  </VStack>
                </HStack>
              </Box>
            ))}
          </VStack>
        </Box>
      </VStack>
    </Container>
  )
}

export default Profile 