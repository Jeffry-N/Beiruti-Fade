const IP = "192.168.0.106";
const BASE_URL = `http://${IP}:8080`;

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export const apiCall = async <T>(
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' = 'GET',
  body?: Record<string, any>
): Promise<ApiResponse<T>> => {
  try {
    const url = `${BASE_URL}${endpoint}`;
    const options: RequestInit = {
      method,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    };

    if (body && (method === 'POST' || method === 'PUT')) {
      const filtered = Object.entries(body).reduce((acc, [key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          acc[key] = String(value);
        }
        return acc;
      }, {} as Record<string, string>);

      options.body = new URLSearchParams(filtered).toString();
    }

    const response = await fetch(url, options);
    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data?.error || 'Unknown error' };
    }

    // Arrays come back directly from some endpoints (e.g., services)
    if (Array.isArray(data)) {
      return { success: true, data: data as T };
    }

    // Many endpoints wrap payloads as { success, data, error }
    if (data && typeof data === 'object' && 'success' in data) {
      const typed = data as { success?: boolean; data?: T; error?: string };
      if (typed.success === false) {
        return { success: false, error: typed.error || 'Unknown error' };
      }
      const inner = typed.data !== undefined ? typed.data : (data as T);
      return { success: true, data: inner };
    }

    return { success: true, data: data as T };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
};

export const login = (username: string, password: string, type: 'customer' | 'barber') =>
  apiCall('/login', 'POST', { username, password, type });

export const signup = (fullName: string, username: string, email: string, password: string, type: 'customer' | 'barber') =>
  apiCall('/signup', 'POST', { fullName, username, email, password, type });

export const getServices = () => apiCall('/services', 'GET');

export const getBarbers = () => apiCall('/barbers', 'GET');
export const getBarber = (id: number) => apiCall(`/barbers?id=${id}`, 'GET');

export const bookAppointment = (customerId: number, barberId: number, serviceId: number, appointmentDate: string, appointmentTime: string) =>
  apiCall('/appointment', 'POST', { customerId, barberId, serviceId, appointmentDate, appointmentTime });

export const getAppointments = (customerId: number) =>
  apiCall(`/appointment?customerId=${customerId}`, 'GET');

export const getBarberAppointments = (barberId: number) =>
  apiCall(`/appointment?barberId=${barberId}`, 'GET');

export const updateAppointmentDate = (appointmentId: number, appointmentDate: string, appointmentTime: string) =>
  apiCall('/appointment/reschedule', 'PUT', { appointmentId, appointmentDate, appointmentTime });

export const updateAppointmentStatus = (appointmentId: number, status: 'confirmed' | 'completed' | 'cancelled') =>
  apiCall('/appointment', 'PUT', { appointmentId, status });

export const rescheduleAppointmentServices = (
  appointmentIds: number[],
  customerId: number,
  barberId: number,
  serviceIds: number[],
  appointmentDate: string,
  appointmentTime: string
) =>
  apiCall('/appointment/reschedule-services', 'PUT', {
    appointmentIds: appointmentIds.join(','),
    customerId,
    barberId,
    serviceIds: serviceIds.join(','),
    appointmentDate,
    appointmentTime,
  });

export const updateProfile = (
  id: number,
  type: 'customer' | 'barber',
  updates: { fullName?: string; email?: string; password?: string; bio?: string }
) => apiCall('/profile', 'PUT', { id, type, ...updates });

export const getProfile = (id: number, type: 'customer' | 'barber') =>
  apiCall(`/profile?id=${id}&type=${type}`, 'GET');

export const getAvailableTimes = (barberId: number, date: string) =>
  apiCall(`/appointment/availability?barberId=${barberId}&date=${date}`, 'GET');

export const getProducts = () => apiCall('/products', 'GET');

export const orderProduct = (customerId: number, productId: number, quantity: number = 1) =>
  apiCall('/products/order', 'POST', { customerId, productId, quantity });

export const getProductOrders = (customerId: number) =>
  apiCall(`/products/orders?customerId=${customerId}`, 'GET');
