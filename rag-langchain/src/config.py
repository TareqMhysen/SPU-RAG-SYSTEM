"""
Configuration constants for the RAG system.
All paths and parameters are centralized here for easy modification.

هذا الملف يحتوي على جميع الإعدادات والتكوينات اللازمة لنظام RAG.
يتم تخزين جميع القيم الثابتة هنا لتسهيل التعديل والصيانة.

This file contains all the settings and configurations needed for the RAG system.
All constant values are stored here for easy modification and maintenance.

الملفات والمجلدات:
- BASE_DIR: المجلد الرئيسي للمشروع
- DATA_DIR: مجلد المستندات التي سيتم معالجتها (PDF, TXT, MD)
- DB_DIR: مجلد قاعدة البيانات المتجهة (ChromaDB)

Files and Directories:
- BASE_DIR: Project root directory
- DATA_DIR: Directory containing documents to process (PDF, TXT, MD)
- DB_DIR: Vector database directory (ChromaDB)

المعاملات القابلة للتعديل:
- CHUNK_SIZE: حجم كل قطعة نصية (أحرف) - كلما كان أكبر، كلما احتفظنا بسياق أكثر
- CHUNK_OVERLAP: التداخل بين القطع - يساعد في الحفاظ على السياق عند حدود القطع
- TOP_K: عدد المستندات المسترجعة لكل استعلام - كلما زاد العدد، كلما كان هناك معلومات أكثر
- EMBEDDING_MODEL: نموذج التضمين المستخدم لتحويل النصوص إلى متجهات
- LLM_MODEL: نموذج اللغة المستخدم لتوليد الإجابات

Tunable Parameters:
- CHUNK_SIZE: Size of each text chunk (characters) - larger = more context retained
- CHUNK_OVERLAP: Overlap between chunks - helps maintain context at chunk boundaries
- TOP_K: Number of documents retrieved per query - more = more information
- EMBEDDING_MODEL: Embedding model used to convert texts to vectors
- LLM_MODEL: Language model used to generate answers
"""

# استيراد المكتبات المطلوبة
# Import required libraries
import os
from pathlib import Path  # للتعامل مع المسارات بطريقة محمولة عبر أنظمة التشغيل - For cross-platform path handling

# ==================== إعدادات المسارات ====================
# ==================== PATH CONFIGURATION ====================

# المجلد الأساسي للمشروع (المجلد الجذر)
# يتم الحصول عليه تلقائياً من موقع هذا الملف
# Base directory (project root)
# Automatically obtained from this file's location
BASE_DIR = Path(__file__).parent.parent  # يرجع مستوى أعلى من مجلد src - Goes up one level from src folder

# مجلد البيانات: يحتوي على المستندات الأصلية (PDF, TXT, MD)
# يجب وضع جميع ملفات المقرر هنا قبل تشغيل ingest.py
# Data directory: Contains original documents (PDF, TXT, MD)
# All course files should be placed here before running ingest.py
DATA_DIR = BASE_DIR / "data"  # مثال: rag-langchain/data/ - Example: rag-langchain/data/

# مجلد قاعدة البيانات: يتم حفظ قاعدة البيانات المتجهة هنا
# يتم إنشاء هذا المجلد تلقائياً عند تشغيل ingest.py
# Database directory: Vector database is stored here
# This directory is created automatically when running ingest.py
DB_DIR = BASE_DIR / "db"  # مثال: rag-langchain/db/ - Example: rag-langchain/db/

# ==================== معاملات التقطيع ====================
# ==================== CHUNKING PARAMETERS ====================

# حجم كل قطعة نصية (بالأحرف)
# حجم أصغر = قطع أكثر = دقة أعلى في الاسترجاع ولكن سياق أقل
# حجم أكبر = قطع أقل = سياق أكثر ولكن دقة أقل في الاسترجاع
# القيمة الموصى بها: 500-2000 حرف
# Maximum characters per chunk
# Smaller size = more chunks = higher retrieval precision but less context
# Larger size = fewer chunks = more context but lower retrieval precision
# Recommended value: 500-2000 characters
CHUNK_SIZE = 1000  # الحد الأقصى للأحرف في كل قطعة - Maximum characters per chunk

# التداخل بين القطع (بالأحرف)
# هذا مهم للحفاظ على السياق عند حدود القطع
# على سبيل المثال: إذا كانت القطعة 1 تنتهي بكلمة "machine" والقطعة 2 تبدأ بـ "learning"
# فبدون تداخل قد نفقد سياق "machine learning"
# القيمة الموصى بها: 10-20% من CHUNK_SIZE
# Overlap between chunks (in characters)
# Important for maintaining context at chunk boundaries
# Example: If chunk 1 ends with "machine" and chunk 2 starts with "learning",
# without overlap we might lose the context of "machine learning"
# Recommended value: 10-20% of CHUNK_SIZE
CHUNK_OVERLAP = 200  # التداخل بين القطع - Overlap between chunks (20% of CHUNK_SIZE)

# ==================== معاملات الاسترجاع ====================
# ==================== RETRIEVAL PARAMETERS ====================

# عدد المستندات المسترجعة لكل استعلام
# كلما زاد العدد، كلما حصلنا على معلومات أكثر ولكن قد يكون بعضها غير ذي صلة
# كلما قل العدد، كلما كانت النتائج أكثر دقة ولكن قد نفقد معلومات مهمة
# القيمة الموصى بها: 3-5 مستندات
# Number of documents retrieved per query
# More = more information but potentially less relevant
# Fewer = more precise results but might miss important information
# Recommended value: 3-5 documents
TOP_K = 4  # عدد المستندات المسترجعة - Number of documents to retrieve

# ==================== إعدادات النماذج ====================
# ==================== MODEL CONFIGURATIONS ====================

# نموذج التضمين المستخدم لتحويل النصوص إلى متجهات
# التضمينات (Embeddings) هي تمثيلات رقمية للنصوص تسمح للكمبيوتر بفهم المعنى
# "text-embedding-3-small": سريع واقتصادي، جيد للاستخدامات العامة
# بدائل أخرى: "text-embedding-3-large" (أكثر دقة ولكن أبطأ وأغلى)
# Embedding model used to convert texts to vectors
# Embeddings are numerical representations of texts that allow computers to understand meaning
# "text-embedding-3-small": Fast and economical, good for general use
# Alternative: "text-embedding-3-large" (more accurate but slower and more expensive)
EMBEDDING_MODEL = "text-embedding-3-small"  # نموذج التضمين من OpenAI - OpenAI embedding model

# نموذج اللغة المستخدم لتوليد الإجابات
# "gpt-3.5-turbo": سريع واقتصادي، جيد للاستخدامات العامة
# "gpt-4o-mini": أحدث وأكثر ذكاءً، يوفر إجابات أفضل ولكن أبطأ قليلاً
# "gpt-4": الأفضل جودة ولكن الأبطأ والأغلى (غير موصى به إلا للاستخدامات المتقدمة)
# Language model used to generate answers
# "gpt-3.5-turbo": Fast and economical, good for general use
# "gpt-4o-mini": Latest and smarter, provides better answers but slightly slower
# "gpt-4": Best quality but slowest and most expensive (not recommended except for advanced use)
LLM_MODEL = "gpt-3.5-turbo"  # يمكن تغييره إلى "gpt-4o-mini" للحصول على جودة أفضل - Can be changed to "gpt-4o-mini" for better quality

# ==================== إنشاء المجلدات ====================
# ==================== CREATE DIRECTORIES ====================

# التأكد من وجود المجلدات وإنشاؤها إن لم تكن موجودة
# exist_ok=True يعني: إذا كان المجلد موجوداً، لا ترفع خطأ
# هذا يضمن أن المجلدات موجودة قبل أن نحاول الكتابة فيها
# Ensure directories exist
# exist_ok=True means: if directory exists, don't raise an error
# This ensures directories exist before we try to write to them
DATA_DIR.mkdir(exist_ok=True)  # إنشاء مجلد data إن لم يكن موجوداً - Create data directory if it doesn't exist
DB_DIR.mkdir(exist_ok=True)  # إنشاء مجلد db إن لم يكن موجوداً - Create db directory if it doesn't exist
