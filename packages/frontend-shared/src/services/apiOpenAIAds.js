import { apiFetch } from './apiClient.js';

const URL = '/api/openai-ads';

const postJson = (path, body) =>
  apiFetch(`${URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body ?? {}),
  });

export const getOpenAIAdsOverviewApi = ({ days = 30 } = {}) => apiFetch(`${URL}/overview?days=${encodeURIComponent(days)}`);
export const getOpenAIAdsSetupApi = () => apiFetch(`${URL}/setup`);
export const searchOpenAIAdsLocationsApi = (q) => apiFetch(`${URL}/locations?q=${encodeURIComponent(q)}`);
export const getOpenAIAdsCampaignApi = (id, days = 30) =>
  apiFetch(`${URL}/campaigns/${encodeURIComponent(id)}?days=${encodeURIComponent(days)}`);
export const createOpenAICampaignApi = (body) => postJson('/campaigns', body);
export const createOpenAIAdGroupApi = ({ campaignId, ...body }) => postJson(`/campaigns/${encodeURIComponent(campaignId)}/ad-groups`, body);
export const createOpenAIAdApi = ({ adGroupId, ...body }) => postJson(`/ad-groups/${encodeURIComponent(adGroupId)}/ads`, body);
export const previewOpenAIAdApi = (id) => postJson(`/ads/${encodeURIComponent(id)}/preview`);

const STATUS_ACTIONS = ['pause', 'activate', 'archive'];

export const setOpenAIAdsStatusApi = ({ kind, id, action }) =>
  postJson(`/${kind}/${encodeURIComponent(id)}/${STATUS_ACTIONS.includes(action) ? action : 'pause'}`);

export const getOpenAICampaignSettingsApi = (id) => apiFetch(`${URL}/campaigns/${encodeURIComponent(id)}/settings`);
export const updateOpenAICampaignSettingsApi = ({ id, ...body }) => postJson(`/campaigns/${encodeURIComponent(id)}/settings`, body);
export const getOpenAIAdGroupSettingsApi = (id) => apiFetch(`${URL}/ad-groups/${encodeURIComponent(id)}/settings`);
export const updateOpenAIAdGroupSettingsApi = ({ id, ...body }) => postJson(`/ad-groups/${encodeURIComponent(id)}/settings`, body);
export const renameOpenAIAdsApi = ({ kind, id, name }) => postJson(`/${kind}/${encodeURIComponent(id)}/rename`, { name });

export function uploadOpenAIAdImageApi(file) {
  const form = new FormData();
  form.append('image', file);
  return apiFetch(`${URL}/images`, { method: 'POST', body: form });
}
