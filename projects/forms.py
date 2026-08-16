from django import forms

class FlagSubmissionForm(forms.Form):
    flag = forms.CharField(label='Enter Flag', max_length=100, widget=forms.TextInput(attrs={
        'class': 'form-control bg-dark text-white border-secondary',
        'placeholder': 'FLAG{...}'
    }))