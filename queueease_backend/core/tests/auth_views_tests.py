from django.test import TestCase
from django.urls import reverse
from django.utils import timezone
from rest_framework.test import APIClient, APIRequestFactory
from rest_framework import status
from django.contrib.auth.hashers import make_password, check_password
import json
from unittest.mock import patch, MagicMock

from core.models import (
    User, Service, ServiceAdmin, FCMToken
)
from core.views.auth_views import (
    login_view, signup_view, admin_signup, save_fcm_token
)

class AuthBaseTest(TestCase):
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
        
        # Create test service for admin signup tests
        self.service = Service.objects.create(
            name="Test Service",
            description="Service for testing",
            service_type="immediate"
        )
        
        # Create admin user
        self.admin_user = User.objects.create(
            name="Admin User",
            email="admin@example.com",
            mobile_number="9876543210",
            password=make_password("adminpass"),
            user_type="admin",
            signup_type="regular"
        )
        
        # Associate admin with service
        self.service_admin = ServiceAdmin.objects.create(
            user=self.admin_user,
            service=self.service,
            is_owner=True
        )


class LoginViewTests(AuthBaseTest):
    def test_login_success(self):
        data = {
            "email": "testuser@example.com",
            "password": "password123"
        }
        request = self.factory.post('/', data=json.dumps(data), content_type='application/json')
        
        # Using a patched version of check_password since we're using make_password earlier
        with patch('django.contrib.auth.hashers.check_password', return_value=True):
            response = login_view(request)
            response_data = json.loads(response.content)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response_data['user_id'], self.user.id)
        self.assertEqual(response_data['name'], self.user.name)
        self.assertEqual(response_data['email'], self.user.email)
        self.assertEqual(response_data['user_type'], "customer")
        self.assertFalse(response_data['is_admin'])
    
    def test_login_admin_success(self):
        data = {
            "email": "admin@example.com",
            "password": "adminpass"
        }
        request = self.factory.post('/', data=json.dumps(data), content_type='application/json')
        
        # Using a patched version of check_password
        with patch('django.contrib.auth.hashers.check_password', return_value=True):
            response = login_view(request)
            response_data = json.loads(response.content)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response_data['user_id'], self.admin_user.id)
        self.assertTrue(response_data['is_admin'])
        self.assertTrue(len(response_data['managed_services']) > 0)
        self.assertEqual(response_data['managed_services'][0]['id'], self.service.id)
    
    def test_login_invalid_credentials(self):
        data = {
            "email": "testuser@example.com",
            "password": "wrongpassword"
        }
        request = self.factory.post('/', data=json.dumps(data), content_type='application/json')
        
        # Using a patched version of check_password to simulate wrong password
        with patch('django.contrib.auth.hashers.check_password', return_value=False):
            response = login_view(request)
            response_data = json.loads(response.content)
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(response_data['error'], 'Invalid email or password.')
    
    def test_login_nonexistent_user(self):
        data = {
            "email": "nonexistent@example.com",
            "password": "password123"
        }
        request = self.factory.post('/', data=json.dumps(data), content_type='application/json')
        
        response = login_view(request)
        response_data = json.loads(response.content)
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(response_data['error'], 'Invalid email or password.')
    
    def test_login_missing_fields(self):
        data = {
            "email": "testuser@example.com"
            # Missing password
        }
        request = self.factory.post('/', data=json.dumps(data), content_type='application/json')
        
        response = login_view(request)
        response_data = json.loads(response.content)
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response_data['error'], 'Email and password are required.')


class SignupViewTests(AuthBaseTest):
    def test_signup_success(self):
        data = {
            "name": "New User",
            "email": "newuser@example.com",
            "password": "newpassword",
            "phoneNumber": "1112223333"
        }
        request = self.factory.post('/', data=json.dumps(data), content_type='application/json')
        request.data = data  # For DRF APIView compatibility
        
        response = signup_view(request)
        response_data = json.loads(response.content)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response_data['message'], 'User created successfully.')
        self.assertTrue('user_id' in response_data)
        
        # Verify user was created in database
        self.assertTrue(User.objects.filter(email="newuser@example.com").exists())
    
    def test_signup_duplicate_email(self):
        data = {
            "name": "Duplicate User",
            "email": "testuser@example.com",  # Already exists
            "password": "newpassword",
            "phoneNumber": "1112223333"
        }
        request = self.factory.post('/', data=json.dumps(data), content_type='application/json')
        request.data = data
        
        response = signup_view(request)
        response_data = json.loads(response.content)
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response_data['error'], 'Email already exists.')
    
    def test_signup_missing_fields(self):
        data = {
            "name": "Incomplete User",
            "email": "incomplete@example.com"
            # Missing password and phoneNumber
        }
        request = self.factory.post('/', data=json.dumps(data), content_type='application/json')
        request.data = data
        
        response = signup_view(request)
        response_data = json.loads(response.content)
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response_data['error'], 'All fields are required.')


class AdminSignupTests(AuthBaseTest):
    def test_admin_signup_success(self):
        data = {
            "name": "New Admin",
            "email": "newadmin@example.com",
            "password": "adminpass123",
            "phoneNumber": "9998887777",
            "serviceId": self.service.id
        }
        request = self.factory.post('/', data=json.dumps(data), content_type='application/json')
        request.data = data
        
        response = admin_signup(request)
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['message'], 'Admin account created successfully.')
        self.assertTrue('user_id' in response.data)
        
        # Verify user was created with admin type
        new_admin = User.objects.get(email="newadmin@example.com")
        self.assertEqual(new_admin.user_type, "admin")
        
        # Verify ServiceAdmin relationship was created
        self.assertTrue(ServiceAdmin.objects.filter(user=new_admin, service=self.service).exists())
    
    def test_admin_signup_duplicate_email(self):
        data = {
            "name": "Duplicate Admin",
            "email": "admin@example.com",  # Already exists
            "password": "adminpass123",
            "phoneNumber": "9998887777",
            "serviceId": self.service.id
        }
        request = self.factory.post('/', data=json.dumps(data), content_type='application/json')
        request.data = data
        
        response = admin_signup(request)
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data['error'], 'Email already registered.')
    
    def test_admin_signup_invalid_service(self):
        data = {
            "name": "Invalid Service Admin",
            "email": "invalidservice@example.com",
            "password": "adminpass123",
            "phoneNumber": "9998887777",
            "serviceId": 9999  # Non-existent service ID
        }
        request = self.factory.post('/', data=json.dumps(data), content_type='application/json')
        request.data = data
        
        response = admin_signup(request)
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(response.data['error'], 'Service not found.')
    
    def test_admin_signup_missing_fields(self):
        data = {
            "name": "Incomplete Admin",
            "email": "incomplete@example.com"
            # Missing other required fields
        }
        request = self.factory.post('/', data=json.dumps(data), content_type='application/json')
        request.data = data
        
        response = admin_signup(request)
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data['error'], 'All fields are required.')


class SaveFCMTokenTests(AuthBaseTest):
    def test_save_token_new(self):
        data = {
            "user_id": self.user.id,
            "fcm_token": "test-fcm-token-12345"
        }
        request = self.factory.post('/', data=json.dumps(data), content_type='application/json')
        request.data = data
        
        response = save_fcm_token(request)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue('success' in response.data)
        
        # Verify token was saved
        self.assertTrue(FCMToken.objects.filter(user=self.user, token="test-fcm-token-12345").exists())
    
    def test_save_token_update_existing(self):
        # Create existing token
        existing_token = FCMToken.objects.create(
            user=self.user,
            token="existing-token",
            is_active=True
        )
        
        data = {
            "user_id": self.user.id,
            "fcm_token": "existing-token"  # Same token, should just update
        }
        request = self.factory.post('/', data=json.dumps(data), content_type='application/json')
        request.data = data
        
        response = save_fcm_token(request)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue('success' in response.data)
        
        # Verify the token was just updated, not duplicated
        self.assertEqual(FCMToken.objects.filter(user=self.user).count(), 1)
    
    def test_save_token_missing_fields(self):
        data = {
            "user_id": self.user.id
            # Missing fcm_token
        }
        request = self.factory.post('/', data=json.dumps(data), content_type='application/json')
        request.data = data
        
        response = save_fcm_token(request)
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data['error'], 'User ID and FCM token are required')
    
    def test_save_token_invalid_user(self):
        data = {
            "user_id": 9999,  # Non-existent user
            "fcm_token": "test-fcm-token-12345"
        }
        request = self.factory.post('/', data=json.dumps(data), content_type='application/json')
        request.data = data
        
        response = save_fcm_token(request)
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(response.data['error'], 'User not found')