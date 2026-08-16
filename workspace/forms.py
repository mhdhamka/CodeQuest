from django import forms
from .models import WorkspaceRoom  # Adjust if your room model has a different name


class WorkspaceRoomForm(forms.ModelForm):

  class Meta:
    model = WorkspaceRoom
    fields = ['name', 'description', 'focus']
    widgets = {
        'name': forms.TextInput(attrs={
            'class': 'form-control bg-dark text-light border-success font-monospace',
            'placeholder': 'Enter room name or topic...',
        }),
        'description': forms.Textarea(attrs={
            'class': 'form-control bg-dark text-light border-success font-monospace',
            'placeholder': 'Describe the objectives or scope of the room...',
            'rows': 3,
        }),
        'focus': forms.TextInput(attrs={
            'class': 'form-control bg-dark text-light border-success font-monospace',
            'placeholder': 'e.g., Python/Django, Security, Frontend...',
        }),
    }