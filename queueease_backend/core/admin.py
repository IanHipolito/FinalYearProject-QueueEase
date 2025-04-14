from django.contrib import admin
from .models import User, Queue, QRCode, Service

admin.site.register(User)

class QueueAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'service', 'status', 'date_created')
    list_filter = ('status', 'is_active')

    def total_queues(self, request):
        return Queue.objects.count()

admin.site.register(Queue, QueueAdmin)


class QRCodeAdmin(admin.ModelAdmin):
    list_display = ('id', 'queue', 'qr_hash', 'date_created')

    def total_qr_codes(self, request):
        return QRCode.objects.count()

admin.site.register(QRCode, QRCodeAdmin)

def update_to_appointment_based(modeladmin, request, queryset):
    queryset.update(service_type='appointment')
update_to_appointment_based.short_description = "Mark selected services as appointment-based"

@admin.register(Service)
class ServiceAdmin(admin.ModelAdmin):
    list_display = ('name', 'category', 'service_type', 'is_active')
    list_filter = ('service_type', 'category', 'is_active')
    search_fields = ('name', 'description', 'category')
    actions = [update_to_appointment_based]
