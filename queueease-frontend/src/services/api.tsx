const API_BASE =
    window.location.hostname === "localhost"
        ? "http://127.0.0.1:8000/api"
        : "https://c21436494.pythonanywhere.com/api";

export const API = {
    // Authentication endpoints
    auth: {
        login: async (email: string, password: string) => {
            const response = await fetch(`${API_BASE}/login/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });
            return API.handleResponse(response);
        },
        signup: async (data: any) => {
            const response = await fetch(`${API_BASE}/signup/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            return API.handleResponse(response);
        },
        adminLogin: async (email: string, password: string) => {
            const response = await fetch(`${API_BASE}/login/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });
            return API.handleResponse(response);
        },
        adminSignup: async (data: any) => {
            const response = await fetch(`${API_BASE}/admin-signup/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            return API.handleResponse(response);
        },
        saveFcmToken: async (userId: number, fcmToken: string) => {
            const response = await fetch(`${API_BASE}/save-fcm-token/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: userId,
                    fcm_token: fcmToken
                }),
            });
            return API.handleResponse(response);
        },
    },

    // Admin dashboard endpoints
    admin: {
        getDashboardData: async (serviceId: number, timeRangeParam: string = 'daily') => {
            const response = await fetch(`${API_BASE}/admin/dashboard-data/?service_id=${serviceId}&time_range=${timeRangeParam}`);
            return API.handleResponse(response);
        },
        getCustomers: async (serviceId: number) => {
            const response = await fetch(`${API_BASE}/admin/customers/?service_id=${serviceId}`);
            return API.handleResponse(response);
        },
        getQueueDetails: async (serviceId: number) => {
            const response = await fetch(`${API_BASE}/service_queues/${serviceId}/`);
            return API.handleResponse(response);
        },
        getAnalytics: async (serviceId: number, period: string = 'month') => {
            const response = await fetch(`${API_BASE}/admin-get-analytics/?service_id=${serviceId}&period=${period}`, {
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                method: 'GET'
            });
            return API.handleResponse(response);
        },
        updateQueueStatus: async (queueId: number, isActive: boolean) => {
            const response = await fetch(`${API_BASE}/update-queue-position/${queueId}/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ is_active: isActive }),
            });
            return API.handleResponse(response);
        },
        createCustomer: async (serviceId: number, data: any) => {
            const response = await fetch(`${API_BASE}/admin/customers/create/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    service_id: serviceId,
                    ...data
                }),
            });
            return API.handleResponse(response);
        },
        getNotificationSettings: async (serviceId: number) => {
            const response = await fetch(`${API_BASE}/admin/notification-settings/?service_id=${serviceId}`);
            return API.handleResponse(response);
        },
        updateNotificationSettings: async (data: any) => {
            const response = await fetch(`${API_BASE}/admin/notification-settings/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            return API.handleResponse(response);
        },
        getCompanyInfo: async (userId: number) => {
            const response = await fetch(`${API_BASE}/admin/company-info/${userId}/`);
            return API.handleResponse(response);
        },
        updateCompanyInfo: async (formData: FormData) => {
            const response = await fetch(`${API_BASE}/admin/update-company-info/`, {
                method: 'POST',
                body: formData,
            });
            return API.handleResponse(response);
        },
        changePassword: async (data: any) => {
            const response = await fetch(`${API_BASE}/admin/change-password/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            return API.handleResponse(response);
        },
    },

    // Service management
    services: {
        list: async () => {
            const response = await fetch(`${API_BASE}/list_services/`);
            return API.handleResponse(response);
        },
        listWithStatus: async () => {
            const response = await fetch(`${API_BASE}/list_services_with_status/`);
            return API.handleResponse(response);
        },
        getServiceDetails: async (serviceId: number) => {
            const response = await fetch(`${API_BASE}/service/${serviceId}/`);
            return API.handleResponse(response);
        },
        getAvailableTimes: async (serviceId: number, date: string) => {
            const response = await fetch(`${API_BASE}/available-times/${serviceId}/?date=${date}`);
            return API.handleResponse(response);
        },
    },

    // Queue management
    queues: {
        getActive: async (userId: number) => {
            const response = await fetch(`${API_BASE}/active-queue/${userId}/`);
            return API.handleResponse(response);
        },
        getDetails: async (queueId: number) => {
            const response = await fetch(`${API_BASE}/queue-detail/${queueId}/`);
            return API.handleResponse(response);
        },
        getUserQueues: async (userId: number) => {
            const response = await fetch(`${API_BASE}/user-queues/${userId}/`);
            return API.handleResponse(response);
        },
        createQueue: async (userId: number, serviceId: number) => {
            const response = await fetch(`${API_BASE}/create-queue/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: userId,
                    service_id: serviceId
                }),
            });
            return API.handleResponse(response);
        },
        joinQueue: async (queueId: number, customerId: number) => {
            const response = await fetch(`${API_BASE}/join-queue/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ queue_id: queueId, customer_id: customerId }),
            });
            return API.handleResponse(response);
        },
        leaveQueue: async (queueId: number) => {
            const response = await fetch(`${API_BASE}/leave-queue/${queueId}/`, { method: 'POST' });
            return API.handleResponse(response);
        },
        completeQueue: async (queueId: number) => {
            const response = await fetch(`${API_BASE}/queue-complete/${queueId}/`, { method: 'POST' });
            return API.handleResponse(response);
        },
        getQRCode: async (queueId: number) => {
            const response = await fetch(`${API_BASE}/get-qr-code/${queueId}/`);
            return API.handleResponse(response);
        },
        getUserAnalytics: async (userId: number, timeRange: string = 'month') => {
            const response = await fetch(`${API_BASE}/user-analytics/${userId}/?time_range=${timeRange}`);
            return API.handleResponse(response);
        },
        transferQueue: async (originalQueueId: number, targetServiceId: number, userId: number) => {
            const response = await fetch(`${API_BASE}/transfer-queue/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    original_queue_id: originalQueueId,
                    target_service_id: targetServiceId,
                    user_id: userId
                }),
            });
            return API.handleResponse(response);
        },
        validateQR: async (qrHash: string) => {
            const response = await fetch(`${API_BASE}/validate-qr/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ qrHash }),
            });
            return API.handleResponse(response);
        },
    },

    // Appointment management
    appointments: {
        getAll: async (userId: number) => {
            const response = await fetch(`${API_BASE}/appointments/${userId}/`);
            return API.handleResponse(response);
        },
        getAppointmentDetails: async (orderId: string) => {
            const response = await fetch(`${API_BASE}/appointment/${orderId}/`);
            return API.handleResponse(response);
        },
        addAppointment: async (orderID: string, userId: number) => {
            const response = await fetch(`${API_BASE}/appointment/add-existing/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ order_id: orderID, user_id: userId }),
            });
            return API.handleResponse(response);
        },
        deleteAppointment: async (orderId: string) => {
            const response = await fetch(`${API_BASE}/appointment/delete/${orderId}/`, { method: 'DELETE' });
            return API.handleResponse(response);
        },
        createAppointment: async (data: any) => {
            const response = await fetch(`${API_BASE}/create-appointment/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            return API.handleResponse(response);
        },
        cancelAppointment: async (orderId: string) => {
            const response = await fetch(`${API_BASE}/appointment/cancel/${orderId}/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            return API.handleResponse(response);
        },
        checkAndUpdateAppointments: async () => {
            const response = await fetch(`${API_BASE}/check-appointments/`);
            return API.handleResponse(response);
        },
        checkStatus: async (orderId: string) => {
            const response = await fetch(`${API_BASE}/appointment/check-status/${orderId}/`);
            return API.handleResponse(response);
        },
    },

    // Feedback management
    feedback: {
        getCategories: async () => {
            const response = await fetch(`${API_BASE}/feedback/categories/`);
            return API.handleResponse(response);
        },
        submitFeedback: async (feedbackData: any) => {
            const response = await fetch(`${API_BASE}/feedback/submit/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(feedbackData),
            });
            return API.handleResponse(response);
        },
        getUserFeedbackHistory: async (userId: number) => {
            const response = await fetch(`${API_BASE}/feedback/user/${userId}/`);
            return API.handleResponse(response);
        },
        getUserEligibleServices: async (userId: number) => {
            const response = await fetch(`${API_BASE}/feedback/eligible-services/${userId}/`, {
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            });
            return API.handleResponse(response);
        },
    },

    // Helper methods for common operations
    async handleResponse(response: Response) {
        if (!response.ok) {
            let errorMessage = `API Error: ${response.status} ${response.statusText}`;
            
            try {
                const contentType = response.headers.get('content-type');
                if (contentType && contentType.includes('application/json')) {
                    const errorData = await response.json();
                    errorMessage = errorData.error || errorData.detail || errorMessage;
                } else {
                    const textError = await response.text();
                    if (textError) errorMessage = textError;
                }
            } catch (parseError) {
                console.error("Error parsing API error response:", parseError);
            }
            
            const error = new Error(errorMessage);
            (error as any).status = response.status;
            (error as any).response = response;
            throw error;
        }
        
        try {
            return await response.json();
        } catch (jsonError) {
            // Handle empty responses or non-JSON responses
            return {};
        }
    },
};