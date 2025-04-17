from django.shortcuts import get_object_or_404
from django.db import models
from django.utils import timezone
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from datetime import datetime, timedelta
import logging
import traceback
from django.contrib.auth.hashers import check_password, make_password
import json
from ..models import User, Service, Queue, ServiceAdmin, ServiceWaitTime, Feedback, AppointmentDetails, NotificationSettings
from ..utils.nlp_sentiment import KeywordExtractor, SentimentAnalyzer

logger = logging.getLogger(__name__)

@api_view(['GET'])
def admin_dashboard_data(request):
    try:
        service_id = request.query_params.get('service_id')
        time_range = request.query_params.get('time_range', 'daily')
        
        if not service_id:
            return Response({'error': 'Service ID is required'}, status=400)
        
        service = get_object_or_404(Service, id=service_id)
        
        # Timezone-aware queries for accuracy
        now = timezone.now()
        
        # Count pending queues - correctly with timezone awareness
        customer_count = Queue.objects.filter(
            service=service, 
            status='pending', 
            is_active=True
        ).count()
        
        # Get actual queue count without minimum value
        queue_count = Queue.objects.filter(
            service=service, 
            is_active=True
        ).distinct().count()
        
        # Get latest orders with proper timezone handling
        latest_orders = []
        
        if service.service_type == 'immediate':
            # Get up to 5 most recent queue entries regardless of status
            latest_queue_entries = Queue.objects.filter(
                service=service
            ).select_related('user').order_by('-date_created')[:5]
            
            for queue in latest_queue_entries:
                try:
                    formatted_date = timezone.localtime(queue.date_created).strftime('%Y-%m-%d') if queue.date_created else 'N/A'
                    formatted_time = timezone.localtime(queue.date_created).strftime('%H:%M') if queue.date_created else 'N/A'
                    
                    customer_name = queue.user.name if hasattr(queue, 'user') and queue.user else 'Customer'
                    
                    latest_orders.append({
                        'id': queue.id,
                        'service_name': service.name,
                        'status': queue.status,
                        'date': formatted_date,
                        'customer_name': customer_name,
                        'time': formatted_time,
                        'type': 'immediate'
                    })
                except Exception as e:
                    logger.error(f"Error processing queue entry {queue.id}: {e}")
                    continue
                    
            order_count = Queue.objects.filter(service=service).count()
        else:
            # For appointment-based services
            latest_appointments = AppointmentDetails.objects.filter(
                service=service
            ).order_by('-appointment_date', '-appointment_time')[:5]
            
            for appt in latest_appointments:
                try:
                    latest_orders.append({
                        'id': appt.order_id,
                        'service_name': service.name,
                        'status': appt.status,
                        'date': appt.appointment_date.strftime('%Y-%m-%d') if appt.appointment_date else 'N/A',
                        'customer_name': appt.user.name if hasattr(appt, 'user') and appt.user else 'Customer',
                        'time': appt.appointment_time.strftime('%H:%M') if appt.appointment_time else 'N/A',
                        'type': 'appointment'
                    })
                except Exception as e:
                    logger.error(f"Error processing appointment {appt.id}: {e}")
                    continue
                
            order_count = AppointmentDetails.objects.filter(service=service).count()
        
        # Calculate growth rate with proper date ranges
        today = timezone.now().date()
        last_week_start = today - timedelta(days=7)
        previous_week_start = last_week_start - timedelta(days=7)
        
        # Use timezone-aware date ranges
        current_week_count = Queue.objects.filter(
            service=service,
            date_created__gte=timezone.make_aware(datetime.combine(last_week_start, datetime.min.time())),
            date_created__lt=timezone.make_aware(datetime.combine(today, datetime.min.time()))
        ).count()
        
        previous_week_count = Queue.objects.filter(
            service=service,
            date_created__gte=timezone.make_aware(datetime.combine(previous_week_start, datetime.min.time())),
            date_created__lt=timezone.make_aware(datetime.combine(last_week_start, datetime.min.time()))
        ).count()
        
        growth = 0
        if previous_week_count > 0:
            growth_percentage = ((current_week_count - previous_week_count) / previous_week_count) * 100
            growth = round(growth_percentage, 2)
        
        # Calculate customer stats for charting with proper timezone handling
        customer_stats = []
        
        # Use actual number of days based on time range
        if time_range == 'daily':
            days_to_check = 5
        else:
            days_to_check = 5
            
        for i in range(days_to_check):
            day_date = today - timedelta(days=i)
            
            # Use timezone-aware datetime for queries
            day_start = timezone.make_aware(datetime.combine(day_date, datetime.min.time()))
            day_end = timezone.make_aware(datetime.combine(day_date, datetime.max.time()))
            
            # Get actual count without scaling
            day_count = Queue.objects.filter(
                service=service,
                date_created__gte=day_start,
                date_created__lte=day_end
            ).count()
            
            customer_stats.append(day_count)
        
        # Reverse to get chronological order
        customer_stats.reverse()
            
        response_data = {
            'customer_count': customer_count,
            'queue_count': queue_count,
            'order_count': order_count,
            'growth': growth,
            'latest_orders': latest_orders,
            'customer_stats': customer_stats,
            'service_type': service.service_type
        }
        
        return Response(response_data)
        
    except Exception as e:
        logger.error(f"Dashboard data error: {str(e)}")
        logger.error(traceback.format_exc())
        
        # Return an error response
        return Response({
            'error': 'An unexpected error occurred while retrieving dashboard data',
            'details': str(e)
        }, status=500)
    
@api_view(['GET'])
def admin_customers(request):
    try:
        service_id = request.query_params.get('service_id')
        if not service_id:
            return Response({'error': 'Service ID is required'}, status=400)
            
        try:
            service = Service.objects.get(id=service_id)
        except Service.DoesNotExist:
            return Response({'error': 'Service not found'}, status=404)
            
        # Get unique user IDs who have used a specific service
        user_ids = Queue.objects.filter(service=service).values_list('user', flat=True).distinct()
        users = User.objects.filter(id__in=user_ids)
        
        customers_data = []
        for user in users:
            # Count orders placed by this customer for a specific service
            order_count = Queue.objects.filter(user=user, service=service).count()
            
            # Get the user's last visit date for a specific service
            last_visit = Queue.objects.filter(user=user, service=service).order_by('-date_created').first()
            
            is_active = False
            if last_visit and last_visit.date_created:
                thirty_days_ago = timezone.now() - timedelta(days=30)
                is_active = last_visit.date_created > thirty_days_ago
            
            customers_data.append({
                'id': user.id,
                'name': user.name or f"User #{user.id}",
                'email': user.email or "No email",
                'phone': user.mobile_number or "No phone",
                'status': 'Active' if is_active else 'Inactive',
                'is_active': is_active,
                'order_count': order_count,
                'last_visit': last_visit.date_created.isoformat() if last_visit and last_visit.date_created else None
            })
            
        return Response(customers_data)
    except Exception as e:
        return Response({
            'error': str(e),
            'message': 'An error occurred while fetching customer data'
        }, status=500)
    
@api_view(['GET'])
def admin_get_analytics(request):
    try:
        service_id = request.GET.get('service_id')
        period = request.GET.get('period', 'month')
        if not service_id:
            return Response({'error': 'service_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        service = get_object_or_404(Service, id=service_id)
        today = timezone.now()
        if period == 'week':
            start_date = today - timedelta(days=7)
        elif period == 'month':
            start_date = today - timedelta(days=30)
        else:
            start_date = today - timedelta(days=365)
        
        # Retrieve feedback for this service from start_date
        feedbacks = Feedback.objects.filter(
            service=service,
            created_at__gte=start_date
        ).select_related('user', 'queue').order_by('-created_at')
        
        total_feedbacks = feedbacks.count()
        
        # Build the feedback distribution array aggregate feedback by category
        category_distribution = {}
        for fb in feedbacks:
            categories = fb.categories if fb.categories else ["Overall"]
            for cat in categories:
                if cat not in category_distribution:
                    category_distribution[cat] = {'satisfied': 0, 'neutral': 0, 'dissatisfied': 0, 'total': 0}
                if fb.rating >= 4:
                    category_distribution[cat]['satisfied'] += 1
                elif fb.rating <= 2:
                    category_distribution[cat]['dissatisfied'] += 1
                else:
                    category_distribution[cat]['neutral'] += 1
                category_distribution[cat]['total'] += 1
        
        distribution_array = []
        idx = 1
        for cat, counts in category_distribution.items():
            total = counts['total'] if counts['total'] > 0 else 1
            distribution_array.append({
                'id': idx,
                'category': cat,
                'satisfied': int((counts['satisfied'] / total) * 100),
                'neutral': int((counts['neutral'] / total) * 100),
                'dissatisfied': int((counts['dissatisfied'] / total) * 100)
            })
            idx += 1

        # Calculate overall rating rercentages as fallback
        if total_feedbacks > 0:
            satisfied_count = feedbacks.filter(rating__gte=4).count()
            neutral_count = feedbacks.filter(rating=3).count()
            dissatisfied_count = feedbacks.filter(rating__lte=2).count()
            overall_satisfied_pct = int((satisfied_count / total_feedbacks) * 100)
            overall_neutral_pct = int((neutral_count / total_feedbacks) * 100)
            overall_dissatisfied_pct = 100 - overall_satisfied_pct - overall_neutral_pct
        else:
            overall_satisfied_pct = overall_neutral_pct = overall_dissatisfied_pct = 0

        # Build Customer Comments
        comments = []
        comment_texts = []
        comment_sentiments = {}
        sentiment_analyzer = SentimentAnalyzer()
        for fb in feedbacks[:10]:
            user = fb.user
            queue_name = f"Queue #{fb.queue.id}" if fb.queue else "General"
            comment_data = {
                'id': fb.id,
                'name': user.name if user else 'Anonymous',
                'date': fb.created_at.strftime("%b %d, %Y"),
                'queue': queue_name,
                'rating': fb.rating,
                'comment': fb.comment,
                'sentiment': fb.sentiment
            }
            comments.append(comment_data)
            if fb.comment:
                comment_texts.append(fb.comment)
                norm_comment = fb.comment.strip().lower()
                comment_sentiments[norm_comment] = sentiment_analyzer.analyze(fb.comment, method="ensemble")["sentiment"]
        
        # Extract Feedback Keywords Using KeywordExtractor
        keyword_extractor = KeywordExtractor()
        keywords = keyword_extractor.extract_keywords(comment_texts, sentiment_mapping=comment_sentiments)
        
        # Compute Average Wait Time
        avg_wait_time = 0
        historical_data = ServiceWaitTime.objects.filter(
            service=service,
            date_recorded__gte=start_date
        )
        if historical_data.exists():
            avg = historical_data.aggregate(avg_time=models.Avg('wait_time'))['avg_time']
            if avg:
                avg_wait_time = int(avg)
        else:
            queues = Queue.objects.filter(service=service, status='completed')
            if queues.exists():
                total_wait = 0
                count = 0
                for queue in queues:
                    if hasattr(queue, 'total_wait') and queue.total_wait:
                        wait_minutes = queue.total_wait / 60 if queue.total_wait > 1000 else queue.total_wait
                        total_wait += wait_minutes
                        count += 1
                if count:
                    avg_wait_time = int(total_wait / count)
        
        # Calculate Trends Using Existing Functions
        satisfaction_trend = calculate_satisfaction_trend(feedbacks, period)
        wait_time_trend = calculate_wait_time_trend(service, period)
        
        # Assemble the Real Response Data
        response_data = {
            'feedback_distribution': distribution_array,
            'customer_comments': comments,
            'total_reports': total_feedbacks,
            'satisfied_pct': overall_satisfied_pct,
            'neutral_pct': overall_neutral_pct,
            'dissatisfied_pct': overall_dissatisfied_pct,
            'average_wait_time': avg_wait_time,
            'satisfaction_trend': satisfaction_trend,
            'wait_time_trend': wait_time_trend,
            'feedback_keywords': keywords
        }
        
        return Response(response_data)
    
    except Exception as e:
        logger.error("Error in admin_get_analytics: " + str(e))
        logger.error(traceback.format_exc())
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
def calculate_satisfaction_trend(feedbacks, period):
    if not feedbacks:
        return []
    now = timezone.now()
    if period == 'week':
        # 7-day buckets (Monday=0)
        buckets = [0] * 7
        totals = [0] * 7
        for fb in feedbacks:
            weekday = fb.created_at.weekday()
            totals[weekday] += 1
            if fb.rating >= 4:
                buckets[weekday] += 1
        trend = [int((pos / tot) * 100) if tot else 0 for pos, tot in zip(buckets, totals)]
        return trend
    elif period == 'month':
        # 4-week buckets
        buckets = [0] * 4
        totals = [0] * 4
        for fb in feedbacks:
            week_index = (fb.created_at.day - 1) // 7
            if week_index < 4:
                totals[week_index] += 1
                if fb.rating >= 4:
                    buckets[week_index] += 1
        trend = [int((pos / tot) * 100) if tot else 0 for pos, tot in zip(buckets, totals)]
        return trend
    else:
        # For year: group by month
        buckets = [0] * 12
        totals = [0] * 12
        for fb in feedbacks:
            month = fb.created_at.month
            index = month - 1
            totals[index] += 1
            if fb.rating >= 4:
                buckets[index] += 1
        trend = [int((pos / tot) * 100) if tot else 0 for pos, tot in zip(buckets, totals)]
        return trend[:now.month]

def calculate_wait_time_trend(service, period):
    now = timezone.now()
    if period == 'week':
        trend = []
        for i in range(7):
            day = now - timedelta(days=i)
            day_data = ServiceWaitTime.objects.filter(
                service=service,
                date_recorded__date=day.date()
            )
            if day_data.exists():
                avg = day_data.aggregate(avg_time=models.Avg('wait_time'))['avg_time']
                trend.append(int(avg) if avg else 0)
            else:
                trend.append(0)
        return list(reversed(trend))
    elif period == 'month':
        trend = []
        for week in range(4):
            week_start = now - timedelta(days=(week + 1) * 7)
            week_end = now - timedelta(days=week * 7)
            week_data = ServiceWaitTime.objects.filter(
                service=service,
                date_recorded__gte=week_start,
                date_recorded__lt=week_end
            )
            if week_data.exists():
                avg = week_data.aggregate(avg_time=models.Avg('wait_time'))['avg_time']
                trend.append(int(avg) if avg else 0)
            else:
                trend.append(0)
        return list(reversed(trend))
    else:
        trend = []
        for month in range(1, now.month + 1):
            month_data = ServiceWaitTime.objects.filter(
                service=service,
                date_recorded__month=month,
                date_recorded__year=now.year
            )
            if month_data.exists():
                avg = month_data.aggregate(avg_time=models.Avg('wait_time'))['avg_time']
                trend.append(int(avg) if avg else 0)
            else:
                trend.append(0)
        return trend

@api_view(['GET', 'POST'])
def notification_settings(request):
    service_id = request.GET.get('service_id') or request.data.get('service_id')
    if not service_id:
        return Response({"error": "Service ID is required"}, status=400)
    
    try:
        service = Service.objects.get(id=service_id)
    except Service.DoesNotExist:
        return Response({"error": "Service not found"}, status=404)
    
    # Get or create settings
    settings, _ = NotificationSettings.objects.get_or_create(service=service)
    
    if request.method == 'GET':
        return Response({
            "service_id": service.id,
            "is_enabled": settings.is_enabled,
            "frequency_minutes": settings.frequency_minutes,
            "message_template": settings.message_template
        })
    
    elif request.method == 'POST':
        # Update settings
        if 'is_enabled' in request.data:
            settings.is_enabled = request.data['is_enabled']
        if 'frequency_minutes' in request.data:
            settings.frequency_minutes = request.data['frequency_minutes']
        if 'message_template' in request.data:
            settings.message_template = request.data['message_template']
        
        settings.save()
        
        return Response({
            "message": "Notification settings updated successfully",
            "service_id": service.id,
            "is_enabled": settings.is_enabled,
            "frequency_minutes": settings.frequency_minutes,
            "message_template": settings.message_template
        })
    
@api_view(['GET'])
def admin_company_info(request, user_id):
    try:
        user = get_object_or_404(User, id=user_id, user_type='admin')
        
        # Get the admin's service
        service_admin = ServiceAdmin.objects.filter(user=user).first()
        
        if not service_admin or not service_admin.service:
            return Response({"error": "No service found for this admin"}, status=404)
        
        service = service_admin.service
        
        # Initialize details if None
        if service.details is None:
            service.details = {}
        elif isinstance(service.details, str):
            try:
                service.details = json.loads(service.details)
            except json.JSONDecodeError:
                service.details = {}
        
        # Return service details as company info
        company_data = {
            "name": service.name,
            "email": service.details.get("email", user.email if user.email else ""),
            "phone": service.details.get("phone", user.mobile_number if user.mobile_number else ""),
            "address": service.details.get("address", ""),
            "latitude": float(service.latitude) if service.latitude else 0.0,
            "longitude": float(service.longitude) if service.longitude else 0.0,
            "logo_base64": service.details.get("logo_base64", "") 
        }
        
        logger.info(f"Returning company data for user {user_id} (without logo content for brevity)")
        
        return Response(company_data)
    
    except Exception as e:
        logger.error(f"Error retrieving company info: {str(e)}")
        logger.error(traceback.format_exc())
        return Response({"error": str(e)}, status=500)

@api_view(['POST'])
def admin_update_company_info(request):
    try:
        data = request.data
        user_id = data.get('user_id')
        
        if not user_id:
            return Response({"error": "User ID is required"}, status=400)
        
        user = get_object_or_404(User, id=user_id, user_type='admin')
        
        # Get the admin's service
        service_admin = ServiceAdmin.objects.filter(user=user).first()
        
        if not service_admin or not service_admin.service:
            return Response({"error": "No service found for this admin"}, status=404)
        
        service = service_admin.service
        
        # Update basic fields
        service.name = data.get('name', service.name)
        
        # Update latitude and longitude if provided
        latitude = data.get('latitude')
        longitude = data.get('longitude')
        
        if latitude and longitude:
            try:
                service.latitude = float(latitude)
                service.longitude = float(longitude)
            except ValueError:
                return Response({"error": "Invalid latitude or longitude value"}, status=400)
        
        # Ensure details is a dictionary
        if not service.details:
            service.details = {}
        elif isinstance(service.details, str):
            try:
                service.details = json.loads(service.details)
            except json.JSONDecodeError:
                service.details = {}
        
        # Update details fields
        service.details['address'] = data.get('address', service.details.get('address', ''))
        service.details['email'] = data.get('email', service.details.get('email', ''))
        service.details['phone'] = data.get('phone', service.details.get('phone', ''))
        
        # Handle logo as Base64 string
        logo_base64 = data.get('logoBase64')
        if logo_base64:
            service.details['logo_base64'] = logo_base64
        
        # Log update information without the Base64 content for brevity
        logger.info(f"Updating service {service.id} with: name={service.name}, lat={service.latitude}, lng={service.longitude}, logo_provided={'yes' if logo_base64 else 'no'}")
        
        # Save changes
        service.save()
        logger.info(f"Service {service.id} updated successfully")
        
        # Return the updated data for confirmation
        response_data = {
            "message": "Company information updated successfully",
            "data": {
                "name": service.name,
                "email": service.details.get('email', user.email if hasattr(user, 'email') else ''),
                "phone": service.details.get('phone', user.mobile_number if hasattr(user, 'mobile_number') else ''),
                "address": service.details.get('address', ''),
                "latitude": float(service.latitude) if service.latitude else 0.0,
                "longitude": float(service.longitude) if service.longitude else 0.0,
                "logo_base64": service.details.get('logo_base64', '')
            }
        }
        
        return Response(response_data)
    
    except Exception as e:
        logger.error(f"Error updating company info: {str(e)}")
        logger.error(traceback.format_exc())
        return Response({"error": str(e)}, status=500)

@api_view(['POST'])
def admin_change_password(request):
    try:
        data = request.data
        user_id = data.get('user_id')
        current_password = data.get('current_password')
        new_password = data.get('new_password')
        
        if not all([user_id, current_password, new_password]):
            return Response({"error": "All fields are required"}, status=400)
        
        user = get_object_or_404(User, id=user_id)
        
        # Verify current password
        if not check_password(current_password, user.password):
            return Response({"error": "Current password is incorrect"}, status=400)
        
        # Update password
        user.password = make_password(new_password)
        user.save()
        
        return Response({"message": "Password updated successfully"})
    
    except Exception as e:
        logger.error(f"Error changing password: {str(e)}")
        logger.error(traceback.format_exc())
        return Response({"error": str(e)}, status=500)
    
@api_view(['GET'])
def admin_todays_appointments(request):
    try:
        service_id = request.GET.get('service_id')
        date_param = request.GET.get('date')
        
        if not service_id or not date_param:
            return Response({"error": "service_id and date are required"}, status=400)
        
        try:
            selected_date = datetime.strptime(date_param, '%Y-%m-%d').date()
        except ValueError:
            return Response({"error": "Invalid date format. Use YYYY-MM-DD."}, status=400)
        
        # Get appointments for the specified date and service
        appointments = AppointmentDetails.objects.filter(
            service_id=service_id,
            appointment_date=selected_date,
            status__in=['scheduled', 'checked_in', 'in_progress', 'completed']
        ).order_by('appointment_time')
        
        # Get current time in the server's timezone (Europe/Dublin)
        now = timezone.now()
        today = now.date()
        current_time = now.time()
        
        # Process each appointment to check for delays
        appointments_data = []
        for appointment in appointments:
            delay_minutes = 0
            
            # For appointments that have not started yet and scheduled for today and time has passed
            if (appointment.status in ['scheduled', 'checked_in'] and 
                appointment.appointment_date == today and 
                appointment.appointment_time < current_time):
                # Calculate delay in minutes
                naive_scheduled = datetime.combine(today, appointment.appointment_time)
                aware_scheduled = timezone.make_aware(naive_scheduled)
                delay_seconds = (now - aware_scheduled).total_seconds()
                calculated_delay_minutes = max(0, int(delay_seconds / 60))
                
                # Only update delay if calculated delay is greater than existing delay
                existing_delay = appointment.delay_minutes or 0
                if calculated_delay_minutes > existing_delay:
                    delay_minutes = calculated_delay_minutes
                    
                    # Update the appointment with the new delay
                    appointment.delay_minutes = delay_minutes
                    appointment.save(update_fields=['delay_minutes'])
            
            # Format basic appointment data
            apt_data = {
                "order_id": appointment.order_id,
                "user_name": appointment.user.name or f"User {appointment.user.id}",
                "service_name": appointment.service.name,
                "appointment_date": appointment.appointment_date.strftime('%Y-%m-%d'),
                "appointment_time": appointment.appointment_time.strftime('%H:%M'),
                "status": appointment.status,
                "actual_start_time": appointment.actual_start_time.isoformat() if appointment.actual_start_time else None,
                "actual_end_time": appointment.actual_end_time.isoformat() if appointment.actual_end_time else None,
                "delay_minutes": appointment.delay_minutes,
                "check_in_time": appointment.check_in_time.isoformat() if appointment.check_in_time else None
            }
            
            appointments_data.append(apt_data)
        
        return Response(appointments_data)
        
    except Exception as e:
        logger.error(f"Error fetching today's appointments: {str(e)}")
        logger.error(traceback.format_exc())
        return Response({"error": str(e)}, status=500)
    