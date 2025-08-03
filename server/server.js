import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pg from 'pg';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();
const { Pool } = pg;

const app = express();
const port = process.env.PORT || 3000;

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  methods: ['GET', 'POST'],
  credentials: false
}));
app.use(express.json());
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        "'unsafe-inline'",
        'https://cdnjs.cloudflare.com',
        'https://cdn.jsdelivr.net'
      ],
      styleSrc: [
        "'self'",
        "'unsafe-inline'",
        'https://fonts.googleapis.com',
        'https://cdnjs.cloudflare.com',
        'https://cdn.jsdelivr.net'
      ],
      fontSrc: [
        "'self'",
        'https://fonts.gstatic.com',
        'https://cdnjs.cloudflare.com',
        'https://cdn.jsdelivr.net'
      ],
      connectSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https://tile.openstreetmap.org", "https://i.ibb.co"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    }
  }
}));
app.set('trust proxy', 1);
app.timeout = 30000;

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

const validateCode = (code) => {
  if (!code) return null;
  return /^[a-zA-Z0-9]{1,15}$/.test(code) ? code : null;
};

const validateCandidateId = (id) => {
  const parsed = parseInt(id);
  if (Number.isInteger(parsed) && parsed >= 1 && parsed <= 66) {
    return parsed;
  } else {
    return null;
  }
};

app.use(express.static(path.join(__dirname, '../dist')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist', 'index.html'));
});

app.use('/api/', rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please slow down' }
}));

app.get('/api/candidates', async (req, res) => {
  try {
    const code = validateCode(req.query.code);
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

app.get('/api/votes', async (req, res) => {
  try {
    const candidateId = validateCandidateId(req.query.candidate_id);
    const currentLevel = parseInt(req.query.current_level);
    const parentCode = validateCode(req.query.parent_code);
    // console.log(currentLevel);
    
    let query, selectFields, whereClause, groupByFields, params;
    
    switch (currentLevel) {
      case 1: //Region
        selectFields = `c.id, el.adm1_pcode `;
        whereClause = `c.id = $1`;
        groupByFields = `c.id, el.adm1_pcode`;
        break;
        
      case 2: //Province
        selectFields = `c.id, el.adm1_pcode, el.adm2_pcode, el.er2_name`;
        whereClause = `c.id = $1 AND el.adm1_pcode = $2`;
        groupByFields = `c.id, el.adm1_pcode, el.adm2_pcode, el.er2_name`;
        break;
        
      case 3: //City/Municipality
        selectFields = `c.id, el.adm2_pcode, el.adm3_pcode, el.er3_name`;
        whereClause = `c.id = $1 AND el.adm2_pcode = $2`;
        groupByFields = `c.id, el.adm2_pcode, el.adm3_pcode, el.er3_name`;
        break;
        
      case 4: //Barangay
        selectFields = `c.id, el.adm3_pcode, el.adm4_pcode, el.er4_name`;
        whereClause = `c.id = $1 AND el.adm3_pcode = $2`;
        groupByFields = `c.id, el.adm3_pcode, el.adm4_pcode, el.er4_name`;
        break;

      case 5: //Barangay - specific
        selectFields = `c.id, el.adm3_pcode, el.adm4_pcode, el.er4_name`;
        whereClause = `c.id = $1 AND el.adm3_pcode = $2`;
        groupByFields = `c.id, el.adm3_pcode, el.adm4_pcode, el.er4_name`;
        break;

      default:
        return res.status(400).json({ error: 'Invalid current level' });
    }

    query = `
      SELECT
        ${selectFields},
        c.name AS candidate_name,
        SUM(COALESCE(cr.votes, 0)) AS candidate_votes
      FROM er_locations el
      JOIN locations l ON el.id = l.id
      JOIN precincts p ON p.location_id = l.id
      JOIN election_results er ON er.precinct_id = p.id
      LEFT JOIN candidate_results cr ON cr.election_result_id = er.id
      LEFT JOIN candidates c ON c.id = cr.candidate_id
      WHERE ${whereClause}
      GROUP BY ${groupByFields}, c.name
      ORDER BY candidate_votes DESC
    `;

    if (currentLevel === 1) {
      params = [candidateId];
    } else {
      params = [candidateId, parentCode];
    }
    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching votes for candidate: ', error);
    res.status(500).json({ error: 'Internal server error' });
  } 
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong' });
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${port}`);
});