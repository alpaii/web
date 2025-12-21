const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface Composer {
  id: number;
  name: string;
  short_name: string | null;
  birth_year: number | null;
  death_year: number | null;
  nationality: string | null;
}

export interface ComposerCreate {
  name: string;
  short_name?: string | null;
  birth_year?: number | null;
  death_year?: number | null;
  nationality?: string | null;
}

export interface ComposerUpdate {
  name?: string;
  short_name?: string | null;
  birth_year?: number | null;
  death_year?: number | null;
  nationality?: string | null;
}

class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
      throw new Error(error.detail || `HTTP ${response.status}`);
    }

    if (response.status === 204) {
      return null as T;
    }

    return response.json();
  }

  // Composers API
  async getComposers(skip = 0, limit = 100): Promise<Composer[]> {
    return this.request<Composer[]>(`/api/composers/?skip=${skip}&limit=${limit}`);
  }

  async getComposer(id: number): Promise<Composer> {
    return this.request<Composer>(`/api/composers/${id}`);
  }

  async createComposer(data: ComposerCreate): Promise<Composer> {
    return this.request<Composer>('/api/composers/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateComposer(id: number, data: ComposerUpdate): Promise<Composer> {
    return this.request<Composer>(`/api/composers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteComposer(id: number): Promise<void> {
    return this.request<void>(`/api/composers/${id}`, {
      method: 'DELETE',
    });
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
