const API_BASE =
    window.location.hostname === "localhost"
        ? "http://127.0.0.1:8000/api"
        : "https://m2xb3cv3-8000.eun1.devtunnels.ms/api";

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
    },

    // Admin dashboard endpoints
    admin: {
        getDashboardData: (serviceId: number, timeRangeParam: string = 'daily') =>
            fetch(`${API_BASE}/admin/dashboard-data/?service_id=${serviceId}&time_range=${timeRangeParam}`),
        getCustomers: (serviceId: number) =>
            fetch(`${API_BASE}/admin/customers/?service_id=${serviceId}`),
        getQueueDetails: (serviceId: number) =>
            fetch(`${API_BASE}/admin/queues/?service_id=${serviceId}`),
        getAppointments: (serviceId: number) =>
            fetch(`${API_BASE}/admin/appointments/?service_id=${serviceId}`),
        getAnalytics: (serviceId: number, period: string = 'month') =>
            fetch(`${API_BASE}/admin-get-analytics/?service_id=${serviceId}&period=${period}`, {
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                method: 'GET'
            }),
        createQueue: (serviceId: number, queueData: any) =>
            fetch(`${API_BASE}/admin/queues/create/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    service_id: serviceId,
                    ...queueData
                }),
            }),
        updateQueue: (queueId: number, queueData: any) =>
            fetch(`${API_BASE}/admin/queues/${queueId}/update/`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(queueData),
            }),
        updateQueueStatus: (queueId: number, status: string) =>
            fetch(`${API_BASE}/admin/queues/${queueId}/update-status/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status }),
            }),
        deleteQueue: (queueId: number) =>
            fetch(`${API_BASE}/admin/queues/${queueId}/delete/`, {
                method: 'DELETE',
            }),
        getQueueStatus: (queueId: number) =>
            fetch(`${API_BASE}/admin/queues/${queueId}/status/`),
        getAppointmentDetails: (appointmentId: string) =>
            fetch(`${API_BASE}/admin/appointment/${appointmentId}/`),
        getCustomerDetails: (customerId: number) =>
            fetch(`${API_BASE}/admin/customer/${customerId}/`),
        createCustomer: (serviceId: number, data: any) =>
            fetch(`${API_BASE}/admin/customers/create/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    service_id: serviceId,
                    ...data
                }),
            }),
    },

    // Service management
    services: {
        list: () => fetch(`${API_BASE}/list_services/`),
        listWithStatus: () => fetch(`${API_BASE}/list_services_with_status/`),
        getAdminServices: (userId: number) => fetch(`${API_BASE}/admin_services/${userId}/`),
        getServiceDetails: (serviceId: number) => fetch(`${API_BASE}/service/${serviceId}/`),
        getAvailableTimes: (serviceId: number, date: string) => 
            fetch(`${API_BASE}/available-times/${serviceId}/?date=${date}`),
        updateService: (serviceId: number, data: any) =>
            fetch(`${API_BASE}/service/${serviceId}/`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            }),
        createService: (data: any) =>
            fetch(`${API_BASE}/service/create/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            }),
    },

    // Queue management
    queues: {
        getActive: (userId: number) => fetch(`${API_BASE}/active-queue/${userId}/`),
        getDetails: (queueId: number) => fetch(`${API_BASE}/queue-detail/${queueId}/`),
        getHistory: (userId: number) => fetch(`${API_BASE}/queue-history/${userId}/`),
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
    },

    // Appointment management
    appointments: {
        getAll: (userId: number) => fetch(`${API_BASE}/appointments/${userId}/`),
        getDetails: (orderId: string) => fetch(`${API_BASE}/appointment/${orderId}/`),
        add: (orderID: string, userId: number) =>
            fetch(`${API_BASE}/appointment/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ order_id: orderID, user_id: userId }),
            }),
        delete: (orderId: string) =>
            fetch(`${API_BASE}/appointment/delete/${orderId}/`, { method: 'DELETE' }),
        createAppointment: (data: any) =>
            fetch(`${API_BASE}/create-appointment/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            }),
        cancelAppointment: (appointmentId: number) =>
            fetch(`${API_BASE}/appointment/${appointmentId}/cancel/`, { method: 'POST' }),
        generateDemo: (userId: number) =>
            fetch(`${API_BASE}/generate-demo/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: userId }),
            }),
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
        
        checkFeedbackEligibility: (userId: number, serviceId: number, orderId: number) =>
            fetch(`${API_BASE}/feedback/check-eligibility/?user_id=${userId}&service_id=${serviceId}&order_id=${orderId}`),
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
                throw new Error(`API Error: ${response.status} ${response.statusText}`);
            }
        }
        return await response.json();
    },
};