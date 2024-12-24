from django.shortcuts import render, get_object_or_404
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.utils import timezone

import json
import httpx
from datetime import datetime, timedelta

from solders.pubkey import Pubkey

from .models import *
from .solana import generate_wallet, transfer_sol, LAMPORTS_PER_SOL
from ._agent.chat import get_response, get_secret_task, initialize_history

async def get_solana_balance(wallet_address: str) -> float:
    """Get balance for a Solana wallet using direct RPC call."""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.devnet.solana.com",
                json={
                    "jsonrpc": "2.0",
                    "id": 1,
                    "method": "getBalance",
                    "params": [wallet_address]
                }
            )
            data = response.json()
            if 'result' in data and 'value' in data['result']:
                return float(data['result']['value']) / LAMPORTS_PER_SOL
            return 0
    except Exception as e:
        print(f"Error getting balance for wallet {wallet_address}: {str(e)}")
        return 0

@csrf_exempt
async def test(request):
    return JsonResponse({
        'success': True,
        'message': 'Test successful'
    })

@csrf_exempt
async def create_user(request):
    """ 
    Using a wallet address, create a user.
    """
    try:
        data = request.POST
        wallet_address = data.get('wallet_address')
        
        if not wallet_address:
            return JsonResponse({
                'success': False,
                'message': 'Wallet address is required'
            })

        # Try to get existing user or create new one
        user, created = await User.objects.aget_or_create(wallet_address=wallet_address)

        return JsonResponse({
            'success': True,
            'message': 'User created successfully' if created else 'User already exists',
            'wallet_address': wallet_address
        })

    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': str(e)
        })

@csrf_exempt
async def create_agent(request):
    """ 
    Create an agent from the specified parameters.
    """
    try:
        data = request.POST
        
        # Get required parameters
        creator_wallet = data.get('wallet_address')
        name = data.get('name')
        personality = json.loads(data.get('personality', '{}'))
        lore = json.loads(data.get('lore', '{}'))
        behavior = json.loads(data.get('behavior', '{}'))
        secret_task = json.loads(data.get('secret_task', '{}'))
        
        # Optional: expires_at (default 30 days from now)
        expires_at = datetime.now() + timedelta(days=30)
        if data.get('expires_at'):
            expires_at = datetime.fromisoformat(data.get('expires_at'))

        # Validate required fields
        if not all([creator_wallet, name]):
            return JsonResponse({
                'success': False,
                'message': 'Missing required fields: wallet_address and name'
            })

        # Get creator user
        creator = await User.objects.aget(wallet_address=creator_wallet)
        
        # Generate Solana wallet for agent
        public_key, private_key = generate_wallet()
        
        # Create and save agent
        agent = Agent(
            creator=creator,
            name=name,
            personality=personality,
            lore=lore,
            behavior=behavior,
            secret_task=secret_task,
            wallet_address=public_key,
            private_key=private_key,
            expires_at=expires_at
        )
        await agent.asave()

        return JsonResponse({
            'success': True,
            'message': 'Agent created successfully',
            'agent': {
                'id': agent.id,
                'name': agent.name,
                'wallet_address': agent.wallet_address,
                'expires_at': agent.expires_at.isoformat(),
                # Note: private_key should be stored securely or given to the creator
                # 'private_key': private_key  
            }
        })

    except User.DoesNotExist:
        return JsonResponse({
            'success': False,
            'message': 'Creator wallet address not found'
        })
    except json.JSONDecodeError:
        return JsonResponse({
            'success': False,
            'message': 'Invalid JSON in one of the fields'
        })
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': str(e)
        })

@csrf_exempt
async def get_agent_response(request):
    """
    Chat with an agent.
    
    Expected POST parameters:
    - agent_wallet: str - Agent's wallet address
    - user_wallet: str - User's wallet address
    - message: str - User's message to the agent
    """
    try:
        data = request.POST
        agent_wallet = data.get('agent_wallet')
        user_wallet = data.get('user_wallet')
        message = data.get('message')
        

        # Validate required fields
        if not all([agent_wallet, user_wallet, message]):
            return JsonResponse({
                'success': False,
                'message': 'Missing required fields: agent_wallet, user_wallet, and message'
            })

        # Get agent and user
        agent = await Agent.objects.aget(wallet_address=agent_wallet)
        user = await User.objects.aget(wallet_address=user_wallet)

        # Get wallet balances
        agent_balance = await get_solana_balance(agent_wallet)
        user_balance = await get_solana_balance(user_wallet)

        # Try to get existing chat history or create new one
        chat_history, created = await ChatHistory.objects.aget_or_create(
            agent=agent,
            user=user,
            defaults={
                'chat_history': initialize_history(agent),
                'secret_task_schema': get_secret_task(agent)
            }
        )

        # Get current history or initialize if empty
        history = chat_history.chat_history if not created else chat_history.chat_history
        secret_task_schema = chat_history.secret_task_schema

        # Add user message to history
        history.append({
            "role": "user",
            "content": message
        })

        print(f"history: {history}")

        # Get response from agent
        response, secret_task_completed = await get_response(history, secret_task_schema)

        # If the secret task is completed and hasn't been triggered before
        if secret_task_completed and not chat_history.triggered_secret_task:
            await transfer_sol(agent.private_key, user.wallet_address, -1.0)
            chat_history.triggered_secret_task = True

        # Add response to history and save
        history.append({
            "role": "assistant",
            "content": response
        })
        chat_history.chat_history = history
        await chat_history.asave()

        return JsonResponse({
            'success': True,
            'message': 'Response generated successfully',
            'response': response,
            'secret_task_completed': secret_task_completed,
            'agent_balance': agent_balance,
            'user_balance': user_balance
        })

    except Agent.DoesNotExist:
        return JsonResponse({
            'success': False,
            'message': 'Agent not found'
        })
    except User.DoesNotExist:
        return JsonResponse({
            'success': False,
            'message': 'User not found'
        })
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': str(e)
        })
    

@csrf_exempt
async def user_exists(request):
    """
    Check if a user with the given wallet address exists.
    """
    try:
        wallet_address = request.GET.get('wallet_address')
        
        if not wallet_address:
            return JsonResponse({
                'success': False,
                'message': 'Wallet address is required',
                'exists': False
            })

        # Try to get the user
        try:
            user = await User.objects.aget(wallet_address=wallet_address)
            exists = True
        except User.DoesNotExist:
            exists = False

        return JsonResponse({
            'success': True,
            'exists': exists
        })

    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': str(e),
            'exists': False
        })

@csrf_exempt
async def list_agents(request):
    """
    List all active agents.
    """
    try:
        # Get all agents that haven't expired
        agents = []
        
        async for agent in Agent.objects.select_related('creator').filter(expires_at__gt=timezone.now()):
            # Get the agent's balance
            prize_pool = await get_solana_balance(agent.wallet_address)

            agents.append({
                'id': agent.id,
                'name': agent.name,
                'wallet_address': agent.wallet_address,
                'expires_at': agent.expires_at.isoformat(),
                'creator': {
                    'wallet_address': agent.creator.wallet_address
                },
                'personality': agent.personality,
                'lore': agent.lore,
                'behavior': agent.behavior,
                'secret_task': agent.secret_task,
                'prize_pool': prize_pool
            })

        return JsonResponse({
            'success': True,
            'agents': agents
        })

    except Exception as e:
        print(f"Error in list_agents: {str(e)}")
        return JsonResponse({
            'success': False,
            'message': str(e)
        })

@csrf_exempt
async def transfer(request):
    """
    Transfer SOL to a user.
    """
    private_key = "d3187335e6bd53957236f283235a09e81419e210fed5aa1bb72518304d9d7b12185345a8a38b79d9b0432db5c85c1f15aac1ef480afa09a001e950eb9e1e255d"
    to_address = "Fyf3AmC9wTwSTtNDFvhzxNjCisodsrotbVw86yHzg5P8"
    amount = -1

    result = transfer_sol(private_key, to_address, amount)
    return JsonResponse({
        'success': True,
        'message': 'SOL transferred successfully',
        'result': result
    })

