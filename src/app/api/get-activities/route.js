import { sql } from '@vercel/postgres';

export async function GET() {
  try {
    const { rows } = await sql`
      SELECT 
        id,
        name,
        description,
        latitude,
        longitude,
        category,
        address,
        audio_guide_text
      FROM activities
      WHERE latitude IS NOT NULL AND longitude IS NOT NULL
    `;

    return Response.json({
      activities: rows.map(activity => ({
        id: activity.id,
        name: activity.name,
        description: activity.description,
        position: [parseFloat(activity.latitude), parseFloat(activity.longitude)],
        category: activity.category,
        address: activity.address,
        audio_guide_text: activity.audio_guide_text
      }))
    });
  } catch (error) {
    console.error('Database Error:', error);
    return Response.json({ error: 'Failed to fetch activities' }, { status: 500 });
  }
}