import axios from 'axios';
import { useToastStore } from '../store/toast';

const BASE_URL = (import.meta.env.VITE_API_URL ?? '') + '/api';

const client = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

client.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err.response?.status;

    if (status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
      return Promise.reject(err);
    }

    const { addToast } = useToastStore.getState();
    const data = err.response?.data;

    let title = 'エラーが発生しました';
    let message: string | undefined;

    if (status === 422) {
      title = '入力値エラー';
      if (typeof data?.detail === 'string') {
        message = data.detail;
      } else if (Array.isArray(data?.detail)) {
        message = data.detail
          .map((e: { loc?: string[]; msg: string }) => {
            const field = e.loc?.filter((x) => x !== 'body').join(' → ');
            return field ? `${field}: ${e.msg}` : e.msg;
          })
          .join('\n');
      }
    } else if (status === 404) {
      title = '見つかりません';
      message = typeof data?.detail === 'string' ? data.detail : undefined;
    } else if (status === 409 || status === 400) {
      title = 'リクエストエラー';
      message = typeof data?.detail === 'string' ? data.detail : undefined;
    } else if (status && status >= 500) {
      title = 'サーバーエラー';
      message = typeof data?.detail === 'string' ? data.detail : `ステータスコード: ${status}`;
    } else if (!err.response) {
      title = '通信エラー';
      message = 'サーバーに接続できませんでした。ネットワークを確認してください。';
    }

    addToast('error', title, message);
    return Promise.reject(err);
  }
);

export default client;
