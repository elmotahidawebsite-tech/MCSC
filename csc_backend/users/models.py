from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """
    MVP: role is a plain string field, no separate Roles table yet.
    Add a proper Roles/Permissions model later if access control grows.
    """

    class Role(models.TextChoices):
        OFFICER = "officer", "Officer"
        ADMIN = "admin", "Admin"
        SUPPORT = "support", "Support"   # ✅ مسؤل الدعم الفني

    role = models.CharField(max_length=20, choices=Role.choices, default=Role.OFFICER)

    def __str__(self):
        return f"{self.username} ({self.role})"
