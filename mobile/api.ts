const IP = "192.168.0.103";
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
      options.body = new URLSearchParams(
        Object.entries(body).reduce((acc, [key, value]) => {
          acc[key] = String(value);
          return acc;
        }, {} as Record<string, string>)
      ).toString();
    }

    const response = await fetch(url, options);
    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.error || 'Unknown error' };
    }

    return { success: true, data };
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
