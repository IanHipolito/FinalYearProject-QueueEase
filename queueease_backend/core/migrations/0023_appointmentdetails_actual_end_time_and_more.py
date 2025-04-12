# Generated by Django 5.1.3 on 2025-04-10 20:24

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0022_queue_last_notification_time_notificationsettings'),
    ]

    operations = [
        migrations.AddField(
            model_name='appointmentdetails',
            name='actual_end_time',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='appointmentdetails',
            name='actual_start_time',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='appointmentdetails',
            name='delay_notified',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='appointmentdetails',
            name='expected_duration',
            field=models.IntegerField(default=30),
        ),
        migrations.AddField(
            model_name='appointmentdetails',
            name='last_delay_minutes',
            field=models.IntegerField(blank=True, null=True),
        ),
    ]
