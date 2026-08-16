from django.urls import path
from . import views

urlpatterns = [
    path('', views.workspace_index, name='workspace_index'),
    path('room/create/', views.create_room, name='create_room'),
    path('rooms/<int:pk>/edit/', views.edit_room, name='edit_room'),
    path('room/<int:room_id>/', views.room_detail, name='room_detail'),  
    path('project/<int:pk>/', views.project_detail, name='project_detail'),
    path('challenge/<int:pk>/', views.ctf_challenge_detail, name='ctf_challenge_detail'),
    path('profile/', views.user_profile_view, name='profile'),
]