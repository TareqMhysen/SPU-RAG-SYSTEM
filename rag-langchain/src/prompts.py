"""
Prompt templates with critical guardrails for the RAG system.
Implements: Anti-cheating, Out-of-scope rejection, and PII protection.

هذا الملف يحتوي على جميع القوالب (Templates) للرسائل الموجهة للنموذج.
كما يحتوي على الحمايات (Guardrails) الثلاثة الرئيسية:
1. Anti-Cheating: منع الغش وحل الواجبات
2. Out-of-Scope: رفض الأسئلة غير المتعلقة بالمقرر
3. PII Protection: حماية المعلومات الشخصية

This file contains all prompt templates for the language model.
It also contains the three main guardrails:
1. Anti-Cheating: Prevent cheating and homework solving
2. Out-of-Scope: Reject questions unrelated to course
3. PII Protection: Protect personally identifiable information

الملفات الموجودة هنا:
- SYSTEM_PROMPT: رسالة النظام الرئيسية التي تحدد سلوك النموذج
- RAG_PROMPT_TEMPLATE: قالب للاستعلامات RAG العادية
- PII_PATTERNS: الأنماط المستخدمة لاكتشاف المعلومات الشخصية
- CHEATING_KEYWORDS: الكلمات المفتاحية لاكتشاف محاولات الغش

Contents:
- SYSTEM_PROMPT: Main system message that defines model behavior
- RAG_PROMPT_TEMPLATE: Template for normal RAG queries
- PII_PATTERNS: Patterns used to detect personally identifiable information
- CHEATING_KEYWORDS: Keywords to detect cheating attempts
"""

# ==================== رسالة النظام الرئيسية ====================
# ==================== MAIN SYSTEM PROMPT ====================

# رسالة النظام مع جميع الحمايات
# هذه الرسالة تُعطى للنموذج في بداية كل محادثة لتحديد سلوكه
# System prompt with all guardrails
# This message is given to the model at the start of each conversation to define its behavior
SYSTEM_PROMPT = """You are an intelligent course assistant for a college NLP/Machine Learning course. 
Your role is to help students understand concepts, not to do their work for them.

=== CRITICAL GUARDRAILS ===

1. ANTI-CHEATING GUARDRAIL:
   If the student asks you to:
   - "Solve my assignment"
   - "Give me exam answers"
   - "Do my homework"
   - "Write my lab report"
   - Complete any graded work for them
   
   YOU MUST switch to TUTORING MODE:
   - Provide hints and guiding questions instead of direct answers
   - Explain the concepts needed to solve the problem
   - Break down the problem-solving approach
   - Never give the final solution directly
   - Say: "I can help you understand the concept, but I won't solve your assignment. Let me guide you..."

2. OUT-OF-SCOPE GUARDRAIL:
   If the question is NOT related to the course content (NLP, machine learning, transformers, BERT, neural networks, etc.):
   - Politely refuse to answer
   - Say: "I'm sorry, but this question is outside the scope of our NLP/ML course. I can only help with course-related topics."
   - Do NOT attempt to answer questions about other subjects, personal advice, etc.

3. PII PROTECTION GUARDRAIL:
   If the user's input contains personal identifiable information such as:
   - Email addresses (containing @)
   - Phone numbers (digits with dashes or spaces)
   - Student IDs
   - Full names with identification numbers
   
   YOU MUST respond with EXACTLY this message:
   "⚠️ WARNING: Please remove personal data (emails, phone numbers, IDs) from your message and resend your question."
   Do NOT process or store any PII.

=== RESPONSE GUIDELINES ===

When answering course-related questions:
1. Use ONLY the provided context to answer questions
2. If the context doesn't contain the answer, say: "I don't have enough information in the course materials to answer this question."
3. Always cite your sources with document name and page number when available
4. Be helpful, clear, and educational
5. Encourage learning and understanding

Context from course materials:
{context}

Remember: You are a tutor, not a homework solver. Help students LEARN, don't do their work."""


# ==================== قالب RAG ====================
# ==================== RAG TEMPLATE ====================

# قالب رسالة RAG
# هذا القالب يُستخدم عند توليد إجابات من المستندات المسترجعة
# {context} و {question} هما متغيرات سيتم استبدالها بالقيم الفعلية
# RAG prompt template
# This template is used when generating answers from retrieved documents
# {context} and {question} are variables that will be replaced with actual values
RAG_PROMPT_TEMPLATE = """Based on the following context from the course materials, answer the student's question.

Context:
{context}

Question: {question}

Instructions:
- Answer based ONLY on the provided context
- If the answer is not in the context, say "I don't have enough information in the course materials to answer this."
- Cite sources using [Source: filename, Page: X] format
- Be educational and help the student understand the concept

Answer:"""


# ==================== حماية المعلومات الشخصية (PII) ====================
# ==================== PERSONALLY IDENTIFIABLE INFORMATION (PII) PROTECTION ====================

# أنماط اكتشاف المعلومات الشخصية (PII)
# هذه أنماط تعبيرات منتظمة (Regular Expressions) لاكتشاف المعلومات الشخصية في النصوص
# PII detection patterns
# These are regular expressions (regex) to detect personally identifiable information in texts
PII_PATTERNS = [
    # النمط الأول: البريد الإلكتروني
    # يبحث عن: أحرف/أرقام/رموز + @ + اسم النطاق + . + نطاق المستوى الأعلى (2+ حرف)
    # Pattern 1: Email address
    # Looks for: letters/numbers/symbols + @ + domain name + . + top-level domain (2+ chars)
    # مثال: user@example.com, test.email@domain.co.uk
    # Example: user@example.com, test.email@domain.co.uk
    r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b',  # البريد الإلكتروني - Email
    
    # النمط الثاني: رقم الهاتف
    # يبحث عن: 3 أرقام + (-. أو مسافة أو لا شيء) + 3 أرقام + (-. أو مسافة أو لا شيء) + 4 أرقام
    # Pattern 2: Phone number
    # Looks for: 3 digits + (-. or space or nothing) + 3 digits + (-. or space or nothing) + 4 digits
    # مثال: 123-456-7890, 123.456.7890, 123 456 7890, 1234567890
    # Example: 123-456-7890, 123.456.7890, 123 456 7890, 1234567890
    r'\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b',  # رقم الهاتف - Phone number
    
    # النمط الثالث: رقم الهوية أو رقم الطالب
    # يبحث عن: 8-12 رقم متتالي
    # Pattern 3: Student ID or identification number
    # Looks for: 8-12 consecutive digits
    # مثال: 12345678, 987654321012
    # Example: 12345678, 987654321012
    r'\b\d{8,12}\b',  # رقم الطالب (8-12 رقم) - Student ID (8-12 digits)
]

# رسالة تحذير عند اكتشاف معلومات شخصية
# هذه الرسالة تُرسل للمستخدم عند اكتشاف معلومات شخصية في استعلامه
# Warning message when PII is detected
# This message is sent to the user when PII is detected in their query
PII_WARNING = "⚠️ WARNING: Please remove personal data (emails, phone numbers, IDs) from your message and resend your question."

# ==================== حماية من الغش ====================
# ==================== ANTI-CHEATING PROTECTION ====================

# الكلمات المفتاحية لاكتشاف محاولات الغش
# هذه كلمات وعبارات تشير إلى أن الطالب يطلب حل واجباته أو اختباراته
# عندما يتم اكتشاف إحدى هذه الكلمات، النظام يتحول إلى وضع التوجيه (Tutoring Mode)
# Cheating keywords to detect
# These are words and phrases that indicate the student is asking to solve their homework or exams
# When one of these keywords is detected, the system switches to Tutoring Mode
CHEATING_KEYWORDS = [
    "solve my assignment",      # حل واجبي - Solve my assignment
    "give me exam answers",     # أعطني إجابات الاختبار - Give me exam answers
    "do my homework",           # قم بواجبي - Do my homework
    "write my lab report",      # اكتب تقرير المختبر - Write my lab report
    "complete this for me",     # أكمل هذا من أجلي - Complete this for me
    "finish my assignment",     # أنهي واجبي - Finish my assignment
    "answer this exam question", # أجب على سؤال الاختبار هذا - Answer this exam question
    "write my essay",           # اكتب مقالي - Write my essay
]

# بادئة رسالة التوجيه عند اكتشاف محاولة غش
# عندما يتم اكتشاف محاولة غش، تُضاف هذه البادئة إلى بداية الاستجابة
# هذا يوضح للطالب أن النظام لن يحل الواجب مباشرة، بل سيوجهه
# Tutoring response prefix when cheating attempt detected
# When a cheating attempt is detected, this prefix is added to the start of the response
# This makes it clear to the student that the system won't solve the assignment directly, but will guide them
TUTORING_RESPONSE_PREFIX = """I can help you understand this concept, but I won't solve your assignment directly. 
Let me guide you through the learning process instead:

"""
