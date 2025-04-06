import firebase_admin
from firebase_admin import credentials, messaging
import os
import json
from typing import Dict, Any, Optional, List
import logging

logger = logging.getLogger(__name__)

# Initialize Firebase Admin SDK - use environment variable for credentials path in production
FIREBASE_CREDENTIAL_PATH = os.environ.get('FIREBASE_CREDENTIAL_PATH', 'C:/Final Year Project- QueueEase/queueease_backend/queueease-5945e-firebase-adminsdk-fbsvc-94a5d0a36c.json')

def get_firebase_credentials():
    """Get Firebase credentials safely parsing JSON content"""
    try:
        if os.path.exists(FIREBASE_CREDENTIAL_PATH):
            logger.info(f"Found Firebase credentials file at {FIREBASE_CREDENTIAL_PATH}")
            # Read the file with explicit encoding
            with open(FIREBASE_CREDENTIAL_PATH, 'r', encoding='utf-8') as f:
                try:
                    cred_json = json.load(f)
                    logger.info(f"Loaded credentials for project: {cred_json.get('project_id')}")
                    return credentials.Certificate(cred_json)
                except json.JSONDecodeError as e:
                    logger.error(f"Firebase credentials file is not valid JSON: {str(e)}")
                    # Log a preview of the file content for debugging
                    with open(FIREBASE_CREDENTIAL_PATH, 'r', encoding='utf-8') as f2:
                        preview = f2.read(100) + "..."
                        logger.error(f"File content preview: {preview}")
                    return None
        else:
            logger.warning(f"Firebase credential file not found at {FIREBASE_CREDENTIAL_PATH}")
            # Log the current working directory for debugging
            logger.warning(f"Current working directory: {os.getcwd()}")
            return None
    except Exception as e:
        logger.error(f"Error loading Firebase credentials: {str(e)}")
        return None

try:
    # Try to get app if already initialized
    firebase_admin.get_app()
    logger.info("Firebase Admin SDK already initialized")
except ValueError:
    # App not initialized yet
    try:
        cred = get_firebase_credentials()
        if cred:
            firebase_admin.initialize_app(cred)
            logger.info("Firebase Admin SDK initialized successfully")
        else:
            logger.warning("Failed to load valid Firebase credentials")
    except Exception as e:
        logger.error(f"Error initializing Firebase Admin SDK: {str(e)}")

class NotificationService:    
    @staticmethod
    def send_push_notification(token: str, title: str, body: str, data: Optional[Dict[str, str]] = None) -> Dict[str, Any]:
        """Send a push notification to a specific device"""
        try:
            if not token:
                logger.warning("Attempted to send notification with empty token")
                return {"success": False, "error": "No FCM token provided"}
                
            # Create message
            message = messaging.Message(
                notification=messaging.Notification(
                    title=title,
                    body=body,
                ),
                data=data or {},
                token=token,
            )
            
            # Log attempt
            logger.info(f"Attempting to send notification: title='{title}', body='{body}'")
            
            # Send message
            response = messaging.send(message)
            logger.info(f"Successfully sent notification: {response}")
            
            return {
                "success": True,
                "message_id": response
            }
            
        except Exception as e:
            logger.error(f"Error sending push notification: {str(e)}")
            return {
                "success": False,
                "error": str(e)
            }
    
    @staticmethod
    def send_queue_update_notification(token: str, queue_id: int, position: int, 
                                       wait_time: int, service_name: str) -> Dict[str, Any]:
        """Send a notification for queue updates"""
        title = f"Queue Update: {service_name}"
        body = f"Your position is now #{position}. Estimated wait: {wait_time} min."
        
        data = {
            "type": "queue_update",
            "queue_id": str(queue_id),
            "position": str(position),
            "wait_time": str(wait_time),
            "url": f"/success/{queue_id}"
        }
        
        return NotificationService.send_push_notification(token, title, body, data)
    
    @staticmethod
    def send_queue_almost_ready_notification(token: str, queue_id: int, service_name: str) -> Dict[str, Any]:
        """Send a notification when queue is almost ready (2 minutes)"""
        title = f"Almost Ready: {service_name}"
        body = "Your order will be ready in about 2 minutes! Please prepare to collect it."
        
        data = {
            "type": "queue_almost_ready",
            "queue_id": str(queue_id),
            "url": f"/success/{queue_id}"
        }
        
        return NotificationService.send_push_notification(token, title, body, data)
    
    @staticmethod
    def send_appointment_reminder(token: str, appointment_id: str, service_name: str, 
                                 time_until: int) -> Dict[str, Any]:
        """Send a reminder for upcoming appointments"""
        title = f"Appointment Reminder: {service_name}"
        
        if time_until <= 15:
            body = f"Your appointment is in {time_until} minutes! Please arrive soon."
        elif time_until <= 60:
            body = f"Your appointment is in {time_until} minutes."
        else:
            hours = time_until // 60
            body = f"Your appointment is in {hours} hour{'s' if hours > 1 else ''}."
        
        data = {
            "type": "appointment_reminder",
            "appointment_id": appointment_id,
            "time_until": str(time_until),
            "url": f"/appointment/{appointment_id}"
        }
        
        return NotificationService.send_push_notification(token, title, body, data)

# Convenience export functions
def send_push_notification(token, title, body, data=None):
    return NotificationService.send_push_notification(token, title, body, data)

def send_queue_update_notification(token, queue_id, position, wait_time, service_name):
    return NotificationService.send_queue_update_notification(token, queue_id, position, wait_time, service_name)

def send_queue_almost_ready_notification(token, queue_id, service_name):
    return NotificationService.send_queue_almost_ready_notification(token, queue_id, service_name)

def send_appointment_reminder(token, appointment_id, service_name, time_until):
    return NotificationService.send_appointment_reminder(token, appointment_id, service_name, time_until)