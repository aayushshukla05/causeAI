import { Router } from 'express';
import { fetchIncidentHistory } from '../db/supabase.js';

const router = Router();

router.get('/', async (req, res) => {
  const limit = parseInt(req.query.limit) || 50;
  try {
    const incidents = await fetchIncidentHistory(limit);
    res.json({ incidents, total: incidents.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
