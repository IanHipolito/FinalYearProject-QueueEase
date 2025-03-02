from django.db import migrations

def remove_demo_services(apps, schema_editor):
    Service = apps.get_model('core', 'Service')
    demo_service_names = [
        "McDonald's", "Supermac's", "Burger King", "Domino's Pizza", "Starbucks", "Costa Coffee",
        "The Greenhouse Restaurant", "Dine In Irish Pub", "Guinness Storehouse Tour", "Irish Travel Agency",
        "Bank of Ireland", "AIB (Allied Irish Banks)", "Liberty Insurance", "Vodafone Ireland", "Three Ireland",
        "Eir", "Dublin Bus", "Bus Éireann", "Iarnród Éireann", "Aer Lingus", "Ryanair", "Limerick City Council Services",
        "Galway City Council Services", "Trinity College Dublin", "University College Dublin (UCD)",
        "National Library of Ireland", "Dublin Zoo", "Phoenix Park Visitor Centre", "Irish Medical Clinic",
        "Dublin Dental Clinic", "Health Insurance Ireland", "Irish Beauty Salon", "Irish Spa Retreat",
        "Barber Shop Dublin", "Irish Car Repair Service", "Dublin Auto Spa", "Local Hardware Store",
        "Home Depot Ireland", "SuperValu Ireland", "Centra Ireland", "Dunnes Stores", "Penneys (Primark Ireland)",
        "Irish Bookstore", "HMV Ireland", "Eircom Technology Solutions", "Web Design Ireland", "Dublin Legal Services",
        "Accounting Ireland", "Irish Marketing Agency", "Event Management Ireland"
    ]
    Service.objects.filter(name__in=demo_service_names).delete()

class Migration(migrations.Migration):

    dependencies = [
        ('core', '0003_populate_services'),
    ]

    operations = [
        migrations.RunPython(remove_demo_services),
    ]