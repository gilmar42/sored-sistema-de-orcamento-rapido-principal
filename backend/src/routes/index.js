const express = require('express');
const router = express.Router();

router.use('/payments', require('./payment'));

module.exports = router;
