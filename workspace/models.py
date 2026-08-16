from django.db import models

class WorkspaceRoom(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True, help_text="Describe the objectives or scope of the room.")
    focus = models.CharField(max_length=100, blank=True, null=True, help_text="Primary technology stack or focus area (e.g., Python/Django)")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name