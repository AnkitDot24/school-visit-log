const { z } = require('zod');

const MAX_LIMIT = 100;

                                                            
const blankToUndefined = (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value);

const optional = (schema) => z.preprocess(blankToUndefined, schema.optional());

const code = z.string().trim().regex(/^\d+$/, 'must contain digits only');

const page = z.preprocess(blankToUndefined, z.coerce.number().int().min(1).default(1));

                                                            
const limit = z.preprocess(
  blankToUndefined,
  z.coerce.number().int().min(1).default(20).transform((value) => Math.min(value, MAX_LIMIT)),
);

const year = z.coerce.number().int().min(2000).max(2100);
const month = z.coerce.number().int().min(1).max(12);

module.exports = { z, optional, code, page, limit, year, month, MAX_LIMIT };
