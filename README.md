# Intentional - Personal Finance Management App

A modern, full-stack personal finance management application designed to help users track expenses, manage budgets, and make informed financial decisions through intuitive visualizations and educational content.

## 🚀 Features

### Core Functionality
- **Expense Tracking**: Log and categorize daily expenses with detailed insights
- **Budget Management**: Set and monitor budget limits across different categories
- **Financial Analytics**: Interactive charts and visualizations for spending patterns
- **Educational Hub**: Curated financial education videos from trusted sources
- **User Authentication**: Secure login and registration system

### Technical Highlights
- **Modern Frontend**: React 18 with Vite, TypeScript-ready
- **3D Visualizations**: React Three Fiber for engaging data presentations
- **Robust Backend**: NestJS with TypeScript, PostgreSQL/SQLite support
- **API Documentation**: Integrated Swagger/OpenAPI documentation
- **Responsive Design**: Mobile-first approach with Tailwind CSS

## 🏗️ Architecture

### Frontend (React + Vite)
```
frontend/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── layout/         # Layout components
│   │   └── visualizations/  # 3D charts and graphs
│   ├── pages/              # Route components
│   ├── context/            # React context providers
│   ├── api/                # API client configuration
│   └── main.jsx            # Application entry point
├── public/                 # Static assets
└── package.json
```

### Backend (NestJS + TypeScript)
```
backend/
├── src/
│   ├── auth/               # Authentication module
│   ├── users/              # User management
│   ├── expenses/           # Expense tracking
│   ├── budgets/            # Budget management
│   └── analytics/          # Data analytics
├── dist/                   # Compiled TypeScript
├── package.json
└── nest-cli.json
```

## 🛠️ Tech Stack

### Frontend
- **React 18** - UI framework
- **Vite** - Build tool and dev server
- **React Router DOM** - Client-side routing
- **React Three Fiber** - 3D graphics
- **Framer Motion** - Animations
- **Recharts** - Data visualization
- **Axios** - HTTP client
- **Tailwind CSS** - Styling

### Backend
- **NestJS** - Node.js framework
- **TypeScript** - Type safety
- **PostgreSQL/SQLite** - Database
- **TypeORM** - Object-relational mapping
- **JWT** - Authentication tokens
- **Passport** - Authentication middleware
- **Swagger** - API documentation

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- PostgreSQL (optional, SQLite available)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/intentional.git
cd intentional
```

2. **Install dependencies**
```bash
# Frontend
cd frontend
npm install

# Backend
cd ../backend
npm install
```

3. **Environment Setup**
```bash
# Backend environment
cd backend
cp .env.example .env
# Edit .env with your database credentials

# Frontend environment (if needed)
cd ../frontend
cp .env.example .env
```

4. **Database Setup**
```bash
cd backend
npm run migration:run
npm run seed:run  # Optional: seed with sample data
```

5. **Start Development Servers**
```bash
# Backend (port 3001)
cd backend
npm run start:dev

# Frontend (port 3000)
cd frontend
npm run dev
```

6. **Access the Application**
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- API Documentation: http://localhost:3001/api

## 📦 Deployment

### Frontend (Vercel/Netlify)
```bash
cd frontend
npm run build
# Deploy dist/ folder to your hosting provider
```

### Backend (Heroku/Railway/DigitalOcean)
```bash
cd backend
npm run build
npm start
# Deploy with your preferred hosting provider
```

### Docker Deployment
```bash
# Build and run with Docker Compose
docker-compose up -d
```

## 🧪 Testing

### Frontend
```bash
cd frontend
npm test                    # Run tests
npm run test:coverage      # Run with coverage
```

### Backend
```bash
cd backend
npm test                   # Run unit tests
npm run test:cov          # Run with coverage
npm run test:e2e          # Run end-to-end tests
```

## 📊 API Documentation

The backend includes comprehensive API documentation accessible at:
- Development: http://localhost:3001/api
- Production: https://your-domain.com/api

### Key Endpoints
- `POST /auth/login` - User authentication
- `POST /auth/register` - User registration
- `GET /expenses` - Retrieve expenses
- `POST /expenses` - Create new expense
- `GET /budgets` - Retrieve budgets
- `GET /analytics/overview` - Financial analytics

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Workflow
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Financial education content by [Nischa](https://www.youtube.com/@nischa)
- Built with modern web development best practices
- Community-driven open source development

## 📞 Support

- 📧 Email: support@intentional-app.com
- 💬 Discord: [Join our community](https://discord.gg/intentional)
- 🐛 Issues: [Report bugs on GitHub](https://github.com/yourusername/intentional/issues)

## 🔮 Roadmap

- [ ] Mobile app (React Native)
- [ ] Advanced analytics with ML insights
- [ ] Multi-currency support
- [ ] Investment portfolio tracking
- [ ] Collaborative budgeting for families
- [ ] Integration with banking APIs
- [ ] Subscription management
- [ ] Goal setting and tracking

---

**Made with ❤️ for better financial health**
