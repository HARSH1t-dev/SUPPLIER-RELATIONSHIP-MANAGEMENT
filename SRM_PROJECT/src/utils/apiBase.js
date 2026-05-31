export function getApiBaseUrl() {
  return (
    import.meta.env.VITE_API_BASE_URL ||
    'http://127.0.0.1:8080/api'
  ).replace(/\/$/, '');
}
