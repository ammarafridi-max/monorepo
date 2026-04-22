import { apiFetch } from './apiClient.js';

const URL = '/api/admin-users/me';

export async function getMyAccountApi() {
  return await apiFetch(URL, {
    method: 'GET',
  });
}

export async function updateAccountApi(data) {
  return await apiFetch(URL, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
}

export async function updatePasswordApi(accountData) {
  const payload = {
    passwordCurrent: accountData.passwordCurrent || accountData.currentPassword,
    password: accountData.password,
    passwordConfirm: accountData.passwordConfirm,
  };

  return await apiFetch(`${URL}/password`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
}
