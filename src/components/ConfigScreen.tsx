import React, { useState } from 'react';
import { AppConfig, AIProvider } from '../types';
import { KeyRound, ShieldCheck, ArrowLeft, Cpu, Server, Globe, ChevronDown, Settings, Database } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

interface ConfigScreenProps {
  onSaved: (config: AppConfig) => void;
  savedConfig: AppConfig | null;
  onCancel?: () => void;
}

const PROVIDERS = [
  { value: 'gemini', label: 'Google Gemini', hint: 'AIza...' },
  { value: 'openai', label: 'OpenAI',         hint: 'sk-...' },
  { value: 'groq',   label: 'Groq',           hint: 'gsk_...' },
  { value: 'custom', label: 'Custom (OpenAI Compatible)', hint: 'Your API key' },
] as const;

const MODELS_BY_PROVIDER = {
  gemini: [
    { value: 'gemini-3.1-pro-preview',        label: 'Gemini 3.1 Pro – الأكثر دقة' },
    { value: 'gemini-3-flash-preview',        label: 'Gemini 3 Flash – أسرع استجابة' },
    { value: 'gemini-3.1-flash-lite-preview', label: 'Gemini 3.1 Flash Lite – اقتصادي' },
  ],
  openai: [
    { value: 'gpt-4o',      label: 'GPT-4o – النموذج الأقوى' },
    { value: 'gpt-4o-mini', label: 'GPT-4o Mini – سريع وموفر' },
  ],
  groq: [
    { value: 'llama3-70b-8192',          label: 'Llama 3 70B – قوي جداً' },
    { value: 'llama-3.3-70b-versatile',  label: 'Llama 3.3 70B Versatile' },
    { value: 'mixtral-8x7b-32768',       label: 'Mixtral 8x7B' },
  ],
} as const;

// ── Reusable field wrapper ──────────────────────────────────────────────────
function Field({ label, icon: Icon, hint, children }: {
  label: string;
  icon: React.ElementType;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2.5">
      <label className="flex items-center gap-2 text-sm font-medium font-sans text-text-main/90">
        <Icon className="w-4 h-4 text-text-dim" />
        {label}
      </label>
      {children}
      {hint && (
        <p className="text-xs text-text-dim font-sans font-light px-1 flex items-center gap-1.5">
          <span className="w-1 h-1 rounded-full bg-accent-primary/50 shrink-0" />
          {hint}
        </p>
      )}
    </div>
  );
}

// ── Main component ──────────────────────────────────────────────────────────
export function ConfigScreen({ onSaved, savedConfig, onCancel }: ConfigScreenProps) {
  const [provider, setProvider] = useState<AIProvider>(savedConfig?.provider || 'gemini');
  const [apiKey, setApiKey]     = useState(savedConfig?.apiKey || '');
  const [model, setModel]       = useState(savedConfig?.model || MODELS_BY_PROVIDER.gemini[0].value);
  const [customBaseUrl, setCustomBaseUrl] = useState(savedConfig?.customBaseUrl || '');

  const handleProviderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const p = e.target.value as AIProvider;
    setProvider(p);
    if (p === 'gemini')      setModel(MODELS_BY_PROVIDER.gemini[0].value);
    else if (p === 'openai') setModel(MODELS_BY_PROVIDER.openai[0].value);
    else if (p === 'groq')   setModel(MODELS_BY_PROVIDER.groq[0].value);
    else                     setModel('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (apiKey.trim() && model.trim()) {
      onSaved({
        provider,
        apiKey: apiKey.trim(),
        model:  model.trim(),
        ...(provider === 'custom' && { customBaseUrl: customBaseUrl.trim() })
      });
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col items-center justify-center px-4 py-8" dir="rtl">
      {/* Brand header */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200, delay: 0.1 }}
        className="w-full bg-bg-surface border border-border-subtle soft-shadow rounded-3xl overflow-hidden mb-8"
      >
        <div className="bg-bg-surface px-6 py-6 border-b border-border-subtle flex flex-col items-center justify-center gap-3">
          <div className="w-12 h-12 bg-text-main text-bg-base rounded-2xl flex items-center justify-center shadow-md">
            <Settings className="w-6 h-6" />
          </div>
          <div className="text-center">
            <h2 className="text-2xl font-serif text-text-main mb-1">تكوين النظام</h2>
            <p className="text-sm font-sans text-text-dim">قم بإعداد مزود الذكاء الاصطناعي للبدء في توليد الأفكار</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-8 bg-bg-base">
          {/* Provider */}
          <Field label="مزوّد الذكاء الاصطناعي" icon={Server}>
            <div className="relative">
              <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-text-dim">
                <Database className="w-5 h-5" />
              </div>
              <select
                value={provider}
                onChange={handleProviderChange}
                className="w-full appearance-none bg-bg-surface border border-border-subtle rounded-xl py-3.5 pl-10 pr-12 text-text-main font-sans outline-none focus:ring-2 focus:ring-text-main/20 transition-all cursor-pointer"
                dir="ltr"
              >
                {PROVIDERS.map(p => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
              <ChevronDown className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-dim pointer-events-none" />
            </div>
          </Field>

          {/* API Key */}
          <Field
            label="مفتاح API"
            icon={KeyRound}
            hint="يُحفظ المفتاح محلياً في متصفحك فقط — لا يُرسل إلى أي خادم."
          >
            <input
              type="password"
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              placeholder="Enter API Key..."
              className="w-full bg-bg-surface border border-border-subtle rounded-xl py-3.5 px-4 text-text-main font-mono text-left outline-none focus:ring-2 focus:ring-text-main/20 transition-all placeholder:font-sans placeholder:text-text-dim"
              dir="ltr"
            />
          </Field>

          {/* Custom base URL */}
          {provider === 'custom' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <Field
                label="رابط النهاية (Base URL)"
                icon={Globe}
                hint={<>يجب أن يدعم <code>/chat/completions</code></>}
              >
                <input
                  type="url"
                  value={customBaseUrl}
                  onChange={e => setCustomBaseUrl(e.target.value)}
                  placeholder="https://api.deepseek.com/v1"
                  className="w-full bg-bg-surface border border-border-subtle rounded-xl py-3.5 px-4 text-text-main font-mono text-left outline-none focus:ring-2 focus:ring-text-main/20 transition-all"
                  dir="ltr"
                />
              </Field>
            </motion.div>
          )}

          {/* Model */}
          <Field label="النموذج اللغوي" icon={Cpu}>
            <div className="relative">
              {provider === 'custom' ? (
                <input
                  type="text"
                  value={model}
                  onChange={e => setModel(e.target.value)}
                  placeholder="e.g. deepseek-chat"
                  required
                  className="w-full bg-bg-surface border border-border-subtle rounded-xl py-3.5 px-4 text-text-main font-mono text-left outline-none focus:ring-2 focus:ring-text-main/20 transition-all"
                  dir="ltr"
                />
              ) : (
                <>
                  <select
                    value={model}
                    onChange={e => setModel(e.target.value)}
                    className="w-full appearance-none bg-bg-surface border border-border-subtle rounded-xl py-3.5 pl-10 pr-4 text-text-main font-sans outline-none focus:ring-2 focus:ring-text-main/20 transition-all cursor-pointer"
                    dir="ltr"
                  >
                    {MODELS_BY_PROVIDER[provider as keyof typeof MODELS_BY_PROVIDER]?.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-dim pointer-events-none" />
                </>
              )}
            </div>
          </Field>

          {/* Actions */}
          <div className="pt-4 flex items-center gap-3">
            <button
              type="submit"
              disabled={!apiKey.trim() || !model.trim()}
              className={cn(
                'flex-1 flex items-center justify-center gap-2',
                'bg-text-main text-bg-base font-bold text-sm',
                'py-4 rounded-xl transition-all duration-200',
                'hover:opacity-90 active:scale-[0.98]',
                'disabled:opacity-40 disabled:cursor-not-allowed shadow-md'
              )}
            >
              <span>تأكيد وبدء التحليل</span>
              <ArrowLeft className="w-4 h-4" />
            </button>
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className={cn(
                  'flex items-center justify-center',
                  'bg-bg-surface text-text-main font-medium text-sm border border-border-subtle',
                  'px-6 py-4 rounded-xl transition-all duration-200',
                  'hover:bg-border-subtle active:scale-[0.98]'
                )}
              >
                إلغاء
              </button>
            )}
          </div>
        </form>
      </motion.div>
    </div>
  );
}