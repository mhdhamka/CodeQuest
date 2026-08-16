from django.urls import path
from . import views

urlpatterns = [
    path('', views.project_index, name='project_index'),
    path('project/<int:pk>/', views.project_detail, name='project_detail'),
    path('challenge/<int:pk>/', views.ctf_challenge_detail, name='ctf_challenge_detail'),
    path('profile/', views.user_profile_view, name='profile'), 
]