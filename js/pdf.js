/**
 * Génération du PDF du programme d'entraînement.
 * Utilise jsPDF (chargé via CDN dans index.html).
 *
 * @module js/pdf
 */

/**
 * Construit l'URL YouTube de recherche pour un exercice donné.
 *
 * @param {string} exerciseName - Nom de l'exercice
 * @returns {string} URL YouTube
 */
function buildYouTubeLink(exerciseName) {
  const query = encodeURIComponent(exerciseName + " exercise tutorial");
  return `https://www.youtube.com/results?search_query=${query}`;
}

/**
 * Convertit un objectif en label affichable.
 *
 * @param {string} objectif
 * @returns {string}
 */
function getObjectifLabel(objectif) {
  const map = {
    "prise de masse": "Prise de masse",
    "perte de poids": "Perte de poids",
    endurance: "Endurance",
  };
  return map[objectif] || "Programme";
}

/**
 * Dessine le fond noir sur la page courante.
 *
 * @param {jsPDF} doc
 */
function drawBackground(doc) {
  doc.setFillColor(10, 10, 10);
  doc.rect(0, 0, 210, 297, "F");
}

/**
 * Génère et déclenche le téléchargement du PDF du programme.
 *
 * @param {Object} program  - Programme validé (sortie de parseWorkoutResponse)
 * @param {string} objectif - Objectif sélectionné (pour le titre)
 */
export function generatePDF(program, objectif) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: "p", unit: "mm", format: "a4" });
  const margin = 18;
  let y = 22;

  const objectifLabel = getObjectifLabel(objectif);

  drawBackground(doc);

  // Titre principal
  doc.setFont("helvetica", "bold");
  doc.setFontSize(26);
  doc.setTextColor(181, 242, 61);
  doc.text(`Workout — ${objectifLabel}`, margin, y);

  // Résumé
  y += 7;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(200, 200, 195);
  doc.text(program.resume || "", margin, y);

  // Durée recommandée
if (program.duree) {
  y += 6;
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(120, 180, 255);
  doc.text(`Durée recommandée : ${program.duree}`, margin, y);
}

  // Séparateur
  y += 10;
  doc.setDrawColor(50, 50, 50);
  doc.setLineWidth(0.3);
  doc.line(margin, y, 210 - margin, y);
  y += 10;

  // Itération sur les jours
  program.jours.forEach((jour) => {
    if (y > 260) {
      doc.addPage();
      drawBackground(doc);
      y = 20;
    }

    // Header du jour
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(181, 242, 61);
    doc.text(`JOUR ${jour.numero} — ${jour.nom.toUpperCase()}`, margin, y);
    y += 9;

    // Itération sur les exercices
    jour.exercices.forEach((ex) => {
      if (y > 268) {
        doc.addPage();
        drawBackground(doc);
        y = 20;
      }

      // Nom de l'exercice = lien YouTube cliquable (nouvelle fenêtre)
      const ytUrl = buildYouTubeLink(ex.nom);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(255, 255, 255);
      doc.textWithLink(`  ${ex.nom}`, margin, y, {
        url: ytUrl,
        target: "_blank",
      });

      // Sets × Reps
      doc.setFont("helvetica", "bold");
      doc.setTextColor(181, 242, 61);
      doc.text(`${ex.series}×${ex.repetitions}`, 158, y);
      y += 5;

      // Repos (à droite)
      if (ex.repos) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8.5);
        doc.setTextColor(120, 180, 255);
        doc.text(`Repos : ${ex.repos}`, 158, y);
      }

      // Notes (à gauche)
      if (ex.notes) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8.5);
        doc.setTextColor(180, 220, 120);
        doc.text(`  ${ex.notes}`, margin + 3, y);
        y += 5;
      }

      y += 3;
    });

    y += 5;
  });

  // Téléchargement
  const fileName = `workout-${objectifLabel.toLowerCase().replace(/ /g, "-")}.pdf`;
  doc.save(fileName);
}