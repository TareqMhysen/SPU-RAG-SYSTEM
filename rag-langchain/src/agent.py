"""
BONUS: LangChain Agent with multiple tools for enhanced course assistance.
Implements: retrieve_tool, quiz_tool, flashcards_tool, calculator_tool, 
            list_sources_tool, cite_evidence_tool (6 tools total)

مكافأة: وكيل LangChain مع أدوات متعددة لمساعدة تعليمية محسّنة.
يحتوي على: retrieve_tool, quiz_tool, flashcards_tool, calculator_tool,
            list_sources_tool, cite_evidence_tool (6 أدوات إجمالاً)

هذا الملف يحتوي على نظام Agent متقدم يستخدم LangChain.
الـ Agent هو نظام ذكي يمكنه اختيار الأدوات المناسبة تلقائياً بناءً على سؤال المستخدم.

This file contains an advanced Agent system using LangChain.
The Agent is an intelligent system that can automatically select appropriate tools based on user's question.

الأدوات المتاحة / Available Tools:
1. retrieve_tool: البحث في مواد المقرر
2. quiz_tool: إنشاء اختبارات تدريبية
3. flashcards_tool: إنشاء بطاقات تعليمية
4. calculator_tool: إجراء حسابات رياضية
5. list_sources_tool: عرض المستندات المتاحة
6. cite_evidence_tool: العثور على اقتباسات مع استشهادات

1. retrieve_tool: Search course materials
2. quiz_tool: Generate practice quizzes
3. flashcards_tool: Create study flashcards
4. calculator_tool: Perform mathematical calculations
5. list_sources_tool: List available documents
6. cite_evidence_tool: Find quotes with citations

كيف يعمل الـ Agent؟
1. المستخدم يطرح سؤالاً
2. الـ Agent يحلل السؤال ويقرر أي أداة (أو أدوات) يجب استخدامها
3. يستدعي الأداة المناسبة
4. يجمع النتائج ويقدم إجابة شاملة

How does the Agent work?
1. User asks a question
2. Agent analyzes question and decides which tool(s) to use
3. Invokes appropriate tool
4. Collects results and provides comprehensive answer
"""

# استيراد المكتبات المطلوبة
# Import required libraries
import os  # للتعامل مع متغيرات البيئة - For environment variables
from typing import List, Dict, Any  # لنوع البيانات - For type hints

from dotenv import load_dotenv  # لتحميل متغيرات البيئة - To load environment variables
from langchain.agents import AgentExecutor, create_openai_functions_agent  # للوكيل - For agent
from langchain_openai import ChatOpenAI  # لنموذج اللغة - For language model
from langchain.tools import Tool, tool  # للأدوات - For tools
from langchain.prompts import ChatPromptTemplate, MessagesPlaceholder  # للرسائل الموجهة - For prompts
from langchain_community.vectorstores import Chroma  # لقاعدة البيانات المتجهة - For vector database
from langchain_openai import OpenAIEmbeddings  # لنموذج التضمين - For embedding model

# استيراد الإعدادات من config.py
# Import settings from config.py
from .config import DB_DIR, DATA_DIR, TOP_K, EMBEDDING_MODEL, LLM_MODEL

# استيراد الدوال المساعدة من utils.py
# Import helper functions from utils.py
from .utils import format_docs_for_context  # تنسيق المستندات للسياق - Format documents for context


# ==================== تهيئة الموارد المشتركة ====================
# ==================== Initialize Shared Resources ====================

def get_vector_store():
    """
    Load the vector store for retrieval.
    
    تحميل مستودع المتجهات للاسترجاع.
    
    هذه الدالة تُستخدم من قبل جميع الأدوات التي تحتاج للبحث في المستندات.
    تقوم بتحميل قاعدة البيانات المتجهة التي تم إنشاؤها في ingest.py.
    
    Load the vector store for retrieval.
    
    This function is used by all tools that need to search documents.
    It loads the vector database created in ingest.py.
    
    Returns:
        Chroma: مثيل مستودع المتجهات - Vector store instance
    """
    # تهيئة نموذج التضمين
    # هذا النموذج يستخدم لتحويل الاستعلامات إلى متجهات للبحث
    # Initialize embeddings model
    # This model is used to convert queries to vectors for search
    embeddings = OpenAIEmbeddings(model=EMBEDDING_MODEL)
    
    # إنشاء مستودع المتجهات من التخزين المستمر
    # Chroma() يحمل قاعدة البيانات الموجودة من القرص
    # Create vector store from persisted storage
    # Chroma() loads existing database from disk
    return Chroma(
        persist_directory=str(DB_DIR),  # مسار التخزين (حيث تم حفظ قاعدة البيانات) - Storage path (where database was saved)
        embedding_function=embeddings,  # دالة التضمين (لتحويل الاستعلامات إلى متجهات) - Embedding function (to convert queries to vectors)
        collection_name="course_materials"  # اسم المجموعة (يجب أن يطابق الاسم المستخدم في ingest.py) - Collection name (must match name used in ingest.py)
    )


def get_llm():
    """
    Get the LLM instance.
    
    الحصول على مثيل النموذج اللغوي.
    
    هذه الدالة تُستخدم من قبل الأدوات التي تحتاج لتوليد نصوص
    (مثل quiz_tool و flashcards_tool).
    
    Get the LLM instance.
    
    This function is used by tools that need to generate text
    (such as quiz_tool and flashcards_tool).
    
    Returns:
        ChatOpenAI: مثيل النموذج اللغوي - Language model instance
    """
    # إنشاء مثيل نموذج اللغة
    # temperature=0.3 يعني إجابات أكثر تركيزاً وثباتاً
    # Create language model instance
    # temperature=0.3 means more focused and consistent answers
    return ChatOpenAI(model=LLM_MODEL, temperature=0.3)


# ============= تعريف الأدوات =============
# ============= TOOL DEFINITIONS =============

@tool
def retrieve_tool(query: str) -> str:
    """
    Search the course materials for information related to the query.
    Use this tool when the student asks a content question about NLP, 
    machine learning, transformers, BERT, or any course topic.
    
    Args:
        query: The search query or question about course content
        
    Returns:
        Relevant information from course materials with sources
    """
    # الحصول على مستودع المتجهات
    # Get vector store
    vector_store = get_vector_store()
    # البحث عن المستندات المشابهة
    # Search for similar documents
    docs = vector_store.similarity_search(query, k=TOP_K)
    
    # إذا لم يتم العثور على مستندات
    # If no documents found
    if not docs:
        return "I couldn't find relevant information in the course materials."
    
    # تنسيق النتائج مع الاستشهادات
    # Format results with citations
    results = []
    # تكرار على كل مستند وترقيمه
    # Iterate over each document and number it
    for i, doc in enumerate(docs, 1):
        # الحصول على مصدر المستند
        # Get document source
        source = doc.metadata.get('source', 'Unknown')
        # الحصول على رقم الصفحة
        # Get page number
        page = doc.metadata.get('page', 'N/A')
        # إضافة المستند المنسق إلى النتائج
        # Add formatted document to results
        results.append(
            f"[{i}] From {source} (Page {page}):\n{doc.page_content}\n"
        )
    
    # دمج النتائج مع فاصل
    # Join results with separator
    return "\n---\n".join(results)


@tool
def quiz_tool(topic: str) -> str:
    """
    Generate a 3-question quiz on the specified NLP/ML topic.
    Use this tool when the student wants to practice or test their knowledge.
    
    إنشاء اختبار تدريبي مكون من 3 أسئلة عن موضوع محدد في NLP/ML.
    استخدم هذه الأداة عندما يريد الطالب التدرب أو اختبار معرفته.
    
    هذه الأداة تقوم بـ:
    1. البحث عن معلومات عن الموضوع من مواد المقرر
    2. استخدام النموذج اللغوي لإنشاء أسئلة اختيار من متعدد
    3. إرجاع اختبار كامل مع الإجابات الصحيحة
    
    This tool does:
    1. Search for information about the topic from course materials
    2. Use language model to create multiple choice questions
    3. Return complete quiz with correct answers
    
    Args:
        topic: The topic to create a quiz about (e.g., "BERT", "attention", "transformers")
               (الموضوع المراد إنشاء اختبار عنه)
        
    Returns:
        A 3-question multiple choice quiz with answers
        (اختبار مكون من 3 أسئلة اختيار من متعدد مع الإجابات)
    """
    # الحصول على السياق من مستودع المتجهات
    # نبحث عن 3 مستندات ذات صلة بالموضوع لاستخدامها كسياق
    # Get context from vector store
    # Search for 3 relevant documents about the topic to use as context
    vector_store = get_vector_store()
    docs = vector_store.similarity_search(topic, k=3)  # k=3 يعني 3 مستندات - k=3 means 3 documents
    
    # تنسيق المستندات كسياق
    # format_docs_for_context() تحول قائمة المستندات إلى سلسلة نصية منسقة
    # Format documents as context
    # format_docs_for_context() converts list of documents to formatted text string
    context = format_docs_for_context(docs)
    
    # توليد الاختبار باستخدام نموذج اللغة
    # سنستخدم النموذج اللغوي لإنشاء الأسئلة بناءً على السياق
    # Generate quiz using LLM
    # We'll use language model to create questions based on context
    llm = get_llm()
    
    # إنشاء رسالة موجهة لإنشاء الاختبار
    # الرسالة الموجهة تخبر النموذج بما نريده بالضبط (3 أسئلة، اختيار من متعدد، إلخ)
    # Create prompt for quiz generation
    # Prompt tells the model exactly what we want (3 questions, multiple choice, etc.)
    prompt = f"""Based on the following course content about "{topic}", create a 3-question multiple choice quiz.

Course Content:
{context}

Format each question as:
Q1: [Question text]
A) [Option A]
B) [Option B]
C) [Option C]
D) [Option D]
Correct Answer: [Letter]

Q2: ...

Q3: ...

Make sure the questions test understanding, not just memorization.
Include the correct answers at the end."""

    # استدعاء النموذج لإنشاء الاختبار
    # invoke() يرسل الرسالة الموجهة للنموذج ويعيد الاستجابة
    # Invoke model to generate quiz
    # invoke() sends prompt to model and returns response
    response = llm.invoke(prompt)
    
    # إرجاع الاختبار مع عنوان منسق
    # Return quiz with formatted title
    return f"📝 **Quiz on {topic}**\n\n{response.content}"


@tool
def flashcards_tool(topic: str) -> str:
    """
    Generate 5 Q/A flashcards for studying the specified topic.
    Use this tool when the student wants flashcards for revision.
    
    إنشاء 5 بطاقات تعليمية بصيغة سؤال/إجابة لموضوع محدد.
    استخدم هذه الأداة عندما يريد الطالب بطاقات تعليمية للمراجعة.
    
    البطاقات التعليمية (Flashcards) مفيدة جداً للحفظ والمراجعة:
    - الوجه (Front): السؤال أو المفهوم المراد تذكره
    - الظهر (Back): الإجابة أو الشرح
    
    Flashcards are very useful for memorization and revision:
    - Front: Question or concept to remember
    - Back: Answer or explanation
    
    Args:
        topic: The NLP/ML topic to create flashcards about
               (الموضوع المراد إنشاء بطاقات تعليمية عنه)
        
    Returns:
        5 flashcards in Q/A format
        (5 بطاقات تعليمية بصيغة سؤال/إجابة)
    """
    # الحصول على السياق من مستودع المتجهات
    # نبحث عن 3 مستندات ذات صلة بالموضوع
    # Get context from vector store
    # Search for 3 relevant documents about the topic
    vector_store = get_vector_store()
    docs = vector_store.similarity_search(topic, k=3)
    
    # تنسيق المستندات كسياق
    # Format documents as context
    context = format_docs_for_context(docs)
    
    # توليد البطاقات التعليمية باستخدام نموذج اللغة
    # Generate flashcards using LLM
    llm = get_llm()
    
    # إنشاء رسالة موجهة لإنشاء البطاقات التعليمية
    # الرسالة الموجهة تحدد الشكل المطلوب للبطاقات
    # Create prompt for flashcard generation
    # Prompt specifies the required format for flashcards
    prompt = f"""Based on the following course content about "{topic}", create exactly 5 study flashcards.

Course Content:
{context}

Format each flashcard as:
📇 Flashcard 1:
Front: [Question or concept to remember]
Back: [Answer or explanation]

📇 Flashcard 2:
...

Create flashcards that help memorize key concepts, formulas, and definitions."""

    # استدعاء النموذج لإنشاء البطاقات التعليمية
    # Invoke model to generate flashcards
    response = llm.invoke(prompt)
    
    # إرجاع البطاقات التعليمية مع عنوان منسق
    # Return flashcards with formatted title
    return f"📚 **Flashcards for {topic}**\n\n{response.content}"


@tool
def calculator_tool(expression: str) -> str:
    """
    Perform basic mathematical calculations.
    Use this tool when the student needs help with calculations.
    Supports: +, -, *, /, ** (power), sqrt(), and basic math operations.
    
    إجراء حسابات رياضية أساسية.
    استخدم هذه الأداة عندما يحتاج الطالب مساعدة في الحسابات.
    
    العمليات المدعومة:
    - العمليات الأساسية: +, -, *, /
    - الأس: ** (مثال: 2**3 = 8)
    - دوال رياضية: sqrt(), sin(), cos(), log(), إلخ
    - الثوابت: pi, e
    
    Supported operations:
    - Basic: +, -, *, /
    - Power: ** (example: 2**3 = 8)
    - Math functions: sqrt(), sin(), cos(), log(), etc.
    - Constants: pi, e
    
    Args:
        expression: Mathematical expression to evaluate
                   (e.g., "9.8 * 5" or "0.5 * 10 * 5**2")
                   (التعبير الرياضي المراد تقييمه)
        
    Returns:
        The calculated result
        (نتيجة الحساب)
    """
    # استيراد مكتبة الرياضيات
    # تحتوي على دوال رياضية مثل sqrt(), sin(), cos()
    # Import math library
    # Contains math functions like sqrt(), sin(), cos()
    import math
    
    # التقييم الآمن مع عمليات محدودة
    # نستخدم eval() لكن بطريقة آمنة: نحدد فقط العمليات المسموحة
    # هذا يمنع تنفيذ كود خبيث
    # Safe evaluation with limited operations
    # We use eval() but safely: we only allow specific operations
    # This prevents execution of malicious code
    allowed_names = {
        # دوال رياضية / Math functions
        'sqrt': math.sqrt,  # الجذر التربيعي - Square root
        'sin': math.sin,  # الجيب - Sine
        'cos': math.cos,  # جيب التمام - Cosine
        'tan': math.tan,  # الظل - Tangent
        'log': math.log,  # اللوغاريتم الطبيعي - Natural logarithm
        'log10': math.log10,  # اللوغاريتم الأساس 10 - Base 10 logarithm
        'exp': math.exp,  # الأسي - Exponential
        # ثوابت / Constants
        'pi': math.pi,  # ثابت باي (3.14159...) - Pi constant (3.14159...)
        'e': math.e,  # ثابت أويلر (2.71828...) - Euler's constant (2.71828...)
        # دوال مدمجة / Built-in functions
        'abs': abs,  # القيمة المطلقة - Absolute value
        'round': round,  # التقريب - Round
        'pow': pow,  # القوة - Power
    }
    
    try:
        # تقييم التعبير الرياضي بشكل آمن
        # eval(expression, {"__builtins__": {}}, allowed_names) يعني:
        # - expression: التعبير المراد تقييمه
        # - {"__builtins__": {}}: إزالة جميع الدوال المدمجة (للسلامة)
        # - allowed_names: فقط الدوال والثوابت المسموحة
        # Evaluate mathematical expression safely
        # eval(expression, {"__builtins__": {}}, allowed_names) means:
        # - expression: Expression to evaluate
        # - {"__builtins__": {}}: Remove all built-in functions (for safety)
        # - allowed_names: Only allowed functions and constants
        result = eval(expression, {"__builtins__": {}}, allowed_names)
        return f"🔢 Result: {expression} = {result}"
    except Exception as e:
        # في حالة حدوث خطأ (مثل تعبير غير صالح)، إرجاع رسالة خطأ
        # If error occurs (e.g., invalid expression), return error message
        return f"❌ Could not calculate: {expression}\nError: {str(e)}"


@tool
def list_sources_tool(query: str = "") -> str:
    """
    List all available documents in the course materials.
    Use this tool when the student asks what documents are available,
    or wants to know what topics are covered in the course.
    
    عرض قائمة بجميع المستندات المتاحة في مواد المقرر.
    استخدم هذه الأداة عندما يسأل الطالب عن المستندات المتاحة
    أو يريد معرفة المواضيع المغطاة في المقرر.
    
    List all available documents in the course materials.
    Use this tool when the student asks what documents are available,
    or wants to know what topics are covered in the course.
    
    Args:
        query: Optional - ignored, just lists all documents
               (اختياري - يتم تجاهله، يعرض فقط جميع المستندات)
        
    Returns:
        List of all available course documents with file types and sizes
        (قائمة بجميع مستندات المقرر المتاحة مع أنواع الملفات وأحجامها)
    """
    # استيراد مكتبة نظام التشغيل
    # Import OS library
    import os
    
    # قائمة لتخزين معلومات المستندات
    # List to store document information
    documents = []
    
    # التحقق من وجود مجلد البيانات وقراءة الملفات
    # Check if data directory exists and read files
    if DATA_DIR.exists():
        # تكرار على كل ملف في المجلد
        # Iterate over each file in directory
        for file in DATA_DIR.iterdir():
            # التحقق من نوع الملف (نقبل فقط .txt, .pdf, .md)
            # Check file type (only accept .txt, .pdf, .md)
            if file.suffix in ['.txt', '.pdf', '.md']:
                # الحصول على حجم الملف بالبايت
                # Get file size in bytes
                size = file.stat().st_size
                # تحويل الحجم من بايت إلى كيلوبايت (القسمة على 1024)
                # Convert size from bytes to kilobytes (divide by 1024)
                size_kb = size / 1024
                # إضافة معلومات الملف إلى القائمة
                # Add file information to list
                documents.append({
                    'name': file.name,  # اسم الملف (مثال: "course_notes.txt") - File name (e.g., "course_notes.txt")
                    'type': file.suffix[1:].upper(),  # نوع الملف (مثال: "TXT", "PDF") - File type (e.g., "TXT", "PDF")
                    'size': f"{size_kb:.1f} KB"  # حجم الملف بصيغة كيلوبايت (مثال: "125.3 KB") - File size in KB (e.g., "125.3 KB")
                })
    
    # إذا لم يتم العثور على مستندات
    # If no documents found
    if not documents:
        return "📁 No documents found in the course materials folder."
    
    # تنسيق المخرجات - بدء القائمة
    # Format output - start list
    output = "📁 **Available Course Documents:**\n\n"
    
    # تكرار على كل مستند لعرضه مع رقمه
    # Iterate over each document to display it with its number
    for i, doc in enumerate(documents, 1):
        output += f"{i}. **{doc['name']}** ({doc['type']}, {doc['size']})\n"
    
    # أيضاً محاولة الحصول على قائمة المصادر من مستودع المتجهات
    # هذا يعطي معلومات إضافية عن المستندات المفهرسة
    # Also try to get list of sources from vector store
    # This gives additional information about indexed documents
    try:
        vector_store = get_vector_store()
        # الحصول على عينة من المستندات لاستخراج أسماء المصادر
        # Get a sample of documents to extract source names
        docs = vector_store.similarity_search("course content", k=10)
        sources = set()  # استخدام set لتجنب التكرار - Use set to avoid duplicates
        
        # تكرار على المستندات لاستخراج المصادر الفريدة
        # Iterate over documents to extract unique sources
        for doc in docs:
            src = doc.metadata.get('source', '')
            if src:
                # استخراج اسم الملف فقط (معالجة المسارات بـ / و \)
                # Extract filename only (handle paths with / and \)
                sources.add(src.split('/')[-1].split('\\')[-1])
        
        # إذا كانت هناك مصادر، أضفها للمخرجات كقسم منفصل
        # If sources exist, add them to output as separate section
        if sources:
            output += "\n**Indexed in Vector Store:**\n"
            for src in sorted(sources):  # sorted() لترتيب الأسماء أبجدياً - sorted() to sort names alphabetically
                output += f"  • {src}\n"
    except:
        # في حالة حدوث خطأ (مثلاً قاعدة البيانات غير موجودة)، تجاهل
        # If error occurs (e.g., database doesn't exist), ignore
        pass
    
    # إضافة نص تلميحي في النهاية
    # Add helpful tip at the end
    output += "\n💡 Tip: Ask me about any topic covered in these materials!"
    return output


@tool
def cite_evidence_tool(query: str) -> str:
    """
    Find and return 1-3 best supporting quotes/snippets with full citations.
    Use this tool when the student asks for proof, evidence, or wants to 
    verify information with exact quotes from the course materials.
    
    العثور على وإرجاع 1-3 اقتباسات/مقتطفات داعمة أفضل مع استشهادات كاملة.
    استخدم هذه الأداة عندما يطلب الطالب دليلاً أو برهاناً أو يريد
    التحقق من المعلومات باقتباسات دقيقة من مواد المقرر.
    
    هذه الأداة مفيدة جداً عندما يريد الطالب:
    - التحقق من معلومات محددة
    - الحصول على دليل من المصدر
    - رؤية الاقتباس الدقيق من المادة
    
    This tool is very useful when student wants to:
    - Verify specific information
    - Get evidence from source
    - See exact quote from materials
    
    Args:
        query: The claim or topic to find evidence for
               (الادعاء أو الموضوع المراد إيجاد دليل له)
        
    Returns:
        1-3 relevant quotes with exact source citations
        (1-3 اقتباسات ذات صلة مع استشهادات المصدر الدقيقة)
    """
    # الحصول على مستودع المتجهات
    # Get vector store
    vector_store = get_vector_store()
    
    # البحث عن المستندات المشابهة (3 مستندات الأكثر صلة)
    # Search for similar documents (3 most relevant documents)
    docs = vector_store.similarity_search(query, k=3)
    
    # إذا لم يتم العثور على مستندات
    # If no documents found
    if not docs:
        return "❌ No evidence found in course materials for this query."
    
    # بدء بناء المخرجات مع عنوان
    # Start building output with title
    output = f"📖 **Evidence for: \"{query}\"**\n\n"
    
    # تكرار على كل مستند (حتى 3 مستندات)
    # Iterate over each document (up to 3 documents)
    for i, doc in enumerate(docs, 1):
        # الحصول على مصدر المستند من البيانات الوصفية
        # Get document source from metadata
        source = doc.metadata.get('source', 'Unknown')
        # الحصول على رقم الصفحة من البيانات الوصفية
        # Get page number from metadata
        page = doc.metadata.get('page', 'N/A')
        
        # معالجة المسارات: استخراج اسم الملف فقط
        # Handle paths: extract filename only
        
        # معالجة المسارات بنظام Unix/Linux/Mac
        # Handle Unix/Linux/Mac paths
        if '/' in source:
            source = source.split('/')[-1]
        # معالجة المسارات بنظام Windows
        # Handle Windows paths
        if '\\' in source:
            source = source.split('\\')[-1]
        
        # الحصول على مقتطف ذي صلة
        # نأخذ أول 300 حرف، أو حتى نهاية الجملة (إذا كان ذلك منطقياً)
        # Get a relevant snippet
        # Take first 300 chars, or until sentence end (if logical)
        content = doc.page_content.strip()
        if len(content) > 300:
            # محاولة إنهاء المقتطف عند نهاية جملة (البحث عن نقطة بعد الحرف 200)
            # Try to end at sentence end (search for period after char 200)
            end_idx = content.find('.', 200)
            # إذا لم يتم العثور على نقطة أو كانت بعيدة جداً، استخدم 300 حرف
            # If period not found or too far, use 300 chars
            if end_idx == -1 or end_idx > 400:
                end_idx = 300
            # أخذ المقتطف حتى نهاية الجملة + "..."
            # Take snippet until sentence end + "..."
            content = content[:end_idx + 1] + "..."
        
        # إضافة الاقتباس إلى المخرجات
        # Add quote to output
        output += f"**Quote {i}:**\n"  # رقم الاقتباس - Quote number
        output += f"```\n{content}\n```\n"  # المحتوى بصيغة code block (للتنسيق) - Content in code block (for formatting)
        output += f"📌 **Source:** {source}, Page: {page}\n\n"  # المصدر والصفحة - Source and page
    
    return output


# ============= إعداد الوكيل =============
# ============= AGENT SETUP =============

def create_course_agent() -> AgentExecutor:
    """
    Create the course assistant agent with all tools.
    
    إنشاء وكيل المساعد التعليمي مع جميع الأدوات.
    
    هذه الدالة تقوم بإنشاء وإعداد الـ Agent الكامل الذي يمكنه:
    - اختيار الأداة المناسبة تلقائياً بناءً على سؤال المستخدم
    - استخدام عدة أدوات في نفس الوقت إذا لزم الأمر
    - الحفاظ على سياق المحادثة
    - تطبيق الحمايات (Guardrails)
    
    Create the course assistant agent with all tools.
    
    This function creates and sets up the complete Agent that can:
    - Automatically select appropriate tool based on user's question
    - Use multiple tools at the same time if necessary
    - Maintain conversation context
    - Apply guardrails
    
    Returns:
        AgentExecutor instance ready to handle queries
        (مثيل AgentExecutor جاهز لمعالجة الاستعلامات)
        
        يمكن استخدامه هكذا:
        agent = create_course_agent()
        result = agent.invoke({"input": "What is machine learning?"})
        
        Can be used like this:
        agent = create_course_agent()
        result = agent.invoke({"input": "What is machine learning?"})
    """
    # إنشاء مثيل نموذج اللغة
    # هذا النموذج هو "دماغ" الـ Agent الذي يقرر أي أداة يجب استخدامها
    # Create language model instance
    # This model is the "brain" of the Agent that decides which tool to use
    llm = ChatOpenAI(model=LLM_MODEL, temperature=0.3)
    
    # تعريف جميع الأدوات (6 أدوات إجمالاً)
    # كل أداة هي دالة Python تم تزيينها بـ @tool
    # Define all tools (6 tools total)
    # Each tool is a Python function decorated with @tool
    tools = [
        retrieve_tool,  # أداة البحث في مواد المقرر - Search course materials tool
        quiz_tool,  # أداة إنشاء الاختبارات - Quiz generation tool
        flashcards_tool,  # أداة إنشاء البطاقات التعليمية - Flashcards generation tool
        calculator_tool,  # أداة الحاسبة الرياضية - Mathematical calculator tool
        list_sources_tool,  # أداة عرض قائمة المستندات - List documents tool
        cite_evidence_tool,  # أداة البحث عن اقتباسات مع استشهادات - Citation search tool
    ]
    
    # رسالة نظام الوكيل مع جميع الحمايات
    # Agent system prompt with all guardrails
    system_prompt = """You are an intelligent course assistant for a college NLP/Machine Learning course.
    
You have access to the following tools:
1. retrieve_tool: Search course materials for information
2. quiz_tool: Generate practice quizzes on topics
3. flashcards_tool: Create study flashcards
4. calculator_tool: Perform mathematical calculations
5. list_sources_tool: List available course documents
6. cite_evidence_tool: Find quotes with citations as proof

DECISION LOGIC:
- If student asks a CONTENT question (what is..., explain..., how does...) → use retrieve_tool
- If student asks for PRACTICE (quiz, test me, practice questions) → use quiz_tool
- If student asks for REVISION (flashcards, study cards, help me memorize) → use flashcards_tool  
- If student asks for CALCULATION (calculate, compute, what is X times Y) → use calculator_tool
- If student asks what documents/topics are available → use list_sources_tool
- If student asks for PROOF or EVIDENCE (cite, prove, show me evidence) → use cite_evidence_tool

CRITICAL GUARDRAILS:

1. ANTI-CHEATING:
   If student asks "solve my assignment", "give me exam answers", "do my homework":
   - Switch to TUTORING MODE
   - Provide hints and guiding questions instead of direct answers
   - Explain the concepts needed to solve the problem
   - Generate similar practice problems instead
   - Say: "I can help you understand the concept, but I won't solve your assignment directly."

2. OUT-OF-SCOPE:
   If question is NOT related to NLP, ML, transformers, BERT, neural networks, etc.:
   - Refuse to answer politely
   - Say: "This question is outside the scope of our NLP/ML course."
   - Suggest using list_sources_tool to see available topics

3. PII PROTECTION:
   If input contains emails (@), phone numbers, or student IDs:
   - Return EXACTLY: "⚠️ WARNING: Please remove personal data (emails, phone numbers, IDs) from your message and resend your question."
   - Do NOT process the rest of the query

Be helpful, educational, and encourage learning!"""

    # إنشاء قالب الرسالة (Prompt Template)
    # هذا القالب يحدد كيف يتم تنسيق الرسائل بين المستخدم والـ Agent
    # Create prompt template
    # This template defines how messages are formatted between user and Agent
    prompt = ChatPromptTemplate.from_messages([
        ("system", system_prompt),  # رسالة النظام (تحتوي على التعليمات والحمايات) - System message (contains instructions and guardrails)
        MessagesPlaceholder(variable_name="chat_history", optional=True),  # سجل المحادثة (للحفاظ على السياق) - Chat history (to maintain context)
        ("human", "{input}"),  # مدخلات المستخدم (السؤال) - User input (the question)
        MessagesPlaceholder(variable_name="agent_scratchpad"),  # مسودة الوكيل (للتخطيط والتفكير) - Agent scratchpad (for planning and thinking)
    ])
    
    # إنشاء الوكيل
    # create_openai_functions_agent() ينشئ وكيل يستخدم OpenAI Functions
    # هذا النوع من الوكيلات قوي جداً ويمكنه اختيار الأدوات تلقائياً
    # Create agent
    # create_openai_functions_agent() creates an agent using OpenAI Functions
    # This type of agent is very powerful and can automatically select tools
    agent = create_openai_functions_agent(llm, tools, prompt)
    
    # إنشاء المنفذ (AgentExecutor)
    # المنفذ هو الذي يقوم بتشغيل الوكيل وإدارة دورة حياته
    # Create executor (AgentExecutor)
    # Executor is what runs the agent and manages its lifecycle
    agent_executor = AgentExecutor(
        agent=agent,  # الوكيل الذي أنشأناه - The agent we created
        tools=tools,  # الأدوات المتاحة للوكيل - Tools available to agent
        verbose=True,  # وضع التفصيل (يطبع خطوات العملية للمساعدة في التصحيح) - Verbose mode (prints process steps for debugging)
        handle_parsing_errors=True,  # معالجة أخطاء التحليل (إذا فشل الوكيل في اختيار أداة) - Handle parsing errors (if agent fails to select tool)
        max_iterations=5  # الحد الأقصى للتكرارات (عدد المرات التي يمكن للوكيل استخدام الأدوات) - Max iterations (number of times agent can use tools)
        # مثال: إذا استخدم أداة 5 مرات ولم ينته، يتوقف - Example: If uses tool 5 times and not done, stops
    )
    
    return agent_executor


def run_agent_chat():
    """
    Run an interactive chat session with the agent.
    
    تشغيل جلسة محادثة تفاعلية مع الوكيل.
    
    هذه الدالة تنشئ حلقة محادثة مستمرة حيث يمكن للمستخدم:
    - طرح أسئلة
    - طلب إنشاء اختبارات أو بطاقات تعليمية
    - طلب حسابات
    - وغيرها من المهام المدعومة
    
    Run an interactive chat session with the agent.
    
    This function creates a continuous chat loop where user can:
    - Ask questions
    - Request quiz or flashcard generation
    - Request calculations
    - And other supported tasks
    
    للخروج من الجلسة، اكتب: quit, exit, أو q
    
    To exit the session, type: quit, exit, or q
    """
    # ========== طباعة رأس الجلسة ==========
    # ========== Print Session Header ==========
    
    # طباعة رسالة ترحيبية مع معلومات عن القدرات
    # Print welcome message with information about capabilities
    print("\n" + "="*60)
    print("🤖 NLP/ML COURSE ASSISTANT (Agent Mode)")
    print("="*60)
    print("I can help you with:")
    print("  📚 Answer questions from course materials (retrieve_tool)")
    print("  📝 Generate practice quizzes (quiz_tool)")
    print("  📇 Create study flashcards (flashcards_tool)")
    print("  🔢 Perform calculations (calculator_tool)")
    print("  📁 List available documents (list_sources_tool)")
    print("  📖 Find evidence with citations (cite_evidence_tool)")
    print("\nType 'quit' to exit.\n")
    print("="*60 + "\n")
    
    # ========== تهيئة الوكيل ==========
    # ========== Initialize Agent ==========
    
    # إنشاء الوكيل مع جميع الأدوات
    # Create agent with all tools
    agent = create_course_agent()
    
    # تهيئة سجل المحادثة
    # هذا مهم للحفاظ على السياق في المحادثة (مثلاً: الإشارة إلى أسئلة سابقة)
    # Initialize chat history
    # This is important to maintain context in conversation (e.g., referring to previous questions)
    chat_history = []
    
    # ========== حلقة المحادثة الرئيسية ==========
    # ========== Main Chat Loop ==========
    
    # حلقة لا نهائية (حتى يقرر المستخدم الخروج)
    # Infinite loop (until user decides to exit)
    while True:
        try:
            # قراءة مدخلات المستخدم من سطر الأوامر
            # .strip() يزيل المسافات الزائدة من البداية والنهاية
            # Read user input from command line
            # .strip() removes extra spaces from start and end
            user_input = input("You: ").strip()
            
            # التحقق من طلب الإنهاء
            # إذا كتب المستخدم quit, exit, أو q، إنهاء الجلسة
            # Check for exit request
            # If user types quit, exit, or q, end session
            if user_input.lower() in ['quit', 'exit', 'q']:
                print("\n👋 Goodbye! Happy studying!")
                break  # الخروج من الحلقة - Exit loop
            
            # إذا كان المدخل فارغاً، تخطي التكرار والانتظار لإدخال جديد
            # If input is empty, skip iteration and wait for new input
            if not user_input:
                continue  # العودة لبداية الحلقة - Return to start of loop
            
            # تشغيل الوكيل مع المدخلات
            # invoke() يستدعي الوكيل الذي سيختار الأداة المناسبة ويستخدمها
            # Run agent with input
            # invoke() calls the agent which will select appropriate tool and use it
            result = agent.invoke({
                "input": user_input,  # المدخلات (سؤال المستخدم) - Input (user's question)
                "chat_history": chat_history  # سجل المحادثة (للحفاظ على السياق) - Chat history (to maintain context)
            })
            
            # طباعة إجابة الوكيل
            # result['output'] يحتوي على النتيجة النهائية من الوكيل
            # Print agent's answer
            # result['output'] contains final result from agent
            print(f"\n🤖 Assistant: {result['output']}\n")
            
            # تحديث سجل المحادثة
            # نضيف سؤال المستخدم وإجابة الوكيل للحفاظ على السياق
            # Update chat history
            # Add user's question and agent's answer to maintain context
            chat_history.append(("human", user_input))  # إضافة سؤال المستخدم - Add user's question
            chat_history.append(("assistant", result['output']))  # إضافة إجابة الوكيل - Add agent's answer
            
        except KeyboardInterrupt:
            # معالجة إيقاف المستخدم (Ctrl+C)
            # عندما يضغط المستخدم Ctrl+C، ننهي الجلسة بأدب
            # Handle user interruption (Ctrl+C)
            # When user presses Ctrl+C, end session politely
            print("\n\n👋 Goodbye!")
            break  # الخروج من الحلقة - Exit loop
            
        except Exception as e:
            # معالجة الأخطاء العامة
            # إذا حدث خطأ غير متوقع، طباعة رسالة الخطأ والاستمرار
            # Handle general errors
            # If unexpected error occurs, print error message and continue
            print(f"\n❌ Error: {e}\n")


# ==================== نقطة الدخول الرئيسية ====================
# ==================== MAIN ENTRY POINT ====================

# نقطة الدخول الرئيسية عند تشغيل الملف مباشرة
# يتم تنفيذ هذا الكود فقط عند تشغيل الملف مباشرة (وليس عند استيراده كوحدة)
# Main entry point when running file directly
# This code executes only when running the file directly (not when imported as module)

# if __name__ == "__main__" يتحقق من أن الملف يُشغّل مباشرة
# if __name__ == "__main__" checks that the file is run directly
if __name__ == "__main__":
    # تحميل متغيرات البيئة من ملف .env
    # load_dotenv() يقرأ الملف .env ويحمّل المتغيرات (مثل OPENAI_API_KEY)
    # Load environment variables from .env file
    # load_dotenv() reads .env file and loads variables (like OPENAI_API_KEY)
    load_dotenv()
    
    # التحقق من وجود مفتاح API الخاص بـ OpenAI
    # هذا المفتاح مطلوب للاتصال بـ OpenAI API (للنموذج اللغوي والتضمينات)
    # Check for OpenAI API key
    # This key is required to connect to OpenAI API (for language model and embeddings)
    if not os.getenv("OPENAI_API_KEY"):
        print("❌ Error: OPENAI_API_KEY not found!")
        print("   Please set your API key in the .env file")
        exit(1)  # إنهاء البرنامج برمز خطأ - Exit program with error code
    
    # تشغيل جلسة المحادثة التفاعلية مع الوكيل
    # Run interactive chat session with agent
    run_agent_chat()
    
    # مثال على الاستخدام:
    # python -m src.agent
    #
    # Usage example:
    # python -m src.agent
