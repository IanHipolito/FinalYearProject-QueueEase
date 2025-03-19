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
        adminLogin: (email: string, password: string) =>
            fetch(`${API_BASE}/admin-login/`, {
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
            fetch(`${API_BASE}/admin/analytics/?service_id=${serviceId}&period=${period}`),
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
        joinQueue: (queueId: number, customerId: number) =>
            fetch(`${API_BASE}/join-queue/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ queue_id: queueId, customer_id: customerId }),
            }),
        leaveQueue: (queueId: number) =>
            fetch(`${API_BASE}/leave-queue/${queueId}/`, { method: 'POST' }),
    },

    // Appointment management
    appointments: {
        getCustomerAppointments: (customerId: number) =>
            fetch(`${API_BASE}/customer-appointments/${customerId}/`),
        createAppointment: (data: any) =>
            fetch(`${API_BASE}/appointment/create/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            }),
        cancelAppointment: (appointmentId: number) =>
            fetch(`${API_BASE}/appointment/${appointmentId}/cancel/`, { method: 'POST' }),
    },

    // Helper methods for common operations
    async handleResponse(response: Response) {
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(
                errorData.error || errorData.detail || `API Error: ${response.status} ${response.statusText}`
            );
        }
        return await response.json();
    },
};