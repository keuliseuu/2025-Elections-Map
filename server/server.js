import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config();
const { Pool } = pg;

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

app.get('/api/candidates', async (req, res) => {
  try {
    const { code } = req.query;
    const query = `
      SELECT 
        c.id,
        c.name,
        c.party,
        c.photo_url,
        SUM(cr.votes) AS total_votes
      FROM candidates c
      JOIN candidate_results cr ON c.id = cr.candidate_id
      JOIN election_results er ON cr.election_result_id = er.id
      JOIN precincts p ON er.precinct_id = p.id
      JOIN locations l ON p.location_id = l.id
      JOIN er_locations el ON l.id = el.id
      WHERE (
        $1::text IS NULL OR
        el.adm1_pcode = $1 OR
        el.adm2_pcode = $1 OR
        el.adm3_pcode = $1 OR
        el.adm4_pcode = $1
      )
      GROUP BY c.id, c.name, c.party, c.photo_url
      ORDER BY total_votes DESC;
    `;

    const values = [code || null];
    const result = await pool.query(query, values);
    const formattedRows = result.rows.map(row => ({
    ...row,
    total_votes: parseInt(row.total_votes)
    }));

    res.json(formattedRows);
  } catch (error) {
    console.error('Error fetching candidate data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
