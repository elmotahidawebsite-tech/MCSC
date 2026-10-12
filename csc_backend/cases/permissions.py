from django.http import Http404

from users.models import User

from .models import Case


def ensure_case_access(case, user):
    """
    الأدمن: وصول كامل لأي قضية.
    الضابط: قضيته هو وبس، وطالما لسه DRAFT.
    غير كده: 404 — نخفي وجود القضية تمامًا.
    """
    if user.role == User.Role.ADMIN:
        return
    if case.created_by_id == user.id and case.status == Case.Status.DRAFT:
        return
    raise Http404