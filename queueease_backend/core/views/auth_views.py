from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from rest_framework.decorators import api_view
from rest_framework.response import Response
import json
import logging
from django.contrib.auth.hashers import make_password, check_password
from ..models import User, ServiceAdmin, Service, FCMToken

logger = logging.getLogger(__name__)

@api_view(['POST'])
def login_view(request):
        try:
            data = json.loads(request.body)
            email = data.get('email', '').strip()
            password = data.get('password', '').strip()

            if not email or not password:
                return JsonResponse({'error': 'Email and password are required.'}, status=400)

            try:
                user = User.objects.get(email=email)
            except User.DoesNotExist:
                return JsonResponse({'error': 'Invalid email or password.'}, status=401)

            # Verify password
            if not check_password(password, user.password):
                return JsonResponse({'error': 'Invalid email or password.'}, status=401)

            # Check if user is an admin
            is_admin = user.user_type == 'admin'
            
            # Get services this admin manages (empty list if not admin)
            managed_services = []
            if is_admin:
                service_admins = ServiceAdmin.objects.filter(user=user).select_related('service')
                managed_services = [{
                    'id': sa.service.id,
                    'name': sa.service.name,
                    'is_owner': sa.is_owner,
                    'description': sa.service.description
                } for sa in service_admins]

            return JsonResponse({
                'message': 'Login successful!',
                'user_id': user.id,
                'name': user.name,
                'email': user.email,
                'user_type': user.user_type,
                'is_admin': is_admin,
                'managed_services': managed_services
            }, status=200)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)

@api_view(['POST'])
def signup_view(request):
    try:
        data = request.data
        name = data.get('name')
        email = data.get('email')
        password = data.get('password')
        phone_number = data.get('phoneNumber')

        if not all([name, email, password, phone_number]):
            return JsonResponse({'error': 'All fields are required.'}, status=400)

        if User.objects.filter(name=name).exists():
            return JsonResponse({'error': 'Username already exists.'}, status=400)

        if User.objects.filter(email=email).exists():
            return JsonResponse({'error': 'Email already exists.'}, status=400)

        if User.objects.filter(mobile_number=phone_number).exists():
            return JsonResponse({'error': 'Phone number already exists.'}, status=400)

        user = User.objects.create(
            name=name,
            email=email,
            mobile_number=phone_number,
            password=make_password(password)
        )

        return JsonResponse({'message': 'User created successfully.', 'user_id': user.id})
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)
    
@api_view(['POST'])
def admin_signup(request):
    try:
        data = request.data
        name = data.get('name')
        email = data.get('email')
        password = data.get('password')
        phone_number = data.get('phoneNumber')
        service_id = data.get('serviceId')
        
        if not all([name, email, password, phone_number, service_id]):
            return Response({'error': 'All fields are required.'}, status=400)
            
        if User.objects.filter(email=email).exists():
            return Response({'error': 'Email already registered.'}, status=400)
            
        try:
            service = Service.objects.get(id=service_id)
        except Service.DoesNotExist:
            return Response({'error': 'Service not found.'}, status=404)
            
        user = User.objects.create(
            name=name,
            email=email,
            mobile_number=phone_number,
            password=make_password(password),
            user_type='admin'
        )
        
        ServiceAdmin.objects.create(
            user=user,
            service=service,
            is_owner=True
        )
        
        return Response({
            'message': 'Admin account created successfully.',
            'user_id': user.id
        }, status=201)
        
    except Exception as e:
        return Response({'error': str(e)}, status=500)
    
@csrf_exempt
@api_view(['POST'])
def save_fcm_token(request):
    try:
        user_id = request.data.get('user_id')
        fcm_token = request.data.get('fcm_token')
        
        if not user_id or not fcm_token:
            return Response({"error": "User ID and FCM token are required"}, status=400)
        
        user = User.objects.get(id=user_id)
        
        # Save or update the token
        FCMToken.objects.update_or_create(
            user=user,
            token=fcm_token,
            defaults={'is_active': True}
        )
        
        return Response({"success": True, "message": "FCM token saved successfully"})
    
    except User.DoesNotExist:
        return Response({"error": "User not found"}, status=404)
    
    except Exception as e:
        logger.error(f"Error saving FCM token: {str(e)}")
        return Response({"error": str(e)}, status=500)