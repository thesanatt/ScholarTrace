const express = require('express');
const router = express.Router();

router.post('/login', (req, res) => {
  const { username, password } = req.body;

  console.log('🛂 Login attempt:', username, password); // helpful debug

  if (username === 'admin' && password === 'scholartrace123') {
    return res.json({ token: 'valid-token' });
  }

  return res.status(401).json({ message: 'Invalid username or password' });
});

module.exports = router;