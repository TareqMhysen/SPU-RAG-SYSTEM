"""
Document ingestion pipeline for the RAG system.
Loads documents, splits into chunks, creates embeddings, and persists to ChromaDB.

خط أنابيب استيعاب المستندات لنظام RAG.
يقوم هذا الملف بتحميل المستندات، تقسيمها إلى قطع، إنشاء التضمينات، وحفظها في ChromaDB.

Document ingestion pipeline for the RAG system.
This file loads documents, splits them into chunks, creates embeddings, and saves them to ChromaDB.

العملية تتكون من 3 خطوات رئيسية:
1. تحميل المستندات (Load Documents): من مجلد data/ بجميع الصيغ المدعومة
2. تقسيم المستندات (Split Documents): إلى قطع أصغر للحفاظ على السياق
3. إنشاء التضمينات والحفظ (Create Embeddings & Persist): تحويل النصوص إلى متجهات وحفظها

The process consists of 3 main steps:
1. Load Documents: From data/ folder in all supported formats
2. Split Documents: Into smaller chunks to maintain context
3. Create Embeddings & Persist: Convert texts to vectors and save them

الصيغ المدعومة / Supported formats:
- .txt: ملفات نصية عادية
- .md: ملفات Markdown
- .pdf: ملفات PDF (يدعم استخراج النصوص من الصفحات)

- .txt: Plain text files
- .md: Markdown files
- .pdf: PDF files (supports text extraction from pages)
"""

# استيراد المكتبات المطلوبة
# Import required libraries
import os  # للتعامل مع متغيرات البيئة - For environment variables
from pathlib import Path  # للتعامل مع المسارات - For path handling
from typing import List  # لنوع البيانات - For type hints

from dotenv import load_dotenv  # لتحميل متغيرات البيئة من ملف .env - To load environment variables from .env file
from langchain.text_splitter import RecursiveCharacterTextSplitter  # لتقسيم النصوص - For text splitting
from langchain_community.document_loaders import TextLoader, PyPDFLoader, DirectoryLoader  # لمحمّلات المستندات - For document loaders
from langchain_community.vectorstores import Chroma  # لقاعدة البيانات المتجهة - For vector database
from langchain_openai import OpenAIEmbeddings  # لنموذج التضمين من OpenAI - For OpenAI embedding model
from langchain.schema import Document  # لنوع المستند - For Document type

# استيراد الإعدادات من ملف config.py
# Import settings from config.py
from .config import DATA_DIR, DB_DIR, CHUNK_SIZE, CHUNK_OVERLAP, EMBEDDING_MODEL


def load_documents() -> List[Document]:
    """
    Load all documents from the data directory.
    Supports .txt, .md, and .pdf files.
    
    تحميل جميع المستندات من مجلد البيانات.
    هذه الدالة تقرأ جميع الملفات المدعومة من مجلد data/ وتحمّلها في الذاكرة.
    
    Load all documents from the data directory.
    This function reads all supported files from data/ folder and loads them into memory.
    
    الصيغ المدعومة / Supported formats:
    - .txt: ملفات نصية بسيطة - Plain text files
    - .md: ملفات Markdown - Markdown files
    - .pdf: ملفات PDF (يتم استخراج النصوص من كل صفحة) - PDF files (text extracted from each page)
    
    ملاحظة: الملفات النصية تعتبر صفحة واحدة، بينما ملفات PDF تحتوي على عدة صفحات
    
    Note: Text files are considered single-page, while PDF files contain multiple pages
    
    Returns:
        List of Document objects with content and metadata
        (قائمة كائنات Document مع المحتوى والبيانات الوصفية)
        
        كل Document يحتوي على:
        - page_content: المحتوى النصي للمستند
        - metadata: بيانات وصفية مثل المصدر (source) ورقم الصفحة (page)
        
        Each Document contains:
        - page_content: Text content of the document
        - metadata: Metadata like source and page number
    """
    # قائمة لتخزين جميع المستندات المحملة
    # سنقوم بإضافة جميع المستندات المحملة إلى هذه القائمة
    # List to store all loaded documents
    # We'll add all loaded documents to this list
    documents = []
    
    # ========== تحميل الملفات النصية (.txt و .md) ==========
    # ========== Load Text Files (.txt and .md) ==========
    
    # البحث عن جميع الملفات النصية في مجلد البيانات
    # glob("*.txt") يبحث عن جميع الملفات التي تنتهي بـ .txt
    # glob("*.md") يبحث عن جميع الملفات التي تنتهي بـ .md
    # list() يحول النتيجة إلى قائمة
    # Search for all text files in data directory
    # glob("*.txt") searches for all files ending with .txt
    # glob("*.md") searches for all files ending with .md
    # list() converts the result to a list
    txt_files = list(DATA_DIR.glob("*.txt")) + list(DATA_DIR.glob("*.md"))
    
    # تكرار على كل ملف نصي
    # Iterate over each text file
    for txt_file in txt_files:
        try:
            # إنشاء محمّل للملف النصي
            # TextLoader يحتاج إلى مسار الملف كسلسلة نصية
            # encoding='utf-8' يضمن دعم الأحرف العربية والإنجليزية
            # Create text file loader
            # TextLoader needs file path as string
            # encoding='utf-8' ensures support for Arabic and English characters
            loader = TextLoader(str(txt_file), encoding='utf-8')
            
            # تحميل المستند
            # load() يقرأ الملف ويعيد قائمة من Document objects
            # (عادة قائمة واحدة لأن الملفات النصية عادةً مستند واحد)
            # Load document
            # load() reads the file and returns a list of Document objects
            # (usually one item because text files are usually single document)
            docs = loader.load()
            
            # إضافة البيانات الوصفية لكل مستند محمل
            # Add source metadata to each loaded document
            for doc in docs:
                # إضافة اسم الملف كمصدر
                # txt_file.name يعطي فقط اسم الملف (بدون المسار الكامل)
                # Add filename as source
                # txt_file.name gives only filename (without full path)
                doc.metadata['source'] = txt_file.name
                # الملفات النصية تعتبر في صفحة واحدة (الصفحة 1)
                # Text files are considered single-page (page 1)
                doc.metadata['page'] = 1
            
            # إضافة جميع المستندات المحملة إلى القائمة الرئيسية
            # extend() يضيف جميع العناصر من docs إلى documents
            # Add all loaded documents to main list
            # extend() adds all items from docs to documents
            documents.extend(docs)
            print(f"✅ Loaded: {txt_file.name}")  # رسالة نجاح - Success message
            
        except Exception as e:
            # في حالة حدوث خطأ، طباعة رسالة خطأ ولكن الاستمرار في تحميل الملفات الأخرى
            # If error occurs, print error message but continue loading other files
            print(f"❌ Error loading {txt_file.name}: {e}")
    
    # ========== تحميل ملفات PDF ==========
    # ========== Load PDF Files ==========
    
    # البحث عن جميع ملفات PDF في مجلد البيانات
    # glob("*.pdf") يبحث عن جميع الملفات التي تنتهي بـ .pdf
    # Search for all PDF files in data directory
    # glob("*.pdf") searches for all files ending with .pdf
    pdf_files = list(DATA_DIR.glob("*.pdf"))
    
    # تكرار على كل ملف PDF
    # Iterate over each PDF file
    for pdf_file in pdf_files:
        try:
            # إنشاء محمّل لملف PDF
            # PyPDFLoader يستخدم مكتبة pypdf لاستخراج النصوص من PDF
            # Create PDF loader
            # PyPDFLoader uses pypdf library to extract text from PDF
            loader = PyPDFLoader(str(pdf_file))
            
            # تحميل المستند (قد يحتوي على عدة صفحات)
            # PDF عادة يحتوي على عدة صفحات، لذلك load() يعيد قائمة من Documents
            # كل Document يمثل صفحة واحدة
            # Load document (may contain multiple pages)
            # PDFs usually have multiple pages, so load() returns a list of Documents
            # Each Document represents one page
            docs = loader.load()
            
            # التأكد من تعيين البيانات الوصفية لكل صفحة
            # Ensure source metadata is set for each page
            for i, doc in enumerate(docs):
                # إضافة اسم الملف كمصدر لكل صفحة
                # Add filename as source for each page
                doc.metadata['source'] = pdf_file.name
                # الحصول على رقم الصفحة من البيانات الوصفية
                # إذا لم يكن موجوداً (عادة يكون موجوداً)، استخدم الفهرس + 1
                # enumerate يبدأ من 0، لذلك نضيف 1 للحصول على رقم الصفحة (1, 2, 3...)
                # Get page number from metadata
                # If not found (usually it's there), use index + 1
                # enumerate starts from 0, so we add 1 to get page number (1, 2, 3...)
                doc.metadata['page'] = doc.metadata.get('page', i + 1)
            
            # إضافة جميع الصفحات إلى القائمة الرئيسية
            # Add all pages to main list
            documents.extend(docs)
            print(f"✅ Loaded: {pdf_file.name} ({len(docs)} pages)")  # رسالة نجاح مع عدد الصفحات - Success message with page count
            
        except Exception as e:
            # في حالة حدوث خطأ، طباعة رسالة خطأ ولكن الاستمرار
            # If error occurs, print error message but continue
            print(f"❌ Error loading {pdf_file.name}: {e}")
    
    # طباعة إجمالي عدد المستندات المحملة
    # Print total number of loaded documents
    print(f"\n📊 Total documents loaded: {len(documents)}")
    return documents


def split_documents(documents: List[Document]) -> List[Document]:
    """
    Split documents into smaller chunks for better retrieval.
    
    تقسيم المستندات إلى قطع أصغر لتحسين الاسترجاع.
    
    لماذا التقسيم مهم؟
    - النماذج اللغوية لها حدود على طول النص المدخل
    - القطع الصغيرة أسهل في البحث والاسترجاع
    - يمكن للبحث الدلالي (semantic search) العثور على المعلومات المطلوبة بدقة أكبر
    
    Split documents into smaller chunks for better retrieval.
    
    Why is splitting important?
    - Language models have limits on input text length
    - Smaller chunks are easier to search and retrieve
    - Semantic search can find required information more accurately
    
    كيف يعمل RecursiveCharacterTextSplitter؟
    1. يحاول تقسيم النص عند الفواصل الأكبر أولاً (\n\n)
    2. إذا كانت القطعة أكبر من CHUNK_SIZE، يحاول الفاصل التالي (\n)
    3. يستمر في المحاولة حتى يجد فاصلاً مناسباً أو يصل إلى الحجم المطلوب
    4. يحافظ على التداخل (CHUNK_OVERLAP) بين القطع للحفاظ على السياق
    
    How does RecursiveCharacterTextSplitter work?
    1. Tries to split text at larger separators first (\n\n)
    2. If chunk is larger than CHUNK_SIZE, tries next separator (\n)
    3. Continues trying until finds suitable separator or reaches required size
    4. Maintains overlap (CHUNK_OVERLAP) between chunks to preserve context
    
    Args:
        documents: List of Document objects (قائمة المستندات المراد تقسيمها)
        
    Returns:
        List of chunked Document objects (قائمة المستندات المقسمة إلى قطع)
        
        كل قطعة هي Document منفصل يحتوي على:
        - page_content: جزء من النص الأصلي
        - metadata: نفس البيانات الوصفية للمستند الأصلي (source, page)
        
        Each chunk is a separate Document containing:
        - page_content: Part of original text
        - metadata: Same metadata as original document (source, page)
    """
    # إنشاء مقسم نصي متكرر
    # RecursiveCharacterTextSplitter يحاول تقسيم النص بشكل ذكي
    # Create recursive text splitter
    # RecursiveCharacterTextSplitter tries to split text intelligently
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=CHUNK_SIZE,  # حجم كل قطعة (بالأحرف) - Size of each chunk (in characters)
        chunk_overlap=CHUNK_OVERLAP,  # التداخل بين القطع (بالأحرف) - Overlap between chunks (in characters)
        length_function=len,  # دالة حساب الطول (نستخدم len() لحساب عدد الأحرف) - Length calculation function (we use len() to count characters)
        separators=["\n\n", "\n", ". ", " ", ""]  # الفواصل للقطع (من الأكبر للأصغر)
        # سيحاول أولاً تقسيم النص عند الفقرات (\n\n)
        # ثم عند الأسطر (\n)، ثم عند نهايات الجمل (. )
        # ثم عند المسافات ( )، وأخيراً عند أي حرف ("")
        # Will try to split at paragraphs first (\n\n)
        # Then at lines (\n), then at sentence ends (. )
        # Then at spaces ( ), and finally at any character ("")
    )
    
    # تقسيم المستندات إلى قطع
    # split_documents() تأخذ قائمة من Documents وتعيد قائمة أكبر من Documents
    # كل مستند كبير يتم تقسيمه إلى عدة قطع أصغر
    # Split documents into chunks
    # split_documents() takes a list of Documents and returns a larger list of Documents
    # Each large document is split into several smaller chunks
    chunks = text_splitter.split_documents(documents)
    
    # طباعة عدد القطع الناتجة
    # Print number of resulting chunks
    print(f"📦 Split into {len(chunks)} chunks")
    return chunks


def create_vector_store(chunks: List[Document]) -> Chroma:
    """
    Create embeddings and persist to ChromaDB.
    
    إنشاء التضمينات (Embeddings) وحفظها في ChromaDB.
    
    ما هي التضمينات (Embeddings)؟
    - التضمينات هي تمثيلات رقمية للنصوص (متجهات بأبعاد عالية)
    - تسمح للكمبيوتر بفهم المعنى والدلالة للنصوص
    - النصوص المتشابهة في المعنى تكون متقاربة في فضاء التضمينات
    - هذا يسمح بالبحث الدلالي (Semantic Search) بدلاً من البحث النصي العادي
    
    Create embeddings and persist to ChromaDB.
    
    What are Embeddings?
    - Embeddings are numerical representations of texts (high-dimensional vectors)
    - Allow computers to understand meaning and semantics of texts
    - Texts with similar meanings are close in embedding space
    - This enables semantic search instead of regular text search
    
    كيف يعمل هذا؟
    1. يأخذ كل قطعة نصية من chunks
    2. يحولها إلى متجه باستخدام نموذج التضمين (OpenAI)
    3. يحفظ المتجهات والبيانات الوصفية في ChromaDB
    4. ChromaDB يسمح بالبحث السريع عن القطع المشابهة لاستعلام معين
    
    How does this work?
    1. Takes each text chunk from chunks
    2. Converts it to a vector using embedding model (OpenAI)
    3. Saves vectors and metadata to ChromaDB
    4. ChromaDB allows fast search for chunks similar to a given query
    
    Args:
        chunks: List of document chunks (قائمة قطع المستندات)
        
    Returns:
        Chroma vector store instance (مثيل مستودع المتجهات Chroma)
        
        هذا المثيل يمكن استخدامه لاحقاً للبحث في المستندات:
        vector_store.similarity_search(query, k=5)
        
        This instance can be used later to search documents:
        vector_store.similarity_search(query, k=5)
    """
    # تهيئة نموذج التضمين
    # OpenAIEmbeddings يستخدم API الخاص بـ OpenAI لتحويل النصوص إلى متجهات
    # model=EMBEDDING_MODEL يحدد نموذج التضمين المستخدم (مثلاً: text-embedding-3-small)
    # Initialize embeddings
    # OpenAIEmbeddings uses OpenAI API to convert texts to vectors
    # model=EMBEDDING_MODEL specifies embedding model used (e.g., text-embedding-3-small)
    embeddings = OpenAIEmbeddings(model=EMBEDDING_MODEL)
    
    # إنشاء وتخزين مستودع المتجهات
    # Chroma.from_documents() يقوم بـ:
    # 1. تحويل جميع القطع إلى متجهات (embeddings)
    # 2. حفظ المتجهات والبيانات الوصفية في قاعدة بيانات محلية
    # 3. إنشاء فهارس للبحث السريع
    
    # Create and persist vector store
    # Chroma.from_documents() does:
    # 1. Converts all chunks to vectors (embeddings)
    # 2. Saves vectors and metadata to local database
    # 3. Creates indexes for fast search
    vector_store = Chroma.from_documents(
        documents=chunks,  # القطع المستندات المراد تحويلها - Document chunks to convert
        embedding=embeddings,  # نموذج التضمين المستخدم - Embedding model to use
        persist_directory=str(DB_DIR),  # مسار التخزين (حيث سيتم حفظ قاعدة البيانات) - Storage path (where database will be saved)
        collection_name="course_materials"  # اسم المجموعة (اسم قاعدة البيانات) - Collection name (database name)
    )
    
    # طباعة رسالة تأكيد مع مسار التخزين
    # Print confirmation message with storage path
    print(f"💾 Vector store persisted to: {DB_DIR}")
    return vector_store


def ingest_documents():
    """
    Main ingestion pipeline: Load -> Split -> Embed -> Persist
    
    خط أنابيب الاستيعاب الرئيسي: تحميل -> تقسيم -> تضمين -> حفظ
    
    هذه هي الدالة الرئيسية التي يتم استدعاؤها لتجهيز المستندات للنظام.
    تقوم بتنفيذ العملية الكاملة من بدايتها إلى نهايتها.
    
    Main ingestion pipeline: Load -> Split -> Embed -> Persist
    
    This is the main function called to prepare documents for the system.
    It executes the complete process from start to finish.
    
    الخطوات / Steps:
    1. Load: تحميل جميع المستندات من مجلد data/
    2. Split: تقسيم المستندات إلى قطع أصغر
    3. Embed: تحويل القطع إلى متجهات (embeddings)
    4. Persist: حفظ المتجهات في قاعدة البيانات المحلية (ChromaDB)
    
    1. Load: Load all documents from data/ folder
    2. Split: Split documents into smaller chunks
    3. Embed: Convert chunks to vectors (embeddings)
    4. Persist: Save vectors to local database (ChromaDB)
    
    Returns:
        Chroma vector store instance if successful, None otherwise
        (مثيل مستودع المتجهات Chroma عند النجاح، None خلاف ذلك)
    """
    # طباعة رأس القسم
    # Print section header
    print("\n" + "="*60)
    print("🚀 STARTING DOCUMENT INGESTION")
    print("="*60 + "\n")
    
    # ========== الخطوة 1: تحميل المستندات ==========
    # ========== Step 1: Load Documents ==========
    
    # تحميل جميع المستندات من مجلد data/
    # هذه الدالة تقرأ جميع الملفات المدعومة وتحولها إلى Document objects
    # Load all documents from data/ folder
    # This function reads all supported files and converts them to Document objects
    print("📂 Step 1: Loading documents...")
    documents = load_documents()
    
    # التحقق من وجود مستندات
    # إذا لم يتم تحميل أي مستندات، لا يمكن المتابعة
    # Check if documents exist
    # If no documents were loaded, cannot proceed
    if not documents:
        print("❌ No documents found in data/ directory!")
        print(f"   Please add .txt, .md, or .pdf files to: {DATA_DIR}")
        # إرجاع None للإشارة إلى الفشل
        # Return None to indicate failure
        return None
    
    # ========== الخطوة 2: تقسيم المستندات ==========
    # ========== Step 2: Split Documents ==========
    
    # تقسيم المستندات إلى قطع أصغر
    # هذا مهم لأن النماذج اللغوية لها حدود على طول المدخلات
    # وأيضاً لأن القطع الصغيرة أسهل في البحث والاسترجاع
    # Split documents into smaller chunks
    # This is important because language models have limits on input length
    # And also because smaller chunks are easier to search and retrieve
    print("\n✂️ Step 2: Splitting documents...")
    chunks = split_documents(documents)
    
    # ========== الخطوة 3: إنشاء التضمينات والحفظ ==========
    # ========== Step 3: Create Embeddings and Persist ==========
    
    # تحويل القطع إلى متجهات وحفظها
    # هذه الخطوة تأخذ وقتاً أطول لأنها تتطلب اتصالاً بـ OpenAI API
    # Convert chunks to vectors and save them
    # This step takes longer because it requires connection to OpenAI API
    print("\n🔮 Step 3: Creating embeddings and persisting...")
    vector_store = create_vector_store(chunks)
    
    # طباعة ملخص النتائج
    # Print summary of results
    print("\n" + "="*60)
    print("✅ INGESTION COMPLETE!")
    print("="*60)
    print(f"   Documents: {len(documents)}")  # عدد المستندات الأصلية - Number of original documents
    print(f"   Chunks: {len(chunks)}")  # عدد القطع بعد التقسيم - Number of chunks after splitting
    print(f"   Vector DB: {DB_DIR}")  # مسار قاعدة البيانات - Database path
    print("="*60 + "\n")
    
    return vector_store


# ==================== نقطة الدخول الرئيسية ====================
# ==================== MAIN ENTRY POINT ====================

# نقطة الدخول الرئيسية لتشغيل البرنامج كسكريبت
# يتم تنفيذ هذا الكود فقط عند تشغيل الملف مباشرة (وليس عند استيراده كوحدة)
# Main entry point for running as a script
# This code executes only when running the file directly (not when imported as module)

# if __name__ == "__main__" يتحقق من أن الملف يُشغّل مباشرة
# if __name__ == "__main__" checks that the file is run directly
if __name__ == "__main__":
    # تحميل متغيرات البيئة من ملف .env
    # load_dotenv() يقرأ الملف .env من المجلد الحالي ويحمّل المتغيرات
    # Load environment variables from .env file
    # load_dotenv() reads .env file from current directory and loads variables
    load_dotenv()
    
    # التحقق من وجود مفتاح API الخاص بـ OpenAI
    # هذا المفتاح مطلوب لأننا نحتاج للاتصال بـ OpenAI API لإنشاء التضمينات
    # Check for OpenAI API key
    # This key is required because we need to connect to OpenAI API to create embeddings
    if not os.getenv("OPENAI_API_KEY"):
        # إذا لم يتم العثور على المفتاح، طباعة رسالة خطأ وإنهاء البرنامج
        # If key not found, print error message and exit program
        print("❌ Error: OPENAI_API_KEY not found!")
        print("   Please set your API key in the .env file")
        print("   Example: OPENAI_API_KEY=sk-...")
        exit(1)  # إنهاء البرنامج برمز خطأ - Exit program with error code
    
    # تشغيل عملية الاستيعاب الكاملة
    # Run complete ingestion process
    ingest_documents()
    
    # بعد الانتهاء، يمكن استخدام قاعدة البيانات المتجهة للبحث
    # After completion, the vector database can be used for searching
    # يمكنك الآن تشغيل: python -m src.rag --q "your question"
    # You can now run: python -m src.rag --q "your question"
