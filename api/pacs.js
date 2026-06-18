/**
 * Vercel server-side proxy → https://orthanc.vigilhub.app
 * /pacs/* is rewritten here as ?orthancPath=... (catch-all folders need Next.js).
 */
function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

async function handler(req, res) {
  const user = process.env.ORTHANC_USERNAME || 'orthanc';
  const pass = process.env.ORTHANC_PASSWORD || '';
  const orthancBase = (process.env.ORTHANC_URL || 'https://orthanc.vigilhub.app').replace(/\/$/, '');

  if (!pass) {
    res.status(503).json({
      error: 'ORTHANC_PASSWORD is not configured on Vercel (Project → Settings → Environment Variables).',
    });
    return;
  }

  const rawPath = req.query.orthancPath;
  const path = Array.isArray(rawPath) ? rawPath.join('/') : String(rawPath || '').replace(/^\/+/, '');

  if (!path) {
    res.status(400).json({ error: 'Missing orthancPath (use /pacs/... or ?orthancPath=...)' });
    return;
  }

  const qs = new URL(req.url || '/', 'http://localhost').searchParams;
  qs.delete('orthancPath');
  const queryString = qs.toString();
  const targetUrl = `${orthancBase}/${path}${queryString ? `?${queryString}` : ''}`;

  const auth = `Basic ${Buffer.from(`${user}:${pass}`).toString('base64')}`;
  const forwardHeaders = { Authorization: auth };

  if (req.headers.accept) forwardHeaders.Accept = req.headers.accept;
  if (req.headers['content-type']) forwardHeaders['Content-Type'] = req.headers['content-type'];

  const init = {
    method: req.method,
    headers: forwardHeaders,
  };

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    init.body = await readBody(req);
  }

  try {
    const upstream = await fetch(targetUrl, init);
    res.status(upstream.status);
    upstream.headers.forEach((value, key) => {
      const lower = key.toLowerCase();
      if (lower === 'transfer-encoding' || lower === 'connection') return;
      res.setHeader(key, value);
    });
    res.setHeader('Cache-Control', 'no-store');
    const body = Buffer.from(await upstream.arrayBuffer());
    res.send(body);
  } catch (err) {
    res.status(502).json({
      error: 'Orthanc proxy failed',
      detail: err instanceof Error ? err.message : String(err),
    });
  }
}

module.exports = handler;
module.exports.config = {
  api: {
    bodyParser: false,
  },
};
