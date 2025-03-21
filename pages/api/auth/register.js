export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { email, password, name } = req.body;

    console.log('Registration attempt:', { email, password, name });
    res.status(201).json({ message: 'Registration successful (placeholder)' });
  } else {
    res.status(405).json({ message: 'Method Not Allowed' });
  }
}
