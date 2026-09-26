const path = require('path');
const express = require('express');
const cors = require('cors');
const env = require('./config/env');
const routes = require('./routes');
const requestLogger = require('./middlewares/requestLogger');
const { errorHandler, notFoundHandler } = require('./middlewares/errorHandler');

const app = express();
const faviconPath = path.join(__dirname, '..', 'frontend', 'assets', 'favicon.svg');

const corsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = Array.isArray(env.cors.origin)
      ? env.cors.origin
      : [env.cors.origin || '*'];
    const allowAllOrigins = allowedOrigins.includes('*');

    if (allowAllOrigins || !origin) {
      callback(null, true);
      return;
    }

    const localHosts = ['http://localhost:3000', 'http://localhost:3001', 'http://127.0.0.1:3000', 'http://127.0.0.1:3001'];

    if (localHosts.includes(origin) || origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
      callback(null, true);
      return;
    }

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error(`Origem não permitida pelo CORS: ${origin}`));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};

// --- Middlewares globais ---
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

// --- Arquivos estáticos do frontend (Terminal, Operador, Painel) ---
const FRONTEND_DIR = path.join(__dirname, '..', 'frontend');
app.use('/assets', express.static(path.join(FRONTEND_DIR, 'assets')));
app.use('/terminal', express.static(path.join(FRONTEND_DIR, 'terminal')));
app.use('/operador', express.static(path.join(FRONTEND_DIR, 'operador')));
app.use('/painel', express.static(path.join(FRONTEND_DIR, 'painel')));

app.get('/favicon.ico', (req, res) => {
  res.sendFile(faviconPath);
});

app.get('/', (req, res) => {
  res.redirect('/terminal');
});

// --- API ---
app.use('/api', routes);

// --- Tratamento de erros (deve vir por último) ---
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
