# PurposeLog 📝

PurposeLog is a task management backend built with **Node.js**, **Express.js**, and **MongoDB**.  
It provides secure user authentication, profile management, and task management features with filtering, sorting, search, and pagination support.

---

## Features

- **User Authentication**
  - Register, Login, Logout
  - JWT Authentication with access & refresh tokens
  - Secure password hashing with bcrypt
- **User Profile**
  - View and update profile
  - Change password
  - Upload and update avatar (Cloudinary integration)
  - Delete account (with related tasks and avatar cleanup)
- **Task Management**
  - Create, Read, Update, Delete tasks (CRUD)
  - Search, filter, sort, and paginate tasks
- **Error Handling**
  - Centralized error handler
  - 404 Not Found handler
- **File Uploads**
  - Multer for handling local uploads
  - Cloudinary for cloud image storage

---

## 🛠️ Tech Stack

- **Backend:** Node.js, Express.js
- **Database:** MongoDB + Mongoose
- **Authentication:** JWT, bcrypt
- **File Uploads:** Multer, Cloudinary

---

## 📂 Project Structure

```txt
PurposeLog/
└── backend/
    ├── src/
    │   ├── config/        # Database config
    │   ├── controllers/   # Request handlers
    │   ├── middlewares/   # Auth, error handling, multer
    │   ├── models/        # Mongoose schemas
    │   ├── routes/        # API routes
    │   ├── utils/         # Helpers (asyncHandler, etc.)
    │   ├── temp/uploads/  # Temporary local file uploads
    │   └── server.js      # App entry point
    ├── .gitignore
    ├── .env.example       # Sample environment variables
    ├── package.json
    └── README.md

```

---

## 📄 License

MIT License.

---

## 👨‍💻 Author

**Tehseen Javed**  
Backend Developer | Computer Systems Engineering Student @ DUET
[GitHub Profile](https://github.com/Tehseen100)

---
