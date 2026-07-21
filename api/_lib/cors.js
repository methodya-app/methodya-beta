// Envuelve un handler de Vercel para aplicar CORS y capturar errores en un
// formato JSON consistente. Uso: export default withCors(async (req, res) => {...})
export function withCors(handler) {
  return async (req, res) => {
    const origin = process.env.ALLOWED_ORIGIN || '*';
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
      res.status(204).end();
      return;
    }

    try {
      await handler(req, res);
    } catch (err) {
      console.error('API error:', err);
      if (!res.headersSent) {
        res.status(err.statusCode || 500).json({
          error: err.message || 'Error interno del servidor',
        });
      }
    }
  };
}

export class ApiError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
  }
}
