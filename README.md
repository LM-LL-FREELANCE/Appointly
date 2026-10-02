# Medical Office Appointment System

A **fullstack** web application for managing appointments at a medical office. It lets patients book appointments quickly and easily, and automatically notifies them by email if one of their appointments is cancelled.

---

## The Problem

Booking a medical appointment is often a hassle: busy phone lines, limited office hours, and little information about actual availability. On top of that, when an appointment gets cancelled, patients don't always find out in time and end up going to the office for nothing.

## The Solution

This application centralizes appointment management in a web platform where:

- Patients can **book appointments online**, at any time and from any device.
- The medical office can **manage appointments** in an organized way.
- If an appointment is **cancelled**, the patient **automatically receives an email** letting them know.

---

## Main Features

- **Appointment booking** that is fast and intuitive.
- **Appointment cancellation** with automatic email notification to the patient.
- **Email delivery** powered by Resend.
- **Secure authentication** using JWT stored in cookies, with passwords hashed using bcrypt.
- **Data validation** for forms and requests using Zod.
- **Statistics visualization** through charts built with Recharts.
- **Efficient server data handling** with TanStack React Query (caching, refetching, and synchronization).

---

## Tech Stack

### Frontend

| Technology | Purpose |
|---|---|
| **JavaScript** | Main programming language |
| **React** | User interface |
| **Mantine** | UI component library |
| **TanStack React Query** | Data fetching, caching, and server state management |
| **Recharts** | Charts and data visualization |
| **Zod** | Form and schema validation |

### Backend

| Technology | Purpose |
|---|---|
| **Node.js** | Server runtime |
| **Express** | REST API framework |
| **MySQL** | Relational database |
| **JWT** | Token-based authentication |
| **bcrypt** | Password hashing |
| **Cookies** | Secure session token storage |
| **Resend** | Notification emails |
| **Zod** | Request data validation |

---

## Installation and Usage

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/YOUR_REPOSITORY.git
cd YOUR_REPOSITORY
```

### 2. Set up the backend

```bash
cd backend
npm install
```

Create a `.env` file in the backend folder with the following variables:

```env
PORT=3000
DB_HOST=localhost
DB_USER=your_user
DB_PASSWORD=your_password
DB_NAME=your_database_name
JWT_SECRET=your_secret_key
RESEND_API_KEY=your_resend_api_key
```

Start the server:

```bash
npm run dev
```

### 3. Set up the frontend

```bash
cd frontend
npm install
npm run dev
```

---

## Security

- Passwords are never stored in plain text: they are hashed with **bcrypt**.
- Sessions are handled with **JWT** stored in **cookies**, avoiding exposure of the token in browser storage.
- All incoming data is validated with **Zod** before being processed by the server.

---

## Authors

- **Your Name** - [GitHub](https://github.com/YOUR_USERNAME)

---

## License

This project is licensed under the MIT License.
