/**
 * Test-Driven Security Tests for Workflow Orchestration
 * Based on workflow_orchestration_engineering.md requirements
 * 
 * Implements comprehensive test suite for security validation
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const SecurityCheck = require('./security-check');

class SecurityTestSuite {
  constructor() {
    this.testResults = [];
    this.tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'security-test-'));
    this.setupTestEnvironment();
  }

  /**
   * Setup test environment with sample files
   */
  setupTestEnvironment() {
    // Create test files with security issues
    this.createTestFile('insecure.js', `
      const password = "secret123";
      const apiKey = "sk-1234567890";
      app.get('/users', (req, res) => {
        const query = "SELECT * FROM users WHERE id = " + req.params.id;
        db.query(query, (err, results) => {
          res.json(results);
        });
      });
      document.getElementById('output').innerHTML = userInput;
      eval(userInput);
    `);

    this.createTestFile('package.json', JSON.stringify({
      dependencies: {
        "lodash": "^4.17.15",
        "axios": "^0.20.0",
        "express": "^4.18.0"
      }
    }));

    this.createTestFile('Dockerfile', `
      FROM node:18
      WORKDIR /app
      COPY . .
      RUN npm install
      EXPOSE 3000
      CMD ["node", "server.js"]
    `);

    this.createTestFile('auth.js', `
      const jwtSecret = "weaksecret";
      const token = jwt.sign({userId: 1}, jwtSecret);
      app.post('/login', (req, res) => {
        // No token expiration
        res.json({token});
      });
    `);

    this.createTestFile('.env', `
      DATABASE_URL=postgresql://user:pass@localhost/db
      JWT_SECRET=hardcoded_secret
      API_KEY=sk_live_1234567890
    `);

    this.createTestFile('server.js', `
      app.get('/public-data', (req, res) => {
        // No auth middleware
        res.json(data);
      });
      
      app.get('/admin', (req, res) => {
        // No auth middleware but should be protected
        res.json(adminData);
      });
      
      console.log('Server starting...');
      debugger;
    `);
  }

  createTestFile(filename, content) {
    const filePath = path.join(this.tempDir, filename);
    fs.writeFileSync(filePath, content);
  }

  /**
   * Run all security tests
   */
  async runAllTests() {
    console.log('🧪 Starting Security Test Suite...\n');
    
    const tests = [
      this.testSecretsDetection.bind(this),
      this.testDependencyVulnerabilityDetection.bind(this),
      this.testInputValidationDetection.bind(this),
      this.testAuthenticationSecurity.bind(this),
      this.testContainerSecurity.bind(this),
      this.testNetworkSecurity.bind(this),
      this.testAuditLoggingDetection.bind(this),
      this.testCodeQualitySecurity.bind(this),
      this.testSecurityScoreCalculation.bind(this),
      this.testReportGeneration.bind(this)
    ];

    for (const test of tests) {
      await test();
    }

    return this.generateTestReport();
  }

  /**
   * Test 1: Secrets Detection
   */
  async testSecretsDetection() {
    console.log('🧪 Testing Secrets Detection...');
    
    const securityCheck = new SecurityCheck();
    securityCheck.checkSecretsManagement();
    
    const violations = securityCheck.violations.filter(v => v.type === 'HARDCODED_SECRET');
    
    this.assert(
      violations.length >= 3,
      'Should detect at least 3 hardcoded secrets',
      'Secrets Detection'
    );
    
    this.assert(
      violations.some(v => v.file.includes('insecure.js')),
      'Should detect secrets in insecure.js',
      'Secrets Detection'
    );
    
    this.assert(
      violations.some(v => v.file.includes('.env')),
      'Should detect .env file in git',
      'Secrets Detection'
    );
    
    this.assert(
      violations.every(v => v.severity === 'CRITICAL'),
      'All secret violations should be critical',
      'Secrets Detection'
    );
  }

  /**
   * Test 2: Dependency Vulnerability Detection
   */
  async testDependencyVulnerabilityDetection() {
    console.log('🧪 Testing Dependency Vulnerability Detection...');
    
    const securityCheck = new SecurityCheck();
    securityCheck.checkDependencySecurity();
    
    const violations = securityCheck.violations.filter(v => v.type === 'VULNERABLE_DEPENDENCY');
    
    this.assert(
      violations.length >= 2,
      'Should detect at least 2 vulnerable dependencies',
      'Dependency Vulnerability Detection'
    );
    
    this.assert(
      violations.some(v => v.issue.includes('lodash')),
      'Should detect vulnerable lodash version',
      'Dependency Vulnerability Detection'
    );
    
    this.assert(
      violations.some(v => v.issue.includes('axios')),
      'Should detect vulnerable axios version',
      'Dependency Vulnerability Detection'
    );
  }

  /**
   * Test 3: Input Validation Detection
   */
  async testInputValidationDetection() {
    console.log('🧪 Testing Input Validation Detection...');
    
    const securityCheck = new SecurityCheck();
    securityCheck.checkInputValidation();
    
    const sqlViolations = securityCheck.violations.filter(v => v.type === 'SQL_INJECTION_RISK');
    const xssViolations = securityCheck.violations.filter(v => v.type === 'XSS_VULNERABILITY');
    
    this.assert(
      sqlViolations.length >= 1,
      'Should detect SQL injection vulnerability',
      'Input Validation Detection'
    );
    
    this.assert(
      xssViolations.length >= 1,
      'Should detect XSS vulnerability',
      'Input Validation Detection'
    );
    
    this.assert(
      sqlViolations.every(v => v.severity === 'CRITICAL'),
      'SQL injection should be critical severity',
      'Input Validation Detection'
    );
  }

  /**
   * Test 4: Authentication Security
   */
  async testAuthenticationSecurity() {
    console.log('🧪 Testing Authentication Security...');
    
    const securityCheck = new SecurityCheck();
    securityCheck.checkAuthenticationFlows();
    
    const weakSecretViolations = securityCheck.violations.filter(v => v.type === 'WEAK_JWT_SECRET');
    const missingExpirationWarnings = securityCheck.warnings.filter(w => w.type === 'MISSING_TOKEN_EXPIRATION');
    
    this.assert(
      weakSecretViolations.length >= 1,
      'Should detect weak JWT secret',
      'Authentication Security'
    );
    
    this.assert(
      missingExpirationWarnings.length >= 1,
      'Should warn about missing token expiration',
      'Authentication Security'
    );
  }

  /**
   * Test 5: Container Security
   */
  async testContainerSecurity() {
    console.log('🧪 Testing Container Security...');
    
    const securityCheck = new SecurityCheck();
    securityCheck.checkContainerSecurity();
    
    const rootViolations = securityCheck.violations.filter(v => v.type === 'ROOT_CONTAINER');
    
    this.assert(
      rootViolations.length >= 1,
      'Should detect container running as root',
      'Container Security'
    );
    
    this.assert(
      rootViolations.every(v => v.severity === 'HIGH'),
      'Root container should be high severity',
      'Container Security'
    );
  }

  /**
   * Test 6: Network Security
   */
  async testNetworkSecurity() {
    console.log('🧪 Testing Network Security...');
    
    const securityCheck = new SecurityCheck();
    securityCheck.checkNetworkSecurity();
    
    const missingCorsWarnings = securityCheck.warnings.filter(w => w.type === 'MISSING_CORS_CONFIG');
    const missingRateLimitWarnings = securityCheck.warnings.filter(w => w.type === 'MISSING_RATE_LIMITING');
    
    this.assert(
      missingCorsWarnings.length >= 1,
      'Should warn about missing CORS configuration',
      'Network Security'
    );
    
    this.assert(
      missingRateLimitWarnings.length >= 1,
      'Should warn about missing rate limiting',
      'Network Security'
    );
  }

  /**
   * Test 7: Audit Logging Detection
   */
  async testAuditLoggingDetection() {
    console.log('🧪 Testing Audit Logging Detection...');
    
    const securityCheck = new SecurityCheck();
    securityCheck.checkAuditLogging();
    
    const missingAuditWarnings = securityCheck.warnings.filter(w => w.type === 'MISSING_AUDIT_LOGGING');
    const missingSecurityWarnings = securityCheck.warnings.filter(w => w.type === 'MISSING_SECURITY_LOGGING');
    
    this.assert(
      missingAuditWarnings.length >= 1,
      'Should warn about missing audit logging',
      'Audit Logging Detection'
    );
    
    this.assert(
      missingSecurityWarnings.length >= 1,
      'Should warn about missing security logging',
      'Audit Logging Detection'
    );
  }

  /**
   * Test 8: Code Quality Security
   */
  async testCodeQualitySecurity() {
    console.log('🧪 Testing Code Quality Security...');
    
    const securityCheck = new SecurityCheck();
    securityCheck.checkCodeQuality();
    
    const evalViolations = securityCheck.violations.filter(v => v.type === 'EVAL_USAGE');
    const consoleWarnings = securityCheck.warnings.filter(w => w.type === 'CONSOLE_LOG');
    const debuggerWarnings = securityCheck.warnings.filter(w => w.type === 'DEBUGGER_STATEMENT');
    
    this.assert(
      evalViolations.length >= 1,
      'Should detect eval() usage',
      'Code Quality Security'
    );
    
    this.assert(
      consoleWarnings.length >= 1,
      'Should warn about console.log',
      'Code Quality Security'
    );
    
    this.assert(
      debuggerWarnings.length >= 1,
      'Should warn about debugger statements',
      'Code Quality Security'
    );
  }

  /**
   * Test 9: Security Score Calculation
   */
  async testSecurityScoreCalculation() {
    console.log('🧪 Testing Security Score Calculation...');
    
    const securityCheck = new SecurityCheck();
    
    // Run all checks to populate violations and warnings
    await securityCheck.runSecurityCheck();
    
    const score = securityCheck.calculateSecurityScore();
    
    this.assert(
      typeof score === 'number',
      'Security score should be a number',
      'Security Score Calculation'
    );
    
    this.assert(
      score >= 0 && score <= 100,
      'Security score should be between 0 and 100',
      'Security Score Calculation'
    );
    
    this.assert(
      score < 80,
      'Score should be low given the security issues',
      'Security Score Calculation'
    );
  }

  /**
   * Test 10: Report Generation
   */
  async testReportGeneration() {
    console.log('🧪 Testing Report Generation...');
    
    const securityCheck = new SecurityCheck();
    const report = securityCheck.generateReport();
    
    this.assert(
      report.hasOwnProperty('timestamp'),
      'Report should have timestamp',
      'Report Generation'
    );
    
    this.assert(
      report.hasOwnProperty('summary'),
      'Report should have summary',
      'Report Generation'
    );
    
    this.assert(
      report.hasOwnProperty('violations'),
      'Report should have violations',
      'Report Generation'
    );
    
    this.assert(
      report.hasOwnProperty('warnings'),
      'Report should have warnings',
      'Report Generation'
    );
    
    this.assert(
      report.hasOwnProperty('recommendations'),
      'Report should have recommendations',
      'Report Generation'
    );
    
    this.assert(
      Array.isArray(report.violations),
      'Violations should be an array',
      'Report Generation'
    );
    
    this.assert(
      Array.isArray(report.warnings),
      'Warnings should be an array',
      'Report Generation'
    );
  }

  /**
   * Helper assertion method
   */
  assert(condition, message, testCategory) {
    const result = {
      category: testCategory,
      message,
      passed: condition,
      timestamp: new Date().toISOString()
    };
    
    this.testResults.push(result);
    
    if (condition) {
      console.log(`✅ ${testCategory}: ${message}`);
    } else {
      console.log(`❌ ${testCategory}: ${message}`);
    }
  }

  /**
   * Generate comprehensive test report
   */
  generateTestReport() {
    const totalTests = this.testResults.length;
    const passedTests = this.testResults.filter(r => r.passed).length;
    const failedTests = totalTests - passedTests;
    
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalTests,
        passedTests,
        failedTests,
        successRate: (passedTests / totalTests * 100).toFixed(2) + '%'
      },
      testResults: this.testResults,
      coverage: {
        secretsDetection: true,
        dependencyVulnerabilityDetection: true,
        inputValidationDetection: true,
        authenticationSecurity: true,
        containerSecurity: true,
        networkSecurity: true,
        auditLoggingDetection: true,
        codeQualitySecurity: true,
        securityScoreCalculation: true,
        reportGeneration: true
      },
      recommendations: this.generateTestRecommendations()
    };
    
    return report;
  }

  generateTestRecommendations() {
    const recommendations = [];
    const failedTests = this.testResults.filter(r => !r.passed);
    
    if (failedTests.length > 0) {
      recommendations.push({
        priority: 'HIGH',
        action: 'Fix failing security tests',
        details: `${failedTests.length} tests failed. Review and fix the underlying security issues.`
      });
    }
    
    recommendations.push({
      priority: 'MEDIUM',
      action: 'Expand test coverage',
      details: 'Add more edge cases and boundary condition tests.'
    });
    
    recommendations.push({
      priority: 'LOW',
      action: 'Automate security testing',
      details: 'Integrate security tests into CI/CD pipeline.'
    });
    
    return recommendations;
  }

  /**
   * Cleanup test environment
   */
  cleanup() {
    fs.rmSync(this.tempDir, { recursive: true, force: true });
  }
}

module.exports = SecurityTestSuite;
