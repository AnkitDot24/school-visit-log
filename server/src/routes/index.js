const express = require('express');
const asyncHandler = require('../middleware/asyncHandler');
const { validateQuery, validateBody } = require('../middleware/validate');
const schemas = require('../validators/schemas');
const schools = require('../controllers/schoolController');
const questionnaires = require('../controllers/questionnaireController');
const visits = require('../controllers/visitController');
const reports = require('../controllers/reportController');

const router = express.Router();

router.get('/health', (req, res) => res.json({ status: 'ok' }));

router.get('/schools', validateQuery(schemas.listSchoolsQuery), asyncHandler(schools.list));
                                                             
router.get('/locations/districts', asyncHandler(schools.listDistricts));
router.get('/locations/blocks', validateQuery(schemas.listBlocksQuery), asyncHandler(schools.listBlocks));

router.get('/questionnaires/current', asyncHandler(questionnaires.current));

router.post('/visits', validateBody(schemas.createVisitBody), asyncHandler(visits.create));
router.get('/visits', validateQuery(schemas.listVisitsQuery), asyncHandler(visits.list));

router.get('/reports/block-summary', validateQuery(schemas.blockSummaryQuery), asyncHandler(reports.blockSummary));

module.exports = router;
