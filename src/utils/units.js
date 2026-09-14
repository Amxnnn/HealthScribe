/**
 * Strips any unit the model already attached to a reading.
 *
 * Vital values arrive from three places — the regex parser, the model, and
 * the clinician's own typing — and the model often includes the unit ("98.4 F",
 * "94%"). Every surface renders its own unit label, so the raw number has to
 * be isolated or it reads as "98.4 F °F".
 *
 * Keeps digits, a decimal point, and the slash in a blood pressure.
 */
export const stripUnit = (value) =>
    String(value ?? '').replace(/[^\d./-]/g, '').trim();
