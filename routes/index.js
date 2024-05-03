import express from 'express';
const router = express.Router();
import viewRoutes from './views.js';
import apiRoutes from './api.js';

router.use('/api', apiRoutes);
router.use(viewRoutes)

export default router