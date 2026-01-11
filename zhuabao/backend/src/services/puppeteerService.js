import puppeteer from 'puppeteer';

const TARGET_URL = 'https://172-20-130-13.atrust.ecut.edu.cn/jwglxt/cjcx/cjcx_cxDgXscj.html?gnmkdm=N305005&layout=default';

class PuppeteerService {
  constructor() {
    this.browser = null;
    this.page = null;
    this.isMonitoring = false;
    this.capturedData = [];
  }

  async init() {
    try {
      this.browser = await puppeteer.launch({
        headless: 'new',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--disable-gpu',
          '--window-size=1920,1080'
        ]
      });
      this.page = await this.browser.newPage();
      
      await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
      
      await this.page.setViewport({ width: 1920, height: 1080 });
      
      await this.setupNetworkInterception();
      
      return true;
    } catch (error) {
      console.error('初始化浏览器失败:', error);
      throw error;
    }
  }

  async setupNetworkInterception() {
    this.capturedData = [];
    
    this.page.on('response', async (response) => {
      const url = response.url();
      
      try {
        if (url.includes('cjcx') || url.includes('grade') || url.includes('score') || url.includes('api')) {
          const contentType = response.headers()['content-type'] || '';
          
          if (contentType.includes('application/json') || contentType.includes('text/html') || contentType.includes('text/plain')) {
            try {
              const data = await response.json();
              this.capturedData.push({
                url,
                type: 'json',
                data,
                timestamp: new Date().toISOString()
              });
            } catch (e) {
              try {
                const text = await response.text();
                this.capturedData.push({
                  url,
                  type: 'text',
                  data: text,
                  timestamp: new Date().toISOString()
                });
              } catch (textError) {
                console.log('无法获取响应内容:', url);
              }
            }
          }
        }
      } catch (error) {
        console.log('处理响应时出错:', error.message);
      }
    });
  }

  async navigateToTarget() {
    try {
      await this.page.goto(TARGET_URL, {
        waitUntil: 'networkidle2',
        timeout: 60000
      });
      
      await this.randomDelay(2000, 4000);
      
      const pageContent = await this.page.content();
      
      return {
        success: true,
        content: pageContent,
        capturedData: this.capturedData
      };
    } catch (error) {
      console.error('导航到目标页面失败:', error);
      throw error;
    }
  }

  async extractPageData() {
    try {
      const pageData = await this.page.evaluate(() => {
        const result = {
          title: document.title,
          tables: [],
          forms: []
        };
        
        const tables = document.querySelectorAll('table');
        tables.forEach(table => {
          const rows = [];
          const tableRows = table.querySelectorAll('tr');
          tableRows.forEach(row => {
            const cells = [];
            const tableCells = row.querySelectorAll('td, th');
            tableCells.forEach(cell => {
              cells.push(cell.textContent.trim());
            });
            if (cells.length > 0) {
              rows.push(cells);
            }
          });
          if (rows.length > 0) {
            result.tables.push(rows);
          }
        });
        
        const scripts = Array.from(document.querySelectorAll('script'))
          .map(script => script.textContent)
          .filter(text => text.includes('score') || text.includes('grade') || text.includes('成绩'));
        
        result.scripts = scripts;
        
        return result;
      });
      
      return {
        success: true,
        data: pageData,
        capturedData: this.capturedData
      };
    } catch (error) {
      console.error('提取页面数据失败:', error);
      throw error;
    }
  }

  async waitForDataLoad(timeout = 30000) {
    try {
      await this.page.waitForFunction(
        () => {
          const tables = document.querySelectorAll('table');
          return tables.length > 0 && tables[0].rows.length > 1;
        },
        { timeout }
      );
      return true;
    } catch (error) {
      console.log('等待数据加载超时，继续执行');
      return false;
    }
  }

  async randomDelay(min, max) {
    const delay = Math.floor(Math.random() * (max - min + 1)) + min;
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.page = null;
      this.isMonitoring = false;
    }
  }

  async getScreenshot() {
    if (!this.page) {
      throw new Error('浏览器未初始化');
    }
    return await this.page.screenshot({ encoding: 'base64' });
  }

  async refreshPage() {
    if (!this.page) {
      throw new Error('浏览器未初始化');
    }
    
    this.capturedData = [];
    await this.page.reload({ waitUntil: 'networkidle2', timeout: 60000 });
    await this.randomDelay(2000, 4000);
    
    return await this.extractPageData();
  }
}

export default PuppeteerService;
