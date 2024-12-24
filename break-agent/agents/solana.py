from solders.keypair import Keypair
from solders.pubkey import Pubkey
from solders.message import Message
from solders.transaction import Transaction

from solana.rpc.api import Client
from solders.system_program import TransferParams, transfer


LAMPORTS_PER_SOL = 1000000000
RESIDUAL_SOL_AMOUNT = 0.000005

def transfer_sol(from_private_key: str, to_address: str, amount: float):
    """
    Transfer SOL from one wallet to another on the Solana blockchain.

    Args:
        from_private_key (str): Base58 encoded private key of the sender's wallet
        to_address (str): Public key address of the recipient's wallet
        amount (float): Amount of SOL to transfer

    Returns:
        dict: Transaction result from the Solana client if successful, None if failed
              The result contains transaction signature and other details

    Note:
        - Uses devnet for safety
        - Amount is converted from SOL to lamports (1 SOL = 1 billion lamports)
        - Returns None if any required parameters are missing or if transaction fails
    """
    try:
        if not all([from_private_key, to_address, amount]):
            print("Missing required parameters for transfer_sol")
            return None

        # Initialize Solana client (using devnet for safety)
        print("Initializing Solana client on devnet...")
        client = Client("https://api.devnet.solana.com")

        # Create sender keypair from private key
        print(f"Creating sender keypair from private key...")
        sender = Keypair.from_base58_string(from_private_key)
        print(f"Sender public key: {sender.pubkey()}")

        # If amount is negative, transfer all available balance
        if amount < 0:
            print("Negative amount specified - calculating maximum transfer amount...")
            balance_response = client.get_balance(sender.pubkey())
            if balance_response.value is None:
                print("Failed to get sender balance")
                return None
            print(f"Current balance: {balance_response.value / LAMPORTS_PER_SOL} SOL")
            # Leave some SOL for transaction fees (0.000005 SOL)
            lamports = balance_response.value - RESIDUAL_SOL_AMOUNT * LAMPORTS_PER_SOL
            if lamports <= 0:
                print("Insufficient balance for transfer")
                return None
            print(f"Transferring {lamports / LAMPORTS_PER_SOL} SOL (keeping {RESIDUAL_SOL_AMOUNT} SOL for fees)")
        else:
            # Convert SOL to lamports (1 SOL = 1 billion lamports)
            lamports = int(amount * LAMPORTS_PER_SOL)
            print(f"Converting {amount} SOL to {lamports} lamports")

        # Create receiver public key
        print(f"Creating receiver public key from address: {to_address}")
        receiver = Pubkey.from_string(to_address)

        # Create transfer instruction
        print("Creating transfer instruction...")
        transfer_instruction = transfer(
            TransferParams(
                from_pubkey=sender.pubkey(),
                to_pubkey=receiver,
                lamports=lamports
            )
        )

        # Get recent blockhash
        print("Getting recent blockhash...")
        recent_blockhash = client.get_latest_blockhash().value.blockhash

        # Create message from instruction
        print("Creating transaction message...")
        message = Message(
            instructions=[transfer_instruction],
            payer=sender.pubkey()
        )

        # Create and sign transaction
        print("Creating and signing transaction...")
        transaction = Transaction(
            from_keypairs=[sender],
            message=message,
            recent_blockhash=recent_blockhash
        )

        # Send transaction
        print("Sending transaction...")
        result = client.send_transaction(transaction)
        print(f"Transaction sent successfully: {result}")

        return result

    except Exception as e:
        print(f"Error in transfer_sol: {str(e)}")
        return None

def generate_wallet():
    """
    Generates a new Solana wallet (keypair)
    Returns tuple of (public_key: str, private_key: str)
    """
    keypair = Keypair()
    return (str(keypair.pubkey()), bytes(keypair).hex())

