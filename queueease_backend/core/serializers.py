from rest_framework import serializers
from .models import AppointmentDetails

class AppointmentDetailsSerializer(serializers.ModelSerializer):
    class Meta:
        model = AppointmentDetails
        fields = '__all__'
