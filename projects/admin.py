from django.contrib import admin
from .models import Project, UserProfile, CTFChallenge, ChallengeSubmission


class ProjectAdmin(admin.ModelAdmin):
    pass


admin.site.register(Project, ProjectAdmin)
admin.site.register(UserProfile)
admin.site.register(CTFChallenge)
admin.site.register(ChallengeSubmission)