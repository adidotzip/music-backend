import express from 'express';
import cors from 'cors';
import YTMusic from 'ytmusic-api';

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Global unauthenticated YTMusic instance
const globalYtmusic = new YTMusic();
let globalInitPromise = globalYtmusic.initialize();

// Middleware to handle header-based auth
app.use(async (req, res, next) => {
  const authHeader = req.headers.authorization || req.headers.cookie;

  if (authHeader) {
    try {
      const ytmusic = new YTMusic();
      // Assume authHeader might be exactly the cookies needed
      await ytmusic.initialize({ cookies: authHeader });
      req.ytmusic = ytmusic;
    } catch (error) {
      console.error('Failed to initialize authenticated YTMusic instance:', error);
      // Fallback to global instance if auth fails, or we could return 401
      await globalInitPromise;
      req.ytmusic = globalYtmusic;
    }
  } else {
    await globalInitPromise;
    req.ytmusic = globalYtmusic;
  }
  next();
});

// Endpoint: Search
app.get('/api/search', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.status(400).json({ error: 'Missing query parameter "q"' });
    }
    const results = await req.ytmusic.search(q);
    res.json(results);
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Endpoint: Artist Details
app.get('/api/artist/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const artist = await req.ytmusic.getArtist(id);
    res.json(artist);
  } catch (error) {
    console.error('Artist error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Endpoint: Playlist Tracks
app.get('/api/playlist/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const playlistVideos = await req.ytmusic.getPlaylistVideos(id);
    res.json(playlistVideos);
  } catch (error) {
    console.error('Playlist error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Default error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

export default app;
