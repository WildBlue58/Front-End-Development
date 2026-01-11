import express from 'express';
import GradeController from '../controllers/gradeController.js';

const router = express.Router();
const gradeController = new GradeController();

router.get('/extract', (req, res) => gradeController.extractGrades(req, res));

router.get('/refresh', (req, res) => gradeController.refreshGrades(req, res));

router.get('/current', (req, res) => gradeController.getCurrentGrades(req, res));

router.get('/export/excel', (req, res) => gradeController.exportToExcel(req, res));

router.get('/export/csv', (req, res) => gradeController.exportToCSV(req, res));

router.get('/status', (req, res) => gradeController.getStatus(req, res));

router.post('/close', (req, res) => gradeController.closeBrowser(req, res));

export default router;
