from django.db import migrations

def create_services(apps, schema_editor):
    Service = apps.get_model('core', 'Service')
    services = [
        {"name": "McDonald's", "description": "Fast food restaurant specializing in burgers and fries", "is_active": True},
        {"name": "Supermac's", "description": "Irish fast food chain known for burgers and fries", "is_active": True},
        {"name": "Burger King", "description": "Fast food chain known for flame-grilled burgers", "is_active": True},
        {"name": "Domino's Pizza", "description": "Pizza delivery service offering a variety of toppings", "is_active": True},
        {"name": "Starbucks", "description": "Coffeehouse chain offering specialty coffees and pastries", "is_active": True},
        {"name": "Costa Coffee", "description": "Coffeehouse chain serving a range of beverages and snacks", "is_active": True},
        {"name": "The Greenhouse Restaurant", "description": "Fine dining restaurant offering seasonal Irish cuisine", "is_active": True},
        {"name": "Dine In Irish Pub", "description": "Traditional Irish pub with food, drinks, and live music", "is_active": True},
        {"name": "Guinness Storehouse Tour", "description": "Visitor center offering tours and tastings of Guinness", "is_active": True},
        {"name": "Irish Travel Agency", "description": "Travel agency specializing in tours and vacations in Ireland", "is_active": True},
        {"name": "Bank of Ireland", "description": "Retail banking services for personal and business customers", "is_active": True},
        {"name": "AIB (Allied Irish Banks)", "description": "Irish bank providing financial services and loans", "is_active": True},
        {"name": "Liberty Insurance", "description": "Insurance provider offering a range of insurance products", "is_active": True},
        {"name": "Vodafone Ireland", "description": "Telecommunications provider for mobile and broadband services", "is_active": True},
        {"name": "Three Ireland", "description": "Mobile network offering phone and internet services", "is_active": True},
        {"name": "Eir", "description": "Telecommunications company providing internet and mobile services", "is_active": True},
        {"name": "Dublin Bus", "description": "Public transport service in Dublin", "is_active": True},
        {"name": "Bus Éireann", "description": "National bus service operating across Ireland", "is_active": True},
        {"name": "Iarnród Éireann", "description": "National rail service for intercity and commuter travel", "is_active": True},
        {"name": "Aer Lingus", "description": "National airline of Ireland offering domestic and international flights", "is_active": True},
        {"name": "Ryanair", "description": "Low-cost airline operating flights from Ireland", "is_active": True},
        {"name": "Limerick City Council Services", "description": "Local government services including housing and community support", "is_active": True},
        {"name": "Galway City Council Services", "description": "Local government services in Galway for planning and community support", "is_active": True},
        {"name": "Trinity College Dublin", "description": "Higher education institution offering undergraduate and postgraduate programs", "is_active": True},
        {"name": "University College Dublin (UCD)", "description": "Major Irish university providing a range of academic courses", "is_active": True},
        {"name": "National Library of Ireland", "description": "Cultural institution providing research and public library services", "is_active": True},
        {"name": "Dublin Zoo", "description": "Zoo in Dublin offering educational and recreational experiences", "is_active": True},
        {"name": "Phoenix Park Visitor Centre", "description": "Visitor center in one of Europe's largest urban parks", "is_active": True},
        {"name": "Irish Medical Clinic", "description": "Medical clinic providing general practitioner and specialist services", "is_active": True},
        {"name": "Dublin Dental Clinic", "description": "Dental practice offering routine and cosmetic dental care", "is_active": True},
        {"name": "Health Insurance Ireland", "description": "Provider of private health insurance plans", "is_active": True},
        {"name": "Irish Beauty Salon", "description": "Beauty salon offering hair, makeup, and skincare services", "is_active": True},
        {"name": "Irish Spa Retreat", "description": "Wellness center offering massages, facials, and relaxation treatments", "is_active": True},
        {"name": "Barber Shop Dublin", "description": "Traditional barber service offering haircuts and shaves", "is_active": True},
        {"name": "Irish Car Repair Service", "description": "Automotive repair and maintenance service", "is_active": True},
        {"name": "Dublin Auto Spa", "description": "Car wash and detailing service", "is_active": True},
        {"name": "Local Hardware Store", "description": "Retail store offering home improvement and hardware supplies", "is_active": True},
        {"name": "Home Depot Ireland", "description": "Large home improvement retailer", "is_active": True},
        {"name": "SuperValu Ireland", "description": "Supermarket chain offering groceries and local produce", "is_active": True},
        {"name": "Centra Ireland", "description": "Convenience store chain across Ireland", "is_active": True},
        {"name": "Dunnes Stores", "description": "Department store and supermarket offering clothing, groceries, and home goods", "is_active": True},
        {"name": "Penneys (Primark Ireland)", "description": "Affordable fashion retailer with clothing for all ages", "is_active": True},
        {"name": "Irish Bookstore", "description": "Retail bookstore offering literature and educational resources", "is_active": True},
        {"name": "HMV Ireland", "description": "Entertainment retailer offering music, movies, and video games", "is_active": True},
        {"name": "Eircom Technology Solutions", "description": "IT and telecom services provider", "is_active": True},
        {"name": "Web Design Ireland", "description": "Digital agency offering web design and development services", "is_active": True},
        {"name": "Dublin Legal Services", "description": "Law firm providing legal advice and representation", "is_active": True},
        {"name": "Accounting Ireland", "description": "Professional accounting and bookkeeping services", "is_active": True},
        {"name": "Irish Marketing Agency", "description": "Digital marketing agency offering SEO, PPC, and branding services", "is_active": True},
        {"name": "Event Management Ireland", "description": "Event planning and management services for corporate and private events", "is_active": True},
    ]
    for service_data in services:
        if not Service.objects.filter(name=service_data["name"]).exists():
            Service.objects.create(**service_data)

class Migration(migrations.Migration):

    dependencies = [
        ('core', '0002_remove_appointmentdetails_date_created_and_more'),
    ]

    operations = [
        migrations.RunPython(create_services),
    ]