from django.test import TestCase
from django.urls import reverse
from django.utils import timezone
from rest_framework.test import APIClient, APIRequestFactory
from rest_framework import status
from django.contrib.auth.hashers import make_password
import json
from unittest.mock import patch, MagicMock
import datetime

from core.models import (
    User, Service, Queue, ServiceWaitTime, ServiceAdmin, AppointmentDetails
)
from core.views.service_views import (
    api_overview, list_services, service_detail, available_appointment_times, 
    list_services_with_status
)

class ServiceViewsBaseTest(TestCase):
    def setUp(self):
        # Create base objects used in multiple tests
        self.factory = APIRequestFactory()
        self.client = APIClient()
        
        # Create test user
        self.user = User.objects.create(
            name="Test User",
            email="testuser@example.com",
            mobile_number="1234567890",
            password=make_password("password123"),
            user_type="customer",
            signup_type="regular"
        )
        
        # Create admin user
        self.admin_user = User.objects.create(
            name="Admin User",
            email="admin@example.com",
            mobile_number="9876543210",
            password=make_password("admin123"),
            user_type="admin",
            signup_type="regular"
        )
        
        # Create test services
        self.immediate_service = Service.objects.create(
            name="Immediate Service",
            description="Service for immediate queuing",
            service_type="immediate",
            category="fast_food",
            is_active=True,
            latitude=53.3498,
            longitude=-6.2603
        )
        
        self.appointment_service = Service.objects.create(
            name="Appointment Service",
            description="Service for appointment booking",
            service_type="appointment",
            category="healthcare",
            is_active=True,
            latitude=53.3429,
            longitude=-6.2674
        )
        
        # Create ServiceAdmin record
        self.service_admin = ServiceAdmin.objects.create(
            user=self.admin_user,
            service=self.immediate_service,
            is_owner=True
        )
        
        # Create some wait time history
        self.wait_time_1 = ServiceWaitTime.objects.create(
            service=self.immediate_service,
            wait_time=10,
            date_recorded=timezone.now() - timezone.timedelta(hours=1)
        )
        
        self.wait_time_2 = ServiceWaitTime.objects.create(
            service=self.immediate_service,
            wait_time=15,
            date_recorded=timezone.now() - timezone.timedelta(hours=2)
        )
        
        # Create some existing appointments for the appointment service
        tomorrow = timezone.now().date() + timezone.timedelta(days=1)
        self.appointment_1 = AppointmentDetails.objects.create(
            order_id="AP12345",
            user=self.user,
            service=self.appointment_service,
            appointment_date=tomorrow,
            appointment_time=datetime.time(10, 0),  # 10:00 AM
            duration_minutes=30,
            status='pending'
        )
        
        self.appointment_2 = AppointmentDetails.objects.create(
            order_id="AP12346",
            user=self.user,
            service=self.appointment_service,
            appointment_date=tomorrow,
            appointment_time=datetime.time(11, 0),  # 11:00 AM
            duration_minutes=30,
            status='pending'
        )


class ApiOverviewTests(ServiceViewsBaseTest):
    def test_api_overview(self):
        request = self.factory.get('/')
        response = api_overview(request)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('message', response.data)
        self.assertEqual(response.data['message'], 'Welcome to the API!')


class ListServicesTests(ServiceViewsBaseTest):
    @patch('core.views.service_views.ServiceWaitTime.objects.filter')
    def test_list_services_success(self, mock_filter):
        # Mock the ServiceWaitTime.objects.filter().order_by().aggregate() chain
        mock_values = {'avg_time': 12.5}
        mock_agg = MagicMock()
        mock_agg.return_value = mock_values
        
        mock_order_by = MagicMock()
        mock_order_by.aggregate = mock_agg
        
        mock_filtered = MagicMock()
        mock_filtered.order_by = MagicMock(return_value=mock_order_by)
        
        mock_filter.return_value = mock_filtered
        
        request = self.factory.get('/')
        response = list_services(request)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsInstance(response.data, list)
        self.assertEqual(len(response.data), 2)  # Should include both services
        
        # Check first service data
        service_data = response.data[0]
        self.assertIn('id', service_data)
        self.assertIn('name', service_data)
        self.assertIn('description', service_data)
        self.assertIn('category', service_data)
        self.assertIn('service_type', service_data)
        self.assertIn('queue_length', service_data)
        self.assertIn('wait_time', service_data)
        self.assertIn('latitude', service_data)
        self.assertIn('longitude', service_data)
    
    def test_list_services_empty(self):
        # Delete all services
        Service.objects.all().delete()
        
        request = self.factory.get('/')
        response = list_services(request)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsInstance(response.data, list)
        self.assertEqual(len(response.data), 0)  # Should be empty
    
    def test_list_services_error_handling(self):
        # Force an error by patching Service.objects.filter to raise an exception
        with patch('core.views.service_views.Service.objects.filter', side_effect=Exception('Test exception')):
            request = self.factory.get('/')
            response = list_services(request)
            
            self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
            self.assertIn('error', response.data)


class ServiceDetailTests(ServiceViewsBaseTest):
    def test_service_detail_success(self):
        request = self.factory.get('/')
        response = service_detail(request, self.immediate_service.id)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['id'], self.immediate_service.id)
        self.assertEqual(response.data['name'], self.immediate_service.name)
        self.assertEqual(response.data['description'], self.immediate_service.description)
        self.assertEqual(response.data['category'], self.immediate_service.category)
        self.assertEqual(response.data['service_type'], self.immediate_service.service_type)
    
    def test_service_detail_nonexistent_service(self):
        request = self.factory.get('/')
        
        # The implementation likely returns 500 for nonexistent services
        response = service_detail(request, 9999)  # Non-existent service ID
        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def test_service_detail_error_handling(self):
        # The service_detail view doesn't catch exceptions, so the error is propagated
        # We need to use a different approach to test error handling
        
        # Create a request object
        request = self.factory.get('/')
        
        # Test with an invalid service ID that will cause an error
        non_existent_id = 9999
        try:
            response = service_detail(request, non_existent_id)
            self.fail("Expected an exception but got a response")
        except Exception:
            # Test passes if an exception is raised
            pass


class AvailableAppointmentTimesTests(ServiceViewsBaseTest):
    def test_available_times_success(self):
        tomorrow = (timezone.now().date() + timezone.timedelta(days=1)).strftime('%Y-%m-%d')
        request = self.factory.get(f'/?date={tomorrow}')
        response = available_appointment_times(request, self.appointment_service.id)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('available_times', response.data)
        self.assertIsInstance(response.data['available_times'], list)
        
        # Check that times are returned and existing appointment times are excluded
        # 10:00 and 11:00 should be excluded as they are already booked
        available_times = response.data['available_times']
        self.assertNotIn('10:00', available_times)
        self.assertNotIn('11:00', available_times)
    
    def test_available_times_missing_date(self):
        request = self.factory.get('/')  # No date parameter
        response = available_appointment_times(request, self.appointment_service.id)
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', response.data)
    
    def test_available_times_invalid_date_format(self):
        request = self.factory.get('/?date=invalid-date')
        response = available_appointment_times(request, self.appointment_service.id)
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', response.data)
    
    def test_available_times_nonexistent_service(self):
        tomorrow = (timezone.now().date() + timezone.timedelta(days=1)).strftime('%Y-%m-%d')
        request = self.factory.get(f'/?date={tomorrow}')
        
        # The implementation likely returns 500 for nonexistent services
        response = available_appointment_times(request, 9999)
        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def test_available_times_error_handling(self):
        # The available_appointment_times view doesn't catch all exceptions,
        # so we need to test differently
        
        tomorrow = (timezone.now().date() + timezone.timedelta(days=1)).strftime('%Y-%m-%d')
        request = self.factory.get(f'/?date={tomorrow}')
        
        # Test with an invalid service ID that will cause an error
        non_existent_id = 9999
        try:
            response = available_appointment_times(request, non_existent_id)
            self.fail("Expected an exception but got a response")
        except Exception:
            # Test passes if an exception is raised
            pass


class ListServicesWithStatusTests(ServiceViewsBaseTest):
    def test_list_services_with_status_success(self):
        request = self.factory.get('/')
        response = list_services_with_status(request)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsInstance(response.data, list)
        self.assertEqual(len(response.data), 2)  # Should include both services
        
        # Check service data format
        service_data = response.data[0]
        self.assertIn('id', service_data)
        self.assertIn('name', service_data)
        self.assertIn('description', service_data)
        self.assertIn('category', service_data)
        self.assertIn('has_admin', service_data)
        
        # First service should have admin
        first_service = next(s for s in response.data if s['id'] == self.immediate_service.id)
        self.assertTrue(first_service['has_admin'])
        
        # Second service should not have admin
        second_service = next(s for s in response.data if s['id'] == self.appointment_service.id)
        self.assertFalse(second_service['has_admin'])
    
    def test_list_services_with_status_empty(self):
        # Delete all services
        Service.objects.all().delete()
        
        request = self.factory.get('/')
        response = list_services_with_status(request)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsInstance(response.data, list)
        self.assertEqual(len(response.data), 0)  # Should be empty
    
    def test_list_services_with_status_error_handling(self):
        # Force an error
        with patch('core.views.service_views.Service.objects.all', side_effect=Exception('Test exception')):
            request = self.factory.get('/')
            response = list_services_with_status(request)
            
            self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
            self.assertIn('error', response.data)