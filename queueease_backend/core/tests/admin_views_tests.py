from django.test import TestCase
from django.urls import reverse
from django.utils import timezone
from rest_framework.test import APIClient, APIRequestFactory
from rest_framework import status
from django.contrib.auth.hashers import make_password, check_password
from unittest.mock import patch, MagicMock
import datetime

from core.models import (
    User, Service, Queue, ServiceAdmin, Feedback, 
    FCMToken, NotificationSettings, AppointmentDetails
)
from core.views.admin_views import (
    admin_dashboard_data, admin_customers, admin_create_customer,
    test_notification, admin_get_analytics, notification_settings,
    admin_company_info, admin_update_company_info, admin_change_password,
    calculate_satisfaction_trend, calculate_wait_time_trend
)

class AdminBaseTest(TestCase):
    def setUp(self):
        # Create base objects used in multiple tests
        self.factory = APIRequestFactory()

        # Create test admin user
        self.admin_user = User.objects.create(
            name="Admin User",
            email="admin@example.com",
            mobile_number="1234567890",
            password=make_password("password123"),
            user_type="admin",
            signup_type="regular"
        )

        # Create test service
        self.service = Service.objects.create(
            name="Test Service",
            description="Service for testing",
            service_type="immediate",
            details={
                "email": "service@example.com",
                "phone": "9876543210",
                "address": "123 Test St"
            }
        )

        # Associate admin with service
        self.service_admin = ServiceAdmin.objects.create(
            user=self.admin_user,
            service=self.service,
            is_owner=True
        )

        # Create test customer user
        self.customer = User.objects.create(
            name="Test Customer",
            email="customer@example.com",
            mobile_number="5555555555",
            password=make_password("customer123"),
            user_type="customer",
            signup_type="regular"
        )

        # Create test queue for customer
        self.queue = Queue.objects.create(
            user=self.customer,
            service=self.service,
            sequence_number=1,
            status='completed',
            date_created=timezone.now() - datetime.timedelta(days=5)
        )


class AdminDashboardTests(AdminBaseTest):    
    @patch('core.views.admin_views.Service.objects.get')
    def test_dashboard_data_service_not_found(self, mock_get):
        mock_get.side_effect = Service.DoesNotExist()
        
        request = self.factory.get('/', {'service_id': 999})
        response = admin_dashboard_data(request)
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(response.data['error'], 'Service not found')
    
    def test_dashboard_data_missing_service_id(self):
        request = self.factory.get('/')
        response = admin_dashboard_data(request)
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data['error'], 'Service ID is required')
    
    def test_dashboard_data_immediate_service(self):
        request = self.factory.get('/', {'service_id': self.service.id})
        response = admin_dashboard_data(request)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['service_type'], 'immediate')
        self.assertIn('customer_count', response.data)
        self.assertIn('queue_count', response.data)
        self.assertIn('growth', response.data)
    
    def test_dashboard_data_appointment_service(self):
        # Change service type to appointment
        self.service.service_type = 'appointment'
        self.service.save()
        
        # Create test appointment
        AppointmentDetails.objects.create(
            order_id="APPT-001",
            user=self.customer,
            service=self.service,
            appointment_date=timezone.now().date(),
            appointment_time=datetime.time(10, 30),
            status='confirmed'
        )
        
        request = self.factory.get('/', {'service_id': self.service.id})
        response = admin_dashboard_data(request)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['service_type'], 'appointment')


class AdminCustomersTests(AdminBaseTest):
    def test_customers_list(self):
        request = self.factory.get('/', {'service_id': self.service.id})
        response = admin_customers(request)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['id'], self.customer.id)
        self.assertEqual(response.data[0]['name'], self.customer.name)
        self.assertEqual(response.data[0]['email'], self.customer.email)
    
    def test_customers_missing_service_id(self):
        request = self.factory.get('/')
        response = admin_customers(request)
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    @patch('core.views.admin_views.Service.objects.get')
    def test_customers_service_not_found(self, mock_get):
        mock_get.side_effect = Service.DoesNotExist()
        
        request = self.factory.get('/', {'service_id': 999})
        response = admin_customers(request)
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

class TestNotificationTests(AdminBaseTest):
    def setUp(self):
        super().setUp()
        
        # Create FCM token for notification tests
        self.token = FCMToken.objects.create(
            user=self.customer,
            token="test-fcm-token-123",
            is_active=True,
            device_info={"device": "Test Device"}
        )
    
    @patch('core.views.admin_views.send_push_notification')
    def test_notification_success(self, mock_send_push):
        mock_send_push.return_value = {"success": True}
        
        data = {
            'user_id': self.customer.id,
            'title': 'Test Title',
            'body': 'Test notification body',
            'notification_type': 'custom'
        }
        request = self.factory.post('/', data, format='json')
        request.data = data
        
        response = test_notification(request)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        mock_send_push.assert_called_once()
    
    @patch('core.views.admin_views.FCMToken.objects.filter')
    def test_notification_no_token(self, mock_filter):
        mock_filter.return_value.latest.side_effect = FCMToken.DoesNotExist()
        
        data = {
            'user_id': self.customer.id,
            'title': 'Test Title',
            'body': 'Test notification body'
        }
        request = self.factory.post('/', data, format='json')
        request.data = data
        
        response = test_notification(request)
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', response.data)
    
    def test_notification_missing_user_id(self):
        data = {
            'title': 'Test Title',
            'body': 'Test notification body'
        }
        request = self.factory.post('/', data, format='json')
        request.data = data
        
        response = test_notification(request)
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class AdminAnalyticsTests(AdminBaseTest):
    def setUp(self):
        super().setUp()
        
        # Create feedback entries for testing analytics
        Feedback.objects.create(
            user=self.customer,
            service=self.service,
            rating=4,
            comment="Good service but could be faster",
            categories=["speed", "staff"],
            sentiment="positive",
            created_at=timezone.now() - datetime.timedelta(days=10)
        )
        
        Feedback.objects.create(
            user=self.admin_user,
            service=self.service,
            rating=2,
            comment="Poor service quality",
            categories=["quality"],
            sentiment="negative",
            created_at=timezone.now() - datetime.timedelta(days=15)
        )
    
    def test_get_analytics_success(self):
        # Mock the keyword extractor to return a predictable result
        with patch('core.views.admin_views.KeywordExtractor') as mock_extractor_class:
            mock_extractor = MagicMock()
            mock_extractor.extract_keywords.return_value = [
                {"keyword": "good", "count": 1, "sentiment": "positive"},
                {"keyword": "poor", "count": 1, "sentiment": "negative"}
            ]
            mock_extractor_class.return_value = mock_extractor
            
            request = self.factory.get('/', {'service_id': self.service.id, 'period': 'month'})
            response = admin_get_analytics(request)
            
            self.assertEqual(response.status_code, status.HTTP_200_OK)
            self.assertIn('feedback_distribution', response.data)
            self.assertIn('satisfaction_rate', response.data)
            self.assertIn('average_wait_time', response.data)
            self.assertIn('wait_time_trend', response.data)
            
            # Verify satisfaction calculation (50% positive)
            self.assertEqual(response.data['satisfaction_rate'], 50)
            
    def test_calculate_satisfaction_trend(self):
        trend = calculate_satisfaction_trend(self.service.feedbacks.all(), 'month')
        
        # We want to ensure the trend has 4 values when calculating monthly trend
        self.assertEqual(len(trend), 4) 
    
    def test_calculate_wait_time_trend(self):
        # Update queue with wait time for testing
        self.queue.total_wait = 15
        self.queue.save()
        
        trend = calculate_wait_time_trend(
            self.service,  # Pass the service object directly
            'week'
        )
        
        self.assertEqual(len(trend), 7)  # 7 days in a week


class NotificationSettingsTests(AdminBaseTest):
    def test_get_notification_settings(self):
        # Test retrieving default settings
        request = self.factory.get('/', {'service_id': self.service.id})
        response = notification_settings(request)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['is_enabled'])
        self.assertEqual(response.data['frequency_minutes'], 5)
    
    def test_update_notification_settings(self):
        data = {
            'service_id': self.service.id,
            'is_enabled': False,
            'frequency_minutes': 10,
            'message_template': 'Custom message: {queue_position}'
        }
        request = self.factory.post('/', data, format='json')
        request.data = data
        
        response = notification_settings(request)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data['is_enabled'])
        self.assertEqual(response.data['frequency_minutes'], 10)
        self.assertEqual(response.data['message_template'], 'Custom message: {queue_position}')
        
        # Verify settings were saved
        settings = NotificationSettings.objects.get(service=self.service)
        self.assertFalse(settings.is_enabled)
        self.assertEqual(settings.frequency_minutes, 10)


class AdminCompanyInfoTests(AdminBaseTest):
    def test_get_company_info(self):
        request = self.factory.get('/')
        response = admin_company_info(request, self.admin_user.id)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], self.service.name)
        self.assertEqual(response.data['email'], self.service.details['email'])
        self.assertEqual(response.data['phone'], self.service.details['phone'])
        self.assertEqual(response.data['address'], self.service.details['address'])
    
    def test_company_info_no_service(self):
        # Create an admin without associated service
        unlinked_admin = User.objects.create(
            name="Unlinked Admin",
            email="unlinked@example.com",
            mobile_number="9999999999",
            password=make_password("password"),
            user_type="admin",
            signup_type="regular"
        )
        
        request = self.factory.get('/')
        response = admin_company_info(request, unlinked_admin.id)
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


class AdminUpdateCompanyInfoTests(AdminBaseTest):
    def test_update_company_info(self):
        data = {
            'user_id': self.admin_user.id,
            'name': 'Updated Service Name',
            'email': 'updated@example.com',
            'phone': '5555555555',
            'address': '456 New St',
            'latitude': 55.0,
            'longitude': -6.0,
            'logoBase64': 'data:image/png;base64,testlogo'
        }
        request = self.factory.post('/', data, format='json')
        request.data = data
        
        response = admin_update_company_info(request)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Refresh service from database
        self.service.refresh_from_db()
        
        # Check that service was updated
        self.assertEqual(self.service.name, 'Updated Service Name')
        self.assertEqual(self.service.details['email'], 'updated@example.com')
        self.assertEqual(self.service.details['phone'], '5555555555')
        self.assertEqual(self.service.details['address'], '456 New St')
        self.assertEqual(float(self.service.latitude), 55.0)
        self.assertEqual(float(self.service.longitude), -6.0)
    
    def test_update_company_missing_user_id(self):
        data = {
            'name': 'Updated Service Name'
        }
        request = self.factory.post('/', data, format='json')
        request.data = data
        
        response = admin_update_company_info(request)
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class AdminChangePasswordTests(AdminBaseTest):
    def test_change_password_success(self):
        # Set a known password for testing
        self.admin_user.password = make_password('current_password')
        self.admin_user.save()
        
        data = {
            'user_id': self.admin_user.id,
            'current_password': 'current_password',
            'new_password': 'new_password'
        }
        request = self.factory.post('/', data, format='json')
        request.data = data
        
        response = admin_change_password(request)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('message', response.data)
        
        # Verify password was changed
        self.admin_user.refresh_from_db()
        self.assertTrue(check_password('new_password', self.admin_user.password))
    
    def test_change_password_incorrect_current(self):
        self.admin_user.password = make_password('current_password')
        self.admin_user.save()
        
        data = {
            'user_id': self.admin_user.id,
            'current_password': 'wrong_password',
            'new_password': 'new_password'
        }
        request = self.factory.post('/', data, format='json')
        request.data = data
        
        response = admin_change_password(request)
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)