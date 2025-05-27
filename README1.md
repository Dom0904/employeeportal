# Employee Portal Application

A comprehensive employee portal web application with role-based access control, personal profile management, and various productivity features.

## Features

- **Authentication & Authorization**: Role-based access control with admin, moderator, manager, and regular user roles
- **Dashboard**: Overview of announcements, schedules, tasks, and leave requests
- **Personal Information**: View and edit personal profile information
- **Employee Management**: List and track employee status (with role-specific permissions)
- **Job Management**: Schedule, calendar, assignments, and time tracking
- **Leave Management**: Request and track leave requests
- **Inventory Management**: Track inventory items
- **Financial Tools**: Cost estimation and bill of materials
- **Announcements**: Company-wide announcement system

## Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)

## Getting Started

1. Clone this repository or navigate to the employee-portal directory
2. Install dependencies:

```bash
cd employee-portal
npm install
```

3. Start the development server:

```bash
npm start
```

4. Open your browser and navigate to http://localhost:3000

## Login Credentials (For Testing)

- **Admin**: ID: 1001, Password: password
- **Moderator**: ID: 1002, Password: password
- **Manager**: ID: 1003, Password: password
- **Regular User**: ID: 1004, Password: password

## Project Structure

```
employee-portal/
├── src/
│   ├── components/     # Reusable UI components
│   ├── contexts/       # Context providers (Auth, etc.)
│   ├── hooks/          # Custom React hooks
│   ├── pages/          # Page components
│   ├── services/       # API services
│   ├── types/          # TypeScript interfaces & types
│   ├── assets/         # Static assets (images, etc.)
│   ├── App.tsx         # Main app component with routes
│   └── index.tsx       # Application entry point
├── public/             # Static files
└── package.json        # Dependencies and scripts
```

## Technology Stack

- React.js
- TypeScript
- Material UI
- React Router

## Current Status

The application includes the following completed pages:
- Login page with authentication
- Dashboard with overview information
- Personal Information page with edit functionality
- Layout with responsive sidebar navigation

Other pages are currently placeholders to be implemented in future updates.

## Future Enhancements

- Integration with a real backend API
- Email notifications
- Mobile responsiveness improvements
- Advanced reporting features
- Chat functionality for teams

## License

MIT 