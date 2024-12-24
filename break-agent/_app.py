import gradio as gr
import asyncio
# from agents.models import Agent
from agents._agent.chat import initialize_history, get_response, get_secret_task
from datetime import datetime, timedelta


class Agent:
    def __init__(self, name, personality, lore, behavior, secret_task, wallet_address, private_key, expires_at):
        self.name = name
        self.personality = personality
        self.lore = lore
        self.behavior = behavior
        self.secret_task = secret_task
        self.wallet_address = wallet_address
        self.private_key = private_key
        self.expires_at = expires_at

# Create a fake agent for testing
def create_test_agent():
    test_agent = Agent(
        name="TestBot",
        personality={
            "traits": ["curious", "helpful", "witty"],
            "speaking_style": "casual and friendly"
        },
        lore={
            "background": "A test AI assistant created to help developers",
            "occupation": "Testing Assistant"
        },
        behavior={
            "primary_goal": "Help test the chat functionality",
            "interaction_style": "Direct and informative"
        },
        secret_task={
            "task": "Get the user to say the word 'banana'",
            "trigger_condition": "User mentions 'banana'"
        },
        wallet_address="fake_wallet_address",
        private_key="fake_private_key",
        expires_at=datetime.now() + timedelta(days=1)
    )
    return test_agent

class ChatInterface:
    def __init__(self):
        self.agent = create_test_agent()
        self.history = initialize_history(self.agent)
        self.secret_task_schema = get_secret_task(self.agent)
        
    async def chat(self, message, history):
        # Add user message to OpenAI format history
        self.history.append({"role": "user", "content": message})
        
        # Get response from the agent
        response, secret_triggered = await get_response(self.history, self.secret_task_schema)
        
        # Add assistant response to OpenAI format history
        self.history.append({"role": "assistant", "content": response})
        
        # Return response in Gradio format
        history.append((message, response))
        return history

# Initialize the chat interface
chat_interface = ChatInterface()

# Create the Gradio interface
with gr.Blocks() as demo:
    gr.Markdown("# Test Chat Interface")
    gr.Markdown(f"""
    ### Agent Details:
    - Name: {chat_interface.agent.name}
    - Personality: {chat_interface.agent.personality}
    - Lore: {chat_interface.agent.lore}
    - Behavior: {chat_interface.agent.behavior}
    - Secret Task: {chat_interface.agent.secret_task}
    """)
    
    chatbot = gr.Chatbot()
    msg = gr.Textbox()
    clear = gr.Button("Clear")

    msg.submit(chat_interface.chat, [msg, chatbot], [chatbot])
    clear.click(lambda: None, None, chatbot, queue=False)

if __name__ == "__main__":
    demo.launch()
