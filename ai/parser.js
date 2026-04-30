/**
 * Parser et validateur de la réponse de Claude.
 *
 * Pourquoi ce module existe :
 * Un LLM ne retourne pas toujours du JSON pur — il peut ajouter du texte
 * autour, des backticks, ou un JSON malformé. Cette couche défensive
 * extrait, parse et valide la structure attendue.
 *
 * @module ai/parser
 */

/**
 * Extrait et parse le JSON contenu dans une réponse texte de Claude.
 *
 * @param {string} rawText - Texte brut retourné par Claude
 * @returns {Object} JSON parsé
 * @throws {Error} Si aucun JSON valide n'est trouvé
 */
export function extractJSON(rawText) {
  // Cherche le premier objet JSON dans la réponse, même si Claude
  // a accidentellement ajouté du texte avant ou après.
  const jsonMatch = rawText.match(/\{[\s\S]*\}/);

  if (!jsonMatch) {
    throw new Error("Aucun JSON détecté dans la réponse de Claude");
  }

  try {
    return JSON.parse(jsonMatch[0]);
  } catch (err) {
    throw new Error(`JSON malformé : ${err.message}`);
  }
}

/**
 * Valide qu'un programme parsé respecte la structure attendue.
 * Lance une erreur explicite si un champ critique manque.
 *
 * @param {Object} program - Programme parsé
 * @throws {Error} Si la structure est invalide
 */
export function validateProgram(program) {
  if (!program || typeof program !== "object") {
    throw new Error("Programme invalide : objet manquant");
  }

  if (!Array.isArray(program.jours) || program.jours.length === 0) {
    throw new Error("Programme invalide : aucun jour d'entraînement");
  }

  program.jours.forEach((jour, i) => {
    if (!jour.nom || !Array.isArray(jour.exercices)) {
      throw new Error(`Jour ${i + 1} invalide : structure incorrecte`);
    }
    if (jour.exercices.length === 0) {
      throw new Error(`Jour ${i + 1} invalide : aucun exercice`);
    }
  });

  return true;
}

/**
 * Pipeline complet : extrait le JSON et valide la structure.
 * À utiliser après un appel à callClaude().
 *
 * @param {string} rawText - Texte brut retourné par Claude
 * @returns {Object} Programme validé prêt à être rendu
 */
export function parseWorkoutResponse(rawText) {
  const program = extractJSON(rawText);
  validateProgram(program);
  return program;
}