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
| **bcrypt** | Hashing |
| **Cookies** | Secure session token storage |
| **Resend** | Notification emails |
| **Zod** | Request data validation |

---

## Authors

- **Luca Latigano** - [GitHub]([https://github.com/LucaLaatigano])
- **Leandro Marín** - [GitHub]([https://github.com/leanmarin])

---

## License

This project is licensed under the MIT License.
