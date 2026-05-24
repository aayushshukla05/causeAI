import { Router } from 'express';
import { insertPostmortem, fetchPostmortems } from '../db/supabase.js';

const router = Router();

router.post('/', async (req, res) => {
  const { incident_id, title, content } = req.body;
  if (!content) return res.status(400).json({ error: 'content is required' });
  try {
    const pm = await insertPostmortem({ incident_id, title, content });
    res.json(pm);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const pms = await fetchPostmortems();
    res.json(pms);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
