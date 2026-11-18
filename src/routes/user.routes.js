const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const validate = require('../middleware/validate');
const userValidation = require('../validations/user.validation');
const { authenticate, authorize } = require('../middleware/auth');
const { ROLES } = require('../utils/constants');

router.use(authenticate);

router.post(
  '/',
  authorize(ROLES.ADMIN),
  validate(userValidation.createUser),
  userController.createUser
);

router.get(
  '/',
  authorize(ROLES.ADMIN, ROLES.FACULTY),
  validate(userValidation.listUsers),
  userController.getUsers
);

router.get(
  '/:userId',
  validate(userValidation.getUserById),
  userController.getUserById
);

router.patch(
  '/:userId',
  authorize(ROLES.ADMIN),
  validate(userValidation.updateUser),
  userController.updateUser
);

router.delete(
  '/:userId',
  authorize(ROLES.ADMIN),
  validate(userValidation.getUserById),
  userController.deleteUser
);

module.exports = router;
