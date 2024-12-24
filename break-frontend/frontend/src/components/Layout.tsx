import {
  Box,
  Flex,
  Link as ChakraLink,
  Stack,
  Collapse,
  useColorModeValue,
  useDisclosure,
  Container,
  HStack,
} from '@chakra-ui/react'
import { Link as RouterLink, Outlet } from 'react-router-dom'
import { useWallet } from '@solana/wallet-adapter-react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import styled from '@emotion/styled'

const StyledWalletButton = styled(WalletMultiButton)`
  && {
    background-color: #3900e6 !important;
    transition: all 0.2s ease-in-out !important;
    padding: 0 24px !important;
    height: 44px !important;
    border-radius: 12px !important;
    font-size: 14px !important;
    font-weight: 500 !important;
    color: white !important;
    border: none !important;
    margin: 0 !important;
    
    &:not([disabled]):not(.wallet-adapter-button-trigger) {
      background-color: #3900e6 !important; 
    }
    
    &.wallet-adapter-button-trigger {
      background-color: #3900e6 !important;
    }
    
    &:hover {
      background-color: #501fff !important;
      transform: translateY(-2px) !important;
      box-shadow: 0 4px 12px rgba(57, 0, 230, 0.3) !important;
    }

    &:active {
      transform: translateY(0px) !important;
    }

    .wallet-adapter-button-start-icon {
      margin-right: 8px !important;
    }
  }
`

const Layout = () => {
  const { connected } = useWallet()
  const { isOpen } = useDisclosure()
  const bgColor = useColorModeValue('gray.800', 'gray.900')

  return (
    <Box minH="100vh" bg={useColorModeValue('gray.900', 'gray.900')}>
      <Box
        borderBottom={1}
        borderStyle="solid"
        borderColor={useColorModeValue('gray.700', 'gray.700')}
        bg={bgColor}
        position="fixed"
        w="full"
        zIndex={999}
      >
        <Container maxW="container.xl">
          <Flex
            color="white"
            minH="60px"
            py={{ base: 2 }}
            px={{ base: 4 }}
            align="center"
            justify="space-between"
          >
            <Flex flex={{ base: 1 }} justify={{ base: 'center', md: 'start' }}>
              <ChakraLink
                as={RouterLink}
                to="/"
                fontSize="xl"
                fontWeight="bold"
                color="white"
                _hover={{ textDecoration: 'none', color: 'brand.200' }}
              >
                Break.fun
              </ChakraLink>

              <HStack spacing={4} ml={10} display={{ base: 'none', md: 'flex' }}>
                {connected && (
                  <>
                    <ChakraLink
                      as={RouterLink}
                      to="/agents"
                      p={2}
                      fontSize="sm"
                      fontWeight={500}
                      color="white"
                      _hover={{
                        textDecoration: 'none',
                        color: 'brand.200',
                      }}
                    >
                      Agents
                    </ChakraLink>
                    <ChakraLink
                      as={RouterLink}
                      to="/profile"
                      p={2}
                      fontSize="sm"
                      fontWeight={500}
                      color="white"
                      _hover={{
                        textDecoration: 'none',
                        color: 'brand.200',
                      }}
                    >
                      Profile
                    </ChakraLink>
                  </>
                )}
                <ChakraLink
                  as={RouterLink}
                  to="/leaderboard"
                  p={2}
                  fontSize="sm"
                  fontWeight={500}
                  color="white"
                  _hover={{
                    textDecoration: 'none',
                    color: 'brand.200',
                  }}
                >
                  Leaderboard
                </ChakraLink>
              </HStack>
            </Flex>

            <Box>
              <StyledWalletButton />
            </Box>
          </Flex>

          <Collapse in={isOpen} animateOpacity>
            <Stack
              bg={bgColor}
              p={4}
              display={{ md: 'none' }}
              spacing={4}
              divider={
                <Box
                  borderBottom={1}
                  borderStyle="solid"
                  borderColor="whiteAlpha.200"
                />
              }
            >
              {connected && (
                <>
                  <ChakraLink
                    as={RouterLink}
                    to="/agents"
                    p={2}
                    fontSize="sm"
                    fontWeight={500}
                    color="white"
                    _hover={{
                      textDecoration: 'none',
                      color: 'brand.200',
                    }}
                  >
                    Agents
                  </ChakraLink>
                  <ChakraLink
                    as={RouterLink}
                    to="/profile"
                    p={2}
                    fontSize="sm"
                    fontWeight={500}
                    color="white"
                    _hover={{
                      textDecoration: 'none',
                      color: 'brand.200',
                    }}
                  >
                    Profile
                  </ChakraLink>
                </>
              )}
              <ChakraLink
                as={RouterLink}
                to="/leaderboard"
                p={2}
                fontSize="sm"
                fontWeight={500}
                color="white"
                _hover={{
                  textDecoration: 'none',
                  color: 'brand.200',
                }}
              >
                Leaderboard
              </ChakraLink>
            </Stack>
          </Collapse>
        </Container>
      </Box>

      <Container as="main" maxW="container.xl" pt="80px" pb={8}>
        <Outlet />
      </Container>
    </Box>
  )
}

export default Layout 