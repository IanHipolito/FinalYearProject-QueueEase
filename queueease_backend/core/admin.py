from django.contrib import admin
from .models import User, Queue, QRCode

admin.site.register(User)

class QueueAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'service', 'employee', 'status', 'date_created')
    list_filter = ('status', 'is_active')

    def total_queues(self, request):
        return Queue.objects.count()

admin.site.register(Queue, QueueAdmin)


class QRCodeAdmin(admin.ModelAdmin):
    list_display = ('id', 'queue', 'qr_hash', 'date_created')

    def total_qr_codes(self, request):
        return QRCode.objects.count()

admin.site.register(QRCode, QRCodeAdmin)
