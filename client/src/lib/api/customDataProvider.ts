import jsonServerProvider from 'ra-data-json-server';
import type {
  DataProvider,
  RaRecord,
  GetListParams,
  GetListResult,
  GetOneParams,
  GetOneResult,
  GetManyParams,
  GetManyResult,
  GetManyReferenceParams,
  GetManyReferenceResult,
  UpdateParams,
  UpdateResult,
  UpdateManyParams,
  UpdateManyResult,
  CreateParams,
  CreateResult,
  DeleteParams,
  DeleteResult,
  DeleteManyParams,
  DeleteManyResult,
  Identifier,
} from 'react-admin';

import { API_URL } from './types';

const httpClient = async (url: string, options: RequestInit = {}) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
  const existing = options.headers || {};
  const outHeaders: Record<string, string> = typeof existing === 'object' && !Array.isArray(existing)
    ? { ...(existing as Record<string, string>) }
    : {};
  if (token) outHeaders['Authorization'] = `Bearer ${token}`;
  options.headers = outHeaders;

  const response = await fetch(url, options);
  const text = await response.text();
  const responseHeaders = response.headers;
  return {
    status: response.status,
    headers: responseHeaders,
    body: text,
    json: async () => {
      try {
        return JSON.parse(text);
      } catch {
        return null;
      }
    },
  };
};

const baseDataProvider = jsonServerProvider(API_URL, httpClient);

const convertKeysToSnakeCase = (obj: unknown): unknown => {
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(i => convertKeysToSnakeCase(i));
  const o = obj as Record<string, unknown>;
  return Object.keys(o).reduce((acc: Record<string, unknown>, key) => {
    const snake = key.replace(/[A-Z]/g, c => `_${c.toLowerCase()}`);
    acc[snake] = convertKeysToSnakeCase(o[key]);
    return acc;
  }, {});
};

const convertKeysToCamelCase = (obj: unknown): unknown => {
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return (obj as unknown[]).map(i => convertKeysToCamelCase(i));
  const o = obj as Record<string, unknown>;
  return Object.keys(o).reduce((acc: Record<string, unknown>, key) => {
    const camel = key.replace(/_([a-z])/g, (_m, c) => c.toUpperCase());
    acc[camel] = convertKeysToCamelCase(o[key]);
    return acc;
  }, {});
};

const unwrapData = (input: unknown): unknown => {
  if (input && typeof input === 'object') {
    const o = input as Record<string, unknown>;
    if ('data' in o) return o.data as unknown;
  }
  return input;
};

// Ensure a returned record has an `id` property. Try common fallback keys.
const ensureRecordHasId = (rec: unknown, resource?: string): Record<string, unknown> => {
  if (!rec || typeof rec !== 'object') return rec as Record<string, unknown>;
  const obj = rec as Record<string, unknown>;
  if ('id' in obj && obj.id !== undefined) return obj;

  // Look for common id-like keys (camelCase, snake_case, and variants)
  const keys = Object.keys(obj);
  const candidate = keys.find(k => {
    const lower = k.toLowerCase();
    if (lower === 'id' || lower === '_id' || lower === 'uuid') return true;
    if (lower.endsWith('_id') || lower.endsWith('id')) return true;
    return false;
  });
  if (candidate) {
    obj.id = obj[candidate];
    return obj;
  }

  // Try resource-based fallback (singularized)
  if (resource) {
    const singular = resource.replace(/s$/i, '');
    const camel = `${singular}Id`;
    const snake = `${singular}_id`;
    if (camel in obj) { obj.id = obj[camel]; return obj; }
    if (snake in obj) { obj.id = obj[snake]; return obj; }
  }

  return obj;
};

const customDataProvider: DataProvider = {
  ...baseDataProvider,

  getList: async <R extends RaRecord = RaRecord>(resource: string, params: GetListParams): Promise<GetListResult<R>> => {
    // Build query string from react-admin params
    const page = params.pagination?.page ?? 1;
    const perPage = params.pagination?.perPage ?? 20;
    const sortField = params.sort?.field;
    const sortOrder = params.sort?.order ?? 'ASC';

    const qs = new URLSearchParams();
    qs.set('page', String(page));
    qs.set('limit', String(perPage));
    if (sortField) {
      // Server expects `sortBy` and `sortOrder` (GuideQueryDto)
      qs.set('sortBy', String(sortField));
      qs.set('sortOrder', String(sortOrder));
    }

    if (params.filter && typeof params.filter === 'object') {
      Object.entries(params.filter).forEach(([k, v]) => {
        if (v === undefined || v === null) return;
        // react-admin uses `q` for full-text search; backend expects `search`
        const mappedKey = k === 'q' ? 'search' : k;
        if (Array.isArray(v)) v.forEach(item => qs.append(mappedKey, String(item)));
        else qs.set(mappedKey, String(v));
      });
    }

    const url = `${API_URL}/${resource}?${qs.toString()}`;
    // Helper to parse a successful fetch response into react-admin shape
    const parseResp = async (resp: Response): Promise<GetListResult<R> | null> => {
      let body: unknown = null;
      try { body = await resp.json(); } catch { body = null; }

      if (body && typeof body === 'object' && 'data' in (body as Record<string, unknown>) && Array.isArray((body as Record<string, unknown>).data)) {
        const obj = body as Record<string, unknown>;
        const arr = ((obj.data) as unknown[]).map(d => convertKeysToCamelCase(d) as unknown as R);
        const bodyTotal = typeof obj.total === 'number' ? Number(obj.total) : undefined;
        const headerTotal = resp.headers.get('x-total-count');
        const total = bodyTotal ?? (headerTotal ? Number(headerTotal) : arr.length);
        return { data: arr, total } as GetListResult<R>;
      }

      if (Array.isArray(body)) {
        const arr = (body as unknown[]).map(d => convertKeysToCamelCase(d) as unknown as R);
        const headerTotal = resp.headers.get('x-total-count');
        const total = headerTotal ? Number(headerTotal) : arr.length;
        return { data: arr, total } as GetListResult<R>;
      }

      return null;
    };

    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
    const resp = await fetch(url, { credentials: 'include', headers: token ? { Authorization: `Bearer ${token}` } : undefined });

    // If response is OK try to parse and return. If parsing fails, reject so react-admin handles it.
    if (resp.ok) {
      const parsed = await parseResp(resp);
      if (parsed) return parsed;
      // Unknown shape — don't delegate to the strict base provider (it throws on missing headers).
      throw new Error(`Unexpected response shape from ${resource}`);
    }

    // If not OK and it's 401, attempt one refresh and retry once. Otherwise reject with status to let authProvider handle it.
    if (resp.status === 401) {
      try {
        const refreshRes = await fetch(`${API_URL}/auth/refresh`, { method: 'POST', credentials: 'include' });
        if (refreshRes.ok) {
          const b = await refreshRes.json().catch(() => null);
          const newToken = b?.access_token ?? null;
          if (newToken && typeof window !== 'undefined') localStorage.setItem('authToken', newToken);

          const tokenAfter = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
          const retryResp = await fetch(url, { credentials: 'include', headers: tokenAfter ? { Authorization: `Bearer ${tokenAfter}` } : undefined });
          if (retryResp.ok) {
            const parsed = await parseResp(retryResp);
            if (parsed) return parsed;
            throw new Error(`Unexpected response shape from ${resource} after refresh`);
          }
          // If retry failed, fall through to reject with its status
          throw new Error(`Failed to fetch ${resource}: ${retryResp.status}`);
        }
      } catch {
        // swallow and fall through to reject as unauthorized
      }
    }

    // Non-OK response (non-401 or failed refresh): reject so react-admin/authProvider reacts (e.g., redirect to login)
  const err = new Error(`Failed to fetch ${resource}: ${resp.status}`) as Error & { status?: number };
  err.status = resp.status;
    throw err;
  },
  
  getOne: <R extends RaRecord = RaRecord>(resource: string, params: GetOneParams<R>): Promise<GetOneResult<R>> =>
    baseDataProvider.getOne<R>(resource, params).then(response => {
      // Some endpoints return the canonical envelope { data: {...} }, or nested envelopes
      let raw: unknown = (response as unknown as Record<string, unknown>).data;

      // If raw is an envelope itself ({ data: ... }), unwrap it
      if (raw && typeof raw === 'object' && 'data' in (raw as Record<string, unknown>)) {
        raw = (raw as Record<string, unknown>).data;
      }

      // If raw is an array (some endpoints return [item]), pick first
      if (Array.isArray(raw)) raw = raw.length > 0 ? raw[0] : null;

      // If raw is an object with a single nested key matching the resource (e.g., { guide: {...} }), unwrap it
      if (raw && typeof raw === 'object') {
        const obj = raw as Record<string, unknown>;
        const keys = Object.keys(obj);
        if (keys.length === 1) {
          const only = keys[0];
          // common convention: singular resource key
          if (only.toLowerCase().includes(resource.replace(/s$/i, '').toLowerCase())) {
            raw = obj[only];
          }
        }
      }

      let dataObj = convertKeysToCamelCase(raw) as unknown as Record<string, unknown> | null;
      if (!dataObj) dataObj = {};

      // Ensure there's an `id` property. Try common fallbacks, resource-based fallbacks, then params.id
      const withId = ensureRecordHasId(dataObj, resource);
      if (!withId.id) {
        // final fallback: use requested id
        (withId as Record<string, unknown>).id = params.id as Identifier;
      }

      return ({ data: withId as unknown as R } as GetOneResult<R>);
    }),

  getMany: <R extends RaRecord = RaRecord>(resource: string, params: GetManyParams<R>): Promise<GetManyResult<R>> =>
  baseDataProvider.getMany<R>(resource, params).then(response => {
    // response.data may be the canonical envelope { data: [...] }
  const raw = unwrapData((response as unknown as Record<string, unknown>).data);
    const arr = Array.isArray(raw) ? (raw as unknown[]).map((d: unknown) => convertKeysToCamelCase(d) as unknown as R) : [];
    return { data: arr } as GetManyResult<R>;
  }),

  getManyReference: <R extends RaRecord = RaRecord>(resource: string, params: GetManyReferenceParams): Promise<GetManyReferenceResult<R>> =>
    baseDataProvider.getManyReference<R>(resource, params).then(response => {
  const raw = unwrapData((response as unknown as Record<string, unknown>).data);
      if (raw && typeof raw === 'object' && 'data' in (raw as Record<string, unknown>)) {
        const obj = raw as Record<string, unknown>;
        const arr = Array.isArray(obj.data) ? (obj.data as unknown[]).map((d: unknown) => convertKeysToCamelCase(d) as unknown as R) : [];
        const total = typeof obj.total === 'number' ? obj.total : (response.total as number) || arr.length;
        return { data: arr, total } as GetManyReferenceResult<R>;
      }
      const arr = Array.isArray(raw) ? (raw as unknown[]).map((d: unknown) => convertKeysToCamelCase(d) as unknown as R) : [];
      const total = (response.total as number) || arr.length;
      return { data: arr, total } as GetManyReferenceResult<R>;
    }),

  update: <R extends RaRecord = RaRecord>(resource: string, params: UpdateParams<R>): Promise<UpdateResult<R>> => {
    const data = convertKeysToSnakeCase(params.data) as unknown as Partial<R>;
    return baseDataProvider.update<R>(resource, { ...params, data } as UpdateParams<R>)
      .then(response => {
        const raw = unwrapData((response as unknown as Record<string, unknown>).data);
        let record = convertKeysToCamelCase(raw) as unknown as Record<string, unknown> | null;
        if (!record) record = {};
        const withId = ensureRecordHasId(record, resource) as unknown as R;
        return ({ data: withId } as UpdateResult<R>);
      });
  },

  updateMany: <R extends RaRecord = RaRecord>(resource: string, params: UpdateManyParams<R>): Promise<UpdateManyResult<R>> => {
    const ids = (params.ids || []) as Identifier[];
    const data = params.data ? (convertKeysToSnakeCase(params.data) as unknown as Partial<R>) : undefined;
    const safeParams = { ids, data } as UpdateManyParams<R>;
    return baseDataProvider.updateMany<R>(resource, safeParams)
      .then(response => {
        const raw = unwrapData((response as unknown as Record<string, unknown>).data) as unknown || [];
        if (Array.isArray(raw)) {
          // If array of ids
          if (raw.every(r => typeof r === 'string' || typeof r === 'number')) return ({ data: raw as unknown as R['id'][] } as UpdateManyResult<R>);
          // If array of records, extract ids
          const idsArr = (raw as unknown[]).map(item => ensureRecordHasId(convertKeysToCamelCase(item) as unknown as Record<string, unknown>, resource).id) as R['id'][];
          return ({ data: idsArr } as UpdateManyResult<R>);
        }
        return ({ data: [] } as UpdateManyResult<R>);
      });
  },

  create: <R extends Omit<RaRecord, 'id'> = Omit<RaRecord, 'id'>, T extends RaRecord = R & { id: Identifier }>(resource: string, params: CreateParams<R>): Promise<CreateResult<T>> => {
    const data = convertKeysToSnakeCase(params.data) as unknown as R;
    return baseDataProvider.create<T>(resource, { ...params, data } as CreateParams<R>)
      .then(response => {
        const raw = unwrapData((response as unknown as Record<string, unknown>).data);
        let record = convertKeysToCamelCase(raw) as unknown as Record<string, unknown> | null;
        if (!record) record = {};
        const withId = ensureRecordHasId(record, resource) as unknown as T;
        return ({ data: withId } as CreateResult<T>);
      });
  },

  delete: <R extends RaRecord = RaRecord>(resource: string, params: DeleteParams<R>): Promise<DeleteResult<R>> =>
    baseDataProvider.delete<R>(resource, params).then(response => {
  const raw = unwrapData((response as unknown as Record<string, unknown>).data);
      return ({ data: convertKeysToCamelCase(raw) as unknown as R } as DeleteResult<R>);
    }),

  deleteMany: <R extends RaRecord = RaRecord>(resource: string, params: DeleteManyParams<R>): Promise<DeleteManyResult<R>> =>
    baseDataProvider.deleteMany<R>(resource, params).then(response => {
  const raw = (unwrapData((response as unknown as Record<string, unknown>).data) as unknown) || [];
      if (Array.isArray(raw)) {
        // if array of ids
        if (raw.every(r => typeof r === 'string' || typeof r === 'number')) return { data: raw as unknown as R['id'][] } as DeleteManyResult<R>;
        // otherwise map records to ids
        const ids = (raw as unknown[]).map((d: unknown) => ensureRecordHasId(convertKeysToCamelCase(d) as unknown as Record<string, unknown>, resource).id) as R['id'][];
        return { data: ids } as DeleteManyResult<R>;
      }
      return { data: [] } as DeleteManyResult<R>;
    }),
};

export default customDataProvider;
