
from django.db import models

RESPONSE_TYPES = [
        ('html', 'HTML'),
        ('text', 'Plain Text'),
    ]

#python manage.py create_index

class Commands(models.Model):
    name = models.CharField(max_length=100, unique=True)
    serial = models.IntegerField(unique=True)
    forwhat = models.CharField(max_length=255)
    response_type = models.CharField(max_length=50, default='text', choices=RESPONSE_TYPES)
    response = models.TextField()

    def __str__(self):
        return self.name

    class Meta:
        verbose_name_plural = "Commands"