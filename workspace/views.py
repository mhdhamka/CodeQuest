from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.core.paginator import Paginator
from django.db.models import Q
from django.shortcuts import get_object_or_404, redirect, render
from projects.models import ChallengeSubmission, CTFChallenge, Project, UserProfile
from .forms import WorkspaceRoomForm
from .models import WorkspaceRoom  # <-- Ensure WorkspaceRoom is imported


def workspace_index(request):
  project_list = Project.objects.all().order_by('-id')
  rooms = WorkspaceRoom.objects.all().order_by(
      '-created_at'
  )  # Fetch all created rooms

  # Paginate Projects (6 per page)
  project_paginator = Paginator(project_list, 6)
  project_page_num = request.GET.get('project_page')
  projects = project_paginator.get_page(project_page_num)

  context = {
      'projects': projects,
      'rooms': rooms,  # Pass rooms to context
  }
  return render(request, 'workspace/workspace_index.html', context)


def create_room(request):
  if request.method == 'POST':
    form = WorkspaceRoomForm(request.POST)
    if form.is_valid():
      room = form.save()
      return redirect('room_detail', room_id=room.pk)
  else:
    form = WorkspaceRoomForm()

  context = {'form': form}
  return render(request, 'workspace/create_room.html', context)


def room_detail(request, room_id):
  room = get_object_or_404(WorkspaceRoom, pk=room_id)
  context = {'room': room}
  return render(request, 'workspace/room_detail.html', context)


def edit_room(request, pk):
  room = get_object_or_404(WorkspaceRoom, pk=pk)

  if request.method == 'POST':
    form = WorkspaceRoomForm(request.POST, instance=room)
    if form.is_valid():
      form.save()
      return redirect('room_detail', room_id=room.pk)
  else:
    form = WorkspaceRoomForm(instance=room)

  context = {'room': room, 'form': form}
  return render(request, 'workspace/edit_room.html', context)


def project_detail(request, pk):
  project = get_object_or_404(Project, pk=pk)
  context = {'project': project}
  return render(request, 'projects/project_detail.html', context)


@login_required
def ctf_challenge_detail(request, pk):
  challenge = get_object_or_404(CTFChallenge, pk=pk)
  user_profile, created = UserProfile.objects.get_or_create(user=request.user)

  existing_submission = ChallengeSubmission.objects.filter(
      user=request.user, challenge=challenge, is_correct=True
  ).first()
  already_solved = bool(existing_submission)

  if request.method == 'POST' and not already_solved:
    submitted_flag = request.POST.get('flag', '').strip()

    if submitted_flag == challenge.flag.strip():
      ChallengeSubmission.objects.update_or_create(
          user=request.user,
          challenge=challenge,
          defaults={'submitted_flag': submitted_flag, 'is_correct': True},
      )
      user_profile.add_xp(challenge.xp_reward)
      messages.success(
          request, f'Correct flag! You earned {challenge.xp_reward} XP.'
      )
      return redirect('ctf_challenge_detail', pk=challenge.pk)
    else:
      ChallengeSubmission.objects.update_or_create(
          user=request.user,
          challenge=challenge,
          defaults={'submitted_flag': submitted_flag, 'is_correct': False},
      )
      messages.error(
          request, 'Incorrect flag. Inspect the code snippet and try again!'
      )
      return redirect('ctf_challenge_detail', pk=challenge.pk)

  context = {
      'challenge': challenge,
      'already_solved': already_solved,
      'user_profile': user_profile,
  }
  return render(request, 'projects/ctf_challenge_detail.html', context)


@login_required
def user_profile_view(request):
  user_profile, created = UserProfile.objects.get_or_create(user=request.user)
  solved_submissions = ChallengeSubmission.objects.filter(
      user=request.user, is_correct=True
  ).select_related('challenge')

  context = {
      'user_profile': user_profile,
      'solved_submissions': solved_submissions,
  }
  return render(request, 'projects/profile.html', context)