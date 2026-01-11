import { load } from 'cheerio';

class GradeParser {
  constructor() {
    this.gradePatterns = {
      regularScore: ['平时', '平时分', '平时成绩', '平时作业', '课堂表现', '出勤'],
      finalScore: ['期末', '期末分', '期末成绩', '期末考试', '期末卷面'],
      totalScore: ['总评', '总分', '总成绩', '综合成绩', '最终成绩']
    };
  }

  parseFromHTML(html) {
    const $ = load(html);
    const grades = [];

    $('table').each((tableIndex, table) => {
      const $table = $(table);
      const headers = this.extractHeaders($table);
      
      if (this.isGradeTable(headers)) {
        const gradeData = this.extractGradeData($table, headers);
        grades.push(...gradeData);
      }
    });

    return this.normalizeGrades(grades);
  }

  parseFromJSON(jsonData) {
    const grades = [];

    if (Array.isArray(jsonData)) {
      jsonData.forEach(item => {
        const grade = this.extractGradeFromObject(item);
        if (grade) {
          grades.push(grade);
        }
      });
    } else if (typeof jsonData === 'object' && jsonData !== null) {
      const grade = this.extractGradeFromObject(jsonData);
      if (grade) {
        grades.push(grade);
      }
      
      Object.values(jsonData).forEach(value => {
        if (Array.isArray(value)) {
          value.forEach(item => {
            const g = this.extractGradeFromObject(item);
            if (g) {
              grades.push(g);
            }
          });
        }
      });
    }

    return this.normalizeGrades(grades);
  }

  extractFromPageData(pageData) {
    let grades = [];

    if (pageData.content) {
      grades = grades.concat(this.parseFromHTML(pageData.content));
    }

    if (pageData.data && pageData.data.tables) {
      pageData.data.tables.forEach(table => {
        const gradeData = this.parseFromTableArray(table);
        grades = grades.concat(gradeData);
      });
    }

    if (pageData.capturedData) {
      pageData.capturedData.forEach(captured => {
        if (captured.type === 'json' && captured.data) {
          const jsonGrades = this.parseFromJSON(captured.data);
          grades = grades.concat(jsonGrades);
        }
      });
    }

    return this.normalizeGrades(grades);
  }

  extractHeaders($table) {
    const headers = [];
    $table.find('tr').first().find('th, td').each((index, element) => {
      headers.push($(element).text().trim());
    });
    return headers;
  }

  isGradeTable(headers) {
    const headerText = headers.join(' ').toLowerCase();
    return headerText.includes('课程') || 
           headerText.includes('科目') || 
           headerText.includes('成绩') ||
           headerText.includes('分数');
  }

  extractGradeData($table, headers) {
    const grades = [];
    const rows = $table.find('tr').slice(1);

    rows.each((rowIndex, row) => {
      const $row = $(row);
      const cells = [];
      
      $row.find('td').each((cellIndex, cell) => {
        cells.push($(cell).text().trim());
      });

      if (cells.length > 0) {
        const grade = this.mapCellsToGrade(headers, cells);
        if (grade && (grade.courseName || grade.regularScore || grade.finalScore)) {
          grades.push(grade);
        }
      }
    });

    return grades;
  }

  parseFromTableArray(table) {
    const grades = [];
    
    if (table.length < 2) {
      return grades;
    }

    const headers = table[0];
    const rows = table.slice(1);

    rows.forEach(row => {
      const grade = this.mapCellsToGrade(headers, row);
      if (grade && (grade.courseName || grade.regularScore || grade.finalScore)) {
        grades.push(grade);
      }
    });

    return grades;
  }

  mapCellsToGrade(headers, cells) {
    const grade = {
      courseName: '',
      regularScore: null,
      finalScore: null,
      totalScore: null,
      credit: null,
      gpa: null,
      semester: '',
      examType: ''
    };

    headers.forEach((header, index) => {
      const cellValue = cells[index] || '';
      
      if (this.containsKeyword(header, this.gradePatterns.regularScore)) {
        grade.regularScore = this.parseScore(cellValue);
      } else if (this.containsKeyword(header, this.gradePatterns.finalScore)) {
        grade.finalScore = this.parseScore(cellValue);
      } else if (this.containsKeyword(header, this.gradePatterns.totalScore)) {
        grade.totalScore = this.parseScore(cellValue);
      } else if (header.includes('课程') || header.includes('科目') || header.includes('名称')) {
        grade.courseName = cellValue;
      } else if (header.includes('学分')) {
        grade.credit = this.parseScore(cellValue);
      } else if (header.includes('绩点') || header.includes('GPA')) {
        grade.gpa = this.parseScore(cellValue);
      } else if (header.includes('学期')) {
        grade.semester = cellValue;
      } else if (header.includes('考试') || header.includes('类型')) {
        grade.examType = cellValue;
      }
    });

    if (!grade.courseName && cells.length > 0) {
      grade.courseName = cells[0];
    }

    return grade;
  }

  extractGradeFromObject(obj) {
    if (!obj || typeof obj !== 'object') {
      return null;
    }

    const grade = {
      courseName: '',
      regularScore: null,
      finalScore: null,
      totalScore: null,
      credit: null,
      gpa: null,
      semester: '',
      examType: ''
    };

    Object.entries(obj).forEach(([key, value]) => {
      const keyLower = key.toLowerCase();
      
      if (this.containsKeyword(key, this.gradePatterns.regularScore)) {
        grade.regularScore = this.parseScore(value);
      } else if (this.containsKeyword(key, this.gradePatterns.finalScore)) {
        grade.finalScore = this.parseScore(value);
      } else if (this.containsKeyword(key, this.gradePatterns.totalScore)) {
        grade.totalScore = this.parseScore(value);
      } else if (keyLower.includes('course') || keyLower.includes('subject') || keyLower.includes('name')) {
        grade.courseName = String(value || '');
      } else if (keyLower.includes('credit')) {
        grade.credit = this.parseScore(value);
      } else if (keyLower.includes('gpa') || keyLower.includes('point')) {
        grade.gpa = this.parseScore(value);
      } else if (keyLower.includes('semester') || keyLower.includes('term')) {
        grade.semester = String(value || '');
      } else if (keyLower.includes('exam') || keyLower.includes('type')) {
        grade.examType = String(value || '');
      }
    });

    if (grade.courseName || grade.regularScore !== null || grade.finalScore !== null) {
      return grade;
    }

    return null;
  }

  containsKeyword(text, keywords) {
    const textLower = String(text).toLowerCase();
    return keywords.some(keyword => textLower.includes(keyword.toLowerCase()));
  }

  parseScore(value) {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    const strValue = String(value).trim();
    
    const match = strValue.match(/(\d+\.?\d*)/);
    if (match) {
      return parseFloat(match[1]);
    }

    return null;
  }

  normalizeGrades(grades) {
    const uniqueGrades = [];
    const seen = new Set();

    grades.forEach(grade => {
      const key = `${grade.courseName}_${grade.semester}_${grade.examType}`;
      
      if (!seen.has(key) && (grade.courseName || grade.regularScore !== null || grade.finalScore !== null)) {
        seen.add(key);
        
        if (grade.totalScore === null && grade.regularScore !== null && grade.finalScore !== null) {
          grade.totalScore = parseFloat(((grade.regularScore + grade.finalScore) / 2).toFixed(2));
        }

        uniqueGrades.push(grade);
      }
    });

    return uniqueGrades;
  }

  calculateStatistics(grades) {
    const stats = {
      totalCourses: grades.length,
      averageRegular: 0,
      averageFinal: 0,
      averageTotal: 0,
      maxTotal: 0,
      minTotal: 100,
      passedCourses: 0,
      failedCourses: 0
    };

    let regularSum = 0;
    let finalSum = 0;
    let totalSum = 0;
    let regularCount = 0;
    let finalCount = 0;
    let totalCount = 0;

    grades.forEach(grade => {
      if (grade.regularScore !== null) {
        regularSum += grade.regularScore;
        regularCount++;
      }
      if (grade.finalScore !== null) {
        finalSum += grade.finalScore;
        finalCount++;
      }
      if (grade.totalScore !== null) {
        totalSum += grade.totalScore;
        totalCount++;
        stats.maxTotal = Math.max(stats.maxTotal, grade.totalScore);
        stats.minTotal = Math.min(stats.minTotal, grade.totalScore);
        
        if (grade.totalScore >= 60) {
          stats.passedCourses++;
        } else {
          stats.failedCourses++;
        }
      }
    });

    stats.averageRegular = regularCount > 0 ? parseFloat((regularSum / regularCount).toFixed(2)) : 0;
    stats.averageFinal = finalCount > 0 ? parseFloat((finalSum / finalCount).toFixed(2)) : 0;
    stats.averageTotal = totalCount > 0 ? parseFloat((totalSum / totalCount).toFixed(2)) : 0;
    stats.minTotal = totalCount > 0 ? stats.minTotal : 0;

    return stats;
  }
}

export default GradeParser;
