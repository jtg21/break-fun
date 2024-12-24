from django.urls import path, include
from .views import *


urlpatterns = [
    path('test/', test, name='test'),
    path('users/exists/', user_exists, name='user_exists'),
    path('users/create/', create_user, name='create_user'),
    path('agents/list/', list_agents, name='list_agents'),
    path('agents/create/', create_agent, name='create_agent'),
    path('agents/chat/', get_agent_response, name='get_agent_response'),
    path('agents/transfer/', transfer, name='transfer'),
]

