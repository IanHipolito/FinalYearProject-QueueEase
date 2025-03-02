from rest_framework import serializers
from .models import AppointmentDetails, Service

class AppointmentDetailsSerializer(serializers.ModelSerializer):
    class Meta:
        model = AppointmentDetails
        fields = '__all__'

class ServiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Service
        fields = '__all__'