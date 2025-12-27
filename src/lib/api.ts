const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface Composer {
  id: number;
  full_name: string;
  name: string;
  birth_year: number | null;
  death_year: number | null;
  nationality: string | null;
  image_url: string | null;
  composition_count: number;
}

export interface ComposerCreate {
  full_name: string;
  name: string;
  birth_year?: number | null;
  death_year?: number | null;
  nationality?: string | null;
  image_url?: string | null;
}

export interface ComposerUpdate {
  full_name?: string;
  name?: string | null;
  birth_year?: number | null;
  death_year?: number | null;
  nationality?: string | null;
  image_url?: string | null;
}

export interface Composition {
  id: number;
  composer_id: number;
  catalog_number: string | null;
  sort_order: number | null;
  title: string;
  recording_count: number;
}

export interface CompositionCreate {
  composer_id: number;
  catalog_number?: string | null;
  title: string;
}

export interface CompositionUpdate {
  composer_id?: number;
  catalog_number?: string | null;
  title?: string;
}

export interface Artist {
  id: number;
  name: string;
  birth_year: number | null;
  death_year: number | null;
  nationality: string | null;
  instrument: string | null;
  recording_count: number;
}

export interface ArtistCreate {
  name: string;
  birth_year?: number | null;
  death_year?: number | null;
  nationality?: string | null;
  instrument?: string | null;
}

export interface ArtistUpdate {
  name?: string;
  birth_year?: number | null;
  death_year?: number | null;
  nationality?: string | null;
  instrument?: string | null;
}

export interface Recording {
  id: number;
  composition_id: number;
  year: number | null;
  artists: Artist[];
}

export interface RecordingCreate {
  composition_id: number;
  year?: number | null;
  artist_ids: number[];
}

export interface RecordingUpdate {
  composition_id?: number;
  year?: number | null;
  artist_ids?: number[];
}

export interface AlbumImage {
  id: number;
  album_id: number;
  image_url: string;
  is_primary: number;
}

export interface Album {
  id: number;
  title: string;
  album_type: string;
  recordings: Recording[];
  images: AlbumImage[];
}

export interface AlbumCreate {
  title: string;
  album_type?: string;
  recording_ids: number[];
  image_urls?: string[];
  primary_image_index?: number | null;
}

export interface AlbumUpdate {
  title?: string;
  album_type?: string;
  recording_ids?: number[];
  image_urls?: string[];
  primary_image_index?: number | null;
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
  async getComposers(skip = 0, limit = 100, search?: string): Promise<Composer[]> {
    const params = new URLSearchParams({
      skip: skip.toString(),
      limit: limit.toString(),
    });

    if (search) {
      params.append('search', search);
    }

    return this.request<Composer[]>(`/api/composers/?${params.toString()}`);
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

  async uploadImage(file: File): Promise<{ image_url: string }> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${this.baseURL}/api/composers/upload-image`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Upload failed' }));
      throw new Error(error.detail || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // Compositions API
  async getCompositions(skip = 0, limit = 100, composerId?: number, search?: string): Promise<Composition[]> {
    const params = new URLSearchParams({
      skip: skip.toString(),
      limit: limit.toString(),
    });

    if (composerId) {
      params.append('composer_id', composerId.toString());
    }

    if (search) {
      params.append('search', search);
    }

    return this.request<Composition[]>(`/api/compositions/?${params.toString()}`);
  }

  async getComposition(id: number): Promise<Composition> {
    return this.request<Composition>(`/api/compositions/${id}`);
  }

  async createComposition(data: CompositionCreate): Promise<Composition> {
    return this.request<Composition>('/api/compositions/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateComposition(id: number, data: CompositionUpdate): Promise<Composition> {
    return this.request<Composition>(`/api/compositions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteComposition(id: number): Promise<void> {
    return this.request<void>(`/api/compositions/${id}`, {
      method: 'DELETE',
    });
  }

  // Artists API
  async getArtists(skip = 0, limit = 100, search?: string): Promise<Artist[]> {
    const params = new URLSearchParams({
      skip: skip.toString(),
      limit: limit.toString(),
    });

    if (search) {
      params.append('search', search);
    }

    return this.request<Artist[]>(`/api/artists/?${params.toString()}`);
  }

  async getArtist(id: number): Promise<Artist> {
    return this.request<Artist>(`/api/artists/${id}`);
  }

  async createArtist(data: ArtistCreate): Promise<Artist> {
    return this.request<Artist>('/api/artists/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateArtist(id: number, data: ArtistUpdate): Promise<Artist> {
    return this.request<Artist>(`/api/artists/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteArtist(id: number): Promise<void> {
    return this.request<void>(`/api/artists/${id}`, {
      method: 'DELETE',
    });
  }

  // Recordings API
  async getRecordings(skip = 0, limit = 100, compositionId?: number, composerId?: number, artistId?: number): Promise<Recording[]> {
    const params = new URLSearchParams({
      skip: skip.toString(),
      limit: limit.toString(),
    });

    if (compositionId) {
      params.append('composition_id', compositionId.toString());
    }

    if (composerId) {
      params.append('composer_id', composerId.toString());
    }

    if (artistId) {
      params.append('artist_id', artistId.toString());
    }

    return this.request<Recording[]>(`/api/recordings/?${params.toString()}`);
  }

  async getRecording(id: number): Promise<Recording> {
    return this.request<Recording>(`/api/recordings/${id}`);
  }

  async createRecording(data: RecordingCreate): Promise<Recording> {
    return this.request<Recording>('/api/recordings/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateRecording(id: number, data: RecordingUpdate): Promise<Recording> {
    return this.request<Recording>(`/api/recordings/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteRecording(id: number): Promise<void> {
    return this.request<void>(`/api/recordings/${id}`, {
      method: 'DELETE',
    });
  }

  // Albums API
  async getAlbums(skip = 0, limit = 100, albumType?: string, search?: string): Promise<Album[]> {
    const params = new URLSearchParams({
      skip: skip.toString(),
      limit: limit.toString(),
    });

    if (albumType) {
      params.append('album_type', albumType);
    }

    if (search) {
      params.append('search', search);
    }

    return this.request<Album[]>(`/api/albums/?${params.toString()}`);
  }

  async getAlbum(id: number): Promise<Album> {
    return this.request<Album>(`/api/albums/${id}`);
  }

  async createAlbum(data: AlbumCreate): Promise<Album> {
    return this.request<Album>('/api/albums/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateAlbum(id: number, data: AlbumUpdate): Promise<Album> {
    return this.request<Album>(`/api/albums/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteAlbum(id: number): Promise<void> {
    return this.request<void>(`/api/albums/${id}`, {
      method: 'DELETE',
    });
  }

  async uploadAlbumImage(file: File): Promise<{ image_url: string }> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${this.baseURL}/api/albums/upload-image`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Upload failed' }));
      throw new Error(error.detail || `HTTP ${response.status}`);
    }

    return response.json();
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
