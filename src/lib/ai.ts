import { GoogleGenAI, Type, Schema } from '@google/genai';
import { GraphData, AppConfig } from '../types';

const schema: Schema = {
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

  const prompt = `
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
   - في كل رابط يجب توفير شرح (explanation) يوضح بوضوح وشفافية "لماذا ربطنا العقدة أ مع العقدة ب؟ كيف يخدمان بعضهما؟" (Reasoning Transparency).

3. اقتراحات لمواضيع مثيرة (suggestedTopics):
   - اقترح 3 مواضيع بحثية مثيرة وغير تقليدية يمكن للمستخدم التوسع بها لاحقاً وتتعلق بالشبكة التي قمت للتو بتوليدها.
   - في حالة النقر عليها لاحقاً ستكون مدخلاً لاستخراج أفكار وتوصيات مستندة إلى هذه الشبكة.

4. مواضيع مضادة للتفكير المعاكس (contrarianTopics):
   - اقترح موضوعين "مضادين" (Contrarian Topics) يعاكسان تماماً الاهتمام الأساسي للمستخدم المدخل حالياً، بهدف تحدي المسلمات الفكرية.
   - الهدف من هذه المواضيع هو الفضول وكسر فقاعة الانحياز التأكيدي (Confirmation Bias).
   - يجب أن يكون العنوان جذاباً والفكرة مستفزة فكرياً ومقنعة في نفس الوقت للبحث فيها.

الرجاء التركيز على أن تكون الأفكار مبتكرة وغير تقليدية ولها سياق واضح، وأن تكون التوصيات تحتوي على مصادر حقيقية دقيقة مع توضيح الفائدة منها. كل النصوص في البيانات يجب أن تكون باللغة العربية.
  `;

  if (config.provider === 'gemini') {
    const ai = new GoogleGenAI({ apiKey: config.apiKey });
    try {
      const response = await ai.models.generateContent({
        model: config.model,
        contents: prompt,
        config: {
          temperature: 0.9,
          responseMimeType: 'application/json',
          responseSchema: schema,
        }
      });

      if (!response.text) throw new Error("No response generated.");
      
      return JSON.parse(response.text) as GraphData;
    } catch (error) {
      console.error("Gemini API Error:", error);
      throw error;
    }
  } else {
    // OpenAI Compatible API
    let baseUrl = 'https://api.openai.com/v1/chat/completions';
    if (config.provider === 'groq') baseUrl = 'https://api.groq.com/openai/v1/chat/completions';
    if (config.provider === 'custom') {
      baseUrl = config.customBaseUrl || baseUrl;
      if (!baseUrl.endsWith('/chat/completions')) {
        baseUrl = baseUrl.replace(/\/$/, '') + '/chat/completions';
      }
    }

    const payload: any = {
      model: config.model,
      messages: [
        { role: 'system', content: 'You are a visual engine JSON API. Return exactly a valid JSON object matching the requested schema. Output raw JSON without markdown codeblocks.' },
        { 
          role: 'user', 
          content: prompt + `\n\nIMPORTANT: You MUST return ONLY valid JSON matching this schema exactly. No \`\`\`json wrappers.\n{
  "nodes": [{"id": "...", "type": "input|idea|recommendation", "label": "...", "description": "...", "ideaContext": "...", "recommendationType": "...", "searchQueries": [{"label": "...", "query": "...", "site": "google|scholar|youtube|wikipedia"}]}],
  "edges": [{"id": "...", "source": "...", "target": "...", "explanation": "..."}],
  "suggestedTopics": [{"title": "...", "description": "..."}],
  "contrarianTopics": [{"title": "...", "description": "..."}]
}`
        }
      ],
      temperature: 0.9,
    };

    if (config.provider === 'openai' || config.provider === 'groq') {
       payload.response_format = { type: "json_object" };
    }

    try {
      const resp = await fetch(baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.apiKey}`
        },
        body: JSON.stringify(payload)
      });

      if (!resp.ok) {
         const errText = await resp.text();
         throw new Error(`API Error: ${resp.status} - ${errText}`);
      }
      
      const data = await resp.json();
      const content = data.choices?.[0]?.message?.content;
      
      if (!content) throw new Error("No content generated.");
      
      const cleaned = content.replace(/^\s*```(json)?/i, '').replace(/```\s*$/i, '').trim();
      return JSON.parse(cleaned) as GraphData;
    } catch (error) {
      console.error(`${config.provider.toUpperCase()} API Error:`, error);
      throw error;
    }
  }
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

  const prompt = `
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

  // We can just reuse the exact same API calling logic from generateGraphData
  // For simplicity, we just change the prompt in a local function or we abstract the api call.
  // Since we don't want to refactor everything, I will just duplicate the API call structure.
  
  if (config.provider === 'gemini') {
    const ai = new GoogleGenAI({ apiKey: config.apiKey });
    try {
      const response = await ai.models.generateContent({
        model: config.model,
        contents: prompt,
        config: {
          temperature: 0.9,
          responseMimeType: 'application/json',
          responseSchema: schema,
        }
      });
      if (!response.text) throw new Error("No response generated.");
      return JSON.parse(response.text) as GraphData;
    } catch (error) {
      console.error("Gemini API Error:", error);
      throw error;
    }
  } else {
    let baseUrl = 'https://api.openai.com/v1/chat/completions';
    if (config.provider === 'groq') baseUrl = 'https://api.groq.com/openai/v1/chat/completions';
    if (config.provider === 'custom') {
      baseUrl = config.customBaseUrl || baseUrl;
      if (!baseUrl.endsWith('/chat/completions')) baseUrl = baseUrl.replace(/\/$/, '') + '/chat/completions';
    }
    const payload: any = {
      model: config.model,
      messages: [
        { role: 'system', content: 'You are a visual engine JSON API. Return exactly a valid JSON object matching the requested schema. Output raw JSON without markdown codeblocks.' },
        { 
          role: 'user', 
          content: prompt + `\n\nIMPORTANT: You MUST return ONLY valid JSON matching this schema exactly. No \`\`\`json wrappers.\n{
  "nodes": [{"id": "...", "type": "input|idea|recommendation", "label": "...", "description": "...", "ideaContext": "...", "recommendationType": "...", "searchQueries": [{"label": "...", "query": "...", "site": "google|scholar|youtube|wikipedia"}]}],
  "edges": [{"id": "...", "source": "...", "target": "...", "explanation": "..."}],
  "suggestedTopics": [],
  "contrarianTopics": []
}`
        }
      ],
      temperature: 0.9,
    };
    if (config.provider === 'openai' || config.provider === 'groq') {
       payload.response_format = { type: "json_object" };
    }
    try {
      const resp = await fetch(baseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${config.apiKey}` },
        body: JSON.stringify(payload)
      });
      if (!resp.ok) throw new Error(`API Error: ${resp.status} - ${await resp.text()}`);
      const data = await resp.json();
      const content = data.choices?.[0]?.message?.content;
      if (!content) throw new Error("No content generated.");
      return JSON.parse(content.replace(/^\s*```(json)?/i, '').replace(/```\s*$/i, '').trim()) as GraphData;
    } catch (error) {
      console.error(`${config.provider.toUpperCase()} API Error:`, error);
      throw error;
    }
  }
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

  if (config.provider === 'gemini') {
    const ai = new GoogleGenAI({ apiKey: config.apiKey });
    try {
      const response = await ai.models.generateContent({
        model: config.model,
        contents: prompt,
        config: { temperature: 0.7 }
      });
      if (!response.text) throw new Error("No response generated.");
      return response.text;
    } catch (error) {
      console.error("Gemini API Error:", error);
      throw error;
    }
  } else {
    let baseUrl = 'https://api.openai.com/v1/chat/completions';
    if (config.provider === 'groq') baseUrl = 'https://api.groq.com/openai/v1/chat/completions';
    if (config.provider === 'custom') {
      baseUrl = config.customBaseUrl || baseUrl;
      if (!baseUrl.endsWith('/chat/completions')) baseUrl = baseUrl.replace(/\/$/, '') + '/chat/completions';
    }
    const payload: any = {
      model: config.model,
      messages: [
        { role: 'system', content: 'You are a professional Arabic writer. Write coherent narrative articles from mind map data.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
    };
    try {
      const resp = await fetch(baseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${config.apiKey}` },
        body: JSON.stringify(payload)
      });
      if (!resp.ok) throw new Error(`API Error: ${resp.status} - ${await resp.text()}`);
      const data = await resp.json();
      const content = data.choices?.[0]?.message?.content;
      if (!content) throw new Error("No content generated.");
      return content;
    } catch (error) {
      console.error(`${config.provider.toUpperCase()} API Error:`, error);
      throw error;
    }
  }
}
