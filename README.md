# Customer Lens: Enterprise Customer Segmentation & Intelligence Platform

Customer Lens is an end-to-end customer segmentation and intelligence system built upon historical transactional, demographic, and campaign response data. It combines unsupervised hierarchical agglomerative clustering with an operational parametric inference surrogate, served via a FastAPI REST backend and an interactive React single-page analytics application.

---

## 1. Problem Statement & Project Objectives

* **Problem Statement:** In retail and direct marketing, customers exhibit diverse purchasing behaviors, income levels, and channel preferences. Traditional one-size-fits-all campaigns lead to high customer acquisition costs and low conversion rates. Furthermore, unsupervised clustering algorithms (such as Agglomerative Clustering) lack an out-of-sample decision boundary, making real-time classification of incoming customer profiles challenging without re-clustering the entire historical database.
* **Project Objectives:**
  1. Uncover distinct, behaviorally coherent customer segments from multi-dimensional transactional records using unsupervised machine learning.
  2. Implement an operational inference surrogate (`NearestCentroid` in reduced 3D PCA space) that enables immediate segment assignment for new customer profiles without retraining.
  3. Provide an intuitive, interactive analytical dashboard for marketing analysts and business decision-makers to explore segment behaviors, inspect individual customer profiles, simulate new classifications, and review empirical cluster statistics.
  4. Ensure rigorous, transparent machine learning reporting that clearly distinguishes empirical observations from strategic marketing hypotheses and surrogate approximation fidelity from ground-truth predictive accuracy.

---

## 2. Key Features of the Six-Page Application

1. **Executive Overview Dashboard (`/`):**
   * Real-time KPI summary displaying total customer population (2,236), active behavioral segments (4), and system health.
   * Visual segment market share distribution with demographic and spending benchmarks.
   * Dataset-wide financial and transactional baselines (income, total spend, recency, average tenure).

2. **Segment Explorer (`/segments`):**
   * Interactive 2D projection scatter plot of customer embeddings (PC1 vs. PC2) with cluster centroid overlays.
   * Dynamic sampling controls (All 2,236 points, Sample 1,000, Sample 500) with clear indicator notices when sampling is active.
   * Segment comparison radar and bar charts comparing cohort averages across 8 continuous business features.

3. **Customer Explorer (`/customers`):**
   * Paginated, searchable, and sortable tabular view of all 2,236 customer records.
   * Segment filtering and multi-column sorting (by Customer ID, Income, Total Spending, Recency).
   * Detailed slide-over drawer displaying an individual customer's 18 raw attributes, 3D PCA coordinates, and comparative deviation percentages against their assigned cluster benchmark.

4. **Predict Customer Segment (`/predict`):**
   * Real-time inference form accepting 21 demographic, financial, and channel attributes.
   * One-click preset archetypes (Young Family Starter, Affluent Spender, Budget Rural Household, Mid-Career Professional) for testing.
   * Real-time pipeline execution: feature engineering $\rightarrow$ One-Hot Encoding $\rightarrow$ StandardScaler transformation $\rightarrow$ PCA projection $\rightarrow$ Euclidean NearestCentroid assignment.
   * Output report presenting predicted segment name, 3D PCA coordinates, absolute Euclidean centroid distance (explicitly documented as non-probabilistic), and marketing action recommendations.

5. **Business Insights (`/business-insights`):**
   * Comprehensive strategic profiles for all 4 customer cohorts.
   * Clear separation between empirical observed baselines (derived directly from historical data) and testable marketing hypotheses.
   * Explicit removal of unverified revenue growth, ROI, or campaign conversion claims.

6. **Model Insights (`/model-insights`):**
   * Full transparency into the ML lifecycle: raw-to-processed pipeline, outlier removal criteria, one-hot encoding, and StandardScaler parameters.
   * Dimensionality reduction breakdown: 3 principal components explaining 44.95% cumulative variance, with explicit notice of the 55.05% uncaptured residual variance.
   * Algorithm comparison table (K-Means vs. Agglomerative Clustering) showing silhouette scores (0.3581 vs. 0.3793).
   * Explicit surrogate validation metrics, boundary confusion analysis, and documented system constraints.

---

## 3. Technology Stack

* **Backend:**
  * Python 3.10+
  * FastAPI (REST API framework with Pydantic v2 data validation schemas)
  * Uvicorn (ASGI web server)
  * Scikit-Learn (AgglomerativeClustering, NearestCentroid, PCA, StandardScaler, OneHotEncoder)
  * Pandas & NumPy (Data manipulation, feature engineering, and matrix operations)
  * Joblib (Model artifact persistence)
* **Frontend:**
  * React 19 + Vite (Modern client build toolchain)
  * Tailwind CSS v4 (Design system and responsive styling)
  * Lucide React (Iconography)
  * Recharts (Scatter plots, bar charts, and distribution graphs)
* **Development & Tooling:**
  * ESLint (Code quality and hook linting)
  * Native Python HTTP & in-memory test runner (Zero third-party test dependencies)

---

## 4. Architecture & Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                       React Frontend                        │
│ (Overview, Segments, Customers, Predict, Insights, Model)   │
└──────────────────────────────┬──────────────────────────────┘
                               │ REST / JSON (HTTP)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                      FastAPI Backend                        │
│ ┌─────────────────┬────────────────────┬──────────────────┐ │
│ │  /api/overview  │   /api/clusters    │  /api/customers  │ │
│ ├─────────────────┼────────────────────┼──────────────────┤ │
│ │  /api/health    │ /predict-segment   │  /api/model-info │ │
│ └─────────────────┴────────────────────┴──────────────────┘ │
└──────────────────────────────┬──────────────────────────────┘
                               │ In-Memory Pipeline & Artifacts
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                       ML Engine                             │
│ 1. Raw Feature Engineering (Age, Tenure, Spend, Children)   │
│ 2. Categorical Encoding (encoder.joblib)                     │
│ 3. Feature Standardization (scaler.joblib)                  │
│ 4. Dimensionality Reduction (pca.joblib -> 3 PCs)           │
│ 5. Segment Assignment (NearestCentroid Voronoi Classifier)   │
└─────────────────────────────────────────────────────────────┘
```

---

## 5. Dataset Description & Preprocessing

* **Raw Dataset:** `datasets/customers_dataset.csv` contains 2,240 customer records across 22 original attributes detailing customer demographics, spending across 6 product categories, purchasing channels, and marketing campaign responses.
* **Missing Value Imputation:** Missing values in the `Income` column (24 rows, ~1.07%) were imputed using the median income of the historical training population ($51,381.50).
* **Outlier Elimination:** Four extreme records were dropped during training based on domain outlier bounds:
  * Age $\ge$ 90 years (Customer IDs: 7829, 11004, 1150)
  * Income $\ge$ $600,000 (Customer ID: 9432; recorded income: $666,666)
  * Final clean population: **2,236 customers**.

---

## 6. Feature Engineering & Clustering Methodology

### Feature Transformations
From the cleaned records, 18 numerical and encoded features are structured:
1. $\text{Age} = \text{observation\_year} - \text{Year\_Birth}$ *(Standardized against training population distribution)*
2. $\text{Customer\_Tenure\_Days} = (\text{observation\_date} - \text{Dt\_Customer}).\text{days}$ *(Evaluated at 2014-06-29 for historical cohort, or current date for modern customers)*
3. $\text{Total\_Spending} = \sum (\text{MntWines} + \text{MntFruits} + \text{MntMeatProducts} + \text{MntFishProducts} + \text{MntSweetProducts} + \text{MntGoldProds})$
4. $\text{Total\_Children} = \text{Kidhome} + \text{Teenhome}$
5. Categorical simplification:
   * `Education` (5 levels) $\rightarrow$ 3 levels: `Graduate`, `Postgraduate`, `Undergraduate`.
   * `Marital_Status` (8 levels) $\rightarrow$ 2 levels: `Living_With_Alone`, `Living_With_Partner`.
6. One-Hot Encoding produces 5 binary indicator columns.
7. `StandardScaler` standardizes all 18 features to zero mean and unit variance.
8. `PCA(n_components=3)` projects the 18 standardized features into 3 orthogonal components, explaining **44.95%** of cumulative variance ($\text{PC1}=28.79\%$, $\text{PC2}=9.68\%$, $\text{PC3}=6.49\%$).

### Unsupervised Model Selection
During the exploratory data analysis:
* **K-Means ($k=4$):** Silhouette score = `0.3581` (Elbow method identified optimal $k=4$).
* **Agglomerative Clustering ($k=4$, Ward linkage):** Silhouette score = `0.3793`.
* **Selection:** Agglomerative Clustering with Ward linkage was selected as the reference segmentation model due to its higher cluster cohesion and separation in 3D PCA space.

---

## 7. The Four Customer Segments

The 2,236 historical customers partition deterministically into four distinct behavioral cohorts:

| Cluster ID | Segment Name | Customer Count | Share (%) | Avg. Income | Avg. Total Spend | Defining Behavioral Traits |
| :---: | :--- | :---: | :---: | :---: | :---: | :--- |
| **0** | **Budget Partner Households** | 905 | 40.47% | $38,591 | $145 | Married/together households with children; low wine/meat spend; frequent web visits; deals-seeking. |
| **1** | **Affluent Partner Spenders** | 534 | 23.88% | $73,723 | $1,281 | High-income couples; heavy wine & meat purchasers; catalog/store buyers; low web visit frequency. |
| **2** | **Budget Solo Shoppers** | 444 | 19.86% | $37,794 | $129 | Single/divorced individuals with children; low discretionary spend; discount responsive; modest tenure. |
| **3** | **Affluent Solo Spenders** | 353 | 15.79% | $74,801 | $1,299 | High-income single/independent customers; highest response to marketing campaigns (29.2%); premium spenders. |

---

## 8. NearestCentroid Inference & Surrogacy Limitations

* **The Inference Problem:** Hierarchical agglomerative clustering is a transductive graph/tree-merging algorithm without a parameterized hyperplane or out-of-sample `.predict()` method. Evaluating an unseen customer requires re-computing the full distance matrix and dendrogram across $N+1$ customers.
* **The Operational Solution:** A `NearestCentroid` classifier is fitted directly onto the historical 3D PCA coordinates and reference Agglomerative cluster labels. New customers are projected into 3D PCA space via the saved `StandardScaler` and `PCA` transformers, and assigned to the nearest cluster centroid by Euclidean distance:
  $$\hat{y} = \arg\min_{c \in \{0,1,2,3\}} ||\mathbf{x}_{\text{pca}} - \boldsymbol{\mu}_c||_2$$
* **Operational Limitations:**
  * **Not a Calibrated Probability:** The centroid distance reported by the API is an absolute Euclidean metric in PCA space, not a classification confidence or probability distribution.
  * **Surrogate Boundary Disagreement:** The parametric Voronoi partition produced by `NearestCentroid` does not exactly replicate the non-parametric Ward tree. Disagreements occur near cluster boundaries.

---

## 9. Verified Evaluation Metrics & Methodological Terminology

Prior evaluation iterations reported a 93.87% ± 1.97% or 96.42% ± 0.68% cross-validated agreement. A rigorous methodology audit confirmed that because preprocessing, PCA transformations, and reference cluster labels were derived from the entire 2,236 customer dataset, those numbers cannot be claimed as *held-out out-of-sample generalization*.

The verified, defensible metrics are:
* **In-Sample Surrogate Fidelity:** **96.29%** (2,153 of 2,236 customers match the reference Agglomerative partition exactly).
* **In-Sample Adjusted Rand Index (ARI):** **0.8947**.
* **5-Fold Cross-Validation Subsample Stability:** **93.87% ± 1.97%** (ARI = 0.8333).
* **Primary Confusion Boundary:** 81.9% of all surrogate disagreements (68 of 83 customers) occur exclusively between **Cluster 0** (Budget Partner Households) and **Cluster 1** (Affluent Partner Spenders) along the continuous income/spending boundary.

---

## 10. Dynamic Temporal Observation Policy & Extrapolation Boundaries

To support modern customer intake while preserving mathematical and statistical alignment with the pre-trained clustering artifacts, the feature engineering pipeline employs a dual-anchor dynamic observation policy:

1. **Dynamic Customer Age Calculation:**
   * $\text{Age} = \text{current\_year} - \text{Year\_Birth}$.
   * Input validation requires adult age ($18 \le \text{Age} \le 100$).
   * *Mathematical Invariance Note:* Standardizing $\text{Age} = C - \text{Year\_Birth}$ with `StandardScaler` is shift-invariant with respect to constant $C$ ($\mu_{\text{shifted}} = \mu + \Delta C$, $\sigma$ unchanged, standardized z-score identical). The pre-trained model geometry and cluster centroids remain preserved.

2. **Dual-Anchor Observation Policy for Tenure:**
   * $\text{Customer\_Tenure\_Days} = (\text{observation\_date} - \text{Dt\_Customer}).\text{days}$.
   * **Historical Cohort ($\text{Dt\_Customer} \le 2014\text{-}06\text{-}29$):** Evaluated against the historical dataset snapshot date (`2014-06-29`). Tenure aligns with the original training distribution ($0 \le \text{tenure} \le 699$ days).
   * **Modern Customers ($\text{Dt\_Customer} > 2014\text{-}06\text{-}29$):** Evaluated against the current execution date ($\text{today}$). Valid dates cannot be in the future ($\text{Dt\_Customer} \le \text{today}$).

3. **Separation of Input Validation vs. Out-of-Distribution Warnings:**
   * **Input Validation (HTTP 422):** Only rejects fundamentally invalid physical data (future enrolment dates, non-positive or astronomical income $> \$10,000,000$, non-adult ages).
   * **Extrapolation Detection (HTTP 200 + `warnings`):** Incoming profiles exceeding the empirical bounds of the training population are successfully predicted by the `NearestCentroid` surrogate, with explicit non-fatal warnings returned in the response payload and highlighted in the UI:
     * **Income Extrapolation:** Income exceeds $\$162,397$ (historical 99.8th percentile after dropping ID 9432).
     * **Tenure Extrapolation:** Tenure exceeds $699$ days (longest tenure in the original cohort).
     * **Age Extrapolation:** Age exceeds $86$ years (maximum age in cleaned training set).

---

## 11. Project Directory Structure

```
CustomerLens/
├── backend/
│   ├── config.py             # Centralised configurations, constants, and paths
│   ├── data_loader.py        # Dataset loading, alignment validation, and model fitting
│   ├── main.py               # FastAPI application factory and route registration
│   ├── predictor.py          # Prediction pipeline, feature assembly, and benchmarking
│   ├── schemas.py            # Pydantic v2 validation models and API contracts
│   └── routes/
│       ├── clusters.py       # GET /api/clusters, GET /api/clusters/{id}
│       ├── customers.py      # GET /api/customers, GET /api/customers/{id}
│       ├── health.py         # GET /api/health
│       ├── model_info.py     # GET /api/model-info
│       ├── overview.py       # GET /api/overview
│       └── predict.py        # POST /api/predict-segment
├── api/
│   └── index.py              # Vercel Serverless Function entry point
├── datasets/
│   ├── customers_dataset.csv # Raw historical dataset (2,240 rows)
│   ├── processed_features.csv# Preprocessed features table (2,236 rows, 18 cols)
│   └── processed_pca.csv     # Transformed 3D PCA coordinates (2,236 rows)
├── frontend/
│   ├── package.json          # Frontend dependencies and build scripts
│   ├── vite.config.js        # Vite build & proxy configuration
│   └── src/
│       ├── api/              # API client and route connectors
│       ├── components/       # Common UI cards, badges, charts, and layout
│       ├── pages/            # 6 application pages (Overview, Segments, etc.)
│       └── utils/            # Formatters and segment styling constants
├── model/
│   ├── encoder.joblib        # Fitted OneHotEncoder artifact
│   ├── kmeans_model.joblib   # Fitted KMeans model (retained for metadata)
│   ├── pca.joblib            # Fitted PCA(n_components=3) artifact
│   └── scaler.joblib         # Fitted StandardScaler artifact
├── notebooks/                # Exploratory data science research notebooks
├── scripts/
│   └── dev.js                # Unified dev launcher (pre-flight checks + graceful cleanup)
├── .vercelignore             # Vercel build exclusions
├── package.json              # Root project package and one-command scripts
├── requirements.txt          # Python backend runtime dependencies
├── vercel.json               # Vercel deployment & routing configuration
└── README.md                 # Complete system documentation
```

---

## 12. Local Setup & Execution Guide (Windows)

### Prerequisites
* **Python 3.10+** installed and available on PATH (`python --version`).
* **Node.js v18+** and **npm** installed (`node --version`).
* Windows PowerShell or Command Prompt.

### First-Time Machine Setup (Run Once)
Before running the one-command launcher, install Python and frontend packages:

1. **Install Python backend dependencies:**
   ```powershell
   # (Optional) Activate a virtual environment if desired:
   # python -m venv venv
   # .\venv\Scripts\Activate.ps1

   pip install -r requirements.txt
   ```

2. **Install frontend packages:**
   ```powershell
   cd frontend
   npm install
   cd ..
   ```

   > [!TIP]
   > **Windows PowerShell Execution Policy Note:**
   > If you encounter `File ...\npm.ps1 cannot be loaded because running scripts is disabled on this system`, either:
   > 1. Run `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser` once in PowerShell, or
   > 2. Use `npm.cmd` instead (e.g., `npm.cmd install`, `npm.cmd run dev`).

### One-Command Startup
To start both the Vite frontend and FastAPI backend simultaneously from the project root:

```powershell
npm run dev
# or on Windows PowerShell without execution policy changes:
# npm.cmd run dev
```

The unified launcher will automatically:
1. Validate your Python interpreter and verify all backend packages (`fastapi`, `uvicorn`, `scikit-learn`, `pandas`, `numpy`, `joblib`).
2. Verify that `frontend/node_modules` exists.
3. Check ports `8000` and `5173`, and automatically terminate any orphaned background processes from prior sessions.
4. Launch the FastAPI backend on `http://127.0.0.1:8000` with hot-reloading.
5. Launch the Vite frontend dev server on `http://localhost:5173` with reverse proxy.
6. Provide colorized, prefixed logs (`[backend]`, `[frontend]`).
7. Cleanly terminate all child process trees when you press `Ctrl+C`.

### Individual Component Commands (Optional)
If you prefer running services in separate terminal windows:
* **Backend only:** `cd backend && python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload`
* **Frontend only:** `cd frontend && npm run dev`
* **Production build check:** `npm run build`
* **Code linter check:** `npm run lint`

---

## 13. Vercel Cloud Deployment

Customer Lens is pre-configured for zero-friction deployment to **Vercel** using a hybrid architecture:
* **Frontend:** Built by Vite into `frontend/dist/` and served as a high-performance Single Page Application (SPA).
* **Backend:** Served via Vercel's Python Serverless Runtime (`api/index.py`), which imports the FastAPI application, eagerly mounts pre-trained model artifacts, and handles `/api/*` requests.

### Configuration Files
* **`vercel.json`:**
  * Defines build command: `npm run build --prefix frontend`.
  * Specifies output directory: `frontend/dist`.
  * Bundles `backend/**`, `datasets/**`, and `model/**` inside the serverless function package via `includeFiles`.
  * Rewrites `/api/(.*)` to `api/index.py`, and rewrites all client-side page paths (`/segments`, `/customers`, `/predict`, `/insights`, `/model-insights`) to `/index.html`.
* **`frontend/src/api/client.js`:**
  * Automatically detects production builds (`import.meta.env.PROD`) and routes requests to same-origin relative `/api`, eliminating hardcoded `localhost` references.
* **`backend/config.py`:**
  * Automatically inspects `VERCEL_URL` and dynamically grants CORS access to Vercel preview and production deployment domains.

### Step-by-Step Vercel Deployment Instructions
1. Push your repository to GitHub, GitLab, or Bitbucket.
2. Log in to [Vercel](https://vercel.com) and click **"Add New Project"**.
3. Import your **CustomerLens** repository.
4. In the **Configure Project** screen:
   * **Framework Preset:** Select `Vite` (or `Other`).
   * **Root Directory:** Leave as `./` (project root).
   * **Build and Output Settings:** Leave default (automatically governed by `vercel.json`).
5. Click **Deploy**.
6. Once deployed:
   * Frontend pages are available at: `https://<your-project>.vercel.app/`
   * API endpoints are available at: `https://<your-project>.vercel.app/api/health`
   * Interactive API docs are available at: `https://<your-project>.vercel.app/api/docs`

---

## 14. Interactive API Documentation

When the application is running:
* **Swagger UI:** `http://127.0.0.1:8000/api/docs` (or `/docs`)
* **ReDoc:** `http://127.0.0.1:8000/api/redoc` (or `/redoc`)
* **OpenAPI JSON Schema:** `http://127.0.0.1:8000/api/openapi.json`

---

## 15. Known Limitations & Future Roadmap

1. **Historical Distribution Coverage & Extrapolation:**
   * Models were trained on a historical 2012–2014 cohort. While the serving pipeline dynamically accepts modern dates and calculates true elapsed tenure, predictions for customers with tenures > 699 days or incomes > $162,397 represent extrapolation into low-density regions of the 3D PCA embedding space, flagged transparently via API warnings.
2. **Information Loss in PCA:**
   * 3 principal components capture 44.95% of total variance across the 18 standardized features. 55.05% of residual variance is compressed away to facilitate 3D Euclidean centroid assignment.
3. **Surrogate Decision Boundary Disagreement:**
   * The `NearestCentroid` classifier exhibits a 3.71% disagreement rate with the true Agglomerative clustering, concentrated along the Cluster 0 and Cluster 1 income boundary.
4. **Vercel Serverless Cold Starts:**
   * The first invocation of `api/index.py` loads the dataset and fits the Agglomerative reference labels in memory (~100-200ms cold start overhead). Subsequent invocations on warm containers execute in < 10ms.
5. **Absence of Calibrated Probabilities:**
   * Centroid distance is non-probabilistic. Future iterations could train a soft-voting classifier (e.g., Logistic Regression or a calibrated Support Vector Classifier) on the cluster labels to output true posterior membership probabilities.
