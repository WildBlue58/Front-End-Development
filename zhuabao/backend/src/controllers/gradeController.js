import PuppeteerService from '../services/puppeteerService.js';
import GradeParser from '../services/gradeParser.js';
import XLSX from 'xlsx';
import { createObjectCsvWriter } from 'csv-writer';

class GradeController {
  constructor() {
    this.puppeteerService = new PuppeteerService();
    this.gradeParser = new GradeParser();
    this.currentGrades = [];
    this.isInitialized = false;
  }

  async initialize() {
    if (!this.isInitialized) {
      await this.puppeteerService.init();
      this.isInitialized = true;
    }
  }

  async extractGrades(req, res) {
    try {
      await this.initialize();

      const result = await this.puppeteerService.navigateToTarget();
      
      await this.puppeteerService.waitForDataLoad(30000);

      const pageData = await this.puppeteerService.extractPageData();

      const grades = this.gradeParser.extractFromPageData(pageData);
      const stats = this.gradeParser.calculateStatistics(grades);

      this.currentGrades = grades;

      res.json({
        success: true,
        data: grades,
        statistics: stats,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('提取成绩失败:', error);
      res.status(500).json({
        success: false,
        message: error.message || '提取成绩失败',
        error: error.toString()
      });
    }
  }

  async refreshGrades(req, res) {
    try {
      if (!this.isInitialized) {
        return res.status(400).json({
          success: false,
          message: '请先初始化浏览器'
        });
      }

      const pageData = await this.puppeteerService.refreshPage();
      
      const grades = this.gradeParser.extractFromPageData(pageData);
      const stats = this.gradeParser.calculateStatistics(grades);

      this.currentGrades = grades;

      res.json({
        success: true,
        data: grades,
        statistics: stats,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('刷新成绩失败:', error);
      res.status(500).json({
        success: false,
        message: error.message || '刷新成绩失败',
        error: error.toString()
      });
    }
  }

  async getCurrentGrades(req, res) {
    try {
      if (this.currentGrades.length === 0) {
        return res.status(404).json({
          success: false,
          message: '暂无成绩数据，请先提取成绩'
        });
      }

      const stats = this.gradeParser.calculateStatistics(this.currentGrades);

      res.json({
        success: true,
        data: this.currentGrades,
        statistics: stats,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('获取当前成绩失败:', error);
      res.status(500).json({
        success: false,
        message: error.message || '获取当前成绩失败',
        error: error.toString()
      });
    }
  }

  async exportToExcel(req, res) {
    try {
      if (this.currentGrades.length === 0) {
        return res.status(404).json({
          success: false,
          message: '暂无成绩数据，请先提取成绩'
        });
      }

      const worksheetData = [
        ['课程名称', '平时分', '期末分', '总分', '学分', '绩点', '学期', '考试类型']
      ];

      this.currentGrades.forEach(grade => {
        worksheetData.push([
          grade.courseName || '',
          grade.regularScore !== null ? grade.regularScore : '',
          grade.finalScore !== null ? grade.finalScore : '',
          grade.totalScore !== null ? grade.totalScore : '',
          grade.credit !== null ? grade.credit : '',
          grade.gpa !== null ? grade.gpa : '',
          grade.semester || '',
          grade.examType || ''
        ]);
      });

      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
      XLSX.utils.book_append_sheet(workbook, worksheet, '成绩表');

      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

      const filename = `成绩导出_${new Date().getTime()}.xlsx`;

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);

      res.send(buffer);
    } catch (error) {
      console.error('导出 Excel 失败:', error);
      res.status(500).json({
        success: false,
        message: error.message || '导出 Excel 失败',
        error: error.toString()
      });
    }
  }

  async exportToCSV(req, res) {
    try {
      if (this.currentGrades.length === 0) {
        return res.status(404).json({
          success: false,
          message: '暂无成绩数据，请先提取成绩'
        });
      }

      const filename = `成绩导出_${new Date().getTime()}.csv`;
      const filepath = `./${filename}`;

      const csvWriter = createObjectCsvWriter({
        path: filepath,
        header: [
          { id: 'courseName', title: '课程名称' },
          { id: 'regularScore', title: '平时分' },
          { id: 'finalScore', title: '期末分' },
          { id: 'totalScore', title: '总分' },
          { id: 'credit', title: '学分' },
          { id: 'gpa', title: '绩点' },
          { id: 'semester', title: '学期' },
          { id: 'examType', title: '考试类型' }
        ]
      });

      await csvWriter.writeRecords(this.currentGrades);

      res.download(filepath, filename, (err) => {
        if (err) {
          console.error('下载 CSV 失败:', err);
        }
      });
    } catch (error) {
      console.error('导出 CSV 失败:', error);
      res.status(500).json({
        success: false,
        message: error.message || '导出 CSV 失败',
        error: error.toString()
      });
    }
  }

  async getStatus(req, res) {
    try {
      res.json({
        success: true,
        data: {
          isInitialized: this.isInitialized,
          hasGrades: this.currentGrades.length > 0,
          gradesCount: this.currentGrades.length
        }
      });
    } catch (error) {
      console.error('获取状态失败:', error);
      res.status(500).json({
        success: false,
        message: error.message || '获取状态失败',
        error: error.toString()
      });
    }
  }

  async closeBrowser(req, res) {
    try {
      await this.puppeteerService.close();
      this.isInitialized = false;
      this.currentGrades = [];

      res.json({
        success: true,
        message: '浏览器已关闭'
      });
    } catch (error) {
      console.error('关闭浏览器失败:', error);
      res.status(500).json({
        success: false,
        message: error.message || '关闭浏览器失败',
        error: error.toString()
      });
    }
  }
}

export default GradeController;
