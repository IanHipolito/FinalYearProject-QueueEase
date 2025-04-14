from django.http import JsonResponse
from django.shortcuts import get_object_or_404
from django.db import models
from django.utils import timezone
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from datetime import datetime, timedelta
import logging
from ..models import Service, ServiceWaitTime, Queue, ServiceAdmin, AppointmentDetails
from ..serializers import ServiceSerializer

logger = logging.getLogger(__name__)

@api_view(['GET'])
def api_overview(request):
    return Response({"message": "Welcome to the API!"})

@api_view(['GET'])
def list_services(request):
    try:
        services = Service.objects.filter(is_active=True)
        
        service_data = []
        for service in services:
            try:
                queue_count = Queue.objects.filter(
                    service=service,
                    status='pending',
                    is_active=True
                ).count()
                
                avg_wait_time = ServiceWaitTime.objects.filter(
                    service=service
                ).order_by('-date_recorded')[:5].aggregate(
                    avg_time=models.Avg('wait_time')
                )['avg_time'] or 10
                
                service_dict = {
                    'id': service.id,
                    'name': service.name,
                    'description': service.description,
                    'category': service.category,
                    'service_type': service.service_type,
                    'queue_length': queue_count,
                    'wait_time': avg_wait_time,
                    'latitude': getattr(service, 'latitude'),
                    'longitude': getattr(service, 'longitude')
                }
                service_data.append(service_dict)
            except Exception as service_error:
                print(f"Error processing service {service.name}: {str(service_error)}")
                continue
        
        return Response(service_data)
    except Exception as e:
        print(f"Error in list_services: {str(e)}")
        return Response(
            {"error": "An unexpected error occurred"}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    
@api_view(['GET'])
def service_detail(request, service_id):
    try:
        service = get_object_or_404(Service, pk=service_id)
        serializer = ServiceSerializer(service)
        return Response(serializer.data)
    except Exception as e:
        return Response({"error": str(e)}, status=500)
    
@api_view(['GET'])
def available_appointment_times(request, service_id):
    try:
        service = get_object_or_404(Service, pk=service_id)
        date_str = request.GET.get('date')
        
        if not date_str:
            return Response({"error": "Date parameter is required"}, status=400)
        
        try:
            date = datetime.strptime(date_str, '%Y-%m-%d').date()
        except ValueError:
            return Response({"error": "Invalid date format. Use YYYY-MM-DD"}, status=400)
        
        existing_appointments = AppointmentDetails.objects.filter(
            service=service,
            appointment_date=date,
            status='pending'
        ).values_list('appointment_time', flat=True)
        
        start_time = datetime.combine(date, datetime.min.time()).replace(hour=9, minute=0)
        end_time = datetime.combine(date, datetime.min.time()).replace(hour=17, minute=0)
        duration = service.average_duration if service.average_duration else 30
        
        available_times = []
        current_time = start_time
        
        while current_time < end_time:
            time_str = current_time.strftime('%H:%M')
            
            if time_str not in [t.strftime('%H:%M') for t in existing_appointments]:
                available_times.append(time_str)
            
            current_time += timedelta(minutes=duration)
        
        return Response({"available_times": available_times})
    
    except Exception as e:
        return Response({"error": str(e)}, status=500)

@api_view(['GET'])
def list_services_with_status(request):
    try:
        services = Service.objects.all()
        services_with_admins = ServiceAdmin.objects.values_list('service', flat=True).distinct()
        
        result = []
        for service in services:
            service_data = {
                'id': service.id,
                'name': service.name,
                'description': service.description,
                'category': service.category,
                'location': service.location if hasattr(service, 'location') else None,
                'business_hours': service.business_hours if hasattr(service, 'business_hours') else None,
                'has_admin': service.id in services_with_admins
            }
            result.append(service_data)
            
        return Response(result)
    except Exception as e:
        return Response({'error': str(e)}, status=500)
    
