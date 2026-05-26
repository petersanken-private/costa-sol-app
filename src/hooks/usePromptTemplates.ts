import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { AIPromptTemplate } from '../types';
import { fromDb } from '../lib/mappers';

type DbRow = {
  id: string;
  name: string;
  prompt: string;
  scope: string;
  created_at: string;
};

function templateFromDb(row: DbRow): AIPromptTemplate {
  return fromDb<AIPromptTemplate>(row as unknown as Record<string, unknown>);
}

interface UsePromptTemplatesResult {
  templates:  AIPromptTemplate[];
  loading:    boolean;
  add:        (name: string, prompt: string, scope: 'portfolio' | 'property') => Promise<void>;
  remove:     (id: string) => Promise<void>;
}

export function usePromptTemplates(scope: 'portfolio' | 'property'): UsePromptTemplatesResult {
  const [templates, setTemplates] = useState<AIPromptTemplate[]>([]);
  const [loading,   setLoading]   = useState(true);

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from('ai_prompt_templates')
      .select('*')
      .eq('scope', scope)
      .order('created_at');
    if (!error && data) {
      setTemplates(data.map(r => templateFromDb(r as DbRow)));
    }
    setLoading(false);
  }, [scope]);

  useEffect(() => { load(); }, [load]);

  const add = useCallback(async (
    name:   string,
    prompt: string,
    sc:     'portfolio' | 'property',
  ) => {
    const { data, error } = await supabase
      .from('ai_prompt_templates')
      .insert({ name, prompt, scope: sc })
      .select()
      .single();
    if (!error && data) {
      setTemplates(prev => [...prev, templateFromDb(data as DbRow)]);
    }
  }, []);

  const remove = useCallback(async (id: string) => {
    const { error } = await supabase
      .from('ai_prompt_templates')
      .delete()
      .eq('id', id);
    if (!error) {
      setTemplates(prev => prev.filter(t => t.id !== id));
    }
  }, []);

  return { templates, loading, add, remove };
}
