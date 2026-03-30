#!/usr/bin/env node

/**
 * Security Check Runner
 * Executes security validation and test-driven security tests
 * Based on workflow_orchestration_engineering.md requirements
 */

const SecurityCheck = require('./security-check');
const SecurityTestSuite = require('./security-check.test');
const fs = require('fs');
const path = require('path');

class SecurityCheckRunner {
  constructor() {
    this.startTime = Date.now();
    this.results = {};
  }

  /**
   * Main execution method
   */
  async run() {
    console.log('🔒 Starting Comprehensive Security Check\n');
    console.log('Based on Workflow Orchestration Engineering Standards v2.0\n');
    console.log('=' .repeat(60));

    try {
      // Step 1: Run security tests first (test-driven approach)
      console.log('\n📋 Phase 1: Test-Driven Security Validation');
      console.log('-'.repeat(50));
      await this.runSecurityTests();

      // Step 2: Run actual security check on the codebase
      console.log('\n🔍 Phase 2: Security Analysis');
      console.log('-'.repeat(50));
      await this.runSecurityAnalysis();

      // Step 3: Generate comprehensive report
      console.log('\n📊 Phase 3: Report Generation');
      console.log('-'.repeat(50));
      await this.generateFinalReport();

      // Step 4: Display summary
      this.displaySummary();

    } catch (error) {
      console.error('❌ Security check failed:', error.message);
      process.exit(1);
    }
  }

  /**
   * Phase 1: Run security tests
   */
  async runSecurityTests() {
    const testSuite = new SecurityTestSuite();
    
    try {
      this.results.testSuite = await testSuite.runAllTests();
      
      const { summary } = this.results.testSuite;
      console.log(`\n✅ Test Suite Completed:`);
      console.log(`   Total Tests: ${summary.totalTests}`);
      console.log(`   Passed: ${summary.passedTests}`);
      console.log(`   Failed: ${summary.failedTests}`);
      console.log(`   Success Rate: ${summary.successRate}`);

      if (summary.failedTests > 0) {
        console.log('\n⚠️  Failed Tests:');
        this.results.testSuite.testResults
          .filter(r => !r.passed)
          .forEach(test => {
            console.log(`   ❌ ${test.category}: ${test.message}`);
          });
      }

    } finally {
      testSuite.cleanup();
    }
  }

  /**
   * Phase 2: Run security analysis
   */
  async runSecurityAnalysis() {
    const securityCheck = new SecurityCheck();
    
    this.results.securityAnalysis = await securityCheck.runSecurityCheck();
    
    const { summary } = this.results.securityAnalysis;
    console.log(`\n🔍 Security Analysis Completed:`);
    console.log(`   Security Score: ${summary.securityScore}/100`);
    console.log(`   Critical Issues: ${summary.criticalViolations}`);
    console.log(`   High Issues: ${summary.highViolations}`);
    console.log(`   Medium Issues: ${summary.mediumViolations}`);
    console.log(`   Low Issues: ${summary.lowViolations}`);
    console.log(`   Warnings: ${summary.totalWarnings}`);
    console.log(`   Passed Checks: ${summary.totalPassed}`);

    // Display critical and high severity issues
    const criticalIssues = this.results.securityAnalysis.violations.filter(v => v.severity === 'CRITICAL');
    const highIssues = this.results.securityAnalysis.violations.filter(v => v.severity === 'HIGH');

    if (criticalIssues.length > 0) {
      console.log('\n🚨 Critical Security Issues:');
      criticalIssues.forEach(issue => {
        console.log(`   ❌ ${issue.type}: ${issue.issue}`);
        console.log(`      File: ${issue.file}`);
        console.log(`      Recommendation: ${issue.recommendation}`);
      });
    }

    if (highIssues.length > 0) {
      console.log('\n⚠️  High Priority Issues:');
      highIssues.forEach(issue => {
        console.log(`   ⚠️  ${issue.type}: ${issue.issue}`);
        console.log(`      File: ${issue.file}`);
        console.log(`      Recommendation: ${issue.recommendation}`);
      });
    }
  }

  /**
   * Phase 3: Generate final report
   */
  async generateFinalReport() {
    const report = {
      executionTime: `${Date.now() - this.startTime}ms`,
      timestamp: new Date().toISOString(),
      testSuite: this.results.testSuite,
      securityAnalysis: this.results.securityAnalysis,
      overallAssessment: this.calculateOverallAssessment(),
      actionItems: this.generateActionItems(),
      complianceStatus: this.checkComplianceStatus()
    };

    // Save report to file
    const reportPath = path.join(process.cwd(), 'security-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    // Save human-readable report
    const readableReportPath = path.join(process.cwd(), 'security-report.md');
    fs.writeFileSync(readableReportPath, this.generateMarkdownReport(report));

    console.log(`\n📄 Reports Generated:`);
    console.log(`   JSON: ${reportPath}`);
    console.log(`   Markdown: ${readableReportPath}`);

    this.results.finalReport = report;
  }

  /**
   * Calculate overall security assessment
   */
  calculateOverallAssessment() {
    const { securityAnalysis, testSuite } = this.results;
    const { summary: securitySummary } = securityAnalysis;
    const { summary: testSummary } = testSuite;

    let assessment = 'UNKNOWN';
    let riskLevel = 'UNKNOWN';

    if (securitySummary.criticalViolations > 0) {
      assessment = 'CRITICAL';
      riskLevel = 'HIGH';
    } else if (securitySummary.highViolations > 0 || securitySummary.securityScore < 60) {
      assessment = 'HIGH_RISK';
      riskLevel = 'MEDIUM';
    } else if (securitySummary.mediumViolations > 0 || securitySummary.securityScore < 80) {
      assessment = 'MEDIUM_RISK';
      riskLevel = 'LOW';
    } else if (securitySummary.securityScore >= 80 && testSummary.failedTests === 0) {
      assessment = 'SECURE';
      riskLevel = 'LOW';
    } else {
      assessment = 'NEEDS_ATTENTION';
      riskLevel = 'LOW';
    }

    return {
      assessment,
      riskLevel,
      securityScore: securitySummary.securityScore,
      testSuccessRate: testSummary.successRate,
      recommendation: this.getAssessmentRecommendation(assessment)
    };
  }

  getAssessmentRecommendation(assessment) {
    const recommendations = {
      'CRITICAL': 'Immediate action required. Address all critical security vulnerabilities before proceeding.',
      'HIGH_RISK': 'High-priority security issues require immediate attention and remediation.',
      'MEDIUM_RISK': 'Address medium-priority issues in the next development cycle.',
      'NEEDS_ATTENTION': 'Review and address security concerns to improve overall posture.',
      'SECURE': 'Security posture is good. Continue monitoring and regular security reviews.',
      'UNKNOWN': 'Unable to determine security assessment. Review security check results.'
    };
    return recommendations[assessment] || recommendations['UNKNOWN'];
  }

  /**
   * Generate action items based on findings
   */
  generateActionItems() {
    const actionItems = [];
    const { violations, warnings, recommendations } = this.results.securityAnalysis;

    // Immediate actions for critical issues
    const criticalIssues = violations.filter(v => v.severity === 'CRITICAL');
    if (criticalIssues.length > 0) {
      actionItems.push({
        priority: 'IMMEDIATE',
        category: 'Critical Security',
        description: `Fix ${criticalIssues.length} critical security vulnerabilities`,
        items: criticalIssues.map(issue => ({
          action: issue.recommendation,
          file: issue.file,
          type: issue.type
        })),
        deadline: 'Within 24 hours'
      });
    }

    // High priority actions
    const highIssues = violations.filter(v => v.severity === 'HIGH');
    if (highIssues.length > 0) {
      actionItems.push({
        priority: 'HIGH',
        category: 'Security Hardening',
        description: `Address ${highIssues.length} high-priority security issues`,
        items: highIssues.map(issue => ({
          action: issue.recommendation,
          file: issue.file,
          type: issue.type
        })),
        deadline: 'Within 1 week'
      });
    }

    // Medium priority actions
    const mediumIssues = violations.filter(v => v.severity === 'MEDIUM');
    if (mediumIssues.length > 0) {
      actionItems.push({
        priority: 'MEDIUM',
        category: 'Security Improvements',
        description: `Resolve ${mediumIssues.length} medium-priority issues`,
        items: mediumIssues.map(issue => ({
          action: issue.recommendation,
          file: issue.file,
          type: issue.type
        })),
        deadline: 'Within 2 weeks'
      });
    }

    // Add recommendations from security analysis
    if (recommendations.length > 0) {
      actionItems.push({
        priority: 'STRATEGIC',
        category: 'Security Strategy',
        description: 'Implement strategic security improvements',
        items: recommendations.map(rec => ({
          action: rec.action,
          details: rec.details
        })),
        deadline: 'Next sprint'
      });
    }

    return actionItems;
  }

  /**
   * Check compliance status against workflow orchestration standards
   */
  checkComplianceStatus() {
    const { securityAnalysis, testSuite } = this.results;
    const standards = {
      secretsManagement: !securityAnalysis.violations.some(v => v.type === 'HARDCODED_SECRET'),
      inputValidation: !securityAnalysis.violations.some(v => v.type === 'SQL_INJECTION_RISK' || v.type === 'XSS_VULNERABILITY'),
      authenticationSecurity: !securityAnalysis.violations.some(v => v.type === 'WEAK_JWT_SECRET'),
      containerSecurity: !securityAnalysis.violations.some(v => v.type === 'ROOT_CONTAINER'),
      codeQuality: !securityAnalysis.violations.some(v => v.type === 'EVAL_USAGE'),
      testCoverage: testSuite.summary.successRate === '100%',
      auditLogging: !securityAnalysis.warnings.some(w => w.type === 'MISSING_AUDIT_LOGGING'),
      networkSecurity: !securityAnalysis.warnings.some(w => w.type === 'MISSING_HTTPS')
    };

    const compliantCount = Object.values(standards).filter(Boolean).length;
    const totalStandards = Object.keys(standards).length;
    const compliancePercentage = (compliantCount / totalStandards * 100).toFixed(1);

    return {
      overall: `${compliancePercentage}%`,
      standards,
      compliantCount,
      totalStandards,
      status: compliancePercentage >= 80 ? 'COMPLIANT' : compliancePercentage >= 60 ? 'PARTIALLY_COMPLIANT' : 'NON_COMPLIANT'
    };
  }

  /**
   * Generate markdown report
   */
  generateMarkdownReport(report) {
    return `# Security Check Report

**Generated:** ${report.timestamp}  
**Execution Time:** ${report.executionTime}

## Executive Summary

**Overall Assessment:** ${report.overallAssessment.assessment}  
**Risk Level:** ${report.overallAssessment.riskLevel}  
**Security Score:** ${report.overallAssessment.securityScore}/100  
**Test Success Rate:** ${report.overallAssessment.testSuccessRate}

**Recommendation:** ${report.overallAssessment.recommendation}

## Test Suite Results

- **Total Tests:** ${report.testSuite.summary.totalTests}
- **Passed:** ${report.testSuite.summary.passedTests}
- **Failed:** ${report.testSuite.summary.failedTests}
- **Success Rate:** ${report.testSuite.summary.successRate}

## Security Analysis Results

### Summary
- **Security Score:** ${report.securityAnalysis.summary.securityScore}/100
- **Critical Issues:** ${report.securityAnalysis.summary.criticalViolations}
- **High Issues:** ${report.securityAnalysis.summary.highViolations}
- **Medium Issues:** ${report.securityAnalysis.summary.mediumViolations}
- **Low Issues:** ${report.securityAnalysis.summary.lowViolations}
- **Warnings:** ${report.securityAnalysis.summary.totalWarnings}
- **Passed Checks:** ${report.securityAnalysis.summary.totalPassed}

### Critical Issues
${report.securityAnalysis.violations.filter(v => v.severity === 'CRITICAL').map(issue => 
  `- **${issue.type}** in \`${issue.file}\`: ${issue.issue}\n  - *Recommendation:* ${issue.recommendation}`
).join('\n\n') || 'None'}

### High Priority Issues
${report.securityAnalysis.violations.filter(v => v.severity === 'HIGH').map(issue => 
  `- **${issue.type}** in \`${issue.file}\`: ${issue.issue}\n  - *Recommendation:* ${issue.recommendation}`
).join('\n\n') || 'None'}

## Action Items

${report.actionItems.map(action => 
  `### ${action.priority} Priority: ${action.category}
**Description:** ${action.description}
**Deadline:** ${action.deadline}

${action.items.map(item => 
  `- ${item.action}${item.file ? ` (\`${item.file}\`)` : ''}${item.details ? `\n  - *Details:* ${item.details}` : ''}`
).join('\n')}
`).join('\n')}

## Compliance Status

**Overall Compliance:** ${report.complianceStatus.overall}  
**Status:** ${report.complianceStatus.status}

### Standards Compliance
${Object.entries(report.complianceStatus.standards).map(([standard, compliant]) => 
  `- ${standard}: ${compliant ? '✅' : '❌'}`
).join('\n')}

## Recommendations

${report.securityAnalysis.recommendations.map(rec => 
  `### ${rec.priority} Priority
**Action:** ${rec.action}
**Details:** ${rec.details}`
).join('\n\n')}

---

*Report generated by Security Check Runner based on Workflow Orchestration Engineering Standards v2.0*
`;
  }

  /**
   * Display final summary
   */
  displaySummary() {
    const { overallAssessment, complianceStatus } = this.results.finalReport;
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 FINAL SECURITY ASSESSMENT');
    console.log('='.repeat(60));
    
    console.log(`\n🎯 Overall Assessment: ${overallAssessment.assessment}`);
    console.log(`⚠️  Risk Level: ${overallAssessment.riskLevel}`);
    console.log(`🔒 Security Score: ${overallAssessment.securityScore}/100`);
    console.log(`✅ Test Success Rate: ${overallAssessment.testSuccessRate}`);
    console.log(`📋 Compliance Status: ${complianceStatus.status} (${complianceStatus.overall})`);
    
    console.log(`\n💡 ${overallAssessment.recommendation}`);
    
    if (this.results.finalReport.actionItems.length > 0) {
      console.log('\n🚀 Next Steps:');
      this.results.finalReport.actionItems.slice(0, 3).forEach(action => {
        console.log(`   ${action.priority}: ${action.description}`);
      });
    }
    
    console.log('\n' + '='.repeat(60));
  }
}

// Run if called directly
if (require.main === module) {
  const runner = new SecurityCheckRunner();
  runner.run().catch(error => {
    console.error('Security check runner failed:', error);
    process.exit(1);
  });
}

module.exports = SecurityCheckRunner;
