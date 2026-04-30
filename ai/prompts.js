/**
 * Prompts pour la génération de programmes d'entraînement.
 * Chaque prompt est versionné et documenté.
 *
 * @module ai/prompts
 */

/**
 * Construit le prompt de génération de programme à partir des paramètres utilisateur.
 *
 * @param {Object} params
 * @param {string} params.prenom      - Prénom de l'utilisateur
 * @param {string} params.objectif    - "prise de masse" | "perte de poids" | "endurance"
 * @param {string} params.niveau      - "débutant" | "intermédiaire" | "avancé"
 * @param {string} params.equipement  - "salle complète" | "haltères seulement" | "aucun équipement"
 * @param {string|number} params.jours - Nombre de jours d'entraînement par semaine
 * @returns {string} Prompt formaté prêt à être envoyé à Claude
 */
export function buildWorkoutPrompt({
  prenom,
  objectif,
  niveau,
  equipement,
  jours,
}) {
  return `Tu es un coach sportif expert. Génère un programme d'entraînement complet et personnalisé.

Informations :
- Prénom : ${prenom}
- Objectif : ${objectif}
- Niveau : ${niveau}
- Équipement disponible : ${equipement}
- Jours d'entraînement par semaine : ${jours}

Réponds UNIQUEMENT avec un JSON valide, sans texte avant ni après, sans backticks, sans commentaires.
Format exact à respecter :

{
  "resume": "phrase courte résumant le programme (ex: Push/Pull/Legs 4 jours, hypertrophie intermédiaire)",
  "duree": "8 semaines",
  "totalExercices": 24,
  "tempsParSeance": "60-75 min",
  "jours": [
    {
      "numero": 1,
      "nom": "Poitrine & Triceps",
      "focus": "Push",
      "exercices": [
        {
          "nom": "Développé couché haltères",
          "series": 4,
          "repetitions": "8-10",
          "repos": "90 sec",
          "notes": "Descente contrôlée 3 secondes"
        }
      ]
    }
  ]
}

Règles :
- Exactement ${jours} jours d'entraînement
- Proposer une durée recommandée pour le programme adaptée au niveau et à l'objectif (ex: "4 semaines" pour un cycle court, "8 semaines" pour hypertrophie classique, "12 semaines" pour transformation complète)
- 5 à 7 exercices par jour selon le niveau
- Les noms d'exercices doivent être en français
- Les notes doivent être courtes et utiles (technique, tempo, conseil)
- Inclure un champ "repos" par exercice adapté à l'objectif (ex: "60 sec", "90 sec", "2 min")
- Adapter les exercices à l'équipement disponible
- Ne génère que le JSON, rien d'autre`;
}

/**
 * Configuration du modèle Claude utilisé pour la génération.
 * Centralisé ici pour faciliter les changements de modèle/paramètres.
 */
export const MODEL_CONFIG = {
  model: "claude-haiku-4-5-20251001",
  max_tokens: 4096,
};