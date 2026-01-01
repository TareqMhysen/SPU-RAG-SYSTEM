"""
Utility functions for formatting and displaying RAG results.

هذا الملف يحتوي على دوال مساعدة تستخدم في جميع أنحاء نظام RAG.
تشمل هذه الدوال:
- تنسيق المستندات للعرض والتخزين
- التحقق من المعلومات الشخصية (PII)
- التحقق من محاولات الغش
- التحقق من صلة الاستعلام بالمقرر

This file contains helper functions used throughout the RAG system.
These functions include:
- Formatting documents for display and storage
- Checking for Personally Identifiable Information (PII)
- Detecting cheating attempts
- Verifying query relevance to course content
"""

# استيراد المكتبات المطلوبة
# Import required libraries
import re  # للبحث عن الأنماط في النصوص - For pattern matching in texts
from typing import List, Dict, Any  # لنوع البيانات - For type hints
from langchain.schema import Document  # نوع المستند من LangChain - Document type from LangChain


def format_docs_for_context(docs: List[Document]) -> str:
    """
    Format retrieved documents into a context string for the LLM.
    
    تقوم هذه الدالة بتحويل قائمة المستندات المسترجعة إلى سلسلة نصية منسقة
    يمكن استخدامها كسياق (context) لإدخالها إلى نموذج اللغة.
    
    This function converts a list of retrieved documents into a formatted string
    that can be used as context input to the language model.
    
    مثال على المخرجات / Example output:
    [Document 1]
    Source: course_notes.txt
    Page: 1
    Content:
    Machine learning is a subset of artificial intelligence...
    ==================================================
    
    [Document 2]
    Source: lecture_slides.pdf
    Page: 5
    Content:
    Neural networks consist of layers...
    ==================================================
    
    Args:
        docs: List of retrieved Document objects (قائمة المستندات المسترجعة)
        
    Returns:
        Formatted string with document content and metadata (سلسلة نصية منسقة)
    """
    # قائمة لتخزين الأجزاء المنسقة من المستندات
    # سنقوم ببناء كل جزء منفصل ثم دمجهما معاً
    # List to store formatted parts of documents
    # We'll build each part separately then combine them
    formatted_parts = []
    
    # تكرار على كل مستند وترقيمه (يبدأ من 1، وليس 0)
    # enumerate(docs, 1) يعطينا الفهرس والمستند معاً
    # Iterate over each document and number it (starting from 1, not 0)
    # enumerate(docs, 1) gives us both index and document
    for i, doc in enumerate(docs, 1):
        # الحصول على مصدر المستند من البيانات الوصفية
        # إذا لم يكن موجوداً، نستخدم 'Unknown' كقيمة افتراضية
        # Get document source from metadata
        # If not found, use 'Unknown' as default
        source = doc.metadata.get('source', 'Unknown')
        # الحصول على رقم الصفحة من البيانات الوصفية
        # إذا لم يكن موجوداً، نستخدم 'N/A' (غير متاح)
        # Get page number from metadata
        # If not found, use 'N/A' (not available)
        page = doc.metadata.get('page', 'N/A')
        
        # معالجة المسارات: استخراج اسم الملف فقط من المسار الكامل
        # هذا مهم لأن المسار الكامل قد يحتوي على معلومات غير ضرورية
        # مثل: /home/user/documents/course_notes.txt → course_notes.txt
        
        # Extract just the filename from the full path
        # This is important because the full path may contain unnecessary information
        # Example: /home/user/documents/course_notes.txt → course_notes.txt
        
        # معالجة المسارات بنظام Unix/Linux/Mac (استخدام /)
        # Handle Unix/Linux/Mac paths (using /)
        if '/' in source:
            # split('/') يقسم المسار إلى أجزاء
            # [-1] يأخذ آخر جزء (اسم الملف)
            # split('/') splits path into parts
            # [-1] takes the last part (filename)
            source = source.split('/')[-1]
        # معالجة المسارات بنظام Windows (استخدام \)
        # Handle Windows paths (using \)
        if '\\' in source:
            # split('\\') يقسم المسار إلى أجزاء
            # [-1] يأخذ آخر جزء (اسم الملف)
            # split('\\') splits path into parts
            # [-1] takes the last part (filename)
            source = source.split('\\')[-1]
        
        # بناء النص المنسق لكل مستند
        # يتضمن: رقم المستند، المصدر، رقم الصفحة، المحتوى، وخط فاصل
        # Build formatted text for each document
        # Includes: document number, source, page number, content, and separator
        formatted_parts.append(
            f"[Document {i}]\n"  # رقم المستند - Document number
            f"Source: {source}\n"  # المصدر - Source
            f"Page: {page}\n"  # الصفحة - Page
            f"Content:\n{doc.page_content}\n"  # المحتوى الفعلي - Actual content
            f"{'='*50}"  # خط فاصل بصيغة 50 علامة = - Separator line with 50 = signs
        )
    
    # دمج جميع الأجزاء مع سطرين فارغين (newlines) بين كل مستند
    # هذا يجعل النص أكثر قابلية للقراءة
    # Join all parts with two newlines between each document
    # This makes the text more readable
    return "\n\n".join(formatted_parts)


def pretty_print_docs(docs: List[Document]) -> None:
    """
    Print retrieved documents in a human-readable format for debugging.
    
    تقوم هذه الدالة بطباعة المستندات المسترجعة بتنسيق جميل وواضح.
    مفيدة جداً عند التصحيح (debugging) لفهم أي مستندات تم استرجاعها
    ولماذا تم اختيارها.
    
    This function prints retrieved documents in a beautiful and clear format.
    Very useful for debugging to understand which documents were retrieved
    and why they were selected.
    
    المخرجات تتضمن:
    - عنوان القسم
    - لكل مستند: رقمه، المصدر، الصفحة، ومعاينة من المحتوى (أول 200 حرف)
    - خط فاصل بين المستندات
    
    Output includes:
    - Section header
    - For each document: number, source, page, and content preview (first 200 chars)
    - Separator lines between documents
    
    Args:
        docs: List of retrieved Document objects (قائمة المستندات المسترجعة)
    """
    # طباعة رأس القسم مع تنسيق جميل
    # استخدام "=" لتشكيل خط فاصل بصري
    # Print section header with beautiful formatting
    # Using "=" to form visual separator line
    print("\n" + "="*60)  # سطر فارغ + 60 علامة = - Empty line + 60 = signs
    print("📚 RETRIEVED DOCUMENTS")  # عنوان القسم - Section title
    print("="*60)  # خط فاصل - Separator line
    
    # تكرار على كل مستند لعرضه
    # enumerate(docs, 1) يعطينا الفهرس (يبدأ من 1) والمستند
    # Iterate over each document to display it
    # enumerate(docs, 1) gives us index (starting from 1) and document
    for i, doc in enumerate(docs, 1):
        # الحصول على مصدر المستند من البيانات الوصفية
        # إذا لم يكن موجوداً، نستخدم 'Unknown'
        # Get document source from metadata
        # If not found, use 'Unknown'
        source = doc.metadata.get('source', 'Unknown')
        # الحصول على رقم الصفحة من البيانات الوصفية
        # إذا لم يكن موجوداً، نستخدم 'N/A'
        # Get page number from metadata
        # If not found, use 'N/A'
        page = doc.metadata.get('page', 'N/A')
        
        # معالجة المسارات: استخراج اسم الملف فقط
        # Handle paths: extract filename only
        
        # معالجة المسارات بنظام Unix/Linux/Mac
        # Handle Unix/Linux/Mac paths
        if '/' in source:
            source = source.split('/')[-1]  # آخر جزء من المسار - Last part of path
        # معالجة المسارات بنظام Windows
        # Handle Windows paths
        if '\\' in source:
            source = source.split('\\')[-1]  # آخر جزء من المسار - Last part of path
        
        # طباعة معلومات المستند بتنسيق منظم
        # Print document information in organized format
        print(f"\n📄 Document {i}:")  # رقم المستند - Document number
        print(f"   Source: {source}")  # المصدر - Source
        print(f"   Page: {page}")  # الصفحة - Page
        
        # طباعة معاينة المحتوى (أول 200 حرف فقط)
        # هذا مفيد لأن المحتوى الكامل قد يكون طويلاً جداً
        # Print content preview (first 200 characters only)
        # This is useful because full content might be very long
        # doc.page_content[:200] يأخذ أول 200 حرف من المحتوى
        # doc.page_content[:200] takes first 200 characters of content
        print(f"   Content Preview: {doc.page_content[:200]}...")
        print("-"*40)  # خط فاصل قصير بين المستندات - Short separator line between documents
    
    # طباعة نهاية القسم
    # Print section footer
    print("="*60 + "\n")  # خط فاصل + سطر فارغ - Separator line + empty line


def format_answer_with_citations(answer: str, docs: List[Document]) -> str:
    """
    Format the final answer with proper citations.
    
    تقوم هذه الدالة بإضافة قسم الاستشهادات (Citations) إلى الإجابة النهائية.
    هذا مهم جداً لإظهار مصادر المعلومات للطالب وزيادة مصداقية الإجابة.
    
    This function adds a citations section to the final answer.
    This is very important to show information sources to students and increase answer credibility.
    
    المخرجات تكون على الشكل التالي:
    [الإجابة من النموذج]
    
    📖 **Sources Used:**
    • filename1.pdf (Page: 5)
    • filename2.txt (Page: 1)
    • filename3.pdf (Page: 10)
    
    Output format:
    [Answer from model]
    
    📖 **Sources Used:**
    • filename1.pdf (Page: 5)
    • filename2.txt (Page: 1)
    • filename3.pdf (Page: 10)
    
    ملاحظة: يتم تجنب تكرار المصادر (إذا ظهر نفس المستند/الصفحة مرتين، يظهر مرة واحدة فقط)
    
    Note: Duplicate sources are avoided (if same document/page appears twice, shown only once)
    
    Args:
        answer: The generated answer from the LLM (الإجابة المولدة من النموذج)
        docs: List of source documents used (قائمة المستندات المصدر المستخدمة)
        
    Returns:
        Answer with formatted citations section
        (الإجابة مع قسم الاستشهادات المنسق)
    """
    # بناء قسم الاستشهادات
    # سنقوم بجمع جميع الاستشهادات الفريدة في قائمة
    # Build citations section
    # We'll collect all unique citations in a list
    citations = []
    
    # مجموعة (set) لتتبع المصادر التي تم إضافتها بالفعل
    # هذا مهم لتجنب تكرار نفس المصدر/الصفحة عدة مرات
    # Set to track sources already added
    # This is important to avoid repeating the same source/page multiple times
    # Set بدلاً من List لأن التحقق من العضوية في Set أسرع (O(1) بدلاً من O(n))
    # Set instead of List because membership check is faster (O(1) vs O(n))
    seen_sources = set()
    
    # تكرار على كل مستند لاستخراج المعلومات اللازمة للاستشهاد
    # Iterate over each document to extract citation information
    for doc in docs:
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
        
        # إنشاء مفتاح فريد للاستشهاد باستخدام المصدر والصفحة
        # هذا المفتاح يستخدم للتحقق من عدم التكرار
        # Create unique citation key using source and page
        # This key is used to check for duplicates
        citation_key = f"{source}:{page}"  # مثال: "course_notes.pdf:5" - Example: "course_notes.pdf:5"
        
        # التحقق من عدم تكرار المصدر
        # إذا لم يكن هذا المصدر موجوداً في مجموعة المصادر التي تم رؤيتها
        # Check if source is not duplicated
        # If this source is not in the set of seen sources
        if citation_key not in seen_sources:
            # إضافة المفتاح إلى المجموعة لتتبع أنه تم إضافته
            # Add key to set to track that it's been added
            seen_sources.add(citation_key)
            # إضافة الاستشهاد إلى القائمة بصيغة منسقة
            # Add citation to list in formatted style
            # "•" هو رمز نقطة bullet point لجعل القائمة أكثر جمالاً
            # "•" is a bullet point symbol to make the list more beautiful
            citations.append(f"• {source} (Page: {page})")
    
    # دمج الإجابة مع الاستشهادات في تنسيق نهائي منسق
    # Combine answer with citations in final formatted style
    # chr(10) هو رمز السطر الجديد (newline) - chr(10) is newline character
    # join(citations) يدمج جميع الاستشهادات مع سطر جديد بين كل واحد
    # join(citations) joins all citations with newline between each
    formatted_output = f"""
{answer}

📖 **Sources Used:**
{chr(10).join(citations)}
"""
    return formatted_output


def check_pii(text: str) -> bool:
    """
    Check if text contains PII (Personally Identifiable Information).
    
    تقوم هذه الدالة بالتحقق من وجود معلومات شخصية في النص مثل:
    - عناوين البريد الإلكتروني (example@domain.com)
    - أرقام الهواتف (123-456-7890)
    - أرقام الهوية أو أرقام الطلاب (8-12 رقم)
    
    This function checks for personally identifiable information in text such as:
    - Email addresses (example@domain.com)
    - Phone numbers (123-456-7890)
    - Student IDs or identification numbers (8-12 digits)
    
    هذه الدالة مهمة لحماية خصوصية المستخدمين ومنع تسريب البيانات الشخصية.
    
    This function is important for protecting user privacy and preventing data leakage.
    
    مثال / Example:
    >>> check_pii("My email is john@example.com")
    True
    >>> check_pii("What is machine learning?")
    False
    
    Args:
        text: Input text to check (النص المراد فحصه)
        
    Returns:
        True if PII is detected, False otherwise
        (True إذا تم اكتشاف معلومات شخصية، False خلاف ذلك)
    """
    # استيراد أنماط اكتشاف المعلومات الشخصية من ملف prompts.py
    # الأنماط (Patterns) هي تعبيرات منتظمة (regex) تحدد شكل المعلومات الشخصية
    # Import PII detection patterns from prompts.py
    # Patterns are regular expressions (regex) that define the shape of PII
    from .prompts import PII_PATTERNS
    
    # التحقق من كل نمط في النص
    # نستخدم حلقة for للبحث عن كل نمط من الأنماط المعرفة
    # Check each pattern in the text
    # We use a for loop to search for each defined pattern
    for pattern in PII_PATTERNS:
        # البحث عن النمط في النص
        # re.search() يبحث عن أول تطابق للنمط في النص
        # re.IGNORECASE يجعل البحث غير حساس لحالة الأحرف (a = A)
        # Search for pattern in text
        # re.search() searches for the first match of the pattern in text
        # re.IGNORECASE makes search case-insensitive (a = A)
        if re.search(pattern, text, re.IGNORECASE):
            # إذا تم العثور على تطابق، النص يحتوي على معلومات شخصية
            # If a match is found, text contains PII
            return True
    
    # إذا لم يتم العثور على أي تطابق، النص لا يحتوي على معلومات شخصية
    # If no match found, text does not contain PII
    return False


def check_cheating_attempt(text: str) -> bool:
    """
    Check if the query is an attempt to get homework/exam answers.
    
    تقوم هذه الدالة بالتحقق من محاولات الطلاب الحصول على إجابات مباشرة
    للواجبات المنزلية أو الاختبارات. إذا تم اكتشاف محاولة غش، النظام
    سيتحول إلى وضع التوجيه (Tutoring Mode) بدلاً من إعطاء الإجابات مباشرة.
    
    This function checks if students are attempting to get direct answers
    for homework or exams. If a cheating attempt is detected, the system
    switches to Tutoring Mode instead of giving direct answers.
    
    الكلمات المفتاحية التي يتم البحث عنها تشمل:
    - "solve my assignment" (حل واجبي)
    - "give me exam answers" (أعطني إجابات الاختبار)
    - "do my homework" (قم بواجبي)
    - وغيرها (انظر prompts.py للحصول على القائمة الكاملة)
    
    Keywords searched for include:
    - "solve my assignment"
    - "give me exam answers"
    - "do my homework"
    - and more (see prompts.py for full list)
    
    مثال / Example:
    >>> check_cheating_attempt("Can you solve my assignment?")
    True
    >>> check_cheating_attempt("What is machine learning?")
    False
    
    Args:
        text: Input query to check (الاستعلام المراد فحصه)
        
    Returns:
        True if cheating attempt detected, False otherwise
        (True إذا تم اكتشاف محاولة غش، False خلاف ذلك)
    """
    # استيراد الكلمات المفتاحية التي تشير لمحاولة الغش من ملف prompts.py
    # هذه الكلمات المفتاحية محددة مسبقاً لتحديد أنواع مختلفة من طلبات الغش
    # Import keywords that indicate cheating attempts from prompts.py
    # These keywords are predefined to identify different types of cheating requests
    from .prompts import CHEATING_KEYWORDS
    
    # تحويل النص إلى أحرف صغيرة (lowercase) للمقارنة
    # هذا مهم لأن البحث في Python حساس لحالة الأحرف
    # مثال: "Homework" ≠ "homework" ولكن "Homework".lower() = "homework"
    # Convert text to lowercase for comparison
    # This is important because Python's search is case-sensitive
    # Example: "Homework" ≠ "homework" but "Homework".lower() = "homework"
    text_lower = text.lower()
    
    # التحقق من وجود أي كلمة مفتاحية في النص
    # نستخدم حلقة for للبحث عن كل كلمة مفتاحية في النص
    # Check if any keyword exists in the text
    # We use a for loop to search for each keyword in the text
    for keyword in CHEATING_KEYWORDS:
        # استخدام in للتحقق من وجود الكلمة المفتاحية في النص
        # in يبحث عن السلسلة الفرعية (substring) داخل السلسلة
        # Use 'in' to check if keyword exists in text
        # 'in' searches for substring within string
        if keyword in text_lower:
            # إذا تم العثور على كلمة مفتاحية، تم اكتشاف محاولة غش
            # If keyword found, cheating attempt detected
            return True
    
    # إذا لم يتم العثور على أي كلمة مفتاحية، لا توجد محاولة غش
    # If no keyword found, no cheating attempt
    return False


def is_course_related(text: str, course_keywords: List[str] = None) -> bool:
    """
    Check if the query is related to course content.
    
    تقوم هذه الدالة بالتحقق من صلة الاستعلام بمحتوى المقرر.
    إذا كان الاستعلام غير متعلق بالمقرر (مثل أسئلة عن الرياضيات أو التاريخ)，
    سيتم رفضه لحماية النظام من الإجابة على أسئلة خارج النطاق.
    
    This function checks if the query is related to course content.
    If the query is unrelated to the course (e.g., questions about math or history),
    it will be rejected to protect the system from answering out-of-scope questions.
    
    الكلمات المفتاحية الافتراضية تركز على مواضيع NLP/ML مثل:
    - مصطلحات التعلم الآلي (machine learning, deep learning)
    - الشبكات العصبية (neural networks, LSTM, RNN, CNN)
    - النماذج الحديثة (transformer, BERT, GPT)
    - مصطلحات أخرى متعلقة بالمقرر
    
    Default keywords focus on NLP/ML topics such as:
    - Machine learning terms (machine learning, deep learning)
    - Neural networks (neural networks, LSTM, RNN, CNN)
    - Modern models (transformer, BERT, GPT)
    - Other course-related terms
    
    مثال / Example:
    >>> is_course_related("What is machine learning?")
    True
    >>> is_course_related("What is the capital of France?")
    False
    
    Args:
        text: Input query (الاستعلام المراد فحصه)
        course_keywords: Optional list of course-related keywords
                        (قائمة اختيارية بكلمات مفتاحية متعلقة بالمقرر)
                        إذا لم يتم توفيرها، سيتم استخدام القائمة الافتراضية
        
    Returns:
        True if course-related, False otherwise
        (True إذا كان متعلقاً بالمقرر، False خلاف ذلك)
    """
    # إذا لم يتم توفير كلمات مفتاحية، استخدم القائمة الافتراضية
    # القائمة الافتراضية تحتوي على مصطلحات شائعة في مقررات NLP/ML
    # If no keywords provided, use default list
    # Default list contains common terms in NLP/ML courses
    if course_keywords is None:
        # الكلمات المفتاحية الافتراضية لدورة NLP/ML
        # تم تجميعها لتغطي المواضيع الرئيسية في المقرر
        # Default NLP/ML course keywords
        # Collected to cover main course topics
        course_keywords = [
            # مصطلحات التعلم الآلي العامة
            # General machine learning terms
            'nlp', 'natural language', 'machine learning', 'deep learning', 'neural',
            
            # الشبكات العصبية والبنيات
            # Neural networks and architectures
            'network', 'transformer', 'attention', 'lstm', 'rnn', 'cnn',
            
            # النماذج والأنظمة المعروفة
            # Known models and systems
            'bert', 'gpt', 'embedding', 'word2vec',
            
            # العمليات والمفاهيم الأساسية
            # Basic operations and concepts
            'classification', 'training', 'model', 'loss',
            'gradient', 'backpropagation', 'tokenization', 'encoder', 'decoder',
            
            # التقنيات والممارسات
            # Techniques and practices
            'fine-tuning', 'pretrained', 'regularization', 'overfitting', 'dropout'
        ]
    
    # تحويل النص إلى أحرف صغيرة للمقارنة
    # هذا يجعل البحث غير حساس لحالة الأحرف
    # Convert text to lowercase for comparison
    # This makes search case-insensitive
    text_lower = text.lower()
    
    # التحقق من وجود أي كلمة مفتاحية في النص
    # نستخدم حلقة for للبحث عن كل كلمة مفتاحية
    # Check if any keyword exists in the text
    # We use a for loop to search for each keyword
    for keyword in course_keywords:
        # إذا وجدت الكلمة المفتاحية في النص، الاستعلام متعلق بالمقرر
        # If keyword found in text, query is course-related
        if keyword in text_lower:
            return True
    
    # إذا لم يتم العثور على أي كلمة مفتاحية، الاستعلام غير متعلق بالمقرر
    # If no keyword found, query is not course-related
    return False
