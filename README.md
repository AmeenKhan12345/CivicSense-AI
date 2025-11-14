# 🤖 CivicSense AI

![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white) ![Supabase](https://img.shields.io/badge/Supabase-3FCF8E?style=for-the-badge&logo=supabase&logoColor=white) ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white) ![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white) ![Ollama](https://img.shields.io/badge/Ollama-232323?style=for-the-badge&logo=ollama&logoColor=white)

A multi-agent AI "Co-pilot" and Decision Support System built for municipal officers. This system transforms raw citizen complaints into prioritized, contextual, and actionable intelligence.

This project is not another public grievance portal; it's an **"Intelligence Layer"** designed to integrate with existing government systems and supercharge the officers managing them.

## 🚀 The Core Problem

Municipal officers in cities like Nagpur are overwhelmed. Digital portals (like CPGRAMS) have solved data *collection* but created a new problem: **information overload**.

Officers face a raw, unfiltered queue of complaints with:
* **No Prioritization:** A critical hazard (like an exposed wire) looks the same as a minor issue (a faded sign).
* **No Context:** A recurring pothole is treated as a new, isolated incident every time it's reported.
* **Manual Workload:** Officers spend hours on repetitive tasks like triage, drafting replies, and compiling weekly reports.

## ✨ Our Solution: The AI Co-pilot

CivicSense AI is an officer-facing dashboard that acts as an intelligent assistant. It ingests raw complaints and provides the officer with a "Smart Inbox" that is automatically triaged, contextualized, and ready for action.

It's built on a 100% free, private, and local-first stack using **Next.js**, **Supabase**, and **Ollama** (running Llama 3).

---

## 🌟 Key Features

### 1. The "Smart Inbox" Dashboard
A professional dashboard built with **shadcn/ui** that displays a real-time, prioritized list of all complaints. It's not just a table; it's a triage center.

### 2. AI RAG & Classification
When an officer views an issue, our RAG pipeline activates:
* **Generates Embeddings:** Creates a vector "fingerprint" of the issue using `nomic-embed-text`.
* **Retrieves Context:** Searches the `pgvector` database for the most similar past complaints.
* **Classifies & Explains:** Feeds the new complaint + historical context to **Llama 3** to generate a `category`, `severity`, and a detailed `explanation` for its reasoning.

### 3. Human-in-the-Loop (HITL) Workflow
The officer is the expert. They can:
* **Accept:** One-click button to accept the AI's suggestion and move the issue to "in_progress."
* **Edit / Reject:** A polished modal allows the officer to correct the AI's classification.
* **Logs Feedback:** All corrections are saved to a `feedback_log` table, creating a valuable dataset to fine-tune the AI in the future.

### 4. AI Co-pilot Tools
A suite of generative AI tools to assist the officer:
* **Suggest Action Plan:** An AI-generated checklist for the field team (e.g., "1. Deploy safety cones...").
* **Draft Formal Reply:** Generates a professional, NMC-style response to the citizen or a superior.

### 5. Autonomous Agents
Local scripts that run in the terminal to perform proactive tasks:
* **Summarization Agent:** (`npm run summarize`) Reads all issues from the past week, generates a "Weekly AI Bulletin," and displays it on the dashboard.
* **Escalation Agent:** (`npm run escalate`) Finds critical, unresolved issues older than 48 hours and drafts escalation emails for officer review.

### 6. Conversational AI Chat
A polished chat interface (`/dashboard/chat`) where an officer can ask natural language questions about the data (e.g., "Show me all new high-severity potholes") and get instant answers from the RAG-powered AI.

---

## 🛠️ Technology Stack

| Category | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend** | **Next.js 14 (App Router)**, React | Server-first UI, dashboard, and client-side interactivity. |
| **Backend** | **Next.js API Routes** | All backend logic (complaint submission, AI calls, updates). |
| **Styling** | **Tailwind CSS** + **shadcn/ui** | Professional, polished, and accessible UI components. |
| **Database** | **Supabase (PostgreSQL)** | Primary database for all issue data, logs, and summaries. |
| **Vector Search** | **`pgvector`** | For similarity search in the RAG pipeline. |
| **AI Runtime** | **Ollama** | To run open-source LLMs 100% locally and for free. |
| **AI Models** | **Llama 3**, `nomic-embed-text` | For classification, reasoning, and generating vector embeddings. |
| **Auth** | **Supabase Auth** | Secure magic link authentication for officers. |
| **Storage** | **Supabase Storage** | Storing all user-uploaded complaint images. |
| **Mapping** | **React Leaflet** | Displaying an interactive map for each issue's location. |
| **Scripting** | **`tsx`** + `dotenv` | For running the autonomous agent scripts locally. |

---

## 🚀 Getting Started

Follow these steps to set up and run the project locally.

### 1. Prerequisites

* Node.js (v18 or later)
* npm
* **[Ollama](https://ollama.com/)** installed on your machine.

### 2. Setup

1.  **Clone the repository:**
    ```bash
    git clone [https://github.com/AmeenKhan12345/CivicSense-AI.git](https://github.com/AmeenKhan12345/CivicSense-AI.git)
    cd CivicSense-AI
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up Supabase:**
    * Create a new project on [Supabase](https://supabase.com).
    * In the SQL Editor, run the `schema.sql` file (you will need to create this from our SQL commands) to create the `issues`, `feedback_log`, `weekly_summaries`, and `escalation_drafts` tables.
    * Enable the `pgvector` extension.
    * Create the `match_issues` RPC function.
    * Add the `ALTER PUBLICATION ... ADD TABLE ...` commands for all tables.

4.  **Set up Environment Variables:**
    * Rename `.env.local.example` to `.env.local`.
    * Fill in the required keys from your Supabase project (Project URL, Anon Key, and Service Role Key).
    ```env
    NEXT_PUBLIC_SUPABASE_URL=...
    NEXT_PUBLIC_SUPABASE_ANON_KEY=...
    SUPA_SERVICE_KEY=...
    ```

5.  **Pull the AI Models:**
    * Make sure Ollama is running.
    * Pull the models we use:
    ```bash
    ollama pull llama3
    ollama pull nomic-embed-text
    ```

### 3. Running the Application

You will need **two** terminals running simultaneously.

1.  **Terminal 1: Run the AI Server:**
    * Ensure your Ollama server is running and accessible.

2.  **Terminal 2: Run the Web Application:**
    * Start the Next.js development server.
    ```bash
    npm run dev
    ```
    * Open `http://localhost:3000` to access the application.

### 4. Running the Autonomous Agents

To generate summaries or escalations, run the local agent scripts in a **new terminal**.

```bash
# To generate the weekly summary
npm run summarize

# To generate escalation drafts
npm run escalate
```

### 5. Future Work: Path to Production
- This prototype is a local-first proof-of-concept. To scale it for real-world use, we would:
- Decouple AI Processing: Move from a synchronous API route to an asynchronous job queue. This provides an instant UI response for the user.
- Host the AI: Deploy the Ollama models to a dedicated cloud GPU server (e.g., on Railway, Hugging Face Spaces, or a cloud VM) to create a stable, scalable AI endpoint.
- Automate Agents: Convert the local agent scripts (npm run summarize) into true cloud-based Cron Jobs (like Supabase Edge Functions) that call the hosted AI endpoint on a schedule.
- Fine-Tune the Model: Use the data from our feedback_log table to fine-tune a version of Llama 3, creating a custom model specialized in Nagpur's civic issues.

### 6. Authors
- Ameen Khan
- Pawan Hete
- Rugwed Yawalkar
