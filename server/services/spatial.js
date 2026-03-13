import sql from '../db/pool.js';
import { SPATIAL_BUFFER_RADIUS, SPATIAL_THRESHOLD, SPATIAL_WINDOW_HOURS } from '../utils/constants.js';
import { logger } from '../utils/logger.js';

export async function checkSpatialBuffer(category, latitude, longitude) {
  try {
    logger.debug('Spatial buffer check', { category, latitude, longitude });

    const result = await sql`
      SELECT COUNT(*)::int AS count,
             AVG(latitude) AS center_lat,
             AVG(longitude) AS center_lng
      FROM grievances
      WHERE ai_category = ${category}
        AND created_at > NOW() - make_interval(hours => ${SPATIAL_WINDOW_HOURS})
        AND (
          6371000 * acos(
            LEAST(1.0, GREATEST(-1.0,
              cos(radians(${latitude})) * cos(radians(latitude)) *
              cos(radians(longitude) - radians(${longitude})) +
              sin(radians(${latitude})) * sin(radians(latitude))
            ))
          )
        ) < ${SPATIAL_BUFFER_RADIUS}
    `;

    const { count, center_lat, center_lng } = result[0];
    logger.info('Spatial buffer result', { category, count, threshold: SPATIAL_THRESHOLD });

    if (count >= SPATIAL_THRESHOLD) {
      const severity = count >= SPATIAL_THRESHOLD * 2 ? 'critical' : 'warning';
      const message = `Cluster detected: ${count} "${category}" complaints within ${SPATIAL_BUFFER_RADIUS}m in the last ${SPATIAL_WINDOW_HOURS} hours`;

      await sql`
        INSERT INTO alerts (category, radius_center_lat, radius_center_lng, grievance_count, message, severity)
        VALUES (${category}, ${center_lat}, ${center_lng}, ${count}, ${message}, ${severity})
      `;

      logger.warn('Spatial alert created', { severity, count, category });
      return { count, isAlert: true, severity, message };
    }

    return { count, isAlert: false };
  } catch (err) {
    logger.error('Spatial buffer check failed', { error: err.message, category });
    return { count: 0, isAlert: false };
  }
}
