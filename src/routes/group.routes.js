const express = require('express');
const router = express.Router();
const groupController = require('../controllers/group.controller');
const validate = require('../middleware/validate');
const groupValidation = require('../validations/group.validation');
const { authenticate, authorize } = require('../middleware/auth');
const { ROLES } = require('../utils/constants');

router.use(authenticate);

router.post(
  '/',
  authorize(ROLES.ADMIN),
  validate(groupValidation.createGroup),
  groupController.createGroup
);

router.get('/', groupController.getGroups);

router.get(
  '/:groupId',
  validate(groupValidation.getGroupById),
  groupController.getGroupById
);

router.patch(
  '/:groupId',
  authorize(ROLES.ADMIN),
  validate(groupValidation.updateGroup),
  groupController.updateGroup
);

router.delete(
  '/:groupId',
  authorize(ROLES.ADMIN),
  validate(groupValidation.getGroupById),
  groupController.deleteGroup
);

module.exports = router;
