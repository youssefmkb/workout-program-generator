/**
 * Point d'entrée de l'application.
 * Orchestre : formulaire utilisateur → Claude API → parsing → rendu → PDF.
 *
 * @module js/main
 */

import { buildWorkoutPrompt } from "../ai/prompts.js";
import { callClaude } from "../ai/claude-client.js";
import { parseWorkoutResponse } from "../ai/parser.js";
import { generatePDF } from "./pdf.js";

// État applicatif minimal
let currentProgram = null;
let currentObjectif = null;

// ─────────────────────────────────────────────────────────
// HELPERS UI
// ─────────────────────────────────────────────────────────

/**
 * Construit l'URL YouTube de recherche pour un exercice.
 */
function buildYouTubeLink(exerciseName) {
  const query = encodeURIComponent(exerciseName + " exercise tutorial");
  return `https://www.youtube.com/results?search_query=${query}`;
}

/**
 * Récupère les valeurs du formulaire.
 */
function readFormValues() {
  return {
    prenom: document.getElementById("prenom").value.trim() || "Athlète",
    objectif: document.getElementById("objectif").value,
    niveau: document.getElementById("niveau").value,
    equipement: document.getElementById("equipement").value,
    jours: document.getElementById("jours").value,
  };
}

/**
 * Affiche/masque l'état de chargement du bouton.
 */
function setLoading(isLoading) {
  const btn = document.getElementById("btn-generate");
  btn.disabled = isLoading;
  btn.classList.toggle("loading", isLoading);
}

/**
 * Affiche un message d'erreur sous le bouton.
 */
function showError(message) {
  const errEl = document.getElementById("error-msg");
  errEl.textContent = `Erreur : ${message}`;
  errEl.style.display = "block";
}

function hideError() {
  document.getElementById("error-msg").style.display = "none";
}

/**
 * Affiche un toast de confirmation/erreur.
 */
function showToast(msg, type = "success") {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.className = `toast ${type} show`;
  setTimeout(() => {
    t.className = "toast";
  }, 3000);
}

// ─────────────────────────────────────────────────────────
// RENDU DU PROGRAMME
// ─────────────────────────────────────────────────────────

/**
 * Rend le programme complet dans la page.
 */
function renderProgram(program, prenom, objectif) {
  const section = document.getElementById("result-section");
  const container = document.getElementById("program-container");
  const titleSpan = document.querySelector("#result-title span");
  const statsBar = document.getElementById("stats-bar");

  titleSpan.textContent = prenom;
  container.innerHTML = "";

  // Stats bar
  const focusLabel =
    objectif === "prise de masse"
      ? "Force"
      : objectif === "perte de poids"
        ? "Cardio"
        : "Endurance";

  statsBar.innerHTML = `
    <div class="stat"><span class="stat-value">${program.jours.length}</span><span class="stat-label">Jours</span></div>
    <div class="stat"><span class="stat-value">${program.totalExercices || "—"}</span><span class="stat-label">Exercices</span></div>
    <div class="stat"><span class="stat-value">${program.duree || "—"}</span><span class="stat-label">Durée</span></div>
    <div class="stat"><span class="stat-value">${focusLabel}</span><span class="stat-label">Focus</span></div>
  `;

  // Blocs jours
  program.jours.forEach((jour, i) => {
    const block = document.createElement("div");
    block.className = "day-block" + (i === 0 ? " open" : "");

    const exerciceCount = jour.exercices.length;

    let rows = "";
    jour.exercices.forEach((ex) => {
      const ytLink = buildYouTubeLink(ex.nom);
      rows += `
        <tr>
          <td>
            <a href="${ytLink}" target="_blank" class="exercise-link">
              <div class="yt-icon">
                <svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
              </div>
              ${ex.nom}
            </a>
          </td>
          <td><span class="sets-reps">${ex.series}×${ex.repetitions}</span></td>
          <td><span class="repos-badge">${ex.repos || "—"}</span></td>
          <td class="notes-cell">${ex.notes || "—"}</td>
        </tr>`;
    });

    block.innerHTML = `
      <div class="day-header">
        <span class="day-number">Jour ${jour.numero}</span>
        <span class="day-name">${jour.nom}</span>
        <span class="day-meta">${exerciceCount} exercices · ${jour.focus || ""}</span>
        <span class="chevron">▼</span>
      </div>
      <table class="exercise-table">
        <thead>
          <tr>
            <th style="width:42%">Exercice</th>
            <th style="width:13%">Sets × Reps</th>
            <th style="width:12%">Repos</th>
            <th>Notes</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>`;

    // Listener clic header pour toggle
    block.querySelector(".day-header").addEventListener("click", () => {
      block.classList.toggle("open");
    });

    container.appendChild(block);
  });

  section.style.display = "block";
  section.scrollIntoView({ behavior: "smooth", block: "start" });
}

// ─────────────────────────────────────────────────────────
// HANDLERS
// ─────────────────────────────────────────────────────────

/**
 * Handler du clic "Générer mon programme".
 * Pipeline : form → prompt → Claude → parse → render.
 */
async function handleGenerate() {
  const params = readFormValues();

  setLoading(true);
  hideError();
  document.getElementById("result-section").style.display = "none";

  try {
    const prompt = buildWorkoutPrompt(params);
    const rawResponse = await callClaude(prompt);
    const program = parseWorkoutResponse(rawResponse);

    currentProgram = program;
    currentObjectif = params.objectif;

    renderProgram(program, params.prenom, params.objectif);
  } catch (err) {
    showError(err.message);
  } finally {
    setLoading(false);
  }
}

/**
 * Handler du clic "PDF".
 */
function handleDownloadPDF() {
  if (!currentProgram) return;
  try {
    generatePDF(currentProgram, currentObjectif);
    showToast("PDF téléchargé !", "success");
  } catch (err) {
    showToast("Erreur PDF : " + err.message, "error");
  }
}

// ─────────────────────────────────────────────────────────
// INIT
// ─────────────────────────────────────────────────────────

document.addEventListener("DOMContentLoaded", () => {
  document
    .getElementById("btn-generate")
    .addEventListener("click", handleGenerate);

  // Le bouton PDF utilise un attribut data-action pour qu'on puisse
  // attacher le listener proprement (au lieu de onclick="" inline)
  document
    .querySelector('[data-action="download-pdf"]')
    ?.addEventListener("click", handleDownloadPDF);
});