# LESA Academy Portal - Institutional Control Center

**The Learning & Educational Science Academy (LESA)** Management System. A modern, high-performance, and secure full-stack web application designed to streamline academy operations, from student enrollment to fee management and parent communication.

![Dashboard Preview](frontend/src/assets/academy_logo.png)

## 🚀 Key Features

* **Institutional Dashboard**: Real-time analytics for active students, total revenue, and pending fees.
  * **Financial Overview**: Integrated monthly analytics for **Revenue**, **Expenses**, and **Net Profit**.
  * **Privacy Mode**: Toggle visibility of sensitive financial data with a click for secure presentations.
  * **Collapsible Sidebar**: Maximized workspace efficiency.
* **Expense Ledger & Audit System**:
  * **Interactive Accounting**: Click any expense record (e.g., "Electricity Bill") to view or edit full transaction details instantly.
  * **Vibrant Analytics**: Glassmorphic stat cards with color-coded iconography for at-a-glance financial health tracking.
  * **Category Intelligence**: Gridded cost distribution across Salary, Rent, Utilities, and other cost centers.
  * **Audit-Ready Exports**: Generate professional PDF reports of the academy's expense records.
* **Student Management**:
  * Comprehensive student profiles (Guardian details, contact info).
  * **Fee History**: Track paid/pending status with screenshot proofs.
  * **Promote/Demote**: Easily manage student progression through grades.
* **Smart Messaging System**:
  * **Direct SMS Integration**: Send fee reminders, exam notices, and general announcements to parents via Android SMS server.
  * **Bulk Actions**: Message individual students, multi-select groups, or broadcast to all parents instantly.
* **Modern UI/UX**:
  * **Glassmorphism Design**: Sleek, dark-mode-first interface with blurred backdrops and vibrant gradients.
  * **Responsive**: Fully optimized for desktop, tablet, and mobile use.
  * **Fluid Animations**: Powered by Framer Motion for a premium feel.
* **PDF Reports**: Generate professional student lists and fee reports on the fly.

## 🛠️ Technology Stack

### Frontend

* **React 18** (Vite)
* **TailwindCSS** (Styling)
* **Framer Motion** (Animations)
* **Lucide React** (Icons)
* **Axios** (API Communication)

### Backend

* **Python Django** ( robust web framework)
* **Django REST Framework (DRF)** (API)
* **SimpleJWT** (Secure Authentication)
* **SQLite** (Default Database) / **PostgreSQL** (Production Ready)

## 📦 Installation Guide

Follow these steps to set up the project locally.

### Prerequisites

* Node.js (v16+)
* Python (v3.10+)
* Git

### 1. Clone the Repository

```bash
git clone https://github.com/ayazkhan1410/lesa-academy-portal.git
```

### 2. Backend Setup

```bash
# Create a virtual environment
python -m venv venv

# Activate the virtual environment
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# Create a superuser (for admin access)
python manage.py createsuperuser

# Start the Django server
python manage.py runserver
```

The backend will run at `http://127.0.0.1:8000/`.

### 3. Frontend Setup

Open a new terminal window.

```bash
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

The frontend will run at `http://localhost:5173/`.

## 🔒 Default Credentials

* **Login URL**: `http://localhost:5173/`
* Use the superuser credentials you created in step 2 to log in.

## 🔗 Project Link

[https://github.com/ayazkhan1410/lesa-academy-portal](https://github.com/ayazkhan1410/lesa-academy-portal)

---
Developed with ❤️ by **Ayaz Khan**
