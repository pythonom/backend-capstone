const ApiError = require('../utils/apiError');

const validate = (schema) => (req, res, next) => {
  const validSchema = {};
  ['params', 'query', 'body'].forEach((key) => {
    if (schema[key]) {
      validSchema[key] = schema[key];
    }
  });

  const object = {};
  ['params', 'query', 'body'].forEach((key) => {
    if (schema[key]) {
      object[key] = req[key];
    }
  });

  const { value, error } = require('joi').compile(validSchema)
    .prefs({ errors: { label: 'key' }, abortEarly: false })
    .validate(object);

  if (error) {
    const errorDetails = error.details.map((details) => ({
      field: details.path.join('.'),
      message: details.message.replace(/['"]/g, '')
    }));
    return next(new ApiError(400, 'Validation Error', errorDetails));
  }

  Object.assign(req, value);
  return next();
};

module.exports = validate;
