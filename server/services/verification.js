import sql from '../db/pool.js';

export async function checkDeadline(grievance) {
  if (grievance.status !== 'resolved_pending' || !grievance.verification_deadline) {
    return grievance;
  }

  const now = new Date();
  const deadline = new Date(grievance.verification_deadline);

  if (now > deadline) {
    const result = await sql`
      UPDATE grievances
      SET status = 'resolved_final', updated_at = NOW()
      WHERE id = ${grievance.id}
        AND status = 'resolved_pending'
      RETURNING *
    `;
    return result[0] || grievance;
  }

  return grievance;
}
