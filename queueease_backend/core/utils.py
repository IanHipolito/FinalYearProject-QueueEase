import json

def parse_geojson(filepath):
    with open(filepath, 'r', encoding='utf-8') as file:
        data = json.load(file)
    
    services = []
    for feature in data['features']:
        properties = feature.get('properties', {})
        geometry = feature.get('geometry', {})
        coordinates = geometry.get('coordinates', [])
        geometry_type = geometry.get('type')
        name = properties.get('name')
        if properties and geometry and geometry_type == 'Point' and len(coordinates) == 2 and name:
            service = {
                'name': name,
                'category': properties.get('amenity') or properties.get('office') or properties.get('healthcare'),
                'latitude': coordinates[1],
                'longitude': coordinates[0],
                'details': properties
            }
            services.append(service)
    return services

def categorize_services(services):
    categories = {
        'restaurant': ['restaurant', 'cafe', 'fast_food', 'pub', 'bar'],
        'healthcare': ['dentist', 'clinic', 'hospital', 'doctor', 'gp'],
        'government': ['post_office', 'government', 'administrative', 'public_service', 'ministry', 'register_office', 'parliament'],
        'retail': ['shop', 'supermarket'],
        'other': ['events_venue', 'veterinary', 'charging_station']
    }
    
    categorized_services = {category: [] for category in categories}
    
    for service in services:
        category_found = False
        for category, keywords in categories.items():
            if service['category'] in keywords:
                categorized_services[category].append(service)
                category_found = True
                break
        if not category_found:
            categorized_services['other'].append(service)
    
    return categorized_services
