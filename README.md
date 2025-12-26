

🤖 JARVIS – Personal AI Assistant

A futuristic, automation-powered personal assistant built with free tools

![Status](https://img.shields.io/badge/Status-Active-success)
![Version](https://img.shields.io/badge/Version-1.0.0-blue)
![License](https://img.shields.io/badge/License-MIT-green)

![Frontend](https://img.shields.io/badge/Frontend-purple)
![Automation](https://img.shields.io/badge/Automation-n8n-orange)
![Database](https://img.shields.io/badge/Database-Supabase-3ECF8E)
![AI](https://img.shields.io/badge/AI-Gemini%20%7C%20OpenRouter-blueviolet)

![Made By](https://img.shields.io/badge/Made%20By-Vinay-black)


---

🚀 Overview

JARVIS is a modern, web-based personal AI assistant designed to help users interact with AI intelligently through a clean chat interface.
It combines frontend simplicity, automation workflows, and AI intelligence to deliver a professional assistant experience — inspired by Jarvis from Iron Man.

This project is built using 100% free & open tools and runs locally or semi-publicly without paid APIs.


---

✨ Key Features

🧠 AI-Powered Conversations
Short, clear, professional responses (Jarvis-style)

🔁 Automation Engine (n8n)
Workflow-based backend logic instead of traditional servers

💾 Memory Support (Supabase)
Stores chat history and user interactions

💬 Command-Friendly Chat UI
Supports natural commands like:

add task

plan my day

summarize this


🎨 Dark Futuristic UI
Clean, premium, Iron-Man-inspired interface

🌐 Free API Stack
Uses Gemini / OpenRouter / OpenAI free tiers



---

🧱 Tech Stack

Layer	Technology

Frontend	Base44
Automation / Backend	n8n (localhost)
Database	Supabase (PostgreSQL)
AI Models	Gemini, OpenRouter
Server (Mock / Testing)	Node.js (HTTP)



---

🏗 Architecture

Frontend (Base44)
      ↓
n8n Webhook (Automation Brain)
      ↓
AI Model (Gemini / OpenRouter)
      ↓
Supabase (Memory & Storage)
      ↓
Response back to Frontend

This architecture avoids heavy backend frameworks and focuses on workflow-driven intelligence.


---

⚙ How It Works

1. User sends a message from the frontend


2. Request hits an n8n webhook


3. n8n processes logic:

Detects commands

Calls AI model

Stores memory in Supabase



4. AI response is sent back to UI


5. Frontend displays reply in real time




---

🛠 Local Setup (Quick Start)

1️⃣ Clone Repository

git clone https://github.com/your-username/jarvis-ai-assistant
cd jarvis-ai-assistant

2️⃣ Run n8n (Local)

npx n8n

n8n will run on:

http://localhost:5678


---

3️⃣ Setup Supabase

Create a Supabase project

Create chat_memory table

Get:

Project URL

Anon public key




---

4️⃣ Configure AI API

Use any one (free tier):

Google Gemini (AI Studio)

OpenRouter

OpenAI


Add API keys inside n8n HTTP Request nodes.


---

5️⃣ Run Frontend

Open Base44 project and connect it to the webhook endpoint:

POST /webhook/jarvis


---

📁 Project Structure

/frontend
  └── Base44 UI
/backend
  └── n8n workflows
/mock-server
  └── Node.js HTTP server (testing)
/docs
  └── Architecture & screenshots


---

🧪 Status

✅ Core chat assistant working

✅ Automation via n8n

✅ AI integration

✅ Memory storage

🔄 Tasks & voice support in progress



---

🛣 Roadmap

[ ] Task Manager

[ ] Voice input/output

[ ] Long-term memory recall

[ ] Multi-user authentication

[ ] Public deployment



---

🎯 Use Cases

Personal productivity assistant

AI automation demo

Portfolio project

Learning workflow-based AI systems

Foundation for SaaS assistant



---

🧑‍💻 Author

Vinay
AI & Automation Enthusiast
Built with focus on learning, scalability, and clean architecture


---

📜 License

This project is licensed under the MIT License
Free to use, modify, and learn from.


---

⭐ If you find this project useful, consider starring the repository.
