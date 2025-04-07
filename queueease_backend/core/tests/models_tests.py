from django.test import TestCase
from django.core.exceptions import ValidationError
from django.db import IntegrityError
from django.utils import timezone
from datetime import timedelta, datetime, time
from core.models import (
    User, Service, Queue, ServiceQueue, QRCode, AppointmentDetails,
    ServiceAdmin, FCMToken, Feedback, NotificationSettings
)

class UserModelTest(TestCase):
    def test_create_regular_user(self):
        user = User.objects.create(
            name="Ian H",
            email="Ian@example.com",
            mobile_number="1234567890",
            password="hashed_password",
            user_type="customer",
            signup_type="regular"
        )
        self.assertEqual(user.name, "Ian H")
        self.assertEqual(user.email, "Ian@example.com")
        self.assertEqual(user.user_type, "customer")
        self.assertTrue(user.is_active)

    def test_create_guest_user(self):
        user = User.objects.create(
            email="guest@example.com",
            user_type="customer",
            signup_type="guest"
        )
        self.assertIsNone(user.name)
        self.assertIsNone(user.password)
        self.assertEqual(user.signup_type, "guest")
        self.assertEqual(user.email, "guest@example.com")
        
    def test_user_string_representation(self):
        user = User.objects.create(
            name="Ian H",
            email="IanH@example.com",
            user_type="customer",
            signup_type="regular",
            mobile_number="9876543210",
            password="test_password"
        )
        self.assertEqual(str(user), f"User object ({user.id})")
        
    def test_unique_email_constraint(self):
        User.objects.create(
            name="Original User",
            email="duplicate@example.com",
            user_type="customer",
            signup_type="regular",
            mobile_number="1234567890",
            password="password1"
        )
        
        with self.assertRaises(IntegrityError):
            User.objects.create(
                name="Duplicate User",
                email="duplicate@example.com",
                user_type="customer",
                signup_type="regular",
                mobile_number="0987654321",
                password="password2"
            )


class ServiceModelTest(TestCase):
    def test_create_service(self):
        service = Service.objects.create(
            name="Medical Checkup",
            description="General medical examination",
            category="Healthcare",
            service_type="appointment",
            average_duration=30,
            requires_prep_time=True,
            minimal_prep_time=10,
            parallel_capacity=2,
            latitude=53.349805,
            longitude=-6.26031
        )
        self.assertEqual(service.name, "Medical Checkup")
        self.assertEqual(service.service_type, "appointment")
        self.assertEqual(service.average_duration, 30)
        self.assertTrue(service.is_active)
    
    def test_service_string_representation(self):
        service = Service.objects.create(
            name="Dental Cleaning",
            description="Professional teeth cleaning service",
            category="Dental",
            service_type="appointment"
        )
        self.assertEqual(str(service), "Dental Cleaning")
    
    def test_service_geolocation(self):
        service = Service.objects.create(
            name="Coffee Shop",
            description="Premium coffee service",
            category="Food",
            service_type="immediate",
            latitude=53.349805,
            longitude=-6.26031
        )
        self.assertAlmostEqual(service.latitude, 53.349805)
        self.assertAlmostEqual(service.longitude, -6.26031)
        
    def test_service_details_json(self):
        details = {
            "staff": ["Dr. Smith", "Dr. Ianson"],
            "facilities": ["X-ray", "Lab Tests"],
            "insurance_accepted": True
        }
        service = Service.objects.create(
            name="Family Doctor",
            description="Family physician services",
            details=details
        )
        self.assertEqual(service.details["staff"][0], "Dr. Smith")
        self.assertEqual(service.details["facilities"][1], "Lab Tests")
        self.assertTrue(service.details["insurance_accepted"])


class ServiceQueueModelTest(TestCase):
    def setUp(self):
        self.service = Service.objects.create(
            name="Burger Joint",
            description="Fast food restaurant",
            service_type="immediate"
        )
    
    def test_create_service_queue(self):
        service_queue = ServiceQueue.objects.create(
            service=self.service,
            current_member_count=5
        )
        self.assertEqual(service_queue.service, self.service)
        self.assertEqual(service_queue.current_member_count, 5)
        self.assertTrue(service_queue.is_active)
    
    def test_service_queue_string_representation(self):
        service_queue = ServiceQueue.objects.create(
            service=self.service,
            current_member_count=3
        )
        self.assertEqual(str(service_queue), f"Queue for {self.service.name} (3 members)")


class QueueModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create(
            name="Queue User",
            email="queue_user@example.com",
            mobile_number="1234567890",
            password="password123",
            user_type="customer",
            signup_type="regular"
        )
        self.service = Service.objects.create(
            name="Hair Salon",
            description="Haircut and styling services",
            service_type="immediate"
        )
        self.service_queue = ServiceQueue.objects.create(
            service=self.service
        )
    
    def test_create_queue(self):
        queue = Queue.objects.create(
            user=self.user,
            service=self.service,
            service_queue=self.service_queue,
            sequence_number=1,
            status="pending"
        )
        self.assertEqual(queue.user, self.user)
        self.assertEqual(queue.service, self.service)
        self.assertEqual(queue.sequence_number, 1)
        self.assertEqual(queue.status, "pending")
        self.assertTrue(queue.is_active)
    
    def test_queue_string_representation(self):
        queue = Queue.objects.create(
            user=self.user,
            service=self.service,
            service_queue=self.service_queue,
            sequence_number=5
        )
        self.assertEqual(str(queue), f"Queue {queue.id} - {self.user.name}")
    
    def test_queue_expected_ready_time(self):
        now = timezone.now()
        queue = Queue.objects.create(
            user=self.user,
            service=self.service,
            service_queue=self.service_queue,
            sequence_number=3,
            expected_ready_time=now + timedelta(minutes=30)
        )
        self.assertGreater(queue.expected_ready_time, now)
        self.assertLess(queue.expected_ready_time, now + timedelta(minutes=31))
        
    def test_queue_transfer(self):
        original_queue = Queue.objects.create(
            user=self.user,
            service=self.service,
            service_queue=self.service_queue,
            sequence_number=1,
            status="pending"
        )
        
        new_service = Service.objects.create(
            name="Different Salon",
            description="Another salon service",
            service_type="immediate"
        )
        new_service_queue = ServiceQueue.objects.create(
            service=new_service
        )
        
        transferred_queue = Queue.objects.create(
            user=self.user,
            service=new_service,
            service_queue=new_service_queue,
            sequence_number=5,
            status="pending",
            transferred_from=original_queue
        )
        
        self.assertEqual(transferred_queue.transferred_from, original_queue)


class QRCodeModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create(
            name="QR User",
            email="qr_user@example.com",
            mobile_number="1234567890",
            password="password123",
            user_type="customer",
            signup_type="regular"
        )
        self.service = Service.objects.create(
            name="Doctor's Office",
            description="Medical services",
            service_type="immediate"
        )
        self.service_queue = ServiceQueue.objects.create(
            service=self.service
        )
        self.queue = Queue.objects.create(
            user=self.user,
            service=self.service,
            service_queue=self.service_queue,
            sequence_number=1
        )
    
    def test_create_qr_code(self):
        qr_code = QRCode.objects.create(
            queue=self.queue,
            qr_hash="abc123def456"
        )
        self.assertEqual(qr_code.queue, self.queue)
        self.assertEqual(qr_code.qr_hash, "abc123def456")
        self.assertTrue(qr_code.is_active)
    
    def test_qr_code_string_representation(self):
        qr_code = QRCode.objects.create(
            queue=self.queue,
            qr_hash="abc123def456"
        )
        self.assertEqual(str(qr_code), f"QR Code for Queue {self.queue.id}")
    
    def test_unique_qr_hash(self):
        QRCode.objects.create(
            queue=self.queue,
            qr_hash="unique_hash_123"
        )
        
        other_queue = Queue.objects.create(
            user=self.user,
            service=self.service,
            service_queue=self.service_queue,
            sequence_number=2
        )
        
        with self.assertRaises(IntegrityError):
            QRCode.objects.create(
                queue=other_queue,
                qr_hash="unique_hash_123"  # Using the same hash should fail
            )


class AppointmentDetailsModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create(
            name="Appointment User",
            email="appointment_user@example.com",
            mobile_number="1234567890",
            password="password123",
            user_type="customer",
            signup_type="regular"
        )
        self.service = Service.objects.create(
            name="Dental Office",
            description="Dental services",
            service_type="appointment"
        )
    
    def test_create_appointment(self):
        appointment = AppointmentDetails.objects.create(
            order_id="APPT-2023-001",
            user=self.user,
            service=self.service,
            appointment_date=timezone.now().date(),
            appointment_time=time(14, 30),  # 2:30 PM
            duration_minutes=30,
            status="pending",
            queue_status="not_started"
        )
        self.assertEqual(appointment.order_id, "APPT-2023-001")
        self.assertEqual(appointment.user, self.user)
        self.assertEqual(appointment.service, self.service)
        self.assertEqual(appointment.duration_minutes, 30)
        self.assertEqual(appointment.status, "pending")
        self.assertEqual(appointment.queue_status, "not_started")
        self.assertTrue(appointment.is_active)
    
    def test_appointment_string_representation(self):
        appointment = AppointmentDetails.objects.create(
            order_id="APPT-2023-002",
            user=self.user,
            service=self.service,
            appointment_date=timezone.now().date(),
            appointment_time=time(10, 15)
        )
        self.assertEqual(str(appointment), f"Appointment {appointment.order_id} - {self.user.name}")
        
    def test_unique_order_id(self):
        AppointmentDetails.objects.create(
            order_id="UNIQUE-ORDER-ID",
            user=self.user,
            service=self.service,
            appointment_date=timezone.now().date(),
            appointment_time=time(9, 0)
        )
        
        with self.assertRaises(IntegrityError):
            AppointmentDetails.objects.create(
                order_id="UNIQUE-ORDER-ID",  # Duplicate order_id
                user=self.user,
                service=self.service,
                appointment_date=timezone.now().date(),
                appointment_time=time(14, 0)
            )


class ServiceAdminModelTest(TestCase):
    def setUp(self):
        self.admin_user = User.objects.create(
            name="Admin User",
            email="admin@example.com",
            mobile_number="1234567890",
            password="adminpass",
            user_type="admin",
            signup_type="regular"
        )
        self.service = Service.objects.create(
            name="Admin Service",
            description="Service with admin users",
            service_type="immediate"
        )
    
    def test_create_service_admin(self):
        service_admin = ServiceAdmin.objects.create(
            user=self.admin_user,
            service=self.service,
            is_owner=True
        )
        self.assertEqual(service_admin.user, self.admin_user)
        self.assertEqual(service_admin.service, self.service)
        self.assertTrue(service_admin.is_owner)
        
    def test_service_admin_string_representation(self):
        service_admin = ServiceAdmin.objects.create(
            user=self.admin_user,
            service=self.service
        )
        self.assertEqual(str(service_admin), f"{self.admin_user.name} - {self.service.name}")
        
    def test_unique_user_service_constraint(self):
        ServiceAdmin.objects.create(
            user=self.admin_user,
            service=self.service
        )
        
        with self.assertRaises(IntegrityError):
            ServiceAdmin.objects.create(
                user=self.admin_user,
                service=self.service  # Duplicate user-service combination
            )


class FCMTokenModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create(
            name="Token User",
            email="token_user@example.com",
            mobile_number="1234567890",
            password="tokenpass",
            user_type="customer",
            signup_type="regular"
        )
    
    def test_create_fcm_token(self):
        device_info = {
            "device": "iPhone",
            "os": "iOS 15.5",
            "browser": "Safari"
        }
        
        token = FCMToken.objects.create(
            user=self.user,
            token="fcm-token-123456789abcdef",
            device_info=device_info
        )
        self.assertEqual(token.user, self.user)
        self.assertEqual(token.token, "fcm-token-123456789abcdef")
        self.assertEqual(token.device_info["device"], "iPhone")
        self.assertTrue(token.is_active)
        
    def test_fcm_token_string_representation(self):
        token = FCMToken.objects.create(
            user=self.user,
            token="sample-token-123"
        )
        self.assertEqual(str(token), f"FCM Token for {self.user.name}")
        
    def test_unique_user_token_constraint(self):
        FCMToken.objects.create(
            user=self.user,
            token="unique-token-abc123"
        )
        
        with self.assertRaises(IntegrityError):
            FCMToken.objects.create(
                user=self.user,
                token="unique-token-abc123"  # Duplicate user-token combination
            )


class FeedbackModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create(
            name="Feedback User",
            email="feedback_user@example.com",
            mobile_number="1234567890",
            password="feedbackpass",
            user_type="customer",
            signup_type="regular"
        )
        self.service = Service.objects.create(
            name="Feedback Service",
            description="Service accepting feedback",
            service_type="immediate"
        )
        self.service_queue = ServiceQueue.objects.create(
            service=self.service
        )
        self.queue = Queue.objects.create(
            user=self.user,
            service=self.service,
            service_queue=self.service_queue,
            sequence_number=1,
            status="completed"
        )
    
    def test_create_feedback(self):
        categories = ["cleanliness", "service_speed", "staff_attitude"]
        feedback = Feedback.objects.create(
            user=self.user,
            service=self.service,
            queue=self.queue,
            rating=4,
            comment="Great service but a bit slow",
            categories=categories,
            sentiment="positive",
            total_wait=15
        )
        self.assertEqual(feedback.user, self.user)
        self.assertEqual(feedback.service, self.service)
        self.assertEqual(feedback.queue, self.queue)
        self.assertEqual(feedback.rating, 4)
        self.assertEqual(feedback.comment, "Great service but a bit slow")
        self.assertEqual(feedback.categories, categories)
        self.assertEqual(feedback.sentiment, "positive")
        self.assertEqual(feedback.total_wait, 15)
        
    def test_feedback_string_representation(self):
        feedback = Feedback.objects.create(
            user=self.user,
            service=self.service,
            rating=5
        )
        self.assertEqual(str(feedback), f"Feedback from {self.user.name} for {self.service.name}")
        
    def test_unique_user_service_queue_constraint(self):
        Feedback.objects.create(
            user=self.user,
            service=self.service,
            queue=self.queue,
            rating=3
        )
        
        with self.assertRaises(IntegrityError):
            Feedback.objects.create(
                user=self.user,
                service=self.service,
                queue=self.queue,
                rating=4
            )


class NotificationSettingsModelTest(TestCase):
    def setUp(self):
        self.service = Service.objects.create(
            name="Notification Service",
            description="Service with notification settings",
            service_type="immediate"
        )
    
    def test_create_notification_settings(self):
        settings = NotificationSettings.objects.create(
            service=self.service,
            is_enabled=True,
            frequency_minutes=10,
            message_template="Your position in queue: {queue_position}. Estimated wait: {remaining_time} minutes."
        )
        self.assertEqual(settings.service, self.service)
        self.assertTrue(settings.is_enabled)
        self.assertEqual(settings.frequency_minutes, 10)
        self.assertEqual(settings.message_template, 
                        "Your position in queue: {queue_position}. Estimated wait: {remaining_time} minutes.")
        
    def test_notification_settings_string_representation(self):
        settings = NotificationSettings.objects.create(
            service=self.service
        )
        self.assertEqual(str(settings), f"Notification Settings for {self.service.name}")
        
    def test_default_values(self):
        settings = NotificationSettings.objects.create(
            service=self.service
        )
        self.assertTrue(settings.is_enabled)
        self.assertEqual(settings.frequency_minutes, 5)
        self.assertTrue("{queue_position}" in settings.message_template)
        self.assertTrue("{remaining_time}" in settings.message_template)