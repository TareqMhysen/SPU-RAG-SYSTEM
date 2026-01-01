"""
Main RAG pipeline for the course assistant.
Handles retrieval, answer generation, and citation formatting.

خط أنابيب RAG الرئيسي للمساعد التعليمي.
يتعامل مع الاسترجاع، توليد الإجابات، وتنسيق الاستشهادات.

Main RAG pipeline for the course assistant.
Handles retrieval, answer generation, and citation formatting.

هذا الملف يحتوي على الفئة RAGPipeline التي تنفذ العملية الكاملة لـ RAG:
1. الاسترجاع (Retrieval): البحث عن المستندات ذات الصلة
2. التوليد (Generation): استخدام النموذج اللغوي لتوليد الإجابة
3. الحمايات (Guardrails): فحص المعلومات الشخصية، محاولات الغش، والخروج عن النطاق

This file contains the RAGPipeline class that implements the complete RAG process:
1. Retrieval: Search for relevant documents
2. Generation: Use language model to generate answer
3. Guardrails: Check for PII, cheating attempts, and out-of-scope queries

RAG تعني: Retrieval-Augmented Generation
- Retrieval: استرجاع المعلومات ذات الصلة من قاعدة البيانات
- Augmented: تعزيز النموذج اللغوي بالمعلومات المسترجعة
- Generation: توليد إجابة بناءً على المعلومات المسترجعة

RAG stands for: Retrieval-Augmented Generation
- Retrieval: Retrieve relevant information from database
- Augmented: Augment language model with retrieved information
- Generation: Generate answer based on retrieved information
"""

# استيراد المكتبات المطلوبة
# Import required libraries
import os  # للتعامل مع متغيرات البيئة - For environment variables
import argparse  # لتحليل وسيطات سطر الأوامر - For command-line argument parsing
from typing import Tuple, List, Optional  # لنوع البيانات - For type hints

from dotenv import load_dotenv  # لتحميل متغيرات البيئة - To load environment variables
from langchain_community.vectorstores import Chroma  # لقاعدة البيانات المتجهة - For vector database
from langchain_openai import OpenAIEmbeddings, ChatOpenAI  # لنماذج OpenAI - For OpenAI models
from langchain.prompts import ChatPromptTemplate  # لإنشاء قوالب الرسائل - For creating prompt templates
from langchain.schema import Document  # لنوع المستند - For Document type

# استيراد الإعدادات من ملف config.py
# Import settings from config.py
from .config import DB_DIR, TOP_K, EMBEDDING_MODEL, LLM_MODEL

# استيراد القوالب والرسائل من prompts.py
# Import prompts and messages from prompts.py
from .prompts import (
    SYSTEM_PROMPT,  # رسالة النظام الرئيسية - Main system prompt
    RAG_PROMPT_TEMPLATE,  # قالب RAG - RAG template
    PII_WARNING,  # رسالة تحذير PII - PII warning message
    TUTORING_RESPONSE_PREFIX  # بادئة وضع التوجيه - Tutoring mode prefix
)

# استيراد الدوال المساعدة من utils.py
# Import helper functions from utils.py
from .utils import (
    format_docs_for_context,  # تنسيق المستندات للسياق - Format documents for context
    pretty_print_docs,  # طباعة المستندات بشكل جميل - Pretty print documents
    format_answer_with_citations,  # تنسيق الإجابة مع الاستشهادات - Format answer with citations
    check_pii,  # فحص المعلومات الشخصية - Check for PII
    check_cheating_attempt,  # فحص محاولات الغش - Check for cheating attempts
    is_course_related  # فحص صلة الاستعلام بالمقرر - Check if query is course-related
)


class RAGPipeline:
    """
    RAG Pipeline with guardrails for course assistance.
    
    خط أنابيب RAG مع حمايات للمساعدة التعليمية.
    
    هذه الفئة تنفذ العملية الكاملة لـ RAG:
    1. تحميل قاعدة البيانات المتجهة
    2. استرجاع المستندات ذات الصلة
    3. تطبيق الحمايات (PII، محاولات الغش، خارج النطاق)
    4. توليد الإجابات باستخدام النموذج اللغوي
    5. تنسيق الإجابات مع الاستشهادات
    
    This class implements the complete RAG process:
    1. Load vector database
    2. Retrieve relevant documents
    3. Apply guardrails (PII, cheating attempts, out-of-scope)
    4. Generate answers using language model
    5. Format answers with citations
    
    مثال على الاستخدام / Usage example:
    >>> rag = RAGPipeline(debug=True)
    >>> answer = rag.ask("What is machine learning?")
    >>> print(answer)
    """
    
    def __init__(self, debug: bool = False):
        """
        Initialize the RAG pipeline.
        
        تهيئة خط أنابيب RAG.
        
        هذه الدالة تقوم بتهيئة جميع المكونات اللازمة:
        - نموذج التضمين: لتحويل الاستعلامات إلى متجهات
        - نموذج اللغة: لتوليد الإجابات
        - قاعدة البيانات المتجهة: للبحث عن المستندات
        
        This function initializes all necessary components:
        - Embedding model: To convert queries to vectors
        - Language model: To generate answers
        - Vector database: To search for documents
        
        Args:
            debug: If True, print retrieved documents for debugging
                   (إذا كان True، يطبع المستندات المسترجعة للتصحيح)
        """
        # تعيين وضع التصحيح
        # عندما يكون True، سيتم طباعة المستندات المسترجعة عند كل استعلام
        # هذا مفيد لفهم أي مستندات تم اختيارها ولماذا
        # Set debug mode
        # When True, retrieved documents will be printed for each query
        # This is useful to understand which documents were selected and why
        self.debug = debug
        
        # تهيئة نموذج التضمين
        # هذا النموذج يستخدم لتحويل النصوص (الاستعلامات والمستندات) إلى متجهات
        # المتجهات تسمح بالبحث الدلالي (semantic search) بدلاً من البحث النصي العادي
        # Initialize embeddings model
        # This model is used to convert texts (queries and documents) to vectors
        # Vectors enable semantic search instead of regular text search
        self.embeddings = OpenAIEmbeddings(model=EMBEDDING_MODEL)
        
        # تهيئة نموذج اللغة
        # هذا النموذج يستخدم لتوليد الإجابات بناءً على السياق المسترجع
        # temperature=0.3 يعني أن النموذج سيكون أكثر تركيزاً وأقل إبداعاً
        # (قيم منخفضة = إجابات أكثر دقة وثباتاً، قيم عالية = إجابات أكثر إبداعاً)
        # Initialize language model
        # This model is used to generate answers based on retrieved context
        # temperature=0.3 means the model will be more focused and less creative
        # (low values = more accurate and consistent answers, high values = more creative answers)
        self.llm = ChatOpenAI(model=LLM_MODEL, temperature=0.3)
        
        # تحميل مستودع المتجهات
        # هذا يحمل قاعدة البيانات التي تم إنشاؤها في ingest.py
        # Load vector store
        # This loads the database created in ingest.py
        self.vector_store = self._load_vector_store()
        
    def _load_vector_store(self) -> Chroma:
        """
        Load the persisted vector store.
        
        تحميل مستودع المتجهات المحفوظ.
        
        هذه دالة خاصة (تبدأ بـ _) تُستخدم داخلياً فقط.
        تقوم بتحميل قاعدة البيانات المتجهة التي تم إنشاؤها في ingest.py.
        
        Load the persisted vector store.
        
        This is a private method (starts with _) used internally only.
        It loads the vector database created in ingest.py.
        
        Returns:
            Chroma: مثيل مستودع المتجهات - Vector store instance
            
        Raises:
            RuntimeError: إذا لم يتم العثور على قاعدة البيانات
                         (يجب تشغيل ingest.py أولاً)
                         If database not found (must run ingest.py first)
        """
        # التحقق من وجود مجلد قاعدة البيانات
        # DB_DIR.exists() يتحقق من وجود المجلد
        # any(DB_DIR.iterdir()) يتحقق من أن المجلد ليس فارغاً
        # Check if database directory exists
        # DB_DIR.exists() checks if directory exists
        # any(DB_DIR.iterdir()) checks that directory is not empty
        if not DB_DIR.exists() or not any(DB_DIR.iterdir()):
            # إذا لم يتم العثور على قاعدة البيانات، ارفع خطأ مع رسالة واضحة
            # If database not found, raise error with clear message
            raise RuntimeError(
                f"Vector store not found at {DB_DIR}!\n"
                "Please run: python -m src.ingest first"
            )
        
        # إنشاء مثيل مستودع المتجهات من التخزين المستمر
        # Chroma() يحمل قاعدة البيانات الموجودة من القرص
        # Create vector store instance from persisted storage
        # Chroma() loads existing database from disk
        return Chroma(
            persist_directory=str(DB_DIR),  # مسار التخزين (حيث تم حفظ قاعدة البيانات) - Storage path (where database was saved)
            embedding_function=self.embeddings,  # دالة التضمين (لتحويل الاستعلامات إلى متجهات) - Embedding function (to convert queries to vectors)
            collection_name="course_materials"  # اسم المجموعة (يجب أن يطابق الاسم المستخدم في ingest.py) - Collection name (must match name used in ingest.py)
        )
    
    def retrieve(self, query: str) -> List[Document]:
        """
        Retrieve relevant documents for the query.
        
        استرجاع المستندات ذات الصلة للاستعلام.
        
        هذه الدالة تستخدم البحث الدلالي (Semantic Search) للعثور على المستندات
        الأكثر صلة بالاستعلام. البحث الدلالي يبحث عن المعنى وليس فقط الكلمات.
        
        Retrieve relevant documents for the query.
        
        This function uses semantic search to find documents most relevant to the query.
        Semantic search looks for meaning, not just words.
        
        كيف يعمل البحث الدلالي؟
        1. تحويل الاستعلام إلى متجه باستخدام نموذج التضمين
        2. مقارنة متجه الاستعلام مع متجهات جميع القطع في قاعدة البيانات
        3. اختيار القطع الأكثر تشابهاً (أعلى درجة تشابه)
        
        How does semantic search work?
        1. Convert query to vector using embedding model
        2. Compare query vector with vectors of all chunks in database
        3. Select most similar chunks (highest similarity score)
        
        Args:
            query: User's question (سؤال المستخدم)
            
        Returns:
            List of relevant Document objects (قائمة المستندات ذات الصلة)
            العدد محدد بـ TOP_K (افتراضياً 4 مستندات)
            Number is limited by TOP_K (default 4 documents)
        """
        # البحث عن المستندات المشابهة للاستعلام
        # similarity_search() تقوم بـ:
        # 1. تحويل الاستعلام إلى متجه
        # 2. البحث عن k مستندات الأكثر تشابهاً
        # 3. إرجاع قائمة من Document objects مرتبة حسب التشابه
        # Search for documents similar to the query
        # similarity_search() does:
        # 1. Convert query to vector
        # 2. Search for k most similar documents
        # 3. Return list of Document objects sorted by similarity
        docs = self.vector_store.similarity_search(query, k=TOP_K)
        
        # إذا كان وضع التصحيح مفعلاً، طباعة المستندات المسترجعة
        # هذا مفيد لفهم أي مستندات تم اختيارها ولماذا
        # If debug mode is enabled, print retrieved documents
        # This is useful to understand which documents were selected and why
        if self.debug:
            pretty_print_docs(docs)  # طباعة المستندات بشكل جميل - Pretty print documents
        
        return docs
    
    def _apply_guardrails(self, query: str) -> Tuple[bool, Optional[str]]:
        """
        Apply all guardrails to the query.
        
        تطبيق جميع الحمايات على الاستعلام.
        
        الحمايات (Guardrails) هي قواعد أمان تمنع النظام من:
        1. معالجة المعلومات الشخصية (PII)
        2. الإجابة على أسئلة خارج نطاق المقرر
        3. حل الواجبات مباشرة (يتم التعامل معها في التوليد)
        
        Apply all guardrails to the query.
        
        Guardrails are safety rules that prevent the system from:
        1. Processing personally identifiable information (PII)
        2. Answering questions outside course scope
        3. Solving assignments directly (handled in generation)
        
        Args:
            query: User's question (سؤال المستخدم)
            
        Returns:
            Tuple of (should_continue, guardrail_response)
            - should_continue: True إذا كان يمكن المتابعة، False إذا كان يجب التوقف
            - guardrail_response: رسالة الحماية إذا كان يجب التوقف، None خلاف ذلك
            
            Tuple of (should_continue, guardrail_response)
            - should_continue: True if can proceed, False if should stop
            - guardrail_response: Guardrail message if should stop, None otherwise
        """
        # ========== الحماية 1: فحص المعلومات الشخصية (PII) ==========
        # ========== Guardrail 1: PII Check ==========
        
        # التحقق من وجود معلومات شخصية في الاستعلام
        # مثل: عناوين البريد الإلكتروني، أرقام الهواتف، أرقام الهوية
        # Check for personally identifiable information in query
        # Such as: email addresses, phone numbers, ID numbers
        if check_pii(query):
            # إذا تم اكتشاف معلومات شخصية، إيقاف المعالجة وإرجاع رسالة تحذير
            # If PII detected, stop processing and return warning message
            return False, PII_WARNING
        
        # ========== الحماية 2: فحص خارج النطاق ==========
        # ========== Guardrail 2: Out-of-scope Check ==========
        
        # التحقق من صلة الاستعلام بمحتوى المقرر
        # إذا كان الاستعلام غير متعلق بالمقرر (مثل أسئلة عن الرياضيات أو التاريخ)
        # Check if query is related to course content
        # If query is unrelated to course (e.g., questions about math or history)
        if not is_course_related(query):
            # إذا كان خارج النطاق، إيقاف المعالجة وإرجاع رسالة رفض
            # If out-of-scope, stop processing and return rejection message
            return False, (
                "I'm sorry, but this question is outside the scope of our NLP/ML course. "
                "I can only help with course-related topics such as NLP, machine learning, "
                "transformers, BERT, neural networks, and other concepts covered in the materials."
            )
        
        # ========== الحماية 3: محاولة الغش ==========
        # ========== Guardrail 3: Cheating Attempt ==========
        
        # محاولة الغش لا توقف المعالجة، بل يتم التعامل معها في عملية التوليد
        # بدلاً من إعطاء الإجابة مباشرة، النظام يتحول إلى وضع التوجيه
        # Cheating attempt doesn't stop processing, but is handled in generation
        # Instead of giving direct answer, system switches to tutoring mode
        # نستمر ولكن سنعدل نهج الاستجابة في generate_answer()
        # We continue but will modify response approach in generate_answer()
        
        # إذا مرت جميع الحمايات، يمكن المتابعة
        # If all guardrails passed, can proceed
        return True, None
    
    def generate_answer(self, query: str, docs: List[Document]) -> str:
        """
        Generate an answer using the LLM with retrieved context.
        
        توليد إجابة باستخدام النموذج اللغوي مع السياق المسترجع.
        
        هذه الدالة هي قلب نظام RAG. تأخذ الاستعلام والمستندات المسترجعة
        وتستخدم النموذج اللغوي لتوليد إجابة بناءً على السياق.
        
        Generate an answer using the LLM with retrieved context.
        
        This function is the heart of the RAG system. It takes the query and retrieved documents
        and uses the language model to generate an answer based on context.
        
        العملية:
        1. التحقق من محاولة الغش (لتحديد وضع الاستجابة)
        2. تنسيق السياق من المستندات المسترجعة
        3. إنشاء رسالة موجهة (prompt) للنموذج
        4. استدعاء النموذج لتوليد الإجابة
        5. إضافة الاستشهادات (citations) للإجابة
        
        Process:
        1. Check for cheating attempt (to determine response mode)
        2. Format context from retrieved documents
        3. Create prompt for the model
        4. Invoke model to generate answer
        5. Add citations to answer
        
        Args:
            query: User's question (سؤال المستخدم)
            docs: Retrieved documents (المستندات المسترجعة)
            
        Returns:
            Generated answer with citations (إجابة مولدّة مع استشهادات)
        """
        # ========== التحقق من محاولة الغش ==========
        # ========== Check for Cheating Attempt ==========
        
        # التحقق من محاولة الغش لتحديد وضع الاستجابة
        # إذا كانت محاولة غش، سنستخدم وضع التوجيه (Tutoring Mode)
        # Check for cheating attempt to determine response mode
        # If cheating attempt, we'll use Tutoring Mode
        is_cheating = check_cheating_attempt(query)
        
        # ========== تنسيق السياق ==========
        # ========== Format Context ==========
        
        # تنسيق المستندات المسترجعة إلى سلسلة نصية يمكن إدخالها للنموذج
        # Format retrieved documents into a text string that can be input to the model
        context = format_docs_for_context(docs)
        
        # التحقق من وجود سياق ذي صلة
        # إذا لم تكن هناك مستندات أو السياق فارغ، لا يمكن توليد إجابة
        # Check if we have relevant context
        # If no documents or context is empty, cannot generate answer
        if not docs or not context.strip():
            return "I don't have enough information in the course materials to answer this question."
        
        # ========== تحضير الرسالة الموجهة ==========
        # ========== Prepare Prompt ==========
        
        # تحضير الرسالة الموجهة للنموذج
        # الرسالة الموجهة تحدد سلوك النموذج ونوع الاستجابة
        # Prepare prompt for the model
        # Prompt determines model behavior and response type
        if is_cheating:
            # ===== وضع التوجيه لمحاولات الغش =====
            # ===== Tutoring Mode for Cheating Attempts =====
            
            # عند اكتشاف محاولة غش، نستخدم رسالة موجهة خاصة
            # تخبر النموذج أن يتحول إلى وضع التوجيه ويعطي تلميحات بدلاً من الحلول
            # When cheating detected, use special prompt
            # Tells model to switch to tutoring mode and give hints instead of solutions
            prompt = ChatPromptTemplate.from_messages([
                ("system", SYSTEM_PROMPT),  # رسالة النظام (تحتوي على جميع الحمايات) - System message (contains all guardrails)
                ("human", f"""The student appears to be asking for direct homework/exam answers.
Switch to tutoring mode: provide guidance and hints, not solutions.

Their question: {query}

Context from course materials:
{context}

Provide educational guidance without giving direct answers:""")
            ])
        else:
            # ===== وضع RAG العادي =====
            # ===== Normal RAG Mode =====
            
            # في الوضع العادي، نستخدم قالب RAG القياسي
            # In normal mode, use standard RAG template
            prompt = ChatPromptTemplate.from_messages([
                ("system", SYSTEM_PROMPT),  # رسالة النظام - System message
                ("human", RAG_PROMPT_TEMPLATE)  # قالب RAG (يحتوي على {context} و {question}) - RAG template (contains {context} and {question})
            ])
        
        # ========== توليد الاستجابة ==========
        # ========== Generate Response ==========
        
        # إنشاء سلسلة (chain) من العمليات
        # prompt | self.llm يعني: تطبيق الرسالة الموجهة على النموذج
        # Create chain of operations
        # prompt | self.llm means: apply prompt to model
        chain = prompt | self.llm
        
        # استدعاء السلسلة لتوليد الاستجابة
        # Invoke chain to generate response
        if is_cheating:
            # في وضع التوجيه، نمرر السياق فقط (السؤال موجود في الرسالة الموجهة)
            # In tutoring mode, pass context only (question is in prompt)
            response = chain.invoke({"context": context})
            # إضافة بادئة التوجيه للإجابة
            # Add tutoring prefix to answer
            answer = TUTORING_RESPONSE_PREFIX + response.content
        else:
            # في الوضع العادي، نمرر السياق والسؤال
            # In normal mode, pass context and question
            response = chain.invoke({"context": context, "question": query})
            answer = response.content
        
        # ========== إضافة الاستشهادات ==========
        # ========== Add Citations ==========
        
        # إضافة قسم الاستشهادات إلى الإجابة
        # هذا مهم لإظهار مصادر المعلومات للطالب
        # Add citations section to answer
        # This is important to show information sources to student
        formatted_answer = format_answer_with_citations(answer, docs)
        
        return formatted_answer
    
    def ask(self, query: str) -> str:
        """
        Main entry point: process a question through the full pipeline.
        
        نقطة الدخول الرئيسية: معالجة سؤال من خلال خط الأنابيب الكامل.
        
        هذه هي الدالة الرئيسية التي يجب استدعاؤها لطرح سؤال على النظام.
        تنفذ العملية الكاملة من البداية إلى النهاية:
        1. تطبيق الحمايات
        2. استرجاع المستندات
        3. توليد الإجابة
        
        Main entry point: process a question through the full pipeline.
        
        This is the main function that should be called to ask a question to the system.
        Executes the complete process from start to finish:
        1. Apply guardrails
        2. Retrieve documents
        3. Generate answer
        
        Args:
            query: User's question (سؤال المستخدم)
            
        Returns:
            Complete answer with citations or guardrail response
            (إجابة كاملة مع استشهادات أو استجابة حماية)
            
        مثال / Example:
            >>> rag = RAGPipeline()
            >>> answer = rag.ask("What is machine learning?")
            >>> print(answer)
        """
        # طباعة رسالة بدء المعالجة
        # Print processing start message
        print(f"\n🔍 Processing query: {query}\n")
        
        # ========== الخطوة 1: تطبيق الحمايات ==========
        # ========== Step 1: Apply Guardrails ==========
        
        # تطبيق جميع الحمايات على الاستعلام
        # Apply all guardrails to query
        should_continue, guardrail_response = self._apply_guardrails(query)
        
        # إذا كان يجب التوقف (مثلاً: معلومات شخصية أو خارج النطاق)
        # إرجاع استجابة الحماية مباشرة دون المتابعة
        # If should stop (e.g., PII or out-of-scope)
        # Return guardrail response directly without proceeding
        if not should_continue:
            return guardrail_response
        
        # ========== الخطوة 2: استرجاع المستندات ==========
        # ========== Step 2: Retrieve Documents ==========
        
        # استرجاع المستندات ذات الصلة من قاعدة البيانات
        # Retrieve relevant documents from database
        docs = self.retrieve(query)
        
        # ========== الخطوة 3: توليد الإجابة ==========
        # ========== Step 3: Generate Answer ==========
        
        # توليد الإجابة باستخدام النموذج اللغوي والسياق المسترجع
        # Generate answer using language model and retrieved context
        answer = self.generate_answer(query, docs)
        
        return answer


def main():
    """
    Main entry point for command-line usage.
    
    نقطة الدخول الرئيسية للاستخدام من سطر الأوامر.
    
    هذه الدالة تسمح بتشغيل النظام من سطر الأوامر:
    python -m src.rag --q "What is machine learning?"
    python -m src.rag --q "Explain transformers" --debug
    
    Main entry point for command-line usage.
    
    This function allows running the system from command line:
    python -m src.rag --q "What is machine learning?"
    python -m src.rag --q "Explain transformers" --debug
    """
    # ========== إعداد محلل الوسيطات ==========
    # ========== Setup Argument Parser ==========
    
    # إنشاء محلل وسيطات سطر الأوامر
    # argparse يساعد في تحليل الوسيطات من سطر الأوامر
    # Create command-line argument parser
    # argparse helps parse arguments from command line
    parser = argparse.ArgumentParser(
        description="RAG Course Assistant - Ask questions about course materials"
    )
    
    # إضافة وسيطة الاستعلام
    # --q أو --query: السؤال المراد طرحه
    # Add query argument
    # --q or --query: Question to ask
    parser.add_argument(
        "--q", "--query",  # يمكن استخدام --q أو --query - Can use --q or --query
        type=str,  # نوع البيانات: سلسلة نصية - Data type: string
        required=True,  # مطلوب (يجب توفيره) - Required (must be provided)
        help="The question to ask"  # نص المساعدة - Help text
    )
    
    # إضافة وسيطة وضع التصحيح
    # --debug: إذا تم توفيره، يطبع المستندات المسترجعة
    # Add debug argument
    # --debug: If provided, prints retrieved documents
    parser.add_argument(
        "--debug",
        action="store_true",  # إذا تم توفيره، القيمة True - If provided, value is True
        help="Print retrieved documents for debugging"  # نص المساعدة - Help text
    )
    
    # تحليل الوسيطات من سطر الأوامر
    # Parse arguments from command line
    args = parser.parse_args()
    
    # ========== إعداد البيئة ==========
    # ========== Setup Environment ==========
    
    # تحميل متغيرات البيئة من ملف .env
    # Load environment variables from .env file
    load_dotenv()
    
    # التحقق من وجود مفتاح API الخاص بـ OpenAI
    # هذا المفتاح مطلوب للاتصال بـ OpenAI API
    # Check for OpenAI API key
    # This key is required to connect to OpenAI API
    if not os.getenv("OPENAI_API_KEY"):
        print("❌ Error: OPENAI_API_KEY not found!")
        print("   Please set your API key in the .env file")
        exit(1)  # إنهاء البرنامج برمز خطأ - Exit program with error code
    
    # ========== تشغيل النظام ==========
    # ========== Run System ==========
    
    # تهيئة وتشغيل النظام
    # Initialize and run system
    try:
        # إنشاء مثيل خط أنابيب RAG
        # debug=args.debug: إذا تم توفير --debug، يكون True
        # Create RAG pipeline instance
        # debug=args.debug: If --debug provided, is True
        rag = RAGPipeline(debug=args.debug)
        
        # طرح السؤال والحصول على الإجابة
        # Ask question and get answer
        answer = rag.ask(args.q)
        
        # طباعة الإجابة بتنسيق جميل
        # Print answer in beautiful format
        print("\n" + "="*60)
        print("📝 ANSWER")
        print("="*60)
        print(answer)
        print("="*60 + "\n")
        
    except Exception as e:
        # في حالة حدوث خطأ، طباعة رسالة الخطأ وإنهاء البرنامج
        # If error occurs, print error message and exit program
        print(f"❌ Error: {e}")
        exit(1)


# ==================== نقطة الدخول الرئيسية ====================
# ==================== MAIN ENTRY POINT ====================

# نقطة الدخول الرئيسية عند تشغيل الملف مباشرة
# يتم تنفيذ هذا الكود فقط عند تشغيل الملف مباشرة (وليس عند استيراده كوحدة)
# Main entry point when running file directly
# This code executes only when running the file directly (not when imported as module)

# if __name__ == "__main__" يتحقق من أن الملف يُشغّل مباشرة
# if __name__ == "__main__" checks that the file is run directly
if __name__ == "__main__":
    # استدعاء الدالة الرئيسية
    # Call main function
    main()
    
    # مثال على الاستخدام:
    # python -m src.rag --q "What is machine learning?"
    # python -m src.rag --q "Explain transformers" --debug
    #
    # Usage example:
    # python -m src.rag --q "What is machine learning?"
    # python -m src.rag --q "Explain transformers" --debug
