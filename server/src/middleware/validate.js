const { badRequest } = require('../utils/errors');
                                                                                       
const validate = (schema, source) => (req, res, next) => {
  const result = schema.safeParse(req[source] ?? {});
  if (!result.success) {
    const details = result.error.issues.map((issue) => ({
      field: issue.path.join('.') || source,
      message: issue.message,
    }));
    const summary = details.map((d) => `${d.field} ${d.message}`).join('; ');
    return next(badRequest(`Invalid request ${source}: ${summary}`, details));
  }
  req.valid = { ...req.valid, [source]: result.data };
  return next();
};

module.exports = {
  validateQuery: (schema) => validate(schema, 'query'),
  validateBody: (schema) => validate(schema, 'body'),
};
