const router = require('express').Router();
const User = require('../models/User');
const auth = require('../middleware/auth');

router.get('/search', auth, async (req, res) => {
  try {
    const users = await User.find({
      username: { $regex: req.query.username, $options: 'i' },
      _id: { $ne: req.user.id }
    }).select('-password');
    
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Error searching users' });
  }
});

router.get('/contacts', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('contacts', '-password');
    res.json(user.contacts);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching contacts' });
  }
});

module.exports = router;