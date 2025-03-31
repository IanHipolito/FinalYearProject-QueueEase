from django.db import migrations

def update_service_parameters(apps, schema_editor):
    Service = apps.get_model('core', 'Service')
    for service in Service.objects.all():
        service.parallel_capacity = 8
        if not service.minimal_prep_time:
            service.minimal_prep_time = 5
        service.save()

class Migration(migrations.Migration):
    dependencies = [
        ('core', '0004_service_minimal_prep_time_service_requires_prep_time'),
    ]

    operations = [
        migrations.RunPython(update_service_parameters),
    ]