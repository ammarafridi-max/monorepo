import { apiFetch } from "@/services/apiClient";

const URL = "/api/contact";

export async function submitContactRequestApi(payload) {
  return await apiFetch(URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}
