import {
  Box,
  Button,
  Container,
  Heading,
  Text,
  VStack,
  SimpleGrid,
  Icon,
  useColorModeValue,
  Flex,
  Badge,
} from '@chakra-ui/react'
import { useWallet } from '@solana/wallet-adapter-react'
import { useNavigate } from 'react-router-dom'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { FaBrain, FaTrophy, FaLock } from 'react-icons/fa'

const Feature = ({ title, text, icon }: { title: string; text: string; icon: any }) => {
  return (
    <VStack
      bg={useColorModeValue('gray.800', 'gray.800')}
      p={8}
      borderRadius="xl"
      boxShadow="xl"
      spacing={4}
      height="full"
      borderWidth={1}
      borderColor="whiteAlpha.200"
      _hover={{
        transform: 'translateY(-4px)',
        boxShadow: '2xl',
      }}
      transition="all 0.3s"
    >
      <Flex
        w={16}
        h={16}
        align="center"
        justify="center"
        color="white"
        rounded="full"
        bg="brand.500"
        mb={1}
      >
        <Icon as={icon} w={8} h={8} />
      </Flex>
      <Heading size="md" color="white">
        {title}
      </Heading>
      <Text color="gray.400" textAlign="center">
        {text}
      </Text>
    </VStack>
  )
}

const Home = () => {
  const { connected } = useWallet()
  const navigate = useNavigate()
  const bgColor = useColorModeValue('gray.800', 'gray.800')

  return (
    <Container maxW="container.xl">
      <VStack spacing={16} align="stretch">
        {/* Hero Section */}
        <Box
          p={{ base: 8, md: 16 }}
          bg={bgColor}
          borderRadius="2xl"
          boxShadow="xl"
          textAlign="center"
          borderWidth={1}
          borderColor="whiteAlpha.200"
          position="relative"
          overflow="hidden"
          _before={{
            content: '""',
            position: 'absolute',
            top: '-10%',
            left: '-10%',
            width: '120%',
            height: '120%',
            bgGradient: 'radial(circle, brand.500 0%, transparent 70%)',
            opacity: 0.1,
            zIndex: 0,
          }}
        >
          <VStack spacing={6} position="relative" zIndex={1}>
            <Badge
              colorScheme="brand"
              p={2}
              borderRadius="full"
              textTransform="uppercase"
              letterSpacing="wide"
            >
              Welcome to the Challenge
            </Badge>
            <Heading
              as="h1"
              size="2xl"
              bgGradient="linear(to-r, brand.200, brand.500)"
              bgClip="text"
            >
              Break.fun
            </Heading>
            <Text fontSize="xl" color="gray.400" maxW="2xl">
              Test your skills in AI prompt engineering and earn rewards by completing
              challenges. Can you outsmart the AI?
            </Text>
            {connected ? (
              <Button
                size="lg"
                colorScheme="brand"
                onClick={() => navigate('/agents')}
                _hover={{
                  transform: 'translateY(-2px)',
                  boxShadow: 'lg',
                }}
              >
                View Agents
              </Button>
            ) : (
              <VStack spacing={4}>
                <Text color="gray.400">Connect your wallet to get started</Text>
                <WalletMultiButton />
              </VStack>
            )}
          </VStack>
        </Box>

        {/* Features Section */}
        <SimpleGrid
          columns={{ base: 1, md: 3 }}
          spacing={10}
          px={{ base: 0, md: 4 }}
        >
          <Feature
            icon={FaBrain}
            title="Test Your Skills"
            text="Challenge yourself with various AI prompting scenarios and improve your skills"
          />
          <Feature
            icon={FaTrophy}
            title="Earn Rewards"
            text="Complete challenges successfully to earn points and unique badges"
          />
          <Feature
            icon={FaLock}
            title="Break Constraints"
            text="Learn to identify and work around AI behavioral constraints"
          />
        </SimpleGrid>
      </VStack>
    </Container>
  )
}

export default Home 