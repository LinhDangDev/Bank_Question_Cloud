# User Guidelines - Graduation System

**Author**: Linh Dang Dev  
**Last Updated**: 2024

## 🎯 General Response Protocol

- **Greeting**: Always start responses with "Hi Boss Linh"
- **Summary**: Always conclude with a summary of completed and pending tasks

## 🛠️ Development Standards

### Technology Stack Requirements
- **Scripting**: Use Python 3 CLI instead of bash scripts
- **Frontend/Backend**: TypeScript exclusively
- **Package Manager**: pnpm (never npm)
- **File Placement**: Generate files in correct project directories

### Code Quality Standards
- **No Comments**: Don't generate comments in source code by default
- **Clean Code**: Eliminate all redundant code
- **Best Practices**: Always use optimal solutions and industry best practices
- **Separation**: Keep mock data separate from source code
- **SOLID Principles**: Mandatory adherence to all SOLID design principles

### SOLID Principles Implementation

#### S - Single Responsibility Principle (SRP)
- Each class/function has one reason to change
- Separate concerns into distinct modules
- Example: UserService handles only user operations, not authentication

#### O - Open/Closed Principle (OCP)
- Open for extension, closed for modification
- Use interfaces and abstract classes
- Implement strategy pattern for varying behaviors

#### L - Liskov Substitution Principle (LSP)
- Derived classes must be substitutable for base classes
- Maintain behavioral contracts in inheritance
- Ensure subclasses don't break parent functionality

#### I - Interface Segregation Principle (ISP)
- Clients shouldn't depend on unused interface methods
- Create specific, focused interfaces
- Split large interfaces into smaller, cohesive ones

#### D - Dependency Inversion Principle (DIP)
- Depend on abstractions, not concretions
- Use dependency injection containers
- High-level modules shouldn't depend on low-level modules

### Project Structure Rules
- **Database Files**: Must be placed in predefined subdirectories within `database/`
  - `database/migrations/` - SQL migration files
  - `database/scripts/` - Database utility scripts  
  - `database/seeds/` - Seed data files
  - **Prohibited**: Creating files directly in `database/` root

### File Organization
```
Graduation/
├── backend/                 # NestJS TypeScript API
├── frontend/               # React TypeScript UI
├── database/
│   ├── migrations/         # ✅ SQL migrations here
│   ├── scripts/           # ✅ DB scripts here
│   └── seeds/             # ✅ Seed data here
├── scripts/               # Python utilities
└── docs/                  # Documentation
```

## 📝 Documentation Standards

### Authorship
- **Author Field**: Always use "Linh Dang Dev" in:
  - Markdown documents
  - Code file headers
  - Documentation files
  - Any authored content

### Documentation Format
```markdown
# Document Title

**Author**: Linh Dang Dev
**Created**: YYYY-MM-DD
**Purpose**: Brief description

[Content here]
```

## 🔧 Development Workflow

### Task Execution
1. Analyze requirements thoroughly
2. Use minimal, efficient code solutions
3. Follow TypeScript best practices
4. Ensure proper file placement
5. Test functionality
6. Provide completion summary

### Python Script Usage
- Use `python3` command line interface
- Create utility scripts in `scripts/` directory
- Follow Python best practices and PEP 8

### Package Management
```bash
# ✅ Correct
pnpm install
pnpm run dev
pnpm run build

# ❌ Incorrect
npm install
npm run dev
```

## 📊 Quality Assurance

### Code Review Checklist
- [ ] TypeScript types properly defined
- [ ] No unnecessary comments
- [ ] Clean, minimal implementation
- [ ] Proper file location
- [ ] Mock data separated
- [ ] Best practices followed
- [ ] pnpm commands used
- [ ] SOLID principles applied
- [ ] Single responsibility per class/function
- [ ] Interfaces used for abstractions
- [ ] Dependencies properly injected

### File Placement Validation
- [ ] Database files in correct subdirectories
- [ ] Source code in appropriate modules
- [ ] Scripts in designated directories
- [ ] Documentation properly organized

## 🎯 Task Completion Protocol

### Summary Format
```markdown
## Task Summary

### ✅ Completed:
- [List completed items]

### ⏳ Pending:
- [List remaining items]

### 📝 Notes:
- [Any important observations]
```

## 🚀 Best Practices Enforcement

### TypeScript Standards
- Strict type checking enabled
- Interface definitions for all data structures
- Proper error handling
- Async/await patterns

### Project Hygiene
- Regular dependency updates via pnpm
- Consistent code formatting
- Proper Git commit messages
- Documentation updates

---

**Remember**: These guidelines ensure consistent, high-quality development across the Graduation System project. Always prioritize clean, efficient solutions that follow established patterns.