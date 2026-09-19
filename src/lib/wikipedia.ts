export interface WikipediaArticle {
  title: string;
  extract: string;
  description?: string;
  url?: string;
  pageUrl?: string;
  thumbnail?: string;
}

export interface WikipediaSearchResult {
  title: string;
  description?: string;
  url: string;
}

/**
 * Fallback topics with summaries in case the Wikipedia API is unreachable or rate limited.
 */
const FALLBACK_WIKI_ARTICLES: WikipediaArticle[] = [
  {
    title: "بيت الحكمة",
    extract: "أول دار علمية عامة أنشئت في بغداد في العصر الذهبي للإسلام، جمعت بين دور الترجمة، والمكتبة الوطنية، ومركز الأبحاث العلمية والفلسفية والرياضية.",
    description: "مؤسسة علمية تاريخية رائدة في بغداد",
    url: "https://ar.wikipedia.org/wiki/بيت_الحكمة",
    pageUrl: "https://ar.wikipedia.org/wiki/بيت_الحكمة"
  },
  {
    title: "ابن الهيثم",
    extract: "عالم موسوعي عربي مسلم قدم إسهامات رائدة في البصريات والفيزياء وعلم الفلك والهندسة الرياضية، ويعد المؤسس الأول للمنهج العلمي التجريبي الحديث.",
    description: "عالم بصريات ورياضيات وفلك وفيزياء",
    url: "https://ar.wikipedia.org/wiki/ابن_الهيثم",
    pageUrl: "https://ar.wikipedia.org/wiki/ابن_الهيثم"
  },
  {
    title: "الفركتلات والأنظمة المعقدة",
    extract: "أشكال هندسية متكررة ذاتية التشابه في مختلف المقاييس، تظهر بوضوح في الطبيعة كتشعبات الأنهار، وأشكال السحب، وسواحل البحار، والبلورات الثلجية.",
    description: "مفهوم رياضي وهندسي لدراسة الفوضى المنظمة",
    url: "https://ar.wikipedia.org/wiki/كسيرية",
    pageUrl: "https://ar.wikipedia.org/wiki/كسيرية"
  },
  {
    title: "المحاكاة الحيوية (Biomimicry)",
    extract: "علم يستلهم أفكاره وتصميماته الهندسية والتقنية من الطبيعة والأنظمة البيولوجية الحية لحل المشكلات البشرية المعقدة بفاعلية واستدامة بيئية عالية.",
    description: "نهج هندسي وتصميمي مستوحى من الطبيعة",
    url: "https://ar.wikipedia.org/wiki/محاكاة_حيوية",
    pageUrl: "https://ar.wikipedia.org/wiki/محاكاة_حيوية"
  },
  {
    title: "اللسانيات الحاسوبية",
    extract: "مجال متداخل يجمع بين علوم الحاسوب واللسانيات لدراسة النمذجة الإحصائية والمنطقية للغات الطبيعية وفهم بنيتها ومعانيها آلياً وتوليدها.",
    description: "فرع محوري في الذكاء الاصطناعي ومعالجة اللغات",
    url: "https://ar.wikipedia.org/wiki/لغويات_حاسوبية",
    pageUrl: "https://ar.wikipedia.org/wiki/لغويات_حاسوبية"
  },
  {
    title: "الحوسبة الكمومية",
    extract: "نمط حوسبي يعتمد على مبادئ ميكانيكا الكم كالتردد والتراكب والتشابك الكمي لإجراء حسابات معقدة تفوق قدرات الحواسيب التقليدية بملايين المرات.",
    description: "تقنية ثورية في علوم الحوسبة والفيزياء",
    url: "https://ar.wikipedia.org/wiki/حوسبة_كمومية",
    pageUrl: "https://ar.wikipedia.org/wiki/حوسبة_كمومية"
  },
  {
    title: "علم الأعصاب الإدراكي",
    extract: "دراسة الأسس البيولوجية والفسيولوجية التي تكمن وراء الإدراك والتفكير البشري، مع التركيز على الروابط العصبية في الدماغ والتعلم والذاكرة.",
    description: "تقاطع الطب النفسي مع علم الأعصاب وعلم النفس",
    url: "https://ar.wikipedia.org/wiki/علم_الأعصاب_المعرفي",
    pageUrl: "https://ar.wikipedia.org/wiki/علم_الأعصاب_المعرفي"
  },
  {
    title: "الاقتصاد الدائري",
    extract: "نموذج اقتصادي يستهدف القضاء على الهدر والاستخدام المستمر للموارد، من خلال إعادة التدوير، والتجديد، وإعادة الاستخدام لتعزيز الاستدامة.",
    description: "استراتيجية اقتصادية تنموية مستدامة",
    url: "https://ar.wikipedia.org/wiki/اقتصاد_دائري",
    pageUrl: "https://ar.wikipedia.org/wiki/اقتصاد_دائري"
  }
];

/**
 * جلب مقالة عشوائية ملهمة وموثوقة من ويكيبيديا العربية
 * مع مهلة زمنية 5 ثوانٍ واسترجاع ذكي عند الانقطاع أو الفشل
 */
export async function fetchRandomWikipediaArticle(lang: string = 'ar'): Promise<WikipediaArticle> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  try {
    const endpoint = `https://${lang}.wikipedia.org/api/rest_v1/page/random/summary`;
    const response = await fetch(endpoint, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'TasaowratMindMap/2.0 (https://github.com/imPROOI/t9orat)'
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Wikipedia API responded with status ${response.status}`);
    }

    const data = await response.json();

    if (!data.title || !data.extract) {
      throw new Error('Wikipedia response missing title or extract');
    }

    const title = String(data.title).trim();
    const extract = String(data.extract).trim();
    const description = data.description ? String(data.description).trim() : undefined;
    const thumbnail = data.thumbnail?.source;
    const resolvedUrl = data.content_urls?.desktop?.page || `https://${lang}.wikipedia.org/wiki/${encodeURIComponent(title)}`;

    return {
      title,
      extract,
      description,
      thumbnail,
      url: resolvedUrl,
      pageUrl: resolvedUrl,
    };
  } catch (error) {
    clearTimeout(timeoutId);
    console.warn('Wikipedia random fetch failed or timed out, using curated fallback:', error);
    const fallback = FALLBACK_WIKI_ARTICLES[Math.floor(Math.random() * FALLBACK_WIKI_ARTICLES.length)];
    const fallbackUrl = `https://${lang}.wikipedia.org/wiki/${encodeURIComponent(fallback.title)}`;
    return {
      ...fallback,
      url: fallback.url || fallbackUrl,
      pageUrl: fallback.pageUrl || fallbackUrl,
    };
  }
}

/**
 * دالة مساعدة للبحث في ويكيبيديا واستخراج أهم النتائج بروابطها المباشرة
 */
export async function searchWikipedia(query: string, lang: string = 'ar'): Promise<WikipediaSearchResult[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  try {
    const url = `https://${lang}.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(trimmed)}&limit=6&namespace=0&format=json&origin=*`;
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'Accept': 'application/json' }
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      return [];
    }

    const json = await res.json();
    // OpenSearch format: [query, [titles], [descriptions], [urls]]
    if (!Array.isArray(json) || json.length < 4) {
      return [];
    }

    const titles: string[] = json[1] || [];
    const descriptions: string[] = json[2] || [];
    const urls: string[] = json[3] || [];

    return titles.map((t, i) => ({
      title: t,
      description: descriptions[i] || '',
      url: urls[i] || `https://${lang}.wikipedia.org/wiki/${encodeURIComponent(t)}`
    }));
  } catch (err) {
    clearTimeout(timeoutId);
    console.warn('Wikipedia search error:', err);
    return [];
  }
}
