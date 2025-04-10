const API_BASE =
    window.location.hostname === "localhost"
        ? "http://127.0.0.1:8000/api"
        : "https://c21436494.pythonanywhere.com/api";

// Function to get CSRF token from cookies
const getCSRFToken = () => {
    const name = 'csrftoken=';
    const decodedCookie = decodeURIComponent(document.cookie);
    const cookieArray = decodedCookie.split(';');
    
    for (let i = 0; i < cookieArray.length; i++) {
        let cookie = cookieArray[i].trim();
        if (cookie.indexOf(name) === 0) {
            return cookie.substring(name.length, cookie.length);
        }
    }
    return '';
};

// Common headers function
const getCommonHeaders = () => {
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    };
    
    const csrfToken = getCSRFToken();
    if (csrfToken) {
        headers['X-CSRFToken'] = csrfToken;
    }
    
    return headers;
};

export const API = {
    // Authentication endpoints
    auth: {
        login: async (email: string, password: string) => {
            const response = await fetch(`${API_BASE}/login/`, {
                method: 'POST',
                headers: getCommonHeaders(),
                body: JSON.stringify({ email, password }),
                credentials: 'include', 
            });
            return API.handleResponse(response);
        },
        signup: async (data: any) => {
            const response = await fetch(`${API_BASE}/signup/`, {
                method: 'POST',
                headers: getCommonHeaders(),
                body: JSON.stringify(data),
                credentials: 'include', 
            });
            return API.handleResponse(response);
        },
        adminLogin: async (email: string, password: string) => {
            const response = await fetch(`${API_BASE}/login/`, {
                method: 'POST',
                headers: getCommonHeaders(),
                body: JSON.stringify({ email, password }),
                credentials: 'include', 
            });
            return API.handleResponse(response);
        },
        adminSignup: async (data: any) => {
            const response = await fetch(`${API_BASE}/admin-signup/`, {
                method: 'POST',
                headers: getCommonHeaders(),
                body: JSON.stringify(data),
                credentials: 'include', 
            });
            return API.handleResponse(response);
        },
        saveFcmToken: async (userId: number, fcmToken: string) => {
            try {
                const response = await fetch(`${API_BASE}/save-fcm-token/`, {
                    method: 'POST',
                    headers: getCommonHeaders(),
                    body: JSON.stringify({
                        user_id: userId,
                        fcm_token: fcmToken
                    }),
                    credentials: 'include',
                });
                
                console.log('FCM token save response status:', response.status);
                
                if (!response.ok) {
                    console.warn('Save FCM token returned non-OK status:', response.status);
                }
                
                try {
                    return await response.json();
                } catch (jsonError) {
                    console.warn('Could not parse JSON from FCM token save response');
                    return { success: response.ok };
                }
            } catch (error) {
                console.error('Network error when saving FCM token:', error);
                return { 
                    success: false, 
                    error: error instanceof Error ? error.message : 'Network error' 
                };
            }
        },
    },

    // Admin dashboard endpoints
    admin: {
        getDashboardData: async (serviceId: number, timeRangeParam: string = 'daily') => {
            const response = await fetch(`${API_BASE}/admin/dashboard-data/?service_id=${serviceId}&time_range=${timeRangeParam}`, {
                headers: getCommonHeaders(),
                credentials: 'include', 
            });
            return API.handleResponse(response);
        },
        getCustomers: async (serviceId: number) => {
            const response = await fetch(`${API_BASE}/admin/customers/?service_id=${serviceId}`, {
                headers: getCommonHeaders(),
                credentials: 'include', 
            });
            return API.handleResponse(response);
        },
        getQueueDetails: async (serviceId: number) => {
            const response = await fetch(`${API_BASE}/service_queues/${serviceId}/`, {
                headers: getCommonHeaders(),
                credentials: 'include', 
            });
            return API.handleResponse(response);
        },
        getAnalytics: async (serviceId: number, period: string = 'month') => {
            const response = await fetch(`${API_BASE}/admin-get-analytics/?service_id=${serviceId}&period=${period}`, {
                headers: getCommonHeaders(),
                method: 'GET',
                credentials: 'include', 
            });
            return API.handleResponse(response);
        },
        updateQueueStatus: async (queueId: number, isActive: boolean) => {
            const response = await fetch(`${API_BASE}/update-queue-position/${queueId}/`, {
                method: 'POST',
                headers: getCommonHeaders(),
                body: JSON.stringify({ is_active: isActive }),
                credentials: 'include', 
            });
            return API.handleResponse(response);
        },
        createCustomer: async (serviceId: number, data: any) => {
            const response = await fetch(`${API_BASE}/admin/customers/create/`, {
                method: 'POST',
                headers: getCommonHeaders(),
                body: JSON.stringify({
                    service_id: serviceId,
                    ...data
                }),
                credentials: 'include', 
            });
            return API.handleResponse(response);
        },
        getNotificationSettings: async (serviceId: number) => {
            const response = await fetch(`${API_BASE}/admin/notification-settings/?service_id=${serviceId}`, {
                headers: getCommonHeaders(),
                credentials: 'include', 
            });
            return API.handleResponse(response);
        },
        updateNotificationSettings: async (data: any) => {
            const response = await fetch(`${API_BASE}/admin/notification-settings/`, {
                method: 'POST',
                headers: getCommonHeaders(),
                body: JSON.stringify(data),
                credentials: 'include', 
            });
            return API.handleResponse(response);
        },
        getCompanyInfo: async (userId: number) => {
            const response = await fetch(`${API_BASE}/admin/company-info/${userId}/`, {
                headers: getCommonHeaders(),
                credentials: 'include', 
            });
            return API.handleResponse(response);
        },
        updateCompanyInfo: async (formData: FormData) => {
            const response = await fetch(`${API_BASE}/admin/update-company-info/`, {
                method: 'POST',
                body: formData,
                credentials: 'include', 
            });
            return API.handleResponse(response);
        },
        changePassword: async (data: any) => {
            const response = await fetch(`${API_BASE}/admin/change-password/`, {
                method: 'POST',
                headers: getCommonHeaders(),
                body: JSON.stringify(data),
                credentials: 'include', 
            });
            return API.handleResponse(response);
        },
    },

    // Service management
    services: {
        list: async () => {
            const response = await fetch(`${API_BASE}/list_services/`, {
                headers: getCommonHeaders(),
                credentials: 'include', 
            });
            return API.handleResponse(response);
        },
        listWithStatus: async () => {
            const response = await fetch(`${API_BASE}/list_services_with_status/`, {
                headers: getCommonHeaders(),
                credentials: 'include', 
            });
            return API.handleResponse(response);
        },
        getServiceDetails: async (serviceId: number) => {
            const response = await fetch(`${API_BASE}/service/${serviceId}/`, {
                headers: getCommonHeaders(),
                credentials: 'include', 
            });
            return API.handleResponse(response);
        },
        getAvailableTimes: async (serviceId: number, date: string) => {
            const response = await fetch(`${API_BASE}/available-times/${serviceId}/?date=${date}`, {
                headers: getCommonHeaders(),
                credentials: 'include', 
            });
            return API.handleResponse(response);
        },
    },

    // Queue management
    queues: {
        getActive: async (userId: number) => {
            const response = await fetch(`${API_BASE}/active-queue/${userId}/`, {
                headers: getCommonHeaders(),
                credentials: 'include', 
            });
            return API.handleResponse(response);
        },
        getDetails: async (queueId: number) => {
            const response = await fetch(`${API_BASE}/queue-detail/${queueId}/`, {
                headers: getCommonHeaders(),
                credentials: 'include', 
            });
            return API.handleResponse(response);
        },
        getUserQueues: async (userId: number) => {
            const response = await fetch(`${API_BASE}/user-queues/${userId}/`, {
                headers: getCommonHeaders(),
                credentials: 'include', 
            });
            return API.handleResponse(response);
        },
        createQueue: async (userId: number, serviceId: number) => {
            const response = await fetch(`${API_BASE}/create-queue/`, {
                method: 'POST',
                headers: getCommonHeaders(),
                body: JSON.stringify({
                    user_id: userId,
                    service_id: serviceId
                }),
                credentials: 'include', 
            });
            return API.handleResponse(response);
        },
        joinQueue: async (queueId: number, customerId: number) => {
            const response = await fetch(`${API_BASE}/join-queue/`, {
                method: 'POST',
                headers: getCommonHeaders(),
                body: JSON.stringify({ queue_id: queueId, customer_id: customerId }),
                credentials: 'include', 
            });
            return API.handleResponse(response);
        },
        leaveQueue: async (queueId: number) => {
            const response = await fetch(`${API_BASE}/leave-queue/${queueId}/`, {
                method: 'POST',
                headers: getCommonHeaders(),
                credentials: 'include', 
            });
            return API.handleResponse(response);
        },
        completeQueue: async (queueId: number) => {
            const response = await fetch(`${API_BASE}/queue-complete/${queueId}/`, {
                method: 'POST',
                headers: getCommonHeaders(),
                credentials: 'include', 
            });
            return API.handleResponse(response);
        },
        getQRCode: async (queueId: number) => {
            const response = await fetch(`${API_BASE}/get-qr-code/${queueId}/`, {
                headers: getCommonHeaders(),
                credentials: 'include', 
            });
            return API.handleResponse(response);
        },
        getUserAnalytics: async (userId: number, timeRange: string = 'month') => {
            const response = await fetch(`${API_BASE}/user-analytics/${userId}/?time_range=${timeRange}`, {
                headers: getCommonHeaders(),
                credentials: 'include', 
            });
            return API.handleResponse(response);
        },
        transferQueue: async (originalQueueId: number, targetServiceId: number, userId: number) => {
            const response = await fetch(`${API_BASE}/transfer-queue/`, {
                method: 'POST',
                headers: getCommonHeaders(),
                body: JSON.stringify({
                    original_queue_id: originalQueueId,
                    target_service_id: targetServiceId,
                    user_id: userId
                }),
                credentials: 'include', 
            });
            return API.handleResponse(response);
        },
        validateQR: async (qrHash: string) => {
            const response = await fetch(`${API_BASE}/validate-qr/`, {
                method: 'POST',
                headers: getCommonHeaders(),
                body: JSON.stringify({ qrHash }),
                credentials: 'include', 
            });
            return API.handleResponse(response);
        },
    },

    // Appointment management
    appointments: {
        getAll: async (userId: number) => {
            const response = await fetch(`${API_BASE}/appointments/${userId}/`, {
                headers: getCommonHeaders(),
                credentials: 'include', 
            });
            return API.handleResponse(response);
        },
        getAppointmentDetails: async (orderId: string) => {
            const response = await fetch(`${API_BASE}/appointment/${orderId}/`, {
                headers: getCommonHeaders(),
                credentials: 'include', 
            });
            return API.handleResponse(response);
        },
        addAppointment: async (orderID: string, userId: number) => {
            const response = await fetch(`${API_BASE}/appointment/add-existing/`, {
                method: 'POST',
                headers: getCommonHeaders(),
                body: JSON.stringify({ order_id: orderID, user_id: userId }),
                credentials: 'include', 
            });
            return API.handleResponse(response);
        },
        deleteAppointment: async (orderId: string) => {
            const response = await fetch(`${API_BASE}/appointment/delete/${orderId}/`, {
                method: 'DELETE',
                headers: getCommonHeaders(),
                credentials: 'include', 
            });
            return API.handleResponse(response);
        },
        createAppointment: async (data: any) => {
            const response = await fetch(`${API_BASE}/create-appointment/`, {
                method: 'POST',
                headers: getCommonHeaders(),
                body: JSON.stringify(data),
                credentials: 'include', 
            });
            return API.handleResponse(response);
        },
        cancelAppointment: async (orderId: string) => {
            const response = await fetch(`${API_BASE}/appointment/cancel/${orderId}/`, {
                method: 'POST',
                headers: getCommonHeaders(),
                credentials: 'include', 
            });
            return API.handleResponse(response);
        },
        checkAndUpdateAppointments: async () => {
            const response = await fetch(`${API_BASE}/check-appointments/`, {
                headers: getCommonHeaders(),
                credentials: 'include', 
            });
            return API.handleResponse(response);
        },
        checkStatus: async (orderId: string) => {
            const response = await fetch(`${API_BASE}/appointment/check-status/${orderId}/`, {
                headers: getCommonHeaders(),
                credentials: 'include', 
            });
            return API.handleResponse(response);
        },
    },

    // Feedback management
    feedback: {
        getCategories: async () => {
            const response = await fetch(`${API_BASE}/feedback/categories/`, {
                headers: getCommonHeaders(),
                credentials: 'include', 
            });
            return API.handleResponse(response);
        },
        submitFeedback: async (feedbackData: any) => {
            const response = await fetch(`${API_BASE}/feedback/submit/`, {
                method: 'POST',
                headers: getCommonHeaders(),
                body: JSON.stringify(feedbackData),
                credentials: 'include', 
            });
            return API.handleResponse(response);
        },
        getUserFeedbackHistory: async (userId: number) => {
            const response = await fetch(`${API_BASE}/feedback/user/${userId}/`, {
                headers: getCommonHeaders(),
                credentials: 'include', 
            });
            return API.handleResponse(response);
        },
        getUserEligibleServices: async (userId: number) => {
            const response = await fetch(`${API_BASE}/feedback/eligible-services/${userId}/`, {
                headers: getCommonHeaders(),
                credentials: 'include', 
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
                errorMessage = "Failed to parse error response";
            }
            
            const error = new Error(errorMessage);
            (error as any).status = response.status;
            (error as any).response = response;
            throw error;
        }
        
        try {
            return await response.json();
        } catch (jsonError) {
            return {};
        }
    },
};