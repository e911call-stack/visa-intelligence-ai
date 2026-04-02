'use client';
// lib/api.js — Typed client for internal Next.js API routes
// All paths are relative — no external URL needed.

class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

async function request(path, options = {}, token) {
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  // Paths are now relative — Next.js serves them from the same origin
  const res = await fetch(`/api${path}`, {
    ...options,
    headers,
  });

  let data;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  if (!res.ok) {
    throw new ApiError(
      data?.message || `Request failed with status ${res.status}`,
      res.status,
      data
    );
  }

  return data;
}

// ─── Analysis ────────────────────────────────────────────────

export async function submitAnalysis(payload, token) {
  return request('/analyze', { method: 'POST', body: JSON.stringify(payload) }, token);
}

// ─── Report ──────────────────────────────────────────────────

export async function getReport(analysisId, token) {
  return request(`/report/${analysisId}`, {}, token);
}

export async function downloadReport(analysisId, token) {
  return request(`/report/${analysisId}/download`, {}, token);
}

// ─── Analyses list ───────────────────────────────────────────

export async function listAnalyses(token, page = 1, limit = 10) {
  return request(`/analyses?page=${page}&limit=${limit}`, {}, token);
}

export async function deleteAnalysis(analysisId, token) {
  return request(`/analyses/${analysisId}`, { method: 'DELETE' }, token);
}

// ─── Health ──────────────────────────────────────────────────

export async function healthCheck() {
  return request('/health');
}

export { ApiError };
