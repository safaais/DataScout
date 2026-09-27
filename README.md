# DataScout

An AI-powered data analysis agent that lets you talk to your data in plain English or Arabic, with no coding required.

[![Python](https://img.shields.io/badge/Python-3.12+-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.104+-green.svg)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18.2+-61DAFB.svg)](https://reactjs.org/)
[![Scikit-learn](https://img.shields.io/badge/scikit--learn-1.3+-F7931E.svg)](https://scikit-learn.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Endpoints](#api-endpoints)
- [Example Workflow](#example-workflow)
- [Sample Datasets](#sample-datasets)
- [How It Works](#how-it-works)
- [Explainable AI with SHAP](#explainable-ai-with-shap)
- [Use Cases](#use-cases)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)
- [Author](#author)
- [Acknowledgments](#acknowledgments)

---

## Overview

**DataScout** is an intelligent agent that transforms how users interact with tabular data. Upload a CSV or Excel file, ask questions in natural language, and the system automatically handles data analysis, visualization, model training, and predictions.

The project combines AutoML, foundation models (TabPFN), explainable AI (SHAP), and large language models (GPT) into a single, unified platform.

---

## Key Features

### AI Agent Capabilities

| Feature | Description |
|---|---|
| Natural Language Interface | Ask questions in English or Arabic |
| Auto-Detection | Automatically identifies regression, classification, or time series problems |
| AutoML | Trains 10+ models and selects the best performer |
| Foundation Models | Supports TabPFN for improved accuracy on small datasets |
| SHAP Explainability | Explains why the model made each prediction |
| Time Series Forecasting | Prophet, ARIMA, and Simple Moving Average |
| Multi-Language Support | Full Arabic and English UI support |

### Dashboard Workflow

A streamlined, three-step workflow designed for non-technical users:

1. **Upload and Prepare** — Upload data, handle missing values, remove duplicates, and normalize features.
2. **Target and Train** — Select the target column, choose the problem type, and run AutoML.
3. **Results and Predict** — Compare models, review SHAP explanations, and generate predictions.

### Chat Interface

- Real-time conversation with your dataset
- Quick action buttons for common tasks
- Session-based memory

### Security

- Prompt injection protection to block malicious queries
- Query sanitization to remove dangerous characters
- API key authentication to protect sensitive endpoints
- Automatic data leakage detection (removes ID/index columns)

---

## Architecture

```
User (Browser)
Uploads data and asks questions
        |
        v
Frontend (React + Vite)
- Dashboard (3-step workflow)
- Chat interface
- Recharts and Plotly visualizations
        |
        | HTTP / REST
        v
Backend (FastAPI)
- API routes and authentication
- Security and logging
- Business logic services
        |
        +-------------------+-------------------+
        v                   v                   v
Data Service          ML Service           LLM Service
- Pandas              - Scikit-learn       - OpenAI GPT
- Cleaning            - TabPFN             - Fallback logic
- Caching             - AutoML
```

---

## Tech Stack

### Backend

| Technology | Purpose |
|---|---|
| FastAPI | Modern REST API framework |
| Pandas / NumPy | Data processing and analysis |
| Scikit-learn | Classical machine learning models |
| TabPFN | Foundation model for tabular data |
| SHAP | Model explainability |
| Prophet / Statsmodels | Time series forecasting |
| OpenAI GPT | Natural language understanding |
| Joblib | Model persistence |

### Frontend

| Technology | Purpose |
|---|---|
| React 18 | UI framework |
| Vite | Build tool |
| Axios | HTTP client |
| Recharts | Performance charts |
| Plotly.js | Interactive visualizations |
| React Markdown | Chat message rendering |

### Supported ML Models

| Task | Models |
|---|---|
| Regression | Random Forest, Linear Regression, Ridge, Lasso, Decision Tree, KNN, Extra Trees, Gradient Boosting, AdaBoost, Elastic Net |
| Classification | Random Forest, Logistic Regression, SVM, KNN, Decision Tree, Extra Trees, Gradient Boosting, AdaBoost |
| Time Series | Prophet, ARIMA, Simple Moving Average |

---

## Project Structure

```
datascout/
│
├── backend/
│   ├── app/
│   │   ├── main.py                     # FastAPI application entry point
│   │   ├── config.py                   # Configuration & environment variables
│   │   │
│   │   ├── api/
│   │   │   └── routes.py               # All API endpoints
│   │   │
│   │   ├── core/
│   │   │   ├── security.py             # Prompt injection protection
│   │   │   └── logger.py               # Logging configuration
│   │   │
│   │   ├── services/
│   │   │   ├── data_service.py         # Data loading & cleaning
│   │   │   ├── ml_service.py           # AutoML & model training
│   │   │   ├── llm_service.py          # OpenAI integration
│   │   │   └── timeseries_service.py   # Time series forecasting
│   │   │
│   │   ├── schemas/
│   │   │   └── request_models.py       # Pydantic models
│   │   │
│   │   └── utils/
│   │       └── helpers.py              # Utility functions
│   │
│   ├── uploads/                        # Temporary uploaded files
│   ├── models/                         # Saved trained models
│   ├── logs/                           # Application logs
│   ├── requirements.txt
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── UploadSection.jsx       # File upload UI
│   │   │   ├── DataPreparation.jsx     # Data cleaning options
│   │   │   ├── TargetConfig.jsx        # Target selection & training
│   │   │   ├── ModelResults.jsx        # Results display
│   │   │   ├── BestModelCard.jsx       # Best model highlight
│   │   │   ├── ModelsTable.jsx         # Model comparison
│   │   │   ├── ModelCharts.jsx         # Performance charts
│   │   │   ├── PredictionForm.jsx      # Prediction input
│   │   │   └── SHAPDashboard.jsx       # SHAP explanation
│   │   │
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx           # 3-step workflow
│   │   │   └── ChatInterface.jsx       # Chat UI
│   │   │
│   │   ├── services/
│   │   │   └── api.js                  # API client
│   │   │
│   │   ├── context/
│   │   │   └── AppContext.jsx          # Global state
│   │   │
│   │   ├── App.jsx
│   │   └── main.jsx
│   │
│   ├── package.json
│   └── vite.config.js
│
├── .gitignore
└── README.md
```

---

## Getting Started

### Prerequisites

- Python 3.12 or higher
- Node.js 18 or higher
- npm or yarn
- (Optional) OpenAI API key for AI chat
- (Optional) Hugging Face token for TabPFN

### 1. Backend Setup

```bash
# Navigate to backend
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
cp .env.example .env
# Edit .env and add your API keys (optional)

# Start the server
python -m app.main
```

The backend runs at `http://localhost:8000`.

### 2. Frontend Setup

```bash
# In a new terminal, navigate to frontend
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend runs at `http://localhost:3000`.

### 3. Open in Browser

| Service | URL |
|---|---|
| Dashboard | http://localhost:3000 |
| API Docs (Swagger) | http://localhost:8000/api/v1/docs |

---

## Environment Variables

Create a `.env` file in the `backend/` directory:

```env
# OpenAI API Key (optional - for AI chat)
OPENAI_API_KEY=sk-your-key-here

# Hugging Face Token (optional - for TabPFN)
HF_TOKEN=hf_your-token-here

# Server Configuration
HOST=0.0.0.0
PORT=8000
DEBUG=True

# Storage
UPLOAD_DIR=uploads
MODEL_DIR=models

# API Keys for testing
API_KEY_DEV=dev_key_123
API_KEY_TEST=test_key_456
```

> **Note:** The system works without these keys. OpenAI enables natural language chat, and TabPFN improves accuracy on small datasets.

---

## API Endpoints

### Public Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | API information |
| GET | `/api/v1/health` | Health check |
| GET | `/api/v1/docs` | Interactive API documentation |

### Data Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/v1/upload` | Upload a CSV or Excel file |
| POST | `/api/v1/preprocess` | Clean data |
| GET | `/api/v1/session/{id}` | Get session information |
| GET | `/api/v1/auto_detect_task` | Auto-detect problem type |

### Machine Learning Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/v1/train_all` | Train all models (AutoML) |
| POST | `/api/v1/predict` | Generate a prediction |
| POST | `/api/v1/shap_explain` | Get a SHAP explanation |
| POST | `/api/v1/timeseries/forecast` | Generate a time series forecast |

### AI Chat Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/v1/chat` | Natural language chat |
| POST | `/api/v1/query` | Simple query (no authentication required) |

---

## Example Workflow

### Step 1: Upload Data

```bash
curl -X POST "http://localhost:8000/api/v1/upload" \
  -H "Authorization: Bearer dev_key_123" \
  -F "file=@insurance.csv"
```

Response:

```json
{
  "success": true,
  "session_id": "abc-123-xyz",
  "filename": "insurance.csv",
  "rows": 1338,
  "columns": 7
}
```

### Step 2: Train Models

```bash
curl -X POST "http://localhost:8000/api/v1/train_all" \
  -H "Authorization: Bearer dev_key_123" \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "abc-123-xyz",
    "target_column": "charges",
    "problem_type": "regression"
  }'
```

Response:

```json
{
  "success": true,
  "best_model": "Random Forest",
  "best_score": 0.8816,
  "all_models": {
    "Random Forest": {"r2": 0.8816, "mae": 2583.64},
    "Linear Regression": {"r2": 0.8068, "mae": 4182.35}
  }
}
```

### Step 3: Make a Prediction

```bash
curl -X POST "http://localhost:8000/api/v1/predict" \
  -H "Authorization: Bearer dev_key_123" \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "abc-123-xyz",
    "values": {
      "age": 30,
      "bmi": 25,
      "children": 2,
      "smoker": "yes",
      "sex": "male",
      "region": "southeast"
    }
  }'
```

Response:

```json
{
  "success": true,
  "prediction": 18741.49
}
```

---

## Sample Datasets

The system works with any CSV or Excel file. The following datasets are recommended for testing:

| Dataset | Task | Rows | Recommended Target |
|---|---|---|---|
| insurance.csv | Regression | 1,338 | charges |
| iris.csv | Classification | 150 | Species |
| gold_price.csv | Time Series | 5,317 | Close |
| DailyDelhiClimate.csv | Time Series | 1,461 | meantemp |

---

## How It Works

### Auto-Detection Logic

The system automatically detects the problem type using the following logic:

1. If a date/time column exists, the task is treated as time series.
2. Otherwise, if the target column is categorical or has 10 or fewer unique values, the task is treated as classification.
3. Otherwise, the task is treated as regression.

### Feature and Target Separation

- **Target Column:** The column to be predicted.
- **Features:** All other columns, excluding ID/index columns.

### Data Leakage Prevention

Columns named `Id`, `Index`, `Row`, `Unnamed`, or similar are automatically removed to prevent data leakage.

### Model Selection

The system trains multiple models and selects the one with the highest score:

- **Regression:** R² score
- **Classification:** Accuracy

---

## Explainable AI with SHAP

SHAP (SHapley Additive exPlanations) explains each prediction by showing how much each feature contributed to the result.

Example output:

```
Detailed Explanation

smoker    +$10,245
  Being a smoker increased the prediction by $10,245.

age       +$2,341
  Being older increased the prediction by $2,341.

bmi       +$1,234
  Higher BMI increased the prediction by $1,234.

Summary
Base value: $13,119
Final prediction: $18,741
```

---

## Use Cases

| Domain | Example |
|---|---|
| Healthcare | Predict insurance costs based on patient data |
| Finance | Forecast stock prices using time series analysis |
| Retail | Classify customers into segments |
| Real Estate | Predict house prices |
| Education | Analyze student performance |

---

## Roadmap

- [ ] AutoGluon foundation models (Mitra, TabICL)
- [ ] Multi-user support with authentication
- [ ] Report export (PDF, Excel)
- [ ] Real-time predictions via WebSockets
- [ ] Docker deployment
- [ ] MLflow experiment tracking
- [ ] Additional foundation models

---

## Acknowledgments

- [TabPFN](https://github.com/automl/TabPFN) — Foundation model for tabular data
- [FastAPI](https://fastapi.tiangolo.com/) — Modern web framework
- [SHAP](https://shap.readthedocs.io/) — Model explainability
- [Recharts](https://recharts.org/) — React charts
- [Plotly](https://plotly.com/javascript/) — Interactive visualizations
- [Scikit-learn](https://scikit-learn.org/) — Machine learning library

---

<p align="center">
If you find this project useful, please consider giving it a star.
</p>
