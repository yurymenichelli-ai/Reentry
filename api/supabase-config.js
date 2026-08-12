export default function handler(request, response) {
  response.setHeader('Cache-Control', 'public, max-age=300, s-maxage=300');
  response.status(200).json({
    url: process.env.SUPABASE_URL || '',
    publishableKey: process.env.SUPABASE_PUBLISHABLE_KEY || ''
  });
}
