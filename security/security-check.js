/**
 * Security Check Implementation for Workflow Orchestration
 * Based on workflow_orchestration_engineering.md requirements
 * 
 * Implements high-level security validation with test-driven approach
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class SecurityCheck {
  constructor() {
    this.violations = [];
    this.warnings = [];
    this.passed = [];
    this.securityLevel = 'HIGH';
  }

  /**
   * Execute comprehensive security check
   */
  async runSecurityCheck() {
    console.log('🔒 Starting Security Check for Workflow Orchestration...\n');
    
    const checks = [
      this.checkSecretsManagement.bind(this),
      this.checkDependencySecurity.bind(this),
      this.checkInputValidation.bind(this),
      this.checkAuthenticationFlows.bind(this),
      this.checkDataEncryption.bind(this),
      this.checkAccessControls.bind(this),
      this.checkAuditLogging.bind(this),
      this.checkNetworkSecurity.bind(this),
      this.checkContainerSecurity.bind(this),
      this.checkCodeQuality.bind(this)
    ];

    for (const check of checks) {
      await check();
    }

    return this.generateReport();
  }

  /**
   * Check 1: Secrets Management (Section V.1)
   * Validates no hardcoded secrets, proper secret backend usage
   */
  checkSecretsManagement() {
    console.log('🔍 Checking Secrets Management...');
    
    const patterns = [
      /password\s*=\s*['"][^'"]+['"]/gi,
      /api_key\s*=\s*['"][^'"]+['"]/gi,
      /secret\s*=\s*['"][^'"]+['"]/gi,
      /token\s*=\s*['"][^'"]+['"]/gi,
      /jwt_secret\s*=\s*['"][^'"]+['"]/gi,
      /database_url\s*=\s*['"][^'"]+['"]/gi
    ];

    const filesToCheck = this.getSourceFiles();
    
    filesToCheck.forEach(file => {
      try {
        const content = fs.readFileSync(file, 'utf8');
        
        patterns.forEach(pattern => {
          const matches = content.match(pattern);
          if (matches) {
            this.violations.push({
              type: 'HARDCODED_SECRET',
              file: file,
              line: this.findLineNumber(content, matches[0]),
              issue: `Hardcoded secret detected: ${matches[0]}`,
              severity: 'CRITICAL',
              recommendation: 'Use environment variables or secret management system'
            });
          }
        });
      } catch (error) {
        this.warnings.push({
          type: 'FILE_ACCESS_ERROR',
          file: file,
          issue: `Could not read file: ${error.message}`,
          severity: 'LOW'
        });
      }
    });

    // Check for .env files in git
    if (fs.existsSync('.env')) {
      this.violations.push({
        type: 'ENV_IN_GIT',
        file: '.env',
        issue: '.env file should not be committed to version control',
        severity: 'HIGH',
        recommendation: 'Add .env to .gitignore and use .env.example'
      });
    }

    this.passed.push('Secrets Management Check');
  }

  /**
   * Check 2: Dependency Security
   * Validates package dependencies for known vulnerabilities
   */
  checkDependencySecurity() {
    console.log('🔍 Checking Dependency Security...');
    
    const packageFiles = ['package.json', 'frontend/package.json', 'backend/package.json'];
    
    packageFiles.forEach(pkgFile => {
      if (fs.existsSync(pkgFile)) {
        try {
          const packageJson = JSON.parse(fs.readFileSync(pkgFile, 'utf8'));
          
          // Check for outdated packages
          const outdatedPackages = this.checkOutdatedPackages(packageJson);
          if (outdatedPackages.length > 0) {
            this.warnings.push({
              type: 'OUTDATED_DEPENDENCIES',
              file: pkgFile,
              issue: `Outdated packages: ${outdatedPackages.join(', ')}`,
              severity: 'MEDIUM',
              recommendation: 'Update dependencies to latest secure versions'
            });
          }

          // Check for packages with known security issues
          const vulnerablePackages = this.checkVulnerablePackages(packageJson);
          vulnerablePackages.forEach(pkg => {
            this.violations.push({
              type: 'VULNERABLE_DEPENDENCY',
              file: pkgFile,
              issue: `Vulnerable package: ${pkg.name}@${pkg.version}`,
              severity: 'HIGH',
              recommendation: `Update to ${pkg.safeVersion} or higher`
            });
          });

        } catch (error) {
          this.warnings.push({
            type: 'PACKAGE_PARSE_ERROR',
            file: pkgFile,
            issue: `Error parsing package.json: ${error.message}`,
            severity: 'LOW'
          });
        }
      }
    });

    this.passed.push('Dependency Security Check');
  }

  /**
   * Check 3: Input Validation
   * Validates proper input sanitization and validation
   */
  checkInputValidation() {
    console.log('🔍 Checking Input Validation...');
    
    const sourceFiles = this.getSourceFiles(['.js', '.jsx', '.ts', '.tsx']);
    
    sourceFiles.forEach(file => {
      try {
        const content = fs.readFileSync(file, 'utf8');
        
        // Check for direct use of req.body without validation
        if (content.includes('req.body') && !content.includes('validation') && !content.includes('sanitize')) {
          this.warnings.push({
            type: 'MISSING_INPUT_VALIDATION',
            file: file,
            issue: 'Potential use of req.body without validation',
            severity: 'MEDIUM',
            recommendation: 'Implement input validation using class-validator or similar'
          });
        }

        // Check for SQL injection patterns
        if (content.includes('SELECT') && content.includes('+') || content.includes('${')) {
          this.violations.push({
            type: 'SQL_INJECTION_RISK',
            file: file,
            issue: 'Potential SQL injection vulnerability',
            severity: 'CRITICAL',
            recommendation: 'Use parameterized queries or ORM'
          });
        }

        // Check for XSS vulnerabilities
        if (content.includes('innerHTML') || content.includes('dangerouslySetInnerHTML')) {
          this.violations.push({
            type: 'XSS_VULNERABILITY',
            file: file,
            issue: 'Potential XSS vulnerability',
            severity: 'HIGH',
            recommendation: 'Use proper sanitization or avoid innerHTML'
          });
        }

      } catch (error) {
        this.warnings.push({
          type: 'FILE_ACCESS_ERROR',
          file: file,
          issue: `Could not read file: ${error.message}`,
          severity: 'LOW'
        });
      }
    });

    this.passed.push('Input Validation Check');
  }

  /**
   * Check 4: Authentication Flows
   * Validates JWT implementation and session management
   */
  checkAuthenticationFlows() {
    console.log('🔍 Checking Authentication Flows...');
    
    const authFiles = this.getSourceFiles().filter(file => 
      file.includes('auth') || file.includes('login') || file.includes('jwt')
    );

    authFiles.forEach(file => {
      try {
        const content = fs.readFileSync(file, 'utf8');
        
        // Check JWT secret strength
        const jwtSecretMatch = content.match(/jwt_secret.*?=.*?['"]([^'"]+)['"]/i);
        if (jwtSecretMatch) {
          const secret = jwtSecretMatch[1];
          if (secret.length < 32) {
            this.violations.push({
              type: 'WEAK_JWT_SECRET',
              file: file,
              issue: 'JWT secret is too short (< 32 characters)',
              severity: 'HIGH',
              recommendation: 'Use a strong, randomly generated secret (64+ characters)'
            });
          }
        }

        // Check for proper token expiration
        if (content.includes('jwt') && !content.includes('expiresIn')) {
          this.warnings.push({
            type: 'MISSING_TOKEN_EXPIRATION',
            file: file,
            issue: 'JWT token may not have proper expiration',
            severity: 'MEDIUM',
            recommendation: 'Set appropriate token expiration time'
          });
        }

        // Check for HTTPS enforcement
        if (content.includes('login') || content.includes('auth')) {
          if (!content.includes('https') && !content.includes('secure')) {
            this.warnings.push({
              type: 'HTTP_AUTH',
              file: file,
              issue: 'Authentication over HTTP detected',
              severity: 'HIGH',
              recommendation: 'Enforce HTTPS for all authentication flows'
            });
          }
        }

      } catch (error) {
        this.warnings.push({
          type: 'FILE_ACCESS_ERROR',
          file: file,
          issue: `Could not read file: ${error.message}`,
          severity: 'LOW'
        });
      }
    });

    this.passed.push('Authentication Flows Check');
  }

  /**
   * Check 5: Data Encryption
   * Validates encryption at rest and in transit
   */
  checkDataEncryption() {
    console.log('🔍 Checking Data Encryption...');
    
    // Check for TLS/HTTPS configuration
    const configFiles = this.getSourceFiles().filter(file => 
      file.includes('config') || file.includes('nginx') || file.includes('ssl')
    );

    let httpsConfigured = false;
    configFiles.forEach(file => {
      try {
        const content = fs.readFileSync(file, 'utf8');
        if (content.includes('https') || content.includes('ssl') || content.includes('tls')) {
          httpsConfigured = true;
        }
      } catch (error) {
        // Ignore config file read errors
      }
    });

    if (!httpsConfigured) {
      this.warnings.push({
        type: 'MISSING_HTTPS',
        issue: 'HTTPS/TLS configuration not detected',
        severity: 'HIGH',
        recommendation: 'Configure HTTPS/TLS for all communications'
      });
    }

    // Check for database encryption
    const dbFiles = this.getSourceFiles().filter(file => 
      file.includes('database') || file.includes('db')
    );

    let encryptionConfigured = false;
    dbFiles.forEach(file => {
      try {
        const content = fs.readFileSync(file, 'utf8');
        if (content.includes('encrypt') || content.includes('sslmode=require')) {
          encryptionConfigured = true;
        }
      } catch (error) {
        // Ignore file read errors
      }
    });

    if (!encryptionConfigured) {
      this.warnings.push({
        type: 'MISSING_DB_ENCRYPTION',
        issue: 'Database encryption configuration not detected',
        severity: 'MEDIUM',
        recommendation: 'Configure database encryption at rest and in transit'
      });
    }

    this.passed.push('Data Encryption Check');
  }

  /**
   * Check 6: Access Controls
   * Validates RBAC and authorization patterns
   */
  checkAccessControls() {
    console.log('🔍 Checking Access Controls...');
    
    const sourceFiles = this.getSourceFiles(['.js', '.jsx', '.ts', '.tsx']);
    
    let hasAuthMiddleware = false;
    let hasRoleBasedAccess = false;
    
    sourceFiles.forEach(file => {
      try {
        const content = fs.readFileSync(file, 'utf8');
        
        // Check for authentication middleware
        if (content.includes('auth') && content.includes('middleware')) {
          hasAuthMiddleware = true;
        }

        // Check for role-based access control
        if (content.includes('role') || content.includes('permission') || content.includes('rbac')) {
          hasRoleBasedAccess = true;
        }

        // Check for public endpoints that should be protected
        if (content.includes('app.get') || content.includes('router.get')) {
          const routes = content.match(/(app|router)\.(get|post|put|delete)\s*\(['"][^'"]+['"]/gi);
          if (routes && !content.includes('auth')) {
            this.warnings.push({
              type: 'UNPROTECTED_ENDPOINT',
              file: file,
              issue: 'Potential unprotected API endpoint detected',
              severity: 'MEDIUM',
              recommendation: 'Add authentication middleware to protected endpoints'
            });
          }
        }

      } catch (error) {
        // Ignore file read errors
      }
    });

    if (!hasAuthMiddleware) {
      this.warnings.push({
        type: 'MISSING_AUTH_MIDDLEWARE',
        issue: 'Authentication middleware not detected',
        severity: 'HIGH',
        recommendation: 'Implement authentication middleware for protected routes'
      });
    }

    if (!hasRoleBasedAccess) {
      this.warnings.push({
        type: 'MISSING_RBAC',
        issue: 'Role-based access control not detected',
        severity: 'MEDIUM',
        recommendation: 'Implement proper authorization and role management'
      });
    }

    this.passed.push('Access Controls Check');
  }

  /**
   * Check 7: Audit Logging
   * Validates audit trail implementation
   */
  checkAuditLogging() {
    console.log('🔍 Checking Audit Logging...');
    
    const sourceFiles = this.getSourceFiles(['.js', '.jsx', '.ts', '.tsx']);
    
    let hasAuditLogging = false;
    let hasSecurityLogging = false;
    
    sourceFiles.forEach(file => {
      try {
        const content = fs.readFileSync(file, 'utf8');
        
        // Check for audit logging
        if (content.includes('audit') || content.includes('log') && content.includes('action')) {
          hasAuditLogging = true;
        }

        // Check for security event logging
        if (content.includes('security') && content.includes('log') || 
            content.includes('breach') || content.includes('incident')) {
          hasSecurityLogging = true;
        }

        // Check for authentication event logging
        if (content.includes('login') && content.includes('log')) {
          hasSecurityLogging = true;
        }

      } catch (error) {
        // Ignore file read errors
      }
    });

    if (!hasAuditLogging) {
      this.warnings.push({
        type: 'MISSING_AUDIT_LOGGING',
        issue: 'Audit logging not detected',
        severity: 'MEDIUM',
        recommendation: 'Implement comprehensive audit logging for security events'
      });
    }

    if (!hasSecurityLogging) {
      this.warnings.push({
        type: 'MISSING_SECURITY_LOGGING',
        issue: 'Security event logging not detected',
        severity: 'MEDIUM',
        recommendation: 'Log all security-relevant events'
      });
    }

    this.passed.push('Audit Logging Check');
  }

  /**
   * Check 8: Network Security
   * Validates network security configurations
   */
  checkNetworkSecurity() {
    console.log('🔍 Checking Network Security...');
    
    // Check CORS configuration
    const sourceFiles = this.getSourceFiles(['.js', '.ts']);
    let hasCorsConfig = false;
    
    sourceFiles.forEach(file => {
      try {
        const content = fs.readFileSync(file, 'utf8');
        if (content.includes('cors') || content.includes('CORS')) {
          hasCorsConfig = true;
          
          // Check for overly permissive CORS
          if (content.includes('origin: *') || content.includes('origins: *')) {
            this.violations.push({
              type: 'PERMISSIVE_CORS',
              file: file,
              issue: 'Overly permissive CORS policy detected',
              severity: 'HIGH',
              recommendation: 'Restrict CORS to specific domains'
            });
          }
        }
      } catch (error) {
        // Ignore file read errors
      }
    });

    if (!hasCorsConfig) {
      this.warnings.push({
        type: 'MISSING_CORS_CONFIG',
        issue: 'CORS configuration not detected',
        severity: 'MEDIUM',
        recommendation: 'Configure appropriate CORS policies'
      });
    }

    // Check for rate limiting
    let hasRateLimiting = false;
    sourceFiles.forEach(file => {
      try {
        const content = fs.readFileSync(file, 'utf8');
        if (content.includes('rate') && content.includes('limit')) {
          hasRateLimiting = true;
        }
      } catch (error) {
        // Ignore file read errors
      }
    });

    if (!hasRateLimiting) {
      this.warnings.push({
        type: 'MISSING_RATE_LIMITING',
        issue: 'Rate limiting not detected',
        severity: 'MEDIUM',
        recommendation: 'Implement rate limiting to prevent DoS attacks'
      });
    }

    this.passed.push('Network Security Check');
  }

  /**
   * Check 9: Container Security
   * Validates Docker and container configurations
   */
  checkContainerSecurity() {
    console.log('🔍 Checking Container Security...');
    
    const dockerFiles = ['Dockerfile', 'frontend/Dockerfile', 'backend/Dockerfile', 'docker-compose.yml'];
    
    dockerFiles.forEach(dockerFile => {
      if (fs.existsSync(dockerFile)) {
        try {
          const content = fs.readFileSync(dockerFile, 'utf8');
          
          // Check for running as root
          if (content.includes('USER root') || (dockerFile === 'Dockerfile' && !content.includes('USER'))) {
            this.violations.push({
              type: 'ROOT_CONTAINER',
              file: dockerFile,
              issue: 'Container running as root user',
              severity: 'HIGH',
              recommendation: 'Run containers as non-root user'
            });
          }

          // Check for exposed ports
          const portMatches = content.match(/EXPOSE\s+(\d+)/g);
          if (portMatches) {
            portMatches.forEach(port => {
              const portNum = port.split(' ')[1];
              if (portNum === '80' || portNum === '443') {
                // These are acceptable for web servers
              } else if (portNum === '3000' || portNum === '3001') {
                this.warnings.push({
                  type: 'DEV_PORT_EXPOSED',
                  file: dockerFile,
                  issue: `Development port ${portNum} exposed in production`,
                  severity: 'LOW',
                  recommendation: 'Use production-appropriate ports'
                });
              }
            });
          }

        } catch (error) {
          this.warnings.push({
            type: 'DOCKER_FILE_ERROR',
            file: dockerFile,
            issue: `Error reading Docker file: ${error.message}`,
            severity: 'LOW'
          });
        }
      }
    });

    this.passed.push('Container Security Check');
  }

  /**
   * Check 10: Code Quality
   * Validates code quality and security patterns
   */
  checkCodeQuality() {
    console.log('🔍 Checking Code Quality...');
    
    const sourceFiles = this.getSourceFiles(['.js', '.jsx', '.ts', '.tsx']);
    
    sourceFiles.forEach(file => {
      try {
        const content = fs.readFileSync(file, 'utf8');
        
        // Check for console.log in production code
        if (content.includes('console.log') && !file.includes('test')) {
          this.warnings.push({
            type: 'CONSOLE_LOG',
            file: file,
            issue: 'console.log detected in production code',
            severity: 'LOW',
            recommendation: 'Remove console.log statements or use proper logging'
          });
        }

        // Check for eval usage
        if (content.includes('eval(')) {
          this.violations.push({
            type: 'EVAL_USAGE',
            file: file,
            issue: 'eval() function detected',
            severity: 'HIGH',
            recommendation: 'Avoid eval() for security reasons'
          });
        }

        // Check for debugger statements
        if (content.includes('debugger')) {
          this.warnings.push({
            type: 'DEBUGGER_STATEMENT',
            file: file,
            issue: 'debugger statement detected',
            severity: 'LOW',
            recommendation: 'Remove debugger statements'
          });
        }

      } catch (error) {
        // Ignore file read errors
      }
    });

    this.passed.push('Code Quality Check');
  }

  /**
   * Helper methods
   */
  getSourceFiles(extensions = ['.js', '.jsx', '.ts', '.tsx', '.json', '.yml', '.yaml']) {
    const sourceFiles = [];
    
    const scanDirectory = (dir) => {
      try {
        const items = fs.readdirSync(dir);
        items.forEach(item => {
          const fullPath = path.join(dir, item);
          const stat = fs.statSync(fullPath);
          
          if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
            scanDirectory(fullPath);
          } else if (stat.isFile()) {
            const ext = path.extname(item);
            if (extensions.includes(ext)) {
              sourceFiles.push(fullPath);
            }
          }
        });
      } catch (error) {
        // Ignore directory access errors
      }
    };
    
    scanDirectory('.');
    return sourceFiles;
  }

  findLineNumber(content, text) {
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes(text)) {
        return i + 1;
      }
    }
    return 0;
  }

  checkOutdatedPackages(packageJson) {
    // Simplified check - in real implementation, would check against npm registry
    const outdated = [];
    const currentYear = new Date().getFullYear();
    
    if (packageJson.dependencies) {
      Object.entries(packageJson.dependencies).forEach(([name, version]) => {
        // Simple heuristic: packages older than 2 years might be outdated
        if (version.includes('2020') || version.includes('2021')) {
          outdated.push(name);
        }
      });
    }
    
    return outdated;
  }

  checkVulnerablePackages(packageJson) {
    // Simplified check - in real implementation, would use vulnerability database
    const vulnerable = [];
    const knownVulnerable = {
      'lodash': '<4.17.21',
      'axios': '<0.21.1',
      'node-forge': '<1.3.0'
    };
    
    if (packageJson.dependencies) {
      Object.entries(packageJson.dependencies).forEach(([name, version]) => {
        if (knownVulnerable[name]) {
          vulnerable.push({
            name,
            version,
            safeVersion: knownVulnerable[name].replace(/[<>=]/g, '')
          });
        }
      });
    }
    
    return vulnerable;
  }

  /**
   * Generate comprehensive security report
   */
  generateReport() {
    const totalViolations = this.violations.length;
    const totalWarnings = this.warnings.length;
    const totalPassed = this.passed.length;
    
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalChecks: totalViolations + totalWarnings + totalPassed,
        criticalViolations: this.violations.filter(v => v.severity === 'CRITICAL').length,
        highViolations: this.violations.filter(v => v.severity === 'HIGH').length,
        mediumViolations: this.violations.filter(v => v.severity === 'MEDIUM').length,
        lowViolations: this.violations.filter(v => v.severity === 'LOW').length,
        totalViolations,
        totalWarnings,
        totalPassed,
        securityScore: this.calculateSecurityScore()
      },
      violations: this.violations,
      warnings: this.warnings,
      passedChecks: this.passed,
      recommendations: this.generateRecommendations()
    };
    
    return report;
  }

  calculateSecurityScore() {
    const maxScore = 100;
    let score = maxScore;
    
    // Deduct points for violations
    this.violations.forEach(v => {
      switch (v.severity) {
        case 'CRITICAL': score -= 25; break;
        case 'HIGH': score -= 15; break;
        case 'MEDIUM': score -= 10; break;
        case 'LOW': score -= 5; break;
      }
    });
    
    // Deduct points for warnings
    this.warnings.forEach(w => {
      switch (w.severity) {
        case 'HIGH': score -= 8; break;
        case 'MEDIUM': score -= 5; break;
        case 'LOW': score -= 2; break;
      }
    });
    
    return Math.max(0, score);
  }

  generateRecommendations() {
    const recommendations = [];
    
    if (this.violations.some(v => v.type === 'HARDCODED_SECRET')) {
      recommendations.push({
        priority: 'IMMEDIATE',
        action: 'Remove all hardcoded secrets and implement proper secret management',
        details: 'Use environment variables, AWS Secrets Manager, or HashiCorp Vault'
      });
    }
    
    if (this.violations.some(v => v.type === 'SQL_INJECTION_RISK')) {
      recommendations.push({
        priority: 'IMMEDIATE',
        action: 'Fix SQL injection vulnerabilities',
        details: 'Use parameterized queries, ORM, or prepared statements'
      });
    }
    
    if (this.violations.some(v => v.type === 'XSS_VULNERABILITY')) {
      recommendations.push({
        priority: 'IMMEDIATE',
        action: 'Fix XSS vulnerabilities',
        details: 'Use proper input sanitization and avoid innerHTML'
      });
    }
    
    if (this.violations.some(v => v.type === 'ROOT_CONTAINER')) {
      recommendations.push({
        priority: 'HIGH',
        action: 'Fix container security issues',
        details: 'Run containers as non-root users and follow security best practices'
      });
    }
    
    if (this.warnings.some(w => w.type === 'MISSING_HTTPS')) {
      recommendations.push({
        priority: 'HIGH',
        action: 'Implement HTTPS/TLS',
        details: 'Configure SSL/TLS certificates and enforce HTTPS'
      });
    }
    
    return recommendations;
  }
}

module.exports = SecurityCheck;
