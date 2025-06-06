from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view
from rest_framework.response import Response
import logging
from ..models import Feedback, User, Service, Queue
from ..utils.nlp_sentiment import SentimentAnalyzer

logger = logging.getLogger(__name__)

@api_view(['POST'])
def submit_feedback(request):
    try:
        data = request.data
        required_fields = ['service_id', 'rating', 'user_id', 'categories']
        for field in required_fields:
            if field not in data:
                return Response({'error': f'Missing required field: {field}'}, status=400)
        
        service = get_object_or_404(Service, id=data['service_id'])
        user = get_object_or_404(User, id=data['user_id'])
        order_id = data.get('order_id')
        queue = None
        if order_id:
            queue = Queue.objects.filter(id=order_id).first()
        
        # Prevent duplicate feedback submissions
        if Feedback.objects.filter(user=user, service=service, queue=queue).exists():
            return Response({'error': 'You have already submitted feedback for this service'}, status=400)
        
        comment = data.get('comment', '')
        # Instantiate and use the new SentimentAnalyzer (ensemble method)
        analyzer = SentimentAnalyzer()
        sentiment_result = analyzer.analyze(comment, method="ensemble")
        
        # Create the feedback (preserving all previous fields)
        feedback = Feedback.objects.create(
            user=user,
            service=service,
            queue=queue,
            rating=data['rating'],
            comment=comment,
            categories=data.get('categories', []),
            sentiment=sentiment_result['sentiment']
        )
        
        return Response({
            'id': feedback.id,
            'message': 'Feedback submitted successfully',
            'sentiment': sentiment_result['sentiment']
        }, status=201)
    
    except Exception as e:
        return Response({'error': str(e)}, status=500)

@api_view(['GET'])
def get_feedback_categories(request):
    categories = [
        {"id": "wait_time", "name": "Wait Time"},
        {"id": "staff", "name": "Staff Service"},
        {"id": "cleanliness", "name": "Cleanliness"},
        {"id": "communication", "name": "Communication"},
        {"id": "app_experience", "name": "App Experience"},
        {"id": "value", "name": "Value for Money"},
        {"id": "product_quality", "name": "Product Quality"},
        {"id": "atmosphere", "name": "Atmosphere"}
    ]
    return Response(categories)

@api_view(['GET'])
def get_user_feedback_history(request, user_id):
    try:
        user = get_object_or_404(User, id=user_id)
        feedbacks = Feedback.objects.filter(user=user).order_by('-created_at')
        
        result = []
        for fb in feedbacks:
            order_details = "General Service"
            if fb.queue:
                order_details = f"Queue #{fb.queue.id}"
            
            result.append({
                "id": fb.id,
                "service_name": fb.service.name,
                "order_details": order_details,
                "rating": fb.rating,
                "date": fb.created_at.isoformat(),
                "comment": fb.comment,
                "categories": fb.categories,
                "sentiment": fb.sentiment
            })
        
        return Response(result)
    
    except Exception as e:
        return Response({'error': str(e)}, status=500)
    
@api_view(['GET'])
def get_eligible_services(request, user_id):
    try:
        user = get_object_or_404(User, id=user_id)
        
        queues = Queue.objects.filter(user=user).order_by('-date_created')
        
        result = []
        for queue in queues:
            has_feedback = Feedback.objects.filter(
                user=user,
                service=queue.service,
                queue=queue
            ).exists()
            
            result.append({
                "id": queue.service.id,
                "name": queue.service.name,
                "order_id": queue.id,
                "order_details": f"Queue #{queue.id}",
                "date": queue.date_created.isoformat(),
                "has_feedback": has_feedback
            })
        
        return Response(result)
    
    except Exception as e:
        return Response({'error': str(e)}, status=500)
