# Generated by Django 5.1.3 on 2025-02-26 05:13

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0004_service_minimal_prep_time_service_requires_prep_time'),
    ]

    operations = [
        migrations.AddField(
            model_name='queue',
            name='expected_ready_time',
            field=models.DateTimeField(blank=True, null=True),
        ),
    ]
