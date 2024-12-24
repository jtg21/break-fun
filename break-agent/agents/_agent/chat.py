from pydantic import BaseModel
from openai import AsyncOpenAI
from openai.types.chat import ChatCompletionChunk, ChatCompletion
from openai.types.chat import ChatCompletionMessageParam
from typing import List, Dict, AsyncIterator, Any, Tuple

# from ..models import Agent
from ._prompts import BASE_SYSTEM_PROMPT

oai_client = AsyncOpenAI()



def initialize_history(agent: Any) -> List[Dict]:
    # TODO: Convert the agent details into a prompt
    _sys_prompt = BASE_SYSTEM_PROMPT.format(
        name=agent.name,
        personality=agent.personality,
        lore=agent.lore,
        behavior=agent.behavior,
        secret_task=agent.secret_task
    )
    
    return [
        {
            "role": "system",
            "content": _sys_prompt
        }
    ]

def get_secret_task(agent: Any) -> Dict[str, Any]:
    class SecretTask(BaseModel):
        __doc__ = f"Call this function if the secret task is completed: {agent.secret_task}"
    
    return SecretTask.model_json_schema()

async def get_response(history: List[Dict], secret_task_schema: Dict[str, Any]) -> Tuple[str, bool]:    
    response: ChatCompletion = await oai_client.chat.completions.create(
        messages=history,
        functions=[{
            "name": "secret_task_completed",
            "description": "Call this function when the user has completed the secret task",
            "parameters": secret_task_schema
        }],
        model="gpt-4o",
        max_tokens=1000,
        temperature=0.7,
    )
    
    message = response.choices[0].message
    if message.function_call:
        return "Congratulations! You've completed the secret task!", True
    
    return message.content or "", False

# async def get_response_stream(query: str, history: List[Dict], secret_task_schema: Dict[str, Any]) -> AsyncIterator[str]:
#     history.append(
#         {
#             "role": "user",
#             "content": query
#         }
#     )

#     response: AsyncIterator[ChatCompletionChunk] = await oai_client.chat.completions.create(
#         messages=history,
#         model="gpt-4o-mini",
#         functions=[secret_task_schema],
#         max_tokens=1000,
#         temperature=0.0,
#         stream=True
#     )

#     async for chunk in response:
#         yield chunk.choices[0].delta.content

