const router = require('express').Router();
const auth = require('../middlewares/auth.middleware');
const shop = require('../middlewares/shop.middleware');
const authorizeRoles = require('../middlewares/role.middleware');
const {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser
} = require('../controllers/shopusers.controller');

router.get('/',       auth, shop, getUsers);
router.post('/',      auth, shop, authorizeRoles('shop_admin'), createUser);
router.get('/:id',    auth, shop, getUserById);
router.put('/:id',    auth, shop, authorizeRoles('shop_admin'), updateUser);
router.delete('/:id', auth, shop, authorizeRoles('shop_admin'), deleteUser);

module.exports = router;