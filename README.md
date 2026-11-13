# 🛍️ VisionCart – AI-Powered Fashion Shopping Platform

**VisionCart** is an AI-powered fashion shopping platform designed to make online shopping smarter, more personalized, and budget-friendly. It leverages Artificial Intelligence, semantic search, and recommendation systems to help users discover products and build compatible outfits.

## 🚀 Key Features

- **AI Budget Optimizer:** Discover products and outfit combinations based on a defined shopping budget.
- **Personalized Recommendations:** Get product suggestions based on user preferences and requirements.
- **Outfit Compatibility:** Find matching clothing, shoes, and accessories.
- **Occasion-Based Shopping:** Explore recommendations for different occasions.
- **Semantic Product Search:** Search products using natural language and vector embeddings.
- **AI Shopping Assistant:** Get conversational shopping assistance powered by Google Gemini.
- **AI Product Comparison:** Compare products to make informed purchasing decisions.
- **RAG-Based Recommendations:** Retrieve relevant product information using Retrieval-Augmented Generation.

## 🧠 AI & Recommendation Architecture

VisionCart integrates AI technologies to improve product discovery and shopping recommendations.

- **RAG (Retrieval-Augmented Generation):** Retrieves relevant product information to generate context-aware recommendations.
- **Embeddings:** Converts product information into numerical vector representations.
- **Vector Search:** Uses PostgreSQL with pgvector for semantic similarity search.
- **LLM Integration:** Uses Google Gemini API for conversational AI capabilities.
- **Recommendation Engine:** Supports personalized product discovery and outfit suggestions.

## 🛠️ Technology Stack

| Component | Technologies |
|---|---|
| Frontend | Next.js, React |
| Backend | Python, FastAPI |
| Database | PostgreSQL |
| ORM | SQLAlchemy |
| Vector Database | pgvector |
| AI / LLM | Google Gemini API |
| Embeddings | Sentence Transformers |
| AI Architecture | RAG, Semantic Search |
| Migrations | Alembic |

## 🏗️ Project Structure

```text
visioncart/
│
├── backend/
│   ├── app/
│   │   ├── api/
│   │   ├── ai/
│   │   ├── core/
│   │   ├── db/
│   │   ├── models/
│   │   └── schemas/
│   ├── alembic/
│   └── requirements.txt
│
├── frontend/
│
├── tests/
│
├── .env.example
└── README.md
```

## ⚙️ Getting Started

### Prerequisites

- Python 3.11+
- Node.js and npm
- PostgreSQL with pgvector extension
- Google Gemini API Key

### 1. Clone the Repository

```bash
git clone https://github.com/ayushsharma-engineer/visioncart.git
cd visioncart
```

### 2. Backend Setup

```bash
cd backend

python -m venv .venv
```

Activate the virtual environment:

**Windows:**
```powershell
.venv\Scripts\activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Configure your environment variables using the provided `.env.example` file.

Run database migrations:

```bash
alembic upgrade head
```

Start the backend:

```bash
uvicorn app.main:app --reload
```

Backend API documentation:

```text
http://127.0.0.1:8000/docs
```

### 3. Frontend Setup

```bash
cd frontend

npm install
npm run dev
```

Frontend development server:

```text
http://localhost:3000
```

## 🔐 Environment Variables

Configure the required environment variables in your local `.env` file.

```env
DATABASE_URL=
SECRET_KEY=
GEMINI_API_KEY=
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
FRONTEND_URL=
```

**Note:** Never commit API keys, database credentials, or secret keys to GitHub.

## 📌 Project Status

**Currently under active development.**

VisionCart is being developed and tested in a local environment. AI-powered recommendations, RAG integration, backend APIs, and frontend functionality are part of the ongoing development process.

## 🔮 Future Enhancements

- Weather-based product recommendations.
- AI-powered size and fit assistant.
- Material intelligence and quality scoring.
- Visual product search.
- Digital wardrobe assistant.
- Enhanced personalization and recommendation models.
- Cloud deployment and production optimization.

## 👨‍💻 Developer

**Ayush Sharma**

- GitHub: [@ayushsharma-engineer](https://github.com/ayushsharma-engineer)
- LinkedIn: [Ayush Sharma](https://linkedin.com/in/ayush-sharma)

---

⭐ If you find this project interesting, consider giving the repository a star!

**VisionCart – Shop Smarter. Style Better.**
