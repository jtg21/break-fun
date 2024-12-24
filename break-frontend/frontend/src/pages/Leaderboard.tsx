import { useEffect, useState } from 'react'
import {
  Box,
  Container,
  Heading,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  useColorModeValue,
  Text,
  HStack,
  Select,
  VStack,
} from '@chakra-ui/react'
import axios from 'axios'

interface User {
  id: number
  wallet_address: string
  username: string
  points: number
  created_at: string
}

const Leaderboard = () => {
  const [users, setUsers] = useState<User[]>([])
  const [timeframe, setTimeframe] = useState('all')
  const bgColor = useColorModeValue('white', 'gray.800')

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const response = await axios.get('http://localhost:8000/api/users/')
        const sortedUsers = response.data.sort((a: User, b: User) => b.points - a.points)
        setUsers(sortedUsers)
      } catch (error) {
        console.error('Error fetching leaderboard:', error)
      }
    }

    fetchLeaderboard()
  }, [timeframe])

  const getRankColor = (index: number) => {
    switch (index) {
      case 0:
        return 'yellow.400'
      case 1:
        return 'gray.400'
      case 2:
        return 'orange.400'
      default:
        return undefined
    }
  }

  return (
    <Container maxW="container.xl">
      <VStack spacing={8} align="stretch">
        <Box>
          <HStack justify="space-between" align="center" mb={6}>
            <Heading>Leaderboard</Heading>
            <Select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
              width="200px"
              bg={bgColor}
            >
              <option value="all">All Time</option>
              <option value="month">This Month</option>
              <option value="week">This Week</option>
              <option value="day">Today</option>
            </Select>
          </HStack>
        </Box>

        <Box
          bg={bgColor}
          borderRadius="lg"
          boxShadow="md"
          overflow="hidden"
        >
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>Rank</Th>
                <Th>User</Th>
                <Th isNumeric>Points</Th>
                <Th>Joined</Th>
              </Tr>
            </Thead>
            <Tbody>
              {users.map((user, index) => (
                <Tr key={user.id}>
                  <Td>
                    <HStack spacing={2}>
                      <Text
                        fontWeight="bold"
                        color={getRankColor(index)}
                        fontSize="lg"
                      >
                        #{index + 1}
                      </Text>
                      {index < 3 && (
                        <Badge colorScheme={index === 0 ? 'yellow' : index === 1 ? 'gray' : 'orange'}>
                          {index === 0 ? 'Gold' : index === 1 ? 'Silver' : 'Bronze'}
                        </Badge>
                      )}
                    </HStack>
                  </Td>
                  <Td>
                    <VStack align="start" spacing={1}>
                      <Text fontWeight="bold">
                        {user.username || 'Anonymous'}
                      </Text>
                      <Text fontSize="sm" color="gray.500">
                        {user.wallet_address.slice(0, 6)}...
                        {user.wallet_address.slice(-4)}
                      </Text>
                    </VStack>
                  </Td>
                  <Td isNumeric>
                    <Badge colorScheme="purple" fontSize="md">
                      {user.points}
                    </Badge>
                  </Td>
                  <Td>
                    {new Date(user.created_at).toLocaleDateString()}
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>
      </VStack>
    </Container>
  )
}

export default Leaderboard 