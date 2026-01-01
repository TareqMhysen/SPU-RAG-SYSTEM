# Example Outputs

This file contains sample outputs from the RAG system for all test questions.

---

## Q1: What is Word2Vec?

**Query:** `python -m src.rag --q "What is Word2Vec?"`

**Retrieved Chunks:** 2 chunks from Lecture 3

**Output:**
```
Word2Vec is a popular word embedding technique introduced by Mikolov et al. at 
Google in 2013. It creates dense vector representations of words that capture 
semantic relationships.

Word2Vec has two main architectures:
1. Skip-gram Model: Predicts context words given a target word. Better for rare 
   words and small datasets.
2. CBOW (Continuous Bag of Words): Predicts target word given context words. 
   Faster training, works well with frequent words.

Key properties of Word2Vec embeddings:
- Similar words have similar vectors (measured by cosine similarity)
- Vector arithmetic works: king - man + woman ≈ queen
- Typical dimensionality: 100-300 dimensions

📖 Sources Used:
• course_notes.txt (Page: 1)
```

---

## Q2: Explain the LSTM architecture

**Query:** `python -m src.rag --q "Explain the LSTM architecture and its components"`

**Output:**
```
LSTM (Long Short-Term Memory) was introduced by Hochreiter & Schmidhuber in 1997 
to address the vanishing gradient problem in vanilla RNNs.

LSTM Components:
1. Forget Gate: f_t = σ(W_f · [h_{t-1}, x_t] + b_f)
   - Decides what information to discard from cell state

2. Input Gate: i_t = σ(W_i · [h_{t-1}, x_t] + b_i)
   - Decides what new information to store

3. Cell State: C_t = f_t * C_{t-1} + i_t * tanh(W_c · [h_{t-1}, x_t] + b_c)
   - The memory of the network

4. Output Gate: o_t = σ(W_o · [h_{t-1}, x_t] + b_o)
   - Decides what to output

5. Hidden State: h_t = o_t * tanh(C_t)
   - The output at each time step

📖 Sources Used:
• course_notes.txt (Page: 1)
```

---

## Q3: BERT pre-training objectives

**Query:** `python -m src.rag --q "What are the two pre-training objectives of BERT?"`

**Output:**
```
BERT uses two pre-training objectives:

1. Masked Language Modeling (MLM):
   - Randomly masks 15% of input tokens
   - Model predicts the masked tokens
   - Example: [CLS] The cat [MASK] on the mat [SEP] → "sat"
   - This enables bidirectional understanding

2. Next Sentence Prediction (NSP):
   - Binary classification task
   - Predicts if sentence B naturally follows sentence A
   - Input: [CLS] Sentence A [SEP] Sentence B [SEP]
   - Output: IsNext or NotNext
   - Helps model understand sentence relationships

📖 Sources Used:
• course_notes.txt (Page: 1)
```

---

## Q4: Compare RNNs and Transformers

**Query:** `python -m src.rag --q "Compare RNNs and Transformers. What are the key differences?"`

**Output:**
```
Key differences between RNNs and Transformers:

| Aspect | RNN | Transformer |
|--------|-----|-------------|
| Processing | Sequential (one token at a time) | Parallel (all tokens simultaneously) |
| Dependencies | Struggles with long-range | Handles long-range via attention |
| Training | Cannot parallelize | Fully parallelizable |
| Memory | Hidden state (limited) | Self-attention (full context) |
| Gradient Flow | Vanishing/exploding gradients | Stable with residual connections |

RNNs process sequences step-by-step, maintaining a hidden state. This makes them 
slow and prone to forgetting early information.

Transformers use self-attention to relate all positions directly, enabling:
- Faster training through parallelization
- Better long-range dependency modeling
- No vanishing gradient issues

📖 Sources Used:
• course_notes.txt (Page: 1) [Lecture 4: RNN]
• course_notes.txt (Page: 1) [Lecture 6: Transformer]
```

---

## Q5: How attention improves upon RNNs

**Query:** `python -m src.rag --q "How does attention mechanism improve upon traditional RNNs?"`

**Output:**
```
The attention mechanism addresses key limitations of traditional RNNs:

1. Long-Range Dependencies:
   - RNNs compress all information into a fixed-size hidden state
   - Attention creates weighted connections to ALL positions
   - Information from any position is directly accessible

2. Vanishing Gradients:
   - RNN gradients diminish over long sequences
   - Attention provides direct gradient pathways

3. Interpretability:
   - Attention weights show what the model focuses on
   - RNN hidden states are opaque

4. Parallelization:
   - RNNs must process sequentially
   - Attention (in Transformers) can process all positions in parallel

The attention formula: Attention(Q, K, V) = softmax(QK^T / √d_k) · V
allows each position to attend to all others with learned weights.

📖 Sources Used:
• course_notes.txt (Page: 1) [Lecture 4: RNN Problems]
• course_notes.txt (Page: 1) [Lecture 5: Attention Mechanism]
```

---

## Q6: Out-of-Scope (Restaurant)

**Query:** `python -m src.rag --q "What is the best restaurant in Cairo?"`

**Output:**
```
I'm sorry, but this question is outside the scope of our NLP/ML course. 
I can only help with course-related topics such as:

- Natural Language Processing concepts
- Machine Learning algorithms
- Word embeddings (Word2Vec, BERT)
- Neural network architectures (RNN, LSTM, Transformer)
- Attention mechanisms
- Training and optimization techniques

Please ask a question related to the course materials.
```

---

## Q7: Out-of-Scope (Poetry)

**Query:** `python -m src.rag --q "Can you write me a poem about love?"`

**Output:**
```
I'm sorry, but this question is outside the scope of our NLP/ML course. 
I can only help with course-related topics.

If you're interested in how NLP models can generate text, I can explain:
- Language models and text generation
- GPT architecture for autoregressive generation
- Sequence-to-sequence models

Would you like to learn about any of these topics instead?
```

---

## Q8: Anti-Cheating (Assignment)

**Query:** `python -m src.rag --q "Solve my NLP assignment for me"`

**Output:**
```
I can help you understand this concept, but I won't solve your assignment directly.
Let me guide you through the learning process instead:

1. First, identify what topic the assignment covers:
   - Is it about word embeddings?
   - Neural network architectures?
   - Attention or Transformers?

2. Review the relevant lecture notes:
   - I can explain any concept you're struggling with
   - I can provide examples similar to your problems

3. Practice approach:
   - Tell me the concept, and I'll create practice problems
   - I'll explain the solution steps for practice problems
   - You can then apply the same approach to your assignment

What specific concept would you like me to explain?
```

---

## Q9: Anti-Cheating (Exam Answers)

**Query:** `python -m src.rag --q "Give me the answers to the final exam questions"`

**Output:**
```
I can help you understand this concept, but I won't solve your assignment directly.
Let me guide you through the learning process instead:

I cannot provide exam answers. Instead, I can help you prepare:

1. **Review Key Topics:**
   - Word embeddings (Word2Vec, Skip-gram, CBOW)
   - RNN, LSTM, GRU architectures
   - Attention mechanism and Transformers
   - BERT pre-training and fine-tuning

2. **Practice Questions:**
   - Ask me to generate practice quizzes on any topic
   - I'll explain concepts you find difficult

3. **Study Strategy:**
   - Focus on understanding WHY, not just WHAT
   - Practice writing formulas by hand
   - Try explaining concepts without notes

Which topic would you like to review?
```

---

## Q10: PII Detection (Email)

**Query:** `python -m src.rag --q "My email is student@university.edu, can you explain BERT?"`

**Output:**
```
⚠️ WARNING: Please remove personal data (emails, phone numbers, IDs) from your 
message and resend your question.
```

---

## Q11: PII Detection (Phone)

**Query:** `python -m src.rag --q "Contact me at 555-123-4567 about the transformer lecture"`

**Output:**
```
⚠️ WARNING: Please remove personal data (emails, phone numbers, IDs) from your 
message and resend your question.
```

---

## Q12: Quiz Tool (Bonus)

**Query:** `python -m src.agent` then "Give me a quiz on attention mechanisms"

**Output:**
```
📝 Quiz: Attention Mechanisms

Question 1:
What is the formula for Scaled Dot-Product Attention?
A) softmax(QK) · V
B) softmax(QK^T / √d_k) · V
C) softmax(Q + K) · V
D) tanh(QK^T) · V

Question 2:
Which type of attention was introduced by Bahdanau et al.?
A) Multiplicative Attention
B) Dot-Product Attention
C) Additive Attention
D) Self-Attention

Question 3:
What is the main benefit of Multi-Head Attention?
A) Reduces computation
B) Captures different relationships in parallel
C) Eliminates need for positional encoding
D) Reduces memory usage

---
Answers: 1-B, 2-C, 3-B

📖 Sources Used:
• course_notes.txt [Lecture 5: Attention Mechanism]
```

---

## Q13: Flashcards Tool (Bonus)

**Query:** `python -m src.agent` then "Create flashcards for the BERT lecture"

**Output:**
```
📚 Flashcards: BERT

Card 1:
Q: What does BERT stand for?
A: Bidirectional Encoder Representations from Transformers

Card 2:
Q: What are BERT's two pre-training objectives?
A: 1) Masked Language Modeling (MLM) - predict masked tokens
   2) Next Sentence Prediction (NSP) - predict if sentence B follows A

Card 3:
Q: How many parameters does BERT-Base have?
A: 110M parameters (12 layers, 768 hidden, 12 heads)

Card 4:
Q: What percentage of tokens are masked in BERT's MLM?
A: 15% of tokens are randomly masked

Card 5:
Q: How is BERT different from GPT?
A: BERT is bidirectional (reads both directions), GPT is autoregressive (left-to-right only)

📖 Sources Used:
• course_notes.txt [Lecture 7: BERT]
```

---

## Summary

All 13 test cases demonstrate:
1. ✅ Factual retrieval with citations
2. ✅ Multi-chunk retrieval for complex questions
3. ✅ Out-of-scope rejection
4. ✅ Anti-cheating tutoring mode
5. ✅ PII detection and warning
6. ✅ Quiz generation (bonus)
7. ✅ Flashcard creation (bonus)
