const { z, optional, code, page, limit, year, month } = require('./common');

const listSchoolsQuery = z.object({
  districtCode: optional(code),
  blockCode: optional(code),
  clusterCode: optional(code),
  search: optional(z.string().trim().max(100).transform((s) => s.replace(/\s+/g, ' '))),
  page,
  limit,
});

const listBlocksQuery = z.object({
  districtCode: code,
});

const answerValue = z.union([z.boolean(), z.number(), z.string(), z.null()], {
  errorMap: () => ({ message: 'must be a boolean, number, string or null' }),
});

const createVisitBody = z.object({
                                                                                        
  clientId: z.string().trim().uuid('must be a UUID').transform((s) => s.toLowerCase()),
  userId: z.string().trim().min(1),
  udiseCode: code,
  visitedAt: z
    .string()
    .datetime({ offset: true, message: 'must be an ISO 8601 date-time with a timezone, e.g. 2026-09-28T05:32:10.000Z' })
    .transform((s) => new Date(s)),
  answers: z
    .array(
      z.object({
        questionId: z.string().trim().min(1),
        value: answerValue,
      }),
    )
    .max(200),
});

const withMonthNeedsYear = (schema) =>
  schema.refine((q) => q.month === undefined || q.year !== undefined, {
    message: 'year is required when month is given',
    path: ['year'],
  });

const listVisitsQuery = withMonthNeedsYear(
  z.object({
    userId: z.string().trim().min(1),
    month: optional(month),
    year: optional(year),
    page,
    limit,
  }),
);

const blockSummaryQuery = z
  .object({
    districtCode: code,
    month: optional(month),
    year: optional(year),
  })
  .refine((q) => (q.month === undefined) === (q.year === undefined), {
    message: 'give both month and year, or neither for the current month in India time',
    path: ['month'],
  });

module.exports = {
  listSchoolsQuery,
  listBlocksQuery,
  createVisitBody,
  listVisitsQuery,
  blockSummaryQuery,
};
