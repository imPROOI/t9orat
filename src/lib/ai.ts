import { GoogleGenAI, Type, Schema } from '@google/genai';
import { GraphData, AppConfig } from '../types';

const graphSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    nodes: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING, description: "Unique short alphanumeric ID (e.g. n1)" },
          type: { type: Type.STRING, enum: ["input", "idea", "recommendation"] },
          label: { type: Type.STRING, description: "Short title in Arabic (max 3 words)" },
          description: { type: Type.STRING, description: "Detailed explanation of the concept or recommendation in Arabic." },
          ideaContext: { type: Type.STRING, description: "للأفكار (idea) فقط: هل تم بحث هذه الفكرة أو تطبيقها من قبل؟ اذكر مثالاً حقيقياً أو شركة أو بحث. إذا كانت نظرية اذكر ذلك." },
          recommendationType: { type: Type.STRING, description: "للتوصيات (recommendation) فقط: نوع المصدر بالتحديد؟ (مثال: مقطع يوتيوب، كتاب، موقع إنترنت، بودكاست، فيلم)." },
          searchQueries: {
            type: Type.ARRAY,
            description: "2-3 روابط بحث مقترحة ومحددة جداً للمستخدم ليتوسع في سياق هذا الموضوع بشكل فوري وموثوق.",
            items: {
              type: Type.OBJECT,
              properties: {
                label: { type: Type.STRING, description: "عنوان زر البحث (مثال: 'شاهد شروحات وتطبيقات'، 'ابحث عن بحوث علمية'، 'كتب مراجع')" },
                query: { type: Type.STRING, description: "الكلمات المفتاحية المحددة للبحث باللغة الإنجليزية أو العربية للحصول على أفضل نتائج" },
                site: { type: Type.STRING, enum: ["google", "scholar", "youtube", "wikipedia"], description: "الموقع المفضل للبحث" }
              },
              required: ["label", "query", "site"]
            }
          }
        },
        required: ["id", "type", "label", "description"]
      }
    },
    edges: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          source: { type: Type.STRING, description: "ID of the source node" },
          target: { type: Type.STRING, description: "ID of the target node" },
          explanation: { type: Type.STRING, description: "Detailed rationale in Arabic of why these two nodes are connected." }
        },
        required: ["id", "source", "target", "explanation"]
      }
    },
    suggestedTopics: {
      type: Type.ARRAY,
      description: "3 اقتراحات لمواضيع مثيرة جداً وغير تقليدية لاستكشافها وتوسيع الشبكة الحالية بناءً عليها",
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING, description: "عنوان الموضوع المثير (كلمة إلى 3 كلمات)" },
          description: { type: Type.STRING, description: "وصف موجز يوضح لماذا هذا الموضوع مثير للاهتمام وكيف يرتبط ببحث المستخدم" }
        },
        required: ["title", "description"]
      }
    },
    contrarianTopics: {
      type: Type.ARRAY,
      description: "اقتراحين لمواضيع مضادة ومعاكسة تماماً لاهتمام المستخدم تهدف لاستفزازه فكرياً وجذبه لاكتشاف العكس",
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING, description: "عنوان الموضوع المضاد (كلمة إلى 3 كلمات)" },
          description: { type: Type.STRING, description: "وصف مستفز فكرياً يوضح التناقض الجذاب وكيف أن العكس قد يكون صحيحاً أو مثيراً للانتباه" }
        },
        required: ["title", "description"]
      }
    }
  },
  required: ["nodes", "edges"]
};

interface CallAIOptions {
  config: AppConfig;
  prompt: string;
  systemPrompt?: string;
  temperature?: number;
  jsonMode?: boolean;
  geminiSchema?: Schema;
}

/**
 * Checks if an error qualifies for an automatic retry (rate limits or transient network errors).
 */
function isRetryableError(error: unknown): boolean {
  if (!error) return false;
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    const status = (error as { status?: number }).status;
    if (status === 429 || status === 502 || status === 503 || status === 504) {
      return true;
    }
    if (
      msg.includes('429') ||
      msg.includes('resource_exhausted') ||
      msg.includes('quota') ||
      msg.includes('rate limit') ||
      msg.includes('too many requests') ||
      msg.includes('503') ||
      msg.includes('failed to fetch') ||
      msg.includes('network error') ||
      msg.includes('timeout')
    ) {
      return true;
    }
  }
  return false;
}

/**
 * Cleans potential markdown wrappers from JSON model outputs.
 */
function cleanJsonOutput(raw: string): string {
  return raw
    .replace(/^\s*```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/i, '')
    .trim();
}

/**
 * Executes a function with exponential backoff retry on transient errors.
 */
async function callWithRetry<T>(fn: () => Promise<T>, maxRetries: number = 2): Promise<T> {
  let attempt = 0;
  while (true) {
    try {
      return await fn();
    } catch (error) {
      if (attempt < maxRetries && isRetryableError(error)) {
        attempt++;
        const delay = Math.pow(2, attempt - 1) * 1000 + Math.floor(Math.random() * 250);
        console.warn(`[AI Service] Transient error encountered (attempt ${attempt}/${maxRetries}), retrying in ${delay}ms...`, error);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
}

/**
 * Low-level call to Gemini SDK
 */
async function executeGeminiCall(options: CallAIOptions): Promise<string> {
  const { config, prompt, temperature, jsonMode, geminiSchema } = options;
  const ai = new GoogleGenAI({ apiKey: config.apiKey });

  const genConfig: Record<string, unknown> = {
    temperature: temperature ?? 0.8,
  };

  if (jsonMode) {
    genConfig.responseMimeType = 'application/json';
    if (geminiSchema) {
      genConfig.responseSchema = geminiSchema;
    }
  }

  const response = await ai.models.generateContent({
    model: config.model,
    contents: prompt,
    config: genConfig,
  });

  if (!response.text) {
    throw new Error('No content returned from Gemini API.');
  }

  return response.text;
}

/**
 * Low-level call to OpenAI-compatible endpoints (OpenAI, Groq, Custom)
 */
async function executeOpenAICall(options: CallAIOptions): Promise<string> {
  const { config, prompt, systemPrompt, temperature, jsonMode } = options;

  let baseUrl = 'https://api.openai.com/v1/chat/completions';
  if (config.provider === 'groq') {
    baseUrl = 'https://api.groq.com/openai/v1/chat/completions';
  } else if (config.provider === 'custom') {
    baseUrl = config.customBaseUrl || baseUrl;
    if (!baseUrl.endsWith('/chat/completions')) {
      baseUrl = baseUrl.replace(/\/$/, '') + '/chat/completions';
    }
  }

  const messages: Array<{ role: string; content: string }> = [];
  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt });
  }
  messages.push({ role: 'user', content: prompt });

  const payload: Record<string, unknown> = {
    model: config.model,
    messages,
    temperature: temperature ?? 0.8,
  };

  if (jsonMode && (config.provider === 'openai' || config.provider === 'groq')) {
    payload.response_format = { type: 'json_object' };
  }

  const resp = await fetch(baseUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify(payload),
  });

  if (!resp.ok) {
    const errText = await resp.text();
    const err = new Error(`API Error (${config.provider}): ${resp.status} - ${errText}`);
    (err as { status?: number }).status = resp.status;
    throw err;
  }

  const data = await resp.json();
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error(`No content generated from ${config.provider} API.`);
  }

  return content;
}

/**
 * Unified private helper to handle all AI provider calls with automatic retry and rate-limit backoff.
 */
async function callAIProvider(options: CallAIOptions): Promise<string> {
  return callWithRetry(async () => {
    if (options.config.provider === 'gemini') {
      return executeGeminiCall(options);
    } else {
      return executeOpenAICall(options);
    }
  }, 2);
}

/**
 * Builds the fallback JSON prompt schema text for non-Gemini providers.
 */
function getJsonSchemaPromptSnippet(): string {
  return `\n\nIMPORTANT: You MUST return ONLY valid JSON matching this schema exactly. No \`\`\`json wrappers.
{
  "nodes": [{"id": "...", "type": "input|idea|recommendation", "label": "...", "description": "...", "ideaContext": "...", "recommendationType": "...", "searchQueries": [{"label": "...", "query": "...", "site": "google|scholar|youtube|wikipedia"}]}],
  "edges": [{"id": "...", "source": "...", "target": "...", "explanation": "..."}],
  "suggestedTopics": [{"title": "...", "description": "..."}],
  "contrarianTopics": [{"title": "...", "description": "..."}]
}`;
}

export async function generateGraphData(
  keywords: string[], 
  config: AppConfig,
  existingNodes: {id: string, label: string}[] = []
): Promise<GraphData> {
  const existingContext = existingNodes.length > 0 
    ? `\nالعقد الموجودة مسبقاً في الشبكة (يمكنك ربط العقد الجديدة بها باستخدام الـ id الخاص بها):
${existingNodes.map(n => `- ID: ${n.id}, Label: ${n.label}`).join("\n")}`
    : '';

  const isFusion = keywords.length > 1;
  const fusionInstruction = isFusion 
    ? `\n\n**ملاحظة هامة جداً (Idea Fusion)**: لقد أدخل المستخدم أفكاراً/مجالات متعددة متباعدة (${keywords.join(" و ")}). يجب أن تركز بشكل أساسي على خلق تزاوج ودمج (Fusion) بين هذه المجالات لابتكار شيء هجين غير متوقع يجمع بينها.`
    : '';

  let prompt = `
أنت محرك بصري مدعوم بالذكاء الاصطناعي متخصص في التفكير الابتكاري التراكمي (Cross-industry innovation).
مهمتك هي أخذ مجموعة من الاهتمامات أو الكلمات المفتاحية الجديدة وإنشاء/توسيع شبكة عصبية من الأفكار المبتكرة والتوصيات.${fusionInstruction}

الكلمات المفتاحية الجديدة: [${keywords.join("، ")}]
${existingContext}

متطلبات المخرجات:
1. العقد (Nodes):
   - نوع 'input': عقد تمثل الكلمات المفتاحية الجديدة التي تم إدخالها.
   - نوع 'idea': أفكار، حلول، أو منتجات مبتكرة تنتج عن دمج هذه المجالات. **يجب** أن تعبئ حقل (ideaContext) لتكشف ما إذا كانت هذه الفكرة موجودة مسبقاً (اذكر اسم الشركة/المشروع/البحث) أم أنها جديدة كلياً ونظرية وتستحق البحث.
   - نوع 'recommendation': توصيات لمصادر حقيقية. **يجب** أن تضع نوع هذا المصدر في حقل (recommendationType) لتوضيح ما هو بالضبط (مثلاً: "مقطع يوتيوب قناة كذا"، "كتاب للمؤلف كذا"، "موقع إنترنت"). في حقل (description) اشرح بوضوح ما هو الهدف من الاطلاع على هذا المصدر.
   - **هام جداً - إثراء المحتوى (searchQueries)**: لكل عقدة (Node) يتم توليدها، **يجب** إدراج حقل \`searchQueries\` يحتوي على 2 إلى 3 مواضيع بحث مقترحة ومحددة جداً للمستخدم لكي يتوسع في سياق هذا الموضوع بشكل فوري وموثوق. يجب تحديد العنوان المناسب للزر باللغة العربية (مثال: 'البحث عن أوراق علمية في Google Scholar'، 'كتب مراجع مقترحة'، 'تطبيقات عملية في YouTube')، وتحديد الكلمات المفتاحية المستهدفة (\`query\`) بالإنجليزية أو العربية لضمان نتائج عالية الجودة، وتحديد الموقع المفضل للبحث (\`site\` من نوع: \`google\` أو \`scholar\` أو \`youtube\` أو \`wikipedia\`).
   - قم بتوليد ما بين 8 إلى 12 عقدة جديدة. مهم: أعط كل عقدة ID فريد جداً يبدأ بكلمة node_ متبوعة برقم عشوائي طويل (مثلاً node_84729) لتجنب التكرار.

2. الروابط (Edges) والترابط الهيكلي:
   - الترابط الشبكي المدروس (Topological Linkage): يجب أن تكون الشبكة متماسكة جداً. 
     * المدخلات (input) يجب أن تتقاطع وترتبط لإنتاج الأفكار (idea).
     * الأفكار (idea) يجب أن تكون الجسر المنطقي بين المدخلات المختلفة لاختراع شيء جديد.
     * التوصيات (recommendation) يجب أن ترتبط بشكل مباشر بالأفكار (لتمكين تطبيقها) أو بالمدخلات (لتأسيس فهمها). إياك أن تترك عقدة معزولة.
   - قم بربط العقد الجديدة ببعضها بناءً على هذه الهيكلة المنطقية المتينة.
   ${existingNodes.length > 0 ? "- **هام جداً**: قم بإنشاء روابط منطقية وعميقة بين العقد الجديدة وبعض العقد السابقة (باستخدام الـ id الخاص بالعقدة المذكورة أعلاه) لخلق استمرارية في الشبكة العصبية." : ""}
   - في كل رابط يجب توفير شرح (explanation) يوضح بوضوح وشفافية \"لماذا ربطنا العقدة أ مع العقدة ب؟ كيف يخدمان بعضهما؟\" (Reasoning Transparency).

3. اقتراحات لمواضيع مثيرة (suggestedTopics):
   - اقترح 3 مواضيع بحثية مثيرة وغير تقليدية يمكن للمستخدم التوسع بها لاحقاً وتتعلق بالشبكة التي قمت للتو بتوليدها.
   - في حالة النقر عليها لاحقاً ستكون مدخلاً لاستخراج أفكار وتوصيات مستندة إلى هذه الشبكة.

4. مواضيع مضادة للتفكير المعاكس (contrarianTopics):
   - اقترح موضوعين \"مضادين\" (Contrarian Topics) يعاكسان تماماً الاهتمام الأساسي للمستخدم المدخل حالياً، بهدف تحدي المسلمات الفكرية.
   - الهدف من هذه المواضيع هو الفضول وكسر فقاعة الانحياز التأكيدي (Confirmation Bias).
   - يجب أن يكون العنوان جذاباً والفكرة مستفزة فكرياً ومقنعة في نفس الوقت للبحث فيها.

الرجاء التركيز على أن تكون الأفكار مبتكرة وغير تقليدية ولها سياق واضح، وأن تكون التوصيات تحتوي على مصادر حقيقية دقيقة مع توضيح الفائدة منها. كل النصوص في البيانات يجب أن تكون باللغة العربية.
  `;

  if (config.provider !== 'gemini') {
    prompt += getJsonSchemaPromptSnippet();
  }

  const rawText = await callAIProvider({
    config,
    prompt,
    systemPrompt: 'You are a visual engine JSON API. Return exactly a valid JSON object matching the requested schema. Output raw JSON without markdown codeblocks.',
    temperature: 0.9,
    jsonMode: true,
    geminiSchema: graphSchema,
  });

  const cleaned = cleanJsonOutput(rawText);
  return JSON.parse(cleaned) as GraphData;
}

export async function expandNode(
  nodeId: string,
  nodeLabel: string,
  config: AppConfig,
  existingNodes: {id: string, label: string}[] = []
): Promise<GraphData> {
  const existingContext = existingNodes.length > 0 
    ? `\nالعقد الموجودة مسبقاً في الشبكة (يمكنك ربط العقد الجديدة بها باستخدام الـ id الخاص بها):\n${existingNodes.map(n => `- ID: ${n.id}, Label: ${n.label}`).join("\n")}`
    : '';

  let prompt = `
أنت محرك بصري مدعوم بالذكاء الاصطناعي متخصص في التعمق واستخراج الأفكار التراكمية.
طلب المستخدم التعمق في الفكرة التالية وتوليد أفكار وتوصيات جديدة تتفرع منها مباشرة:

الفكرة المركزية المستهدفة (التي يريد المستخدم التعمق فيها): [${nodeLabel}] (ID: ${nodeId})
${existingContext}

متطلبات المخرجات:
1. العقد (Nodes):
   - قم بتوليد ما بين 4 إلى 7 عقد جديدة ترتبط ارتباطاً وثيقاً بالفكرة المركزية المذكورة أعلاه.
   - نوع 'idea': أفكار متقدمة أو متفرعة من الفكرة المركزية. يجب تعبئة (ideaContext).
   - نوع 'recommendation': مصادر فعلية وحقيقية لتنفيذ أو فهم هذه الفكرة المركزية. يجب تعبئة (recommendationType).
   - **هام جداً - إثراء المحتوى (searchQueries)**: لكل عقدة جديدة، **يجب** إدراج حقل \`searchQueries\` يحتوي على 2 إلى 3 مواضيع بحث مقترحة ومحددة جداً للمستخدم لكي يتوسع في سياق هذا الموضوع بشكل فوري وموثوق. يجب تحديد العنوان المناسب للزر باللغة العربية (مثال: 'البحث عن أوراق علمية في Google Scholar'، 'كتب مراجع مقترحة'، 'تطبيقات عملية في YouTube')، وتحديد الكلمات المفتاحية المستهدفة (\`query\`) بالإنجليزية أو العربية لضمان نتائج عالية الجودة، وتحديد الموقع المفضل للبحث (\`site\` من نوع: \`google\` أو \`scholar\` أو \`youtube\` أو \`wikipedia\`).
   - أعط كل عقدة ID فريد جداً يبدأ بكلمة node_ متبوعة برقم عشوائي طويل.

2. الروابط (Edges):
   - **هام جداً**: يجب أن تربط معظم العقد الجديدة المتولدة بالعقدة المركزية (التي تحمل الـ ID: ${nodeId}).
   - يمكنك أيضاً ربط العقد الجديدة ببعضها أو بالعقد الموجودة مسبقاً إذا كان هناك منطق واضح.
   - في كل رابط يجب توفير شرح (explanation) مقنع باللغة العربية.

المواضيع المقترحة (suggestedTopics) والمواضيع المضادة (contrarianTopics) غير ضرورية هنا لكن يمكنك تركها فارغة أو إضافة موضوع واحد إذا أردت.
`;

  if (config.provider !== 'gemini') {
    prompt += `\n\nIMPORTANT: You MUST return ONLY valid JSON matching this schema exactly. No \`\`\`json wrappers.
{
  "nodes": [{"id": "...", "type": "input|idea|recommendation", "label": "...", "description": "...", "ideaContext": "...", "recommendationType": "...", "searchQueries": [{"label": "...", "query": "...", "site": "google|scholar|youtube|wikipedia"}]}],
  "edges": [{"id": "...", "source": "...", "target": "...", "explanation": "..."}],
  "suggestedTopics": [],
  "contrarianTopics": []
}`;
  }

  const rawText = await callAIProvider({
    config,
    prompt,
    systemPrompt: 'You are a visual engine JSON API. Return exactly a valid JSON object matching the requested schema. Output raw JSON without markdown codeblocks.',
    temperature: 0.9,
    jsonMode: true,
    geminiSchema: graphSchema,
  });

  const cleaned = cleanJsonOutput(rawText);
  return JSON.parse(cleaned) as GraphData;
}

export async function generateSummary(
  nodes: { id: string; label: string; description: string; type: string }[],
  edges: { source: string; target: string; explanation: string }[],
  config: AppConfig
): Promise<string> {
  const nodesText = nodes.map(n => `- [${n.type}] "${n.label}": ${n.description}`).join('\n');
  const edgesText = edges.map(e => {
    const src = nodes.find(n => n.id === e.source);
    const tgt = nodes.find(n => n.id === e.target);
    return `- "${src?.label || e.source}" ← → "${tgt?.label || e.target}": ${e.explanation}`;
  }).join('\n');

  const prompt = `
أنت كاتب محترف ومحلل أفكار. لديك خريطة ذهنية (Mind Map) تحتوي على أفكار وتوصيات مترابطة.
مهمتك هي تحويل هذه الخريطة إلى **مقال سردي متماسك وشامل** باللغة العربية.

العقد (الأفكار):
${nodesText}

الروابط (العلاقات):
${edgesText}

المتطلبات:
1. اكتب مقالاً سردياً متكاملاً (ليس نقاط) يربط بين كل الأفكار بشكل منطقي ومتسلسل.
2. ابدأ بمقدمة تلخص الموضوع العام.
3. اشرح كل فكرة رئيسية وكيف ترتبط بالأفكار الأخرى.
4. اذكر التوصيات والمصادر في سياق النص بشكل طبيعي.
5. اختم بخلاصة تجمع أهم النقاط.
6. اجعل الأسلوب احترافياً وسلساً ومشوقاً للقارئ.
7. أعد النص كـ plain text بدون أي markdown formatting.
`;

  return await callAIProvider({
    config,
    prompt,
    systemPrompt: 'You are a professional Arabic writer. Write coherent narrative articles from mind map data.',
    temperature: 0.7,
    jsonMode: false,
  });
}

/**
 * Allows the user to ask the AI targeted questions about a specific node in the mind map.
 */
export async function askAIAboutNode(
  nodeLabel: string,
  nodeDescription: string,
  question: string,
  config: AppConfig
): Promise<string> {
  const prompt = `
أنت مستشار وخبير معرفي في تطبيق خرائط الأفكار والابتكار التراكمي (تصوّرات - Tasaowrat).
يريد المستخدم استيضاح معلومات معمقة حول عقدة محددة من خريطة الأفكار.

معلومات العقدة المستهدفة:
- العنوان: "${nodeLabel}"
- الوصف / السياق: "${nodeDescription || 'لا يوجد وصف محدد'}"

سؤال المستخدم حول هذه العقدة:
"${question}"

التعليمات:
1. قدم إجابة مباشرة، ثرية، وعميقة باللغة العربية الفصحى الواضحة.
2. اشرح المفاهيم بأسلوب مشوق يربط النظرية بالتطبيقات العملية والأمثلة الواقعية.
3. إذا كان السؤال يطلب اقتراحات أو خطوات عملية، رتبها في نقاط مرقمة وواضحة.
4. حافظ على نبرة فكرية ملهمة ومحفزة على الاستكشاف والتفكير النقدي.
5. أعد الإجابة كنص منسق ونظيف.
`;

  return await callAIProvider({
    config,
    prompt,
    systemPrompt: 'You are an insightful Arabic knowledge assistant and mind-map expert. Answer user questions with intellectual depth, clarity, and practical relevance.',
    temperature: 0.7,
    jsonMode: false,
  });
}
