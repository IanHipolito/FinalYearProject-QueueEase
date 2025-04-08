const API_BASE =
    window.location.hostname === "localhost"
        ? "http://127.0.0.1:8000/api"
        : "https://c21436494.pythonanywhere.com/api";

export const API = {
    // Authentication endpoints
    auth: {
        login: (email: string, password: string) =>
            fetch(`${API_BASE}/login/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            }),
        signup: (data: any) =>
            fetch(`${API_BASE}/signup/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            }),
        adminLogin: (email: string, password: string) =>
            fetch(`${API_BASE}/login/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            }),
        adminSignup: (data: any) =>
            fetch(`${API_BASE}/admin-signup/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            }),
        saveFcmToken: (userId: number, fcmToken: string) =>
            fetch(`${API_BASE}/save-fcm-token/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: userId,
                    fcm_token: fcmToken
                }),
            }),
    },

    // Admin dashboard endpoints
    admin: {
        getDashboardData: (serviceId: number, timeRangeParam: string = 'daily') =>
            fetch(`${API_BASE}/admin/dashboard-data/?service_id=${serviceId}&time_range=${timeRangeParam}`),
        getCustomers: (serviceId: number) =>
            fetch(`${API_BASE}/admin/customers/?service_id=${serviceId}`),
        getQueueDetails: (serviceId: number) =>
            fetch(`${API_BASE}/service_queues/${serviceId}/`),
        getAnalytics: (serviceId: number, period: string = 'month') =>
            fetch(`${API_BASE}/admin-get-analytics/?service_id=${serviceId}&period=${period}`, {
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                method: 'GET'
            }),
        updateQueueStatus: (queueId: number, isActive: boolean) =>
            fetch(`${API_BASE}/update-queue-position/${queueId}/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ is_active: isActive }),
            }),
        createCustomer: (serviceId: number, data: any) =>
            fetch(`${API_BASE}/admin/customers/create/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    service_id: serviceId,
                    ...data
                }),
            }),
        getNotificationSettings: (serviceId: number) =>
            fetch(`${API_BASE}/admin/notification-settings/?service_id=${serviceId}`),
        updateNotificationSettings: (data: any) =>
            fetch(`${API_BASE}/admin/notification-settings/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            }),
        getCompanyInfo: (userId: number) =>
            fetch(`${API_BASE}/admin/company-info/${userId}/`),

        updateCompanyInfo: (formData: FormData) =>
            fetch(`${API_BASE}/admin/update-company-info/`, {
                method: 'POST',
                body: formData,
            }),

        changePassword: (data: any) =>
            fetch(`${API_BASE}/admin/change-password/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            }),
    },

    // Service management
    services: {
        list: () => fetch(`${API_BASE}/list_services/`),
        listWithStatus: () => fetch(`${API_BASE}/list_services_with_status/`),
        // getAdminServices: (userId: number) => fetch(`${API_BASE}/admin_services/${userId}/`),
        getServiceDetails: (serviceId: number) => fetch(`${API_BASE}/service/${serviceId}/`),
        getAvailableTimes: (serviceId: number, date: string) =>
            fetch(`${API_BASE}/available-times/${serviceId}/?date=${date}`),
    },

    // Queue management
    queues: {
        getActive: (userId: number) => fetch(`${API_BASE}/active-queue/${userId}/`),
        getDetails: (queueId: number) => fetch(`${API_BASE}/queue-detail/${queueId}/`),
        getUserQueues: (userId: number) => fetch(`${API_BASE}/user-queues/${userId}/`),
        createQueue: (userId: number, serviceId: number) =>
            fetch(`${API_BASE}/create-queue/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: userId,
                    service_id: serviceId
                }),
            }),
        joinQueue: (queueId: number, customerId: number) =>
            fetch(`${API_BASE}/join-queue/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ queue_id: queueId, customer_id: customerId }),
            }),
        leaveQueue: (queueId: number) =>
            fetch(`${API_BASE}/leave-queue/${queueId}/`, { method: 'POST' }),
        completeQueue: (queueId: number) =>
            fetch(`${API_BASE}/queue-complete/${queueId}/`, { method: 'POST' }),
        getQRCode: (queueId: number) =>
            fetch(`${API_BASE}/get-qr-code/${queueId}/`),
        getUserAnalytics: (userId: number, timeRange: string = 'month') =>
            fetch(`${API_BASE}/user-analytics/${userId}/?time_range=${timeRange}`),
        transferQueue: (originalQueueId: number, targetServiceId: number, userId: number): Promise<Response> =>
            fetch(`${API_BASE}/transfer-queue/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    original_queue_id: originalQueueId,
                    target_service_id: targetServiceId,
                    user_id: userId
                }),
            }),
        validateQR: (qrHash: string) =>
            fetch(`${API_BASE}/validate-qr/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ qrHash }),
            }),
    },

    // Appointment management
    appointments: {
        getAll: (userId: number) => fetch(`${API_BASE}/appointments/${userId}/`),
        getAppointmentDetails: (orderId: string) => fetch(`${API_BASE}/appointment/${orderId}/`),
        addAppointment: (orderID: string, userId: number) =>
            fetch(`${API_BASE}/appointment/add-existing/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ order_id: orderID, user_id: userId }),
            }),
        deleteAppointment: (orderId: string) =>
            fetch(`${API_BASE}/appointment/delete/${orderId}/`, { method: 'DELETE' }),
        createAppointment: (data: any) =>
            fetch(`${API_BASE}/create-appointment/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            }),
        cancelAppointment: (orderId: string) =>
            fetch(`${API_BASE}/appointment/cancel/${orderId}/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            }),
        checkAndUpdateAppointments: () =>
            fetch(`${API_BASE}/check-appointments/`),
        checkStatus: (orderId: string) =>
            fetch(`${API_BASE}/appointment/check-status/${orderId}/`),

    },

    // Feedback management
    feedback: {
        getCategories: () =>
            fetch(`${API_BASE}/feedback/categories/`),
        submitFeedback: (feedbackData: any) =>
            fetch(`${API_BASE}/feedback/submit/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(feedbackData),
            }),
        getUserFeedbackHistory: (userId: number) =>
            fetch(`${API_BASE}/feedback/user/${userId}/`),
        getUserEligibleServices: (userId: number) =>
            fetch(`${API_BASE}/feedback/eligible-services/${userId}/`, {
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            }),
    },

    // Helper methods for common operations
    async handleResponse(response: Response) {
        if (!response.ok) {
            try {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(
                    errorData.error || errorData.detail || `API Error: ${response.status} ${response.statusText}`
                );
            } catch (e) {
                if (e instanceof Error) {
                    throw e;
                }
                throw new Error(`API Error: ${response.status} ${response.statusText}`);
            }
        }
        return await response.json();
    },
};