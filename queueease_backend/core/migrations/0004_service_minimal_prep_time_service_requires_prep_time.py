# Generated by Django 5.1.3 on 2025-02-26 04:58

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0003_populate_services'),
    ]

    operations = [
        migrations.AddField(
            model_name='service',
            name='minimal_prep_time',
            field=models.IntegerField(default=3),
        ),
        migrations.AddField(
            model_name='service',
            name='requires_prep_time',
            field=models.BooleanField(default=True),
        ),
    ]
