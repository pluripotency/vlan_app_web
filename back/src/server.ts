import express from 'express';
import cors from 'cors';
import path from 'path';
import { RedisStore } from 'connect-redis';
import session from 'express-session';
import config from './config'
import redis from './models/redis';
import cookieParser from 'cookie-parser';
import { postFortinetAdvisories } from './fortinetitems';
import { postAlmalinuxBlog } from './almalinuxitems';
import { postPaloAltoAdvisories } from './paloaltoitems';
import { maintainLatestRss, registerMaintainLatestRssSchedule } from './maintainLatestRss';
const url_root = config.url_root
const app = express();
const port = config.server.port;

app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());
app.use(session({
  store: new RedisStore({
    client: redis,
    prefix: config.redis.session.key
  }),
  resave: false,
  saveUninitialized: false,
  secret: config.redis.session.secret,
  cookie: config.redis.session.cookie
}));

// Serve static files from dist directory
app.use(url_root, express.static(path.join(__dirname, '../dist')));

// Get Fortinet RSS feed with Redis caching
app.post(url_root + 'api/rss/fortinet', postFortinetAdvisories);

// Get AlmaLinux blog RSS feed with Redis caching
app.post(url_root + 'api/rss/almalinux', postAlmalinuxBlog);

// Get PaloAlto Networks security advisories RSS feed with Redis caching
app.post(url_root + 'api/rss/paloalto', postPaloAltoAdvisories);

// Session preferences API
app.get(url_root + 'api/preferences', (req, res) => {
  const preferences = (req.session as any).preferences || {};
  res.json({ success: true, data: preferences });
});

app.post(url_root + 'api/preferences', (req, res) => {
  if (!req.session) {
    return res.status(500).json({ success: false, error: 'Session not available' });
  }
  (req.session as any).preferences = req.body;
  res.json({ success: true });
});

app.listen(port, () => {
  console.log(`Backend server running on port ${port}`);

  maintainLatestRss().catch(error => {
    console.error('[maintainLatestRss] Initial run failed', error);
  });

  registerMaintainLatestRssSchedule();
});
