# Contributing to Intentional

Thank you for your interest in contributing to Intentional! This guide will help you get started with contributing to our personal finance management application.

## 🤝 How to Contribute

We welcome contributions of all types, including:
- Bug fixes and improvements
- New features
- Documentation updates
- Performance optimizations
- UI/UX enhancements
- Test coverage improvements

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Git
- PostgreSQL (optional, SQLite available)

### Setup Development Environment

1. **Fork the Repository**
   ```bash
   # Fork the repository on GitHub
   git clone https://github.com/YOUR_USERNAME/intentional.git
   cd intentional
   ```

2. **Install Dependencies**
   ```bash
   # Frontend
   cd frontend
   npm install
   
   # Backend
   cd ../backend
   npm install
   ```

3. **Set Up Environment Variables**
   ```bash
   # Backend
   cd backend
   cp .env.example .env
   # Edit .env with your configuration
   
   # Frontend (if needed)
   cd ../frontend
   cp .env.example .env
   ```

4. **Start Development Servers**
   ```bash
   # Backend (port 3001)
   cd backend
   npm run start:dev
   
   # Frontend (port 3000) - in a new terminal
   cd frontend
   npm run dev
   ```

## 📝 Development Workflow

### 1. Create a Branch
```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/your-bug-fix
```

### 2. Make Your Changes
- Follow the existing code style and patterns
- Write tests for new functionality
- Update documentation if needed
- Ensure all tests pass

### 3. Run Tests
```bash
# Frontend tests
cd frontend
npm test

# Backend tests
cd backend
npm test
```

### 4. Commit Your Changes
```bash
git add .
git commit -m "feat: add your feature description"
```

### 5. Push and Create Pull Request
```bash
git push origin feature/your-feature-name
```

## 🎯 Code Style Guidelines

### Frontend (React)
- Use functional components with hooks
- Follow React best practices
- Use TypeScript when possible
- Component names should be PascalCase
- File names should be PascalCase for components
- Use meaningful variable and function names

### Backend (NestJS)
- Follow NestJS conventions
- Use TypeScript strictly
- Controller methods should be descriptive
- Use dependency injection
- Implement proper error handling
- Write DTOs for request/response validation

### General
- Use descriptive commit messages (follow [Conventional Commits](https://www.conventionalcommits.org/))
- Keep functions small and focused
- Add comments for complex logic
- Follow existing folder structure

## 🧪 Testing

### Frontend Testing
- Unit tests with React Testing Library
- Integration tests for user flows
- Visual regression tests for UI components

### Backend Testing
- Unit tests for services and controllers
- Integration tests for API endpoints
- Database tests with test database
- E2E tests for critical user journeys

### Test Coverage
- Aim for >80% code coverage
- All new features must include tests
- Bug fixes should include regression tests

## 📋 Pull Request Process

### Before Submitting
1. Ensure your code follows our style guidelines
2. Run all tests and ensure they pass
3. Update documentation if needed
4. Test your changes manually

### Pull Request Template
```markdown
## Description
Brief description of your changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] All tests pass
- [ ] New tests added
- [ ] Manual testing completed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
```

### Review Process
1. Automated checks must pass
2. At least one maintainer review required
3. Address all review comments
4. Maintainer will merge when ready

## 🐛 Bug Reports

When reporting bugs, please include:
- Clear description of the issue
- Steps to reproduce
- Expected vs actual behavior
- Environment details (OS, browser, etc.)
- Screenshots if applicable

## 💡 Feature Requests

For new features:
- Open an issue to discuss first
- Provide clear use case and requirements
- Consider impact on existing users
- Be open to feedback and suggestions

## 🏗️ Architecture Decisions

Major architectural changes should:
- Be discussed in an issue first
- Include technical justification
- Consider performance implications
- Plan migration strategy if breaking changes

## 📚 Documentation

### Types of Documentation
- API documentation (Swagger)
- Component documentation
- Setup guides
- User guides
- Architecture documentation

### Documentation Guidelines
- Keep it simple and clear
- Include code examples
- Update with code changes
- Use consistent formatting

## 🎨 UI/UX Guidelines

### Design Principles
- Mobile-first approach
- Accessibility first
- Consistent design language
- User-friendly error messages
- Loading states and feedback

### Component Guidelines
- Reusable components
- Consistent styling
- Proper error handling
- Loading states
- Responsive design

## 🔒 Security Considerations

- Never commit secrets or API keys
- Validate all user inputs
- Use HTTPS in production
- Implement proper authentication
- Follow OWASP guidelines
- Regular security updates

## 🚀 Deployment

### Development
- Use feature branches
- Test in staging environment
- Follow deployment checklist

### Production
- Automated deployments via CI/CD
- Rollback capability
- Monitoring and logging
- Performance monitoring

## 🤝 Community Guidelines

### Code of Conduct
- Be respectful and inclusive
- Welcome newcomers
- Constructive feedback
- No harassment or discrimination

### Communication
- Use GitHub issues for bugs/features
- Discussions for general questions
- Be patient and helpful
- Follow issue templates

## 🏆 Recognition

Contributors will be:
- Listed in our README
- Mentioned in release notes
- Invited to our contributor community
- Eligible for maintainer roles

## 📞 Getting Help

- Check existing issues and discussions
- Read documentation thoroughly
- Ask questions in discussions
- Join our Discord community

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to Intentional! 🎉
