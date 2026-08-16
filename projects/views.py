from django.shortcuts import render, get_object_or_404, redirect
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.core.paginator import Paginator
from django.db.models import Q
from projects.models import Project, CTFChallenge, ChallengeSubmission, UserProfile


def project_index(request):
    project_list = Project.objects.all().order_by('-id')
    challenge_list = CTFChallenge.objects.all()
    
    # 1. Difficulty Filter
    difficulty_filter = request.GET.get('filter', 'all')
    if difficulty_filter in ['easy', 'medium', 'hard']:
        challenge_list = challenge_list.filter(difficulty__iexact=difficulty_filter)

    # 2. Search Filter (by title or description)
    search_query = request.GET.get('q', '').strip()
    if search_query:
        challenge_list = challenge_list.filter(
            Q(title__icontains=search_query) | Q(description__icontains=search_query)
        )

    # 3. Sort Options (XP high/low, newest)
    sort_option = request.GET.get('sort', 'default')
    if sort_option == 'xp_high':
        challenge_list = challenge_list.order_by('-xp_reward')
    elif sort_option == 'xp_low':
        challenge_list = challenge_list.order_by('xp_reward')
    elif sort_option == 'newest':
        challenge_list = challenge_list.order_by('-id')
    else:
        challenge_list = challenge_list.order_by('id')

    # Paginate Projects (6 per page)
    project_paginator = Paginator(project_list, 6)
    project_page_num = request.GET.get('project_page')
    projects = project_paginator.get_page(project_page_num)

    # Paginate Challenges (6 per page)
    challenge_paginator = Paginator(challenge_list, 6)
    challenge_page_num = request.GET.get('challenge_page')
    challenges = challenge_paginator.get_page(challenge_page_num)

    context = {
        "projects": projects,
        "challenges": challenges,
        "current_filter": difficulty_filter,
        "search_query": search_query,
        "current_sort": sort_option,
    }
    return render(request, "projects/project_index.html", context)


def project_detail(request, pk):
    project = get_object_or_404(Project, pk=pk)
    context = {"project": project}
    return render(request, "projects/project_detail.html", context)


@login_required
def ctf_challenge_detail(request, pk):
    challenge = get_object_or_404(CTFChallenge, pk=pk)
    user_profile, created = UserProfile.objects.get_or_create(user=request.user)
    
    existing_submission = ChallengeSubmission.objects.filter(user=request.user, challenge=challenge, is_correct=True).first()
    already_solved = bool(existing_submission)

    if request.method == 'POST' and not already_solved:
        submitted_flag = request.POST.get('flag', '').strip()
        
        if submitted_flag == challenge.flag.strip():
            ChallengeSubmission.objects.update_or_create(
                user=request.user,
                challenge=challenge,
                defaults={
                    'submitted_flag': submitted_flag,
                    'is_correct': True
                }
            )
            user_profile.add_xp(challenge.xp_reward)
            messages.success(request, f"Correct flag! You earned {challenge.xp_reward} XP.")
            return redirect('ctf_challenge_detail', pk=challenge.pk)
        else:
            ChallengeSubmission.objects.update_or_create(
                user=request.user,
                challenge=challenge,
                defaults={
                    'submitted_flag': submitted_flag,
                    'is_correct': False
                }
            )
            messages.error(request, "Incorrect flag. Inspect the code snippet and try again!")
            return redirect('ctf_challenge_detail', pk=challenge.pk)

    context = {
        "challenge": challenge,
        "already_solved": already_solved,
        "user_profile": user_profile,
    }
    return render(request, "projects/ctf_challenge_detail.html", context)


@login_required
def user_profile_view(request):
    user_profile, created = UserProfile.objects.get_or_create(user=request.user)
    solved_submissions = ChallengeSubmission.objects.filter(
        user=request.user, 
        is_correct=True
    ).select_related('challenge')

    context = {
        "user_profile": user_profile,
        "solved_submissions": solved_submissions,
    }
    return render(request, "projects/profile.html", context)