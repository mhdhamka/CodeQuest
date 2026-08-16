from django.db import models
from django.contrib.auth.models import User

class Project(models.Model):
    title = models.CharField(max_length=100)
    description = models.TextField()
    technology = models.CharField(max_length=20)
    image = models.FileField(upload_to="project_images/", blank=True)

    def __str__(self):
        return self.title


class UserProfile(models.Model):
    USER_CLASSES = [
        ('SE', 'Software Engineer'),
        ('SEC', 'Security Analyst'),
        ('BE', 'Backend Architect'),
    ]
    
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    xp = models.IntegerField(default=0)
    level = models.IntegerField(default=1)
    role_class = models.CharField(max_length=3, choices=USER_CLASSES, default='SE')
    avatar_badge = models.CharField(max_length=100, blank=True, null=True)

    def add_xp(self, amount):
        self.xp += amount
        # Simple level progression formula: Every 500 XP increases the level
        self.level = (self.xp // 500) + 1
        self.save()

    def __str__(self):
        return f"{self.user.username} (Level {self.level})"


class CTFChallenge(models.Model):
    DIFFICULTY_LEVELS = [
        ('EASY', 'Easy'),
        ('MED', 'Medium'),
        ('HARD', 'Hard'),
    ]
    
    title = models.CharField(max_length=200)
    description = models.TextField()
    vulnerable_code = models.TextField()
    xp_reward = models.IntegerField(default=100)
    difficulty = models.CharField(max_length=10, choices=DIFFICULTY_LEVELS, default='EASY')
    flag = models.CharField(max_length=100)

    def __str__(self):
        return self.title


class ChallengeSubmission(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    challenge = models.ForeignKey(CTFChallenge, on_delete=models.CASCADE)
    solved_at = models.DateTimeField(auto_now_add=True)
    is_correct = models.BooleanField(default=False)

    class Meta:
        unique_together = ('user', 'challenge')

    def __str__(self):
        status = "Solved" if self.is_correct else "Attempted"
        return f"{self.user.username} - {self.challenge.title} ({status})"