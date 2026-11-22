# CampusConnect – University Campus Management System

A backend-first university management platform built for the Backend Development Capstone Project.

**Technology Stack:** Node.js, Express.js, MongoDB, Mongoose, JWT, bcryptjs and Socket.IO.

## 1. Project Overview

CampusConnect is a University Campus Management System designed to manage students, faculty, courses, sections, enrolments, attendance and announcements through REST APIs.

The system provides role-based access for administrators, faculty members and students. It also supports real-time notifications using Socket.IO.

## 2. Implemented Modules

- Role-based accounts: Admin, Faculty and Student
- Student self-registration
- User login and logout
- JWT-based authentication
- Refresh token rotation
- Admin-managed users
- Course management
- Section management
- Student course enrolment
- Faculty attendance management
- Student attendance history
- Subject-wise attendance percentage
- University, course and section announcements
- Low-attendance reports
- Course-enrolment reports
- MongoDB aggregation pipelines
- Database indexes and validation
- EventEmitter event handling
- Real-time notifications using Socket.IO
- Centralized error handling
- Request logging
- Helmet security middleware
- CORS configuration
- Rate limiting

## 3. Technology Requirements

- Node.js 18.17 or above
- MongoDB local instance or MongoDB Atlas
- npm
- Postman
- Visual Studio Code (recommended)

## 4. Installation and Setup

Clone or download the project and open the project directory.

Install dependencies:

```bash
npm install
```

Create a `.env` file in the root directory using `.env.example` as a reference.

Configure the following environment variables:

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_ACCESS_SECRET=your_access_secret
JWT_REFRESH_SECRET=your_refresh_secret
CLIENT_ORIGIN=http://localhost:3000
```

Use strong private secrets and never commit your `.env` file.

Start the development server:

```bash
npm run dev
```

Run the database seed script:

```bash
npm run seed
```

**API Base URL:**

```text
http://localhost:5000/api
```

**Health Check:**

```text
GET /api/health
```

## 5. Demo Accounts

After running the seed script, the following demo accounts are available:

| Role | Email | Password |
|---|---|---|
| Admin | admin@campusconnect.edu | Admin@12345 |
| Faculty | faculty@campusconnect.edu | Faculty@12345 |
| Student | student1@campusconnect.edu | Student@12345 |

These accounts are for local development and academic demonstration only.

Change demo passwords and secrets before public deployment.

**Note:** The seed script resets project collections. Use it only with a disposable development database.

## 6. Authentication and Authorization

CampusConnect uses JSON Web Tokens (JWT) for authentication.

Authentication workflow:

1. Users register or log in using their credentials.
2. The server verifies the credentials.
3. The server generates an access token and refresh token.
4. The access token is sent in the Authorization header.
5. Protected routes verify the token before allowing access.
6. Role-based authorization restricts access to specific operations.
7. Refresh tokens can be rotated, and logout invalidates the refresh token.

Example Authorization header:

```text
Authorization: Bearer YOUR_ACCESS_TOKEN
```

Public registration creates student accounts only.

Administrators can create faculty and admin accounts.

## 7. API Endpoints Overview

### Authentication

| Method | Endpoint | Access |
|---|---|---|
| POST | /api/auth/register | Public |
| POST | /api/auth/login | Public |
| POST | /api/auth/refresh | Public |
| POST | /api/auth/logout | Authenticated |
| GET | /api/auth/me | Authenticated |

### Users

| Method | Endpoint | Access |
|---|---|---|
| GET | /api/users | Admin |
| POST | /api/users | Admin |
| GET | /api/users/:id | Admin |
| PATCH | /api/users/:id | Admin |
| DELETE | /api/users/:id | Admin |
| PATCH | /api/users/me | Authenticated |

### Courses

| Method | Endpoint | Access |
|---|---|---|
| GET | /api/courses | Authenticated |
| GET | /api/courses/:id | Authenticated |
| POST | /api/courses | Admin |
| PATCH | /api/courses/:id | Admin |
| DELETE | /api/courses/:id | Admin |

### Sections

| Method | Endpoint | Access |
|---|---|---|
| GET | /api/sections | Authenticated |
| POST | /api/sections | Admin |
| POST | /api/sections/:id/students | Admin |

### Enrolments

| Method | Endpoint | Access |
|---|---|---|
| GET | /api/enrollments | Authenticated |
| POST | /api/enrollments | Authenticated |
| PATCH | /api/enrollments/:id/drop | Admin |

### Attendance

| Method | Endpoint | Access |
|---|---|---|
| POST | /api/attendance/mark | Faculty/Admin |
| GET | /api/attendance/me | Authenticated |
| GET | /api/attendance/summary | Authenticated |

### Announcements

| Method | Endpoint | Access |
|---|---|---|
| GET | /api/announcements | Authenticated |
| POST | /api/announcements | Faculty/Admin |
| DELETE | /api/announcements/:id | Admin |

### Reports

| Method | Endpoint | Access |
|---|---|---|
| GET | /api/reports/low-attendance | Faculty/Admin |
| GET | /api/reports/course-enrolment | Faculty/Admin |

*Note: Access permissions are based on the implemented route middleware.*

## 8. Example API Requests

### Login

**POST** `/api/auth/login`

```json
{
  "email": "admin@campusconnect.edu",
  "password": "Admin@12345"
}
```

### Create a Faculty User

**POST** `/api/users`

```json
{
  "name": "Dr. Asha Sharma",
  "email": "asha@example.edu",
  "password": "StrongPass123",
  "role": "faculty",
  "department": "Computer Science",
  "facultyId": "FAC002"
}
```

### Create a Course

**POST** `/api/courses`

```json
{
  "code": "CSE302",
  "title": "Database Management Systems",
  "department": "Computer Science",
  "faculty": "FACULTY_MONGOOSE_ID",
  "credits": 4
}
```

### Mark Attendance

**POST** `/api/attendance/mark`

```json
{
  "course": "COURSE_MONGOOSE_ID",
  "section": "SECTION_MONGOOSE_ID",
  "date": "2026-11-22",
  "records": [
    {
      "student": "STUDENT_MONGOOSE_ID",
      "status": "present"
    },
    {
      "student": "ANOTHER_STUDENT_ID",
      "status": "absent"
    }
  ]
}
```

## 9. MongoDB Aggregation Pipelines

The project uses MongoDB aggregation pipelines for generating reports and performing calculations.

Implemented aggregation operations include:

1. **Attendance Summary:** Calculates total classes attended and attendance percentage for each course.
2. **Low Attendance Report:** Identifies students whose attendance percentage is below the configured threshold.
3. **Course Enrolment Report:** Calculates the number of active students enrolled in each course.

MongoDB aggregation stages used include:

- `$match`
- `$group`
- `$lookup`
- `$unwind`
- `$project`
- `$addFields`
- `$sort`

## 10. Database Indexes

Database indexes improve query performance and help maintain data consistency.

Examples of indexes implemented include:

- Unique user email index
- Unique course code index
- Student and faculty ID indexes
- Compound role and department index
- Department and active-course index
- Unique student-course enrolment index
- Unique student-course-date attendance index

## 11. EventEmitter and Socket.IO

CampusConnect uses Node.js EventEmitter and Socket.IO for real-time event communication.

**EventEmitter Events:**

- `announcement-created`
- `attendance-marked`

**Socket.IO Events:**

Server-to-client events:
- `connected`
- `announcement:new`
- `announcement:published`
- `attendance:updated`

Client-to-server events:
- `join-course`

Socket.IO connections are authenticated using JWT access tokens.

Example client connection:

```javascript
const { io } = require("socket.io-client");

const socket = io("http://localhost:5000", {
  auth: {
    token: accessToken
  }
});
```

When an announcement is published, the backend triggers an EventEmitter event, which is handled by Socket.IO to deliver real-time notifications.

## 12. API Testing

The project includes a Postman collection inside the `postman/` folder.

The collection contains requests organized by functionality, including:

- Health check
- User registration
- Login and logout
- User management
- Course listing and management
- Section management
- Enrolment management
- Attendance marking and retrieval
- Low-attendance reports
- Course-enrolment reports
- Announcements

Important test cases include:

- Successful API requests
- Missing or invalid access tokens (401)
- Unauthorized roles (403)
- Unknown resources (404)
- Successful CRUD operations
- Attendance calculations
- Aggregation reports
- Real-time Socket.IO notifications

## 13. Project Architecture

The backend follows a modular MVC-style architecture.

**Request Flow:**

```text
Client / Postman
       |
       v
Express Routes
       |
       v
Middleware
       |
       v
Controllers
       |
       v
Mongoose Models
       |
       v
MongoDB Database
       |
       v
JSON Response
```

**Main Directory Structure:**

```text
CampusConnect/
│
├── src/
│   ├── config/
│   ├── controllers/
│   ├── events/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── seed/
│   ├── utils/
│   ├── app.js
│   └── server.js
│
├── postman/
├── .postman/
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

## 14. Security Features