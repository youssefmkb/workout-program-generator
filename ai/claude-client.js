/**
 * Client pour l'API Claude (via proxy Cloudflare Worker).
 * Cette couche isole la logique réseau du reste de l'app.
 *
 * @module ai/claude-client
 */

import { MODEL_CONFIG } from "./prompts.js";

/**
 * URL du proxy Cloudflare Worker qui forward les appels vers api.anthropic.com.
 * La clé API n'est JAMAIS exposée côté client — elle est stockée comme Secret
 * dans le Worker.
 */
const PROXY_URL = "https://claude-proxy.mokhbi-youssef.workers.dev";

/**
 * Envoie un prompt à Claude et retourne le texte brut de la réponse.
 *
 * @param {string} prompt - Le prompt utilisateur
 * @param {Object} [options] - Override de la config par défaut
 * @returns {Promise<string>} Texte brut retourné par Claude
 * @throws {Error} Si l'appel API échoue
 */
export async function callClaude(prompt, options = {}) {
  const config = { ...MODEL_CONFIG, ...options };

  const response = await fetch(PROXY_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: config.model,
      max_tokens: config.max_tokens,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `HTTP ${response.status}`);
  }

  const data = await response.json();
  const textBlock = data.content?.find((b) => b.type === "text");

  if (!textBlock) {
    throw new Error("Réponse vide ou invalide de Claude");
  }

  return textBlock.text;
}