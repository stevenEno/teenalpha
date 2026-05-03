'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DollarSign, Link2, Share2, Camera, Loader2, CheckCircle2, ExternalLink } from 'lucide-react';

interface LaunchAndEarnProps {
  projectId: string;
  projectTitle: string;
  moneyPath: string | null;
  paymentLinkUrl: string | null;
}

export function LaunchAndEarn({
  projectId,
  projectTitle,
  moneyPath,
  paymentLinkUrl: initialLink,
}: LaunchAndEarnProps) {
  const router = useRouter();
  const [paymentLink, setPaymentLink] = useState(initialLink);
  const [generating, setGenerating] = useState(false);
  const [price, setPrice] = useState('500');
  const [productName, setProductName] = useState(projectTitle);
  const [copied, setCopied] = useState(false);
  const [reportingDollar, setReportingDollar] = useState(false);
  const [evidenceUrl, setEvidenceUrl] = useState('');
  const [dollarReported, setDollarReported] = useState(false);

  const generateLink = async () => {
    setGenerating(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/payment-link`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          price_cents: Number(price),
          product_name: productName,
        }),
      });
      const j = await res.json();
      if (j.url) setPaymentLink(j.url);
    } catch (e) {
      console.error(e);
    } finally {
      setGenerating(false);
    }
  };

  const copyLink = () => {
    if (paymentLink) {
      navigator.clipboard.writeText(paymentLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const shareLink = () => {
    if (paymentLink && navigator.share) {
      navigator.share({
        title: productName,
        text: `Check out what I built: ${productName}`,
        url: paymentLink,
      }).catch(() => {});
    } else {
      copyLink();
    }
  };

  const reportFirstDollar = async () => {
    if (!evidenceUrl.trim()) return;
    setReportingDollar(true);
    try {
      await fetch(`/api/projects/${projectId}/first-dollar`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          amount_cents: Number(price) || 500,
          evidence_url: evidenceUrl,
        }),
      });
      setDollarReported(true);
      router.refresh();
    } catch (e) {
      console.error(e);
    } finally {
      setReportingDollar(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md border-2 border-[#FF6B35] p-6 space-y-6">
      <div className="flex items-center gap-2">
        <DollarSign className="w-5 h-5 text-[#FF6B35]" />
        <h3 className="text-lg font-bold text-gray-900">Launch & Earn</h3>
        <Badge className="bg-[#FF6B35] text-white ml-auto">Project complete</Badge>
      </div>

      {moneyPath && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
          <p className="text-xs font-semibold text-orange-800 mb-1">Your goal</p>
          <p className="text-sm text-orange-900 font-medium">{moneyPath}</p>
        </div>
      )}

      {!paymentLink ? (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Create a payment link for your project. Share it anywhere — someone pays, you earn.
          </p>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              What are you selling?
            </label>
            <input
              type="text"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Price (cents) — minimum $1
            </label>
            <div className="flex items-center gap-2">
              {['100', '500', '1000', '2500'].map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPrice(p)}
                  className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                    price === p
                      ? 'bg-[#FF6B35] text-white border-[#FF6B35]'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                  }`}
                >
                  ${Number(p) / 100}
                </button>
              ))}
            </div>
          </div>
          <Button
            onClick={generateLink}
            disabled={generating}
            className="w-full bg-[#FF6B35] hover:bg-[#E85A24] text-white"
          >
            {generating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Link2 className="w-4 h-4 mr-2" />}
            {generating ? 'Creating link…' : 'Create payment link'}
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
            <p className="text-sm text-green-800 font-medium">Payment link ready</p>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              readOnly
              value={paymentLink}
              className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm bg-gray-50 truncate"
            />
            <Button variant="outline" size="sm" onClick={copyLink}>
              {copied ? 'Copied' : 'Copy'}
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" onClick={shareLink} className="w-full">
              <Share2 className="w-4 h-4 mr-1" /> Share
            </Button>
            <Button variant="outline" asChild className="w-full">
              <a href={paymentLink} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4 mr-1" /> Preview
              </a>
            </Button>
          </div>

          <p className="text-xs text-gray-500 text-center">
            Share this link on Snapchat, Instagram, or text it to someone who&apos;d buy what you built.
          </p>

          {!dollarReported && (
            <div className="border-t border-gray-100 pt-4 space-y-3">
              <p className="text-sm font-semibold text-gray-900">Made your first sale?</p>
              <p className="text-xs text-gray-600">
                Paste a screenshot or link proving you earned money (Venmo screenshot, Stripe receipt, etc.)
              </p>
              <input
                type="text"
                value={evidenceUrl}
                onChange={(e) => setEvidenceUrl(e.target.value)}
                placeholder="Paste screenshot URL or link…"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
              <Button
                onClick={reportFirstDollar}
                disabled={reportingDollar || !evidenceUrl.trim()}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
              >
                {reportingDollar ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Camera className="w-4 h-4 mr-2" />}
                Report my first dollar
              </Button>
            </div>
          )}

          {dollarReported && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
              <p className="text-lg font-bold text-green-900">You earned your first dollar.</p>
              <p className="text-sm text-green-700">That puts you ahead of 99% of people your age. Keep building.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
