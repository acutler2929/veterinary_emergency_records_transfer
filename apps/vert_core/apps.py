from django.apps import AppConfig


class RecordsConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.vert_core"
    verbose_name = "Veterinary Emergency Records Transfer"

    def ready(self):
        from . import signals   # noqa: F401 (connects the profile signal)
