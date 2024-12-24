from django.db import models


class User(models.Model):
    wallet_address = models.CharField(max_length=44, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)

class Agent(models.Model):
    creator = models.ForeignKey(User, on_delete=models.CASCADE, related_name='agents')
    name = models.CharField(max_length=100)
    personality = models.JSONField(default=dict)
    lore = models.JSONField(default=dict)
    behavior = models.JSONField(default=dict)
    secret_task = models.JSONField(default=dict)
    wallet_address = models.CharField(max_length=44)  # Solana wallet address
    private_key = models.CharField(max_length=128)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(null=True)
    
    def __str__(self):
        return self.name

class ChatHistory(models.Model):
    agent = models.ForeignKey(Agent, on_delete=models.CASCADE, related_name='messages')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='messages')
    
    chat_history = models.JSONField(default=list)
    secret_task_schema = models.JSONField(default=dict)
    started_at = models.DateTimeField(auto_now_add=True)
    triggered_secret_task = models.BooleanField(default=False)
    
    class Meta:
        ordering = ['started_at']
