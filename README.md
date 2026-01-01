# 🎓 Study WITH AI

<div dir="rtl">

## 📖 نظرة عامة

**Study WITH AI** هو تطبيق ويب ذكي يعتمد على تقنية **RAG (Retrieval-Augmented Generation)** لمساعدة الطلاب في فهم ودراسة المواد التعليمية. يستخدم النظام الذكاء الاصطناعي للإجابة على الأسئلة من محتوى المقررات مع توفير استشهادات دقيقة للمصادر.

### ✨ المميزات الرئيسية

- 🤖 **نظام RAG متقدم**: إجابات دقيقة من محتوى المقررات مع استشهادات
- 📚 **أدوات دراسة تفاعلية**: بطاقات مراجعة، اختبارات، وتلخيصات ذكية
- 🌐 **دعم متعدد اللغات**: دعم كامل للغة العربية والإنجليزية
- 🎯 **دقة عالية في الاسترجاع**: بحث هجين مع تحسين للاستعلامات
- 📄 **رفع المستندات**: دعم ملفات PDF, TXT, MD
- 🔒 **حماية متقدمة**: حماية من الغش، حماية البيانات الشخصية، وفلترة الأسئلة
- 🌙 **وضع داكن/فاتح**: تجربة مستخدم مريحة

</div>

<div dir="ltr">

## 🚀 Features

- **Advanced RAG System**: Accurate answers from course materials with citations
- **Interactive Study Tools**: Flashcards, quizzes, and smart summaries
- **Multi-language Support**: Full support for Arabic and English
- **High Retrieval Accuracy**: Hybrid search with query optimization
- **Document Upload**: Support for PDF, TXT, MD files
- **Advanced Guardrails**: Anti-cheating, PII protection, and content filtering
- **Dark/Light Mode**: Comfortable user experience

</div>

---

## 🏗️ Architecture

```
study-buddy-ai/
├── src/                    # Frontend (React + TypeScript)
│   ├── components/        # UI components
│   ├── pages/            # Application pages
│   ├── hooks/            # Custom React hooks
│   └── integrations/     # Supabase integration
├── rag-langchain/        # Backend RAG system (Python)
│   ├── src/             # RAG pipeline source code
│   ├── data/            # Course materials
│   └── db/              # Vector database (ChromaDB)
├── supabase/            # Supabase configuration
│   ├── functions/       # Edge functions
│   └── migrations/      # Database migrations
└── public/              # Static assets
```

---

## 📋 Prerequisites / المتطلبات

### Frontend Requirements
- Node.js 18+ 
- npm or yarn

### Backend Requirements
- Python 3.8+
- pip

### Services
- OpenAI API key
- Supabase account (for hosting and edge functions)

---

## 🛠️ Installation / التثبيت

### 1. Clone the repository

```bash
git clone <repository-url>
cd study-buddy-ai-893-main
```

### 2. Frontend Setup

```bash
# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Edit .env and add your Supabase credentials
# VITE_SUPABASE_URL=your_supabase_url
# VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_key
```

### 3. Backend Setup (RAG System)

```bash
# Navigate to RAG directory
cd rag-langchain

# Install Python dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env

# Edit .env and add your OpenAI API key
# OPENAI_API_KEY=your_openai_api_key
```

### 4. Initialize Vector Database

```bash
# Place your course materials (PDF/TXT/MD) in rag-langchain/data/
# Then run:
python -m src.ingest
```

This will:
- Load all documents from `data/`
- Split them into chunks
- Create embeddings
- Store them in `db/` (ChromaDB)

### 5. Supabase Setup

1. Create a Supabase project
2. Run the migrations from `supabase/migrations/`
3. Set up environment variables for edge functions:
   - `OPENAI_API_KEY`
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`

---

## 🚀 Running the Application / تشغيل التطبيق

### Development Mode

```bash
# Frontend (from root directory)
npm run dev

# The app will be available at http://localhost:8080
```

### Testing RAG System (Standalone)

```bash
cd rag-langchain

# Ask a question
python -m src.rag --q "What is machine learning?"

# With debug mode (shows retrieved documents)
python -m src.rag --q "Explain neural networks" --debug

# Use Agent with study tools
python -m src.agent
```

---

## 📚 Usage / الاستخدام

### 1. Upload Documents
- Go to the main page
- Upload PDF, TXT, or MD files
- Documents are processed and indexed automatically

### 2. Ask Questions
- Type your question in Arabic or English
- Get accurate answers with citations
- View source documents and page numbers

### 3. Study Tools
- **Flashcards**: Generate study cards from course content
- **Quizzes**: Create practice quizzes
- **Summaries**: Get smart summaries of topics

---

## 🔧 Configuration / الإعدادات

### RAG Configuration

Edit `rag-langchain/src/config.py` to adjust:
- `CHUNK_SIZE`: Maximum characters per chunk (default: 1000)
- `CHUNK_OVERLAP`: Overlap between chunks (default: 200)
- `TOP_K`: Number of documents to retrieve (default: 4)
- `EMBEDDING_MODEL`: OpenAI embedding model
- `LLM_MODEL`: OpenAI LLM model

### Frontend Configuration

Environment variables in `.env`:
- `VITE_SUPABASE_URL`: Your Supabase project URL
- `VITE_SUPABASE_PUBLISHABLE_KEY`: Your Supabase anon key

---

## 🛡️ Guardrails / الحماية

The system includes three main guardrails:

1. **Anti-Cheating**: Prevents direct homework solutions, provides tutoring hints instead
2. **Out-of-Scope Protection**: Rejects questions not related to course content
3. **PII Protection**: Detects and protects personal information (emails, phone numbers, IDs)

---

## 📁 Project Structure / بنية المشروع

### Frontend (`src/`)
- `pages/`: Main application pages (Home, Index, StudyTools)
- `components/`: Reusable UI components
- `hooks/`: Custom React hooks
- `integrations/`: Supabase client configuration

### Backend (`rag-langchain/src/`)
- `config.py`: Centralized configuration
- `ingest.py`: Document processing and indexing
- `rag.py`: Main RAG pipeline
- `agent.py`: Agent with study tools
- `prompts.py`: Prompt templates with guardrails
- `utils.py`: Helper functions

### Supabase Functions
- `rag-ask`: Main RAG query endpoint
- `parse-document`: Document parsing service
- `study-tools`: Study tools generation
- `documents`: Document management

---

## 🧪 Testing / الاختبار

### Test RAG System

```bash
cd rag-langchain
python -m src.rag --q "Your test question here" --debug
```

### Example Questions

- "ما هو التعلم الآلي؟" (What is machine learning?)
- "Explain neural networks"
- "ما الفرق بين التعلم الخاضع للإشراف وغير الخاضع للإشراف؟"

---

## 📦 Dependencies / المتطلبات

### Frontend
- React 18
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui components
- Supabase client
- React Router

### Backend
- langchain
- langchain-openai
- langchain-community
- chromadb
- pypdf
- python-dotenv
- tiktoken

See `package.json` and `rag-langchain/requirements.txt` for full lists.

---

## 🤝 Contributing / المساهمة

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License / الترخيص

This project is licensed under the MIT License.

---

## 👨‍💻 Authors / المؤلفون

Created by Tareq Mhysen ❤️ for students and educators.

---


## 📞 Support / الدعم

For issues and questions, please open an issue on GitHub.

---

<div dir="rtl">

## 🔗 روابط مفيدة

- [LangChain Documentation](https://python.langchain.com/)
- [Supabase Documentation](https://supabase.com/docs)
- [OpenAI API Documentation](https://platform.openai.com/docs)

</div>

<div dir="ltr">

## 🔗 Useful Links

- [LangChain Documentation](https://python.langchain.com/)
- [Supabase Documentation](https://supabase.com/docs)
- [OpenAI API Documentation](https://platform.openai.com/docs)

</div>

---

**Made with ❤️ for better learning experiences**


