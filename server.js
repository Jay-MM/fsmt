import express from 'express';
import routes from './routes/index.js'; // Update the import path

const app = express();
const PORT = process.env.PORT || 3001;

// Specify the path to your favicon.ico file
app.use(express.static('public'))
app.use(express.json())
app.use(routes)

app.listen(PORT, () => {
  console.log(`Server listening at http://localhost:${PORT}`)
})
