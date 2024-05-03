import express from 'express';
import path from 'path';

const router = express.Router(); // Create a new router instance

// View routes

router.get('/', (req, res) => {
  res.sendFile( path.join(__dirname, '..', 'public', 'index.html'))
})

router.get('/how-to', (req, res) => {
  res.sendFile( path.join(__dirname, '..', 'public', 'pages', 'how-to.html'))
})

router.get('/orders', (req, res) => {
  res.sendFile( path.join(__dirname, '..', 'public', 'pages', 'orders.html'))
})

export default router;
