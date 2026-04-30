# workout_generator.md — Prompt Engineering Doc

## Objectif du prompt

Générer un programme d'entraînement structuré en JSON, adapté aux paramètres utilisateur, prêt à être rendu en tableau interactif.

---

## Variables injectées

| Variable     | Source       | Valeurs possibles                              |
|--------------|-------------|-----------------------------------------------|
| `prenom`     | Formulaire  | Texte libre                                    |
| `objectif`   | Select      | prise de masse / perte de poids / endurance    |
| `niveau`     | Select      | débutant / intermédiaire / avancé              |
| `equipement` | Select      | salle complète / haltères seulement / aucun    |
| `jours`     | Select      | 3 / 4 / 5                                      |

---

## Format de sortie attendu (JSON strict)

```json
{
  "resume": "Push/Pull/Legs 4 jours, hypertrophie intermédiaire",
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
```

---

## Contraintes du prompt

- **JSON pur** : aucun texte avant/après, aucun backtick, aucun commentaire
- **Langue** : noms d'exercices en français, notes courtes et utiles
- **Cohérence** : nombre de jours = valeur `jours` exactement
- **Volume** : 5-7 exercices/jour selon le niveau
- **Adaptation équipement** : aucun exercice incompatible avec l'équipement choisi
- **Durée recommandée** : Claude propose lui-même la durée optimale (4/8/12 semaines) selon le profil

---

## Stratégie de parsing côté client

```js
const raw = data.content.find(b => b.type === 'text')?.text || '';
const jsonMatch = raw.match(/\{[\s\S]*\}/);
const program = JSON.parse(jsonMatch[0]);
```

Regex `/\{[\s\S]*\}/` extrait le premier objet JSON même si Claude ajoute accidentellement du texte autour. Le module `ai/parser.js` ajoute en plus une validation de structure avant de retourner le programme.

---

## Modèle utilisé

`claude-haiku-4-5-20251001`

Choix : Haiku 4.5 offre le meilleur rapport coût/qualité pour générer du JSON structuré sur ce use case. Un programme génère ~2k tokens en sortie, le coût par génération est négligeable.

---

## Évolutions possibles (v2)

- [ ] Streaming de la réponse avec `stream: true` pour affichage progressif
- [ ] Multi-turn pour ajustements ("rends le programme plus court")
- [ ] Évaluation automatique du JSON généré (taux de validité)
- [ ] RAG : base d'exercices locale pour améliorer la cohérence