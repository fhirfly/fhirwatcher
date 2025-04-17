// src/utils/fhir-client.ts
export interface SearchParam {
    name: string;
    value: string;
  }
  
  const FHIR_SERVER = import.meta.env.VITE_FHIR_SERVER_URL;
  
  const getAuthHeaders = (): HeadersInit => {
    const token = localStorage.getItem('access_token');
    return {
      'Content-Type': 'application/fhir+json',
      'Authorization': `Bearer ${token || ''}`,
    };
  };
  
  /**
   * Performs a FHIR search operation
   * @param resourceType e.g., "Patient"
   * @param parameters array of { name: string, value: string }
   * @returns FHIR Bundle
   */
  export async function searchResource<T = any>(
    resourceType: string,
    parameters: SearchParam[]
  ): Promise<T> {
    const queryString = parameters
      .map(({ name, value }) => `${encodeURIComponent(name)}=${encodeURIComponent(value)}`)
      .join('&');
  
    const url = `${FHIR_SERVER}/${resourceType}?${queryString}`;
  
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
  
    if (!response.ok) {
      throw new Error(`FHIR search failed: ${response.status} ${response.statusText}`);
    }
  
    return response.json();
  }
  
  /**
   * Reads a single FHIR resource by ID
   * @param resourceType e.g., "Patient"
   * @param id e.g., "123"
   * @returns FHIR Resource
   */
  export async function readResource<T = any>(
    resourceType: string,
    id: string
  ): Promise<T> {
    const url = `${FHIR_SERVER}/${resourceType}/${id}`;
  
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
  
    if (!response.ok) {
      throw new Error(`FHIR read failed: ${response.status} ${response.statusText}`);
    }
  
    return response.json();
  }
  