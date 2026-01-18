'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { Save, RotateCcw, ChevronDown, ChevronUp, Copy, Check } from 'lucide-react';

interface Prompt {
  id: string;
  name: string;
  description: string;
  template: string;
  is_default: boolean;
  updated_at?: string;
}

export default function AdminPromptsPage() {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [expandedPrompt, setExpandedPrompt] = useState<string | null>(null);
  const [editedPrompts, setEditedPrompts] = useState<Record<string, string>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [usingDefaults, setUsingDefaults] = useState(true);

  useEffect(() => {
    fetchPrompts();
  }, []);

  const fetchPrompts = async () => {
    try {
      const response = await fetch('/api/admin/prompts');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch prompts');
      }

      setPrompts(data.prompts);
      setUsingDefaults(data.usingDefaults);

      // Initialize edited prompts with current values
      const edited: Record<string, string> = {};
      data.prompts.forEach((p: Prompt) => {
        edited[p.id] = p.template;
      });
      setEditedPrompts(edited);
    } catch (error: any) {
      console.error('Error fetching prompts:', error);
      toast.error('Failed to load prompts', {
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const savePrompt = async (promptId: string) => {
    setSaving(promptId);
    try {
      const prompt = prompts.find(p => p.id === promptId);
      const response = await fetch('/api/admin/prompts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          promptId,
          template: editedPrompts[promptId],
          name: prompt?.name,
          description: prompt?.description,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save prompt');
      }

      toast.success('Prompt saved!', {
        description: 'Your changes have been saved to the database.',
      });

      // Refresh prompts
      await fetchPrompts();
    } catch (error: any) {
      console.error('Error saving prompt:', error);
      toast.error('Failed to save prompt', {
        description: error.message,
      });
    } finally {
      setSaving(null);
    }
  };

  const resetPrompt = async (promptId: string) => {
    if (!confirm('Are you sure you want to reset this prompt to the default? This will delete your custom version.')) {
      return;
    }

    setSaving(promptId);
    try {
      const response = await fetch(`/api/admin/prompts?promptId=${promptId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reset prompt');
      }

      toast.success('Prompt reset!', {
        description: 'The prompt has been reset to the default.',
      });

      // Refresh prompts
      await fetchPrompts();
    } catch (error: any) {
      console.error('Error resetting prompt:', error);
      toast.error('Failed to reset prompt', {
        description: error.message,
      });
    } finally {
      setSaving(null);
    }
  };

  const copyPrompt = async (promptId: string) => {
    const template = editedPrompts[promptId];
    await navigator.clipboard.writeText(template);
    setCopiedId(promptId);
    setTimeout(() => setCopiedId(null), 2000);
    toast.success('Copied to clipboard!');
  };

  const hasChanges = (promptId: string) => {
    const original = prompts.find(p => p.id === promptId);
    return original && editedPrompts[promptId] !== original.template;
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-8 space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Prompt Management</h1>
        <p className="text-gray-600">
          View and customize the AI prompts used for generating project recommendations.
        </p>
      </div>

      {/* Status Alert */}
      {usingDefaults && (
        <Alert className="bg-blue-50 border-blue-200">
          <AlertDescription className="text-blue-800">
            You're currently using the default prompts. Edit and save a prompt to create a custom version stored in your database.
          </AlertDescription>
        </Alert>
      )}

      {/* Variable Reference */}
      <Card className="p-4 bg-gray-50">
        <h3 className="font-semibold mb-2">Available Variables</h3>
        <p className="text-sm text-gray-600 mb-3">
          Use these placeholders in your prompts. They will be replaced with actual data at runtime.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
          <code className="bg-white px-2 py-1 rounded border">{'{{platform}}'}</code>
          <code className="bg-white px-2 py-1 rounded border">{'{{profileDescription}}'}</code>
          <code className="bg-white px-2 py-1 rounded border">{'{{totalLikes}}'}</code>
          <code className="bg-white px-2 py-1 rounded border">{'{{totalFollowing}}'}</code>
          <code className="bg-white px-2 py-1 rounded border">{'{{engagementLevel}}'}</code>
          <code className="bg-white px-2 py-1 rounded border">{'{{topCategories}}'}</code>
          <code className="bg-white px-2 py-1 rounded border">{'{{topAccounts}}'}</code>
          <code className="bg-white px-2 py-1 rounded border">{'{{recentSearches}}'}</code>
        </div>
      </Card>

      {/* Prompts List */}
      <div className="space-y-4">
        {prompts.map((prompt) => (
          <Card key={prompt.id} className="overflow-hidden">
            {/* Header */}
            <button
              onClick={() => setExpandedPrompt(expandedPrompt === prompt.id ? null : prompt.id)}
              className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center space-x-4">
                <div className="text-left">
                  <h3 className="font-semibold text-lg">{prompt.name}</h3>
                  <p className="text-sm text-gray-600">{prompt.description}</p>
                </div>
                {!prompt.is_default && (
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                    Customized
                  </span>
                )}
                {hasChanges(prompt.id) && (
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                    Unsaved Changes
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-2">
                {prompt.updated_at && (
                  <span className="text-xs text-gray-500">
                    Updated: {new Date(prompt.updated_at).toLocaleDateString()}
                  </span>
                )}
                {expandedPrompt === prompt.id ? (
                  <ChevronUp className="w-5 h-5 text-gray-500" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-500" />
                )}
              </div>
            </button>

            {/* Expanded Content */}
            {expandedPrompt === prompt.id && (
              <div className="border-t p-4 space-y-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Prompt Template
                  </label>
                  <textarea
                    value={editedPrompts[prompt.id] || ''}
                    onChange={(e) => setEditedPrompts({
                      ...editedPrompts,
                      [prompt.id]: e.target.value,
                    })}
                    className="w-full h-96 p-4 font-mono text-sm border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Enter your prompt template..."
                  />
                </div>

                {/* Character Count */}
                <div className="text-sm text-gray-500">
                  {editedPrompts[prompt.id]?.length || 0} characters
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Button
                      onClick={() => copyPrompt(prompt.id)}
                      variant="outline"
                      size="sm"
                    >
                      {copiedId === prompt.id ? (
                        <>
                          <Check className="w-4 h-4 mr-2" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 mr-2" />
                          Copy
                        </>
                      )}
                    </Button>
                    {!prompt.is_default && (
                      <Button
                        onClick={() => resetPrompt(prompt.id)}
                        variant="outline"
                        size="sm"
                        disabled={saving === prompt.id}
                      >
                        <RotateCcw className="w-4 h-4 mr-2" />
                        Reset to Default
                      </Button>
                    )}
                  </div>

                  <Button
                    onClick={() => savePrompt(prompt.id)}
                    disabled={saving === prompt.id || !hasChanges(prompt.id)}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    {saving === prompt.id ? (
                      <>
                        <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* SQL for Creating Table */}
      <Card className="p-6 bg-yellow-50 border-yellow-200">
        <h3 className="font-semibold mb-2">Database Setup Required</h3>
        <p className="text-sm text-gray-700 mb-4">
          If you haven't created the prompt_templates table yet, run this SQL in Supabase:
        </p>
        <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto text-sm">
{`CREATE TABLE IF NOT EXISTS prompt_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  template TEXT NOT NULL,
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE prompt_templates ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read
CREATE POLICY "Allow authenticated read" ON prompt_templates
  FOR SELECT TO authenticated USING (true);

-- Allow authenticated users to insert/update
CREATE POLICY "Allow authenticated write" ON prompt_templates
  FOR ALL TO authenticated USING (true) WITH CHECK (true);`}
        </pre>
      </Card>
    </div>
  );
}
