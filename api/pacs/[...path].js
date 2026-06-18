/**
 * Vercel server-side proxy → https://orthanc.vigilhub.app
 * Credentials stay in Vercel env (ORTHANC_USERNAME / ORTHANC_PASSWORD), not in browser JS.
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

  const { path: pathSegments } = req.query;
  const path = Array.isArray(pathSegments)
    ? pathSegments.join('/')
    : String(pathSegments || '');

  const qsIndex = req.url.indexOf('?');
  const qs = qsIndex >= 0 ? req.url.slice(qsIndex) : '';
  const targetUrl = `${orthancBase}/${path}${qs}`;

  const auth = `Basic ${Buffer.from(`${user}:${pass}`).toString('base64')}`;
  const forwardHeaders = {
    Authorization: auth,
  };

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
