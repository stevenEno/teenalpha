'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

export default function RecommendMentorPage() {
  const [loading, setLoading] = useState(false);
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate LinkedIn URL
    if (!linkedinUrl.includes('linkedin.com/in/')) {
      toast.error('Invalid URL', {
        description: 'Please enter a valid LinkedIn profile URL (e.g., https://linkedin.com/in/username)',
      });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/recommend-mentor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          linkedin_url: linkedinUrl,
          message: message,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit recommendation');
      }

      toast.success('Recommendation submitted!', {
        description: 'We\'ll reach out to this potential mentor and keep you updated.',
      });

      // Reset form
      setLinkedinUrl('');
      setMessage('');
    } catch (error: any) {
      toast.error('Submission failed', {
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Recommend a Mentor</h1>
        <p className="text-gray-600">
          Know someone from your LinkedIn network who would be a great mentor? Share their profile with us!
        </p>
      </div>

      <Card className="p-6 bg-blue-50 border-2 border-blue-200">
        <div className="space-y-3">
          <h3 className="font-semibold text-lg flex items-center space-x-2">
            <span>💡</span>
            <span>How It Works</span>
          </h3>
          <ol className="space-y-2 text-sm text-gray-700 list-decimal list-inside">
            <li>Share the LinkedIn profile of someone you think would be a great mentor</li>
            <li>We'll reach out to them with an invitation to join Teen Alpha</li>
            <li>If they accept, they'll be matched with students who fit their expertise</li>
            <li>You'll get notified when they join the platform</li>
          </ol>
        </div>
      </Card>

      <Card className="p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="linkedin">LinkedIn Profile URL *</Label>
            <Input
              id="linkedin"
              type="url"
              placeholder="https://linkedin.com/in/their-profile"
              value={linkedinUrl}
              onChange={(e) => setLinkedinUrl(e.target.value)}
              required
            />
            <p className="text-xs text-gray-500">
              Example: https://linkedin.com/in/john-smith
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Why would they be a great mentor? (Optional)</Label>
            <Textarea
              id="message"
              placeholder="Tell us about their expertise, experience, or why you think they'd be great for mentoring teens..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
            />
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              <strong>Note:</strong> We'll send them a personalized invitation mentioning that you recommended them.
              Make sure you have their permission or a good relationship before recommending.
            </p>
          </div>

          <Button
            type="submit"
            disabled={loading}
            size="lg"
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              'Submit Recommendation'
            )}
          </Button>
        </form>
      </Card>

      <Card className="p-6 border-2 border-dashed">
        <h3 className="font-semibold mb-3">💼 Ideal Mentor Profiles</h3>
        <ul className="space-y-2 text-sm text-gray-700">
          <li className="flex items-start space-x-2">
            <span className="text-green-600 mt-0.5">✓</span>
            <span>Software engineers, developers, or tech professionals</span>
          </li>
          <li className="flex items-start space-x-2">
            <span className="text-green-600 mt-0.5">✓</span>
            <span>Entrepreneurs who've built tech products</span>
          </li>
          <li className="flex items-start space-x-2">
            <span className="text-green-600 mt-0.5">✓</span>
            <span>Product managers, designers, or data scientists</span>
          </li>
          <li className="flex items-start space-x-2">
            <span className="text-green-600 mt-0.5">✓</span>
            <span>Anyone passionate about helping teens learn to code</span>
          </li>
        </ul>
      </Card>
    </div>
  );
}