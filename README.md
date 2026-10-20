# Customer Lens — Understand Your Customers Better

Customer Lens is an interactive analytics dashboard that helps businesses understand who their customers are, how they spend, and what they care about. By analyzing purchasing habits, household characteristics, and shopping preferences, Customer Lens organizes customers into four distinct groups so businesses can create more relevant promotions and make informed marketing decisions.

---

## The Problem

Every business serves people with different budgets, family sizes, and shopping habits:
* Treating all customers the same leads to generic promotions that feel irrelevant.
* High-spending customers might receive discount coupons they don't need, while budget-conscious families might be offered luxury products they cannot afford.
* Understanding customer differences from thousands of raw sales records is overwhelming without a clear way to organize them.

Customer Lens solves this problem by analyzing customer records and grouping similar customers together, giving marketing and sales teams a clear, actionable picture of their audience.

---

## How Customer Lens Works

Customer Lens organizes customer data in four simple steps:

1. **Gathers Customer Information:** Examines everyday customer traits such as annual income, spending across product categories (such as wine, meats, and sweets), household size, and shopping channels (in-store, online, or catalog).
2. **Discovers Natural Customer Groups:** Finds patterns in the data to identify groups of customers who share similar lifestyles and purchasing habits.
3. **Matches New Customer Profiles:** Allows team members to enter details for a new or hypothetical customer to see which existing group they most resemble.
4. **Suggests Relevant Marketing Ideas:** Connects observed shopping habits with practical business ideas, such as family discount bundles or VIP product previews.

---

## Explore the Application

Customer Lens includes six dedicated pages designed for everyday business exploration:

* **Overview Dashboard (`/`):** A high-level summary of the entire customer base, showing total customers, key spending averages, and the distribution across the four customer groups.
* **Customer Groups (`/segments`):** Compare the four groups side by side using interactive visual charts that highlight differences in income, spending, and channel preferences.
* **Customer Explorer (`/customers`):** A searchable, sortable directory of individual customer records. Clicking any customer opens a profile drawer comparing their habits against their group average.
* **Find a Customer's Group (`/predict`):** An easy-to-use form where you can enter a customer's demographic and shopping details—or pick a one-click sample profile—to estimate which group they most resemble.
* **Business Insights (`/business-insights`):** Explore practical marketing strategies, campaign ideas, and channel recommendations tailored to each group's observed habits.
* **How It Works (`/model-insights`):** A transparent look behind the scenes explaining how customer data was processed, how the groups were formed, and the data boundaries of the project.

---

## Meet the Four Customer Groups

Based on 2,236 customer records, Customer Lens identifies four distinct customer groups:

| Customer Group | Share of Customers | Average Income | Typical Annual Spend | Main Characteristics |
| :--- | :---: | :---: | :---: | :--- |
| **Budget Partner Households** | **40.5%** (905 customers) | ~$39,000 | ~$222 / year | Couples with children; frequent website visitors looking for deals and family savings. |
| **Affluent Partner Spenders** | **23.9%** (534 customers) | ~$73,000 | ~$1,237 / year | High-income couples with few children; top spenders on premium wines, meats, and in-store shopping. |
| **Constrained Solo Parents** | **19.9%** (444 customers) | ~$37,000 | ~$166 / year | Single parents managing tight budgets; highly sensitive to discounts with modest discretionary spend. |
| **High-Response Solo Spenders** | **15.8%** (353 customers) | ~$71,000 | ~$1,190 / year | Affluent singles; active digital shoppers with the highest response to marketing campaigns (32%). |

### 1. Budget Partner Households (Cluster 0)
* **Who they are:** The largest customer group (40.5%). Typically married couples or partners living together with children at home.
* **Shopping habits:** Modest income (~$39,000) and cautious spending. They visit the business website frequently to browse, compare prices, and look for deals.
* **Marketing approach:** Multi-buy family bundles, essential product discounts, and loyalty rewards that encourage repeat visits.

### 2. Affluent Partner Spenders (Cluster 1)
* **Who they are:** Well-off couples (23.9%) with few or no children living at home and higher household income (~$73,000).
* **Shopping habits:** The highest overall spenders (~$1,237/year). They spend heavily on premium categories like fine wine and meat, and prefer shopping in physical stores and through printed catalogs.
* **Marketing approach:** Early access to premium product releases, VIP in-store tastings or events, and curated catalog mailings.

### 3. Constrained Solo Parents (Cluster 2)
* **Who they are:** Single-person households with children (19.9%) managing family needs on a modest income (~$37,000).
* **Shopping habits:** The most budget-conscious group with the lowest average spend (~$166/year). They browse online frequently and buy primarily when items are on promotion.
* **Marketing approach:** Everyday low pricing on household essentials, clear promotion alerts, back-to-school bundles, and flexible payment options.

### 4. High-Response Solo Spenders (Cluster 3)
* **Who they are:** Affluent single adults (15.8%) with an average income of ~$71,000 and no children at home.
* **Shopping habits:** High spenders (~$1,190/year) who embrace digital and catalog shopping. They have the highest marketing response rate in the customer base (32% response rate, more than double the average).
* **Marketing approach:** Primary candidates for new product launches, digital-first campaigns, and exclusive individual perks.

---

## Why It Is Useful

Customer Lens provides clear, data-backed visibility that helps teams:
* **Understand Audience Diversity:** See at a glance that customers are not one uniform group, but four distinct communities with different financial realities.
* **Allocate Marketing Budgets Wisely:** Focus premium marketing where purchasing power exists, and focus value-driven promotions where price sensitivity is high.
* **Choose the Right Channels:** Know which groups respond best to digital emails versus physical store experiences or mailings.
* **Inform Strategy with Real Data:** Move discussions from guesswork to observed customer patterns.

*(Note: These insights represent potential marketing opportunities based on historical patterns, not guaranteed sales outcomes.)*

---

## Technology Used

Customer Lens is built with a lightweight, modern technology stack:

* **React & Vite:** Fast, responsive web interface.
* **FastAPI & Python:** High-performance application backend.
* **Pandas & Scikit-learn:** Data processing and customer grouping analysis.
* **Recharts & Tailwind CSS:** Clean visual charts and modern styling.

---

## Try It Yourself

### Local Startup

You can run the entire application on your computer with a single command:

#### Prerequisites
* [Node.js](https://nodejs.org/) (version 18 or newer)
* [Python](https://www.python.org/) (version 3.10 or newer)

#### 1. Setup (One-time)
Open a terminal in the project folder and install dependencies:

```bash
# Install frontend dependencies
npm install --prefix frontend

# Install Python backend dependencies
pip install -r requirements.txt
```

#### 2. Start the Application
Run this single command from the project root:

```bash
npm run dev
```

This starts both the React frontend and the FastAPI backend together. Open your browser and visit:
```text
http://localhost:5173
```

---

## Important Limitations

To maintain honesty and data integrity, please keep these points in mind:

1. **Historical Data:** The dataset reflects customer records collected between 2012 and 2014. Findings may not fully reflect post-2014 inflation, modern e-commerce trends, or recent consumer behavior shifts.
2. **Estimated Similarity:** When testing a new customer in the *Find a Customer's Group* page, the application identifies which historical group the customer most closely resembles. It is an estimate based on available patterns, not a guaranteed prediction of future purchases.
3. **Strategic Ideas, Not Guarantees:** Recommendations are practical ideas based on observed habits, not guaranteed business outcomes. Businesses should always test campaigns on small groups before broad rollouts.

---

## Future Possibilities

Planned enhancements for future iterations of Customer Lens include:
* **Modern Customer Data:** Incorporating newer retail and e-commerce records to observe current shopping trends.
* **Additional Customer Touchpoints:** Exploring interactions such as mobile app activity and customer service feedback.
* **Interactive Campaign Simulation:** Allowing marketing teams to simulate campaign reach and estimated budget allocations.
