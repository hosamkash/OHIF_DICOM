/** Lightweight probe: confirms Vercel serverless functions are deployed. */
module.exports = (req, res) => {
  res.status(200).json({
    ok: true,
    orthancUrl: process.env.ORTHANC_URL || 'https://orthanc.vigilhub.app',
    orthancAuthConfigured: Boolean(process.env.ORTHANC_PASSWORD),
  });
};
