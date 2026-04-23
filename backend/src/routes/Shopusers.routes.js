const router = require('express').Router();
const auth = require('../middlewares/auth.middleware');
const shop = require('../middlewares/shop.middleware');
const {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser
} = require('../controllers/shopusers.controller');

router.get('/',      auth, shop, getUsers);
router.post('/',     auth, shop, createUser);
router.get('/:id',  auth, shop, getUserById);
router.put('/:id',  auth, shop, updateUser);
router.delete('/:id', auth, shop, deleteUser);

module.exports = router;