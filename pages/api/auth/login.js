export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { email, password } = req.body;

    if (email === 'test@example.com' && password === 'password') {
      // Simulate a successful login and set a token
      res.status(200).json({ token: 'placeholder_jwt_token' });
    } else {
      res.status(401).json({ message: 'Invalid credentials' });
    }
  } else {
    res.status(405).json({ message: 'Method Not Allowed' });
  }
}
