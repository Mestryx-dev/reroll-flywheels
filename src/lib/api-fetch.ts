import { apiUnavailableMessage } from './api-hints';

export class ApiResponseError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiResponseError';
    this.status = status;
  }
}

export async function readJsonResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get('content-type') ?? '';
  if (!contentType.includes('application/json')) {
    const preview = (await response.text()).slice(0, 80);
    throw new ApiResponseError(
      preview.startsWith('<!')
        ? apiUnavailableMessage({ htmlResponse: true })
        : `Réponse non-JSON (${response.status})`,
      response.status,
    );
  }

  const payload = (await response.json()) as T & { error?: string };
  if (!response.ok) {
    throw new ApiResponseError(payload.error ?? `Request failed (${response.status})`, response.status);
  }
  return payload;
}
