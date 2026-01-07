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
  memo: string | null;
  artists: Artist[];
}

export interface RecordingCreate {
  composition_id: number;
  year?: number | null;
  memo?: string | null;
  artist_ids: number[];
}

export interface RecordingUpdate {
  composition_id?: number;
  year?: number | null;
  memo?: string | null;
  artist_ids?: number[];
}

export interface AlbumImage {
  id: number;
  album_id: number;
  image_url: string;
  is_primary: number;
}

export interface AlbumCustomUrl {
  id: number;
  album_id: number;
  url_name: string;
  url: string;
  url_order: number;
}

export interface AlbumCustomUrlCreate {
  url_name: string;
  url: string;
  url_order?: number;
}

export interface Album {
  id: number;
  album_type: string;
  discogs_url: string | null;
  goclassic_url: string | null;
  memo: string | null;
  recordings: Recording[];
  images: AlbumImage[];
  custom_urls: AlbumCustomUrl[];
}

export interface AlbumCreate {
  album_type?: string;
  discogs_url?: string | null;
  goclassic_url?: string | null;
  memo?: string | null;
  recording_ids: number[];
  image_urls?: string[];
  primary_image_index?: number | null;
  custom_urls?: AlbumCustomUrlCreate[];
}

export interface AlbumUpdate {
  album_type?: string;
  discogs_url?: string | null;
  goclassic_url?: string | null;
  memo?: string | null;
  recording_ids?: number[];
  image_urls?: string[];
  primary_image_index?: number | null;
  custom_urls?: AlbumCustomUrlCreate[];
}

export interface AlbumsPageData {
  albums: Album[];
  recordings: Recording[];
  composers: Composer[];
  compositions: Composition[];
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

  async uploadImage(file: File, folder?: string): Promise<{ image_url: string }> {
    // Import Cloudinary upload function dynamically to avoid build issues
    const { uploadToCloudinary } = await import('./cloudinary');

    try {
      // Upload to Cloudinary with folder organization
      // Default folder: classical-albums/composers
      // Can be overridden (e.g., classical-albums/albums)
      const uploadFolder = folder || 'classical-albums/composers';
      const result = await uploadToCloudinary(file, uploadFolder);

      return {
        image_url: result.secure_url
      };
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to upload image');
    }
  }

  async uploadMultipleImages(files: File[], folder?: string): Promise<string[]> {
    // Import Cloudinary upload function dynamically to avoid build issues
    const { uploadMultipleToCloudinary } = await import('./cloudinary');

    try {
      // Upload multiple images to Cloudinary
      const uploadFolder = folder || 'classical-albums/albums';
      const urls = await uploadMultipleToCloudinary(files, uploadFolder);
      return urls;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to upload images');
    }
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
  async getAlbumsPageData(skip = 0, limit = 1000): Promise<AlbumsPageData> {
    const params = new URLSearchParams({
      skip: skip.toString(),
      limit: limit.toString(),
    });

    return this.request<AlbumsPageData>(`/api/albums/page-data?${params.toString()}`);
  }

  async getAlbums(skip = 0, limit = 100, albumType?: string): Promise<Album[]> {
    const params = new URLSearchParams({
      skip: skip.toString(),
      limit: limit.toString(),
    });

    if (albumType) {
      params.append('album_type', albumType);
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
