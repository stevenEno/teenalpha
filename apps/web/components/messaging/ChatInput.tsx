'use client';

import { useState, useRef, useCallback } from 'react';
import { Send, Smile, Image as ImageIcon, Mic } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StickerPicker } from './StickerPicker';

interface ChatInputProps {
  onSendText: (content: string) => Promise<void>;
  onSendSticker: (stickerKey: string) => Promise<void>;
  onSendMedia?: (file: File) => Promise<void>;
  disabled?: boolean;
}

export function ChatInput({ onSendText, onSendSticker, onSendMedia, disabled }: ChatInputProps) {
  const [text, setText] = useState('');
  const [showStickers, setShowStickers] = useState(false);
  const [sending, setSending] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSendText = useCallback(async () => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    setSending(true);
    try {
      await onSendText(trimmed);
      setText('');
      inputRef.current?.focus();
    } finally {
      setSending(false);
    }
  }, [text, sending, onSendText]);

  const handleSendSticker = useCallback(async (stickerKey: string) => {
    if (sending) return;
    setSending(true);
    try {
      await onSendSticker(stickerKey);
    } finally {
      setSending(false);
    }
  }, [sending, onSendSticker]);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onSendMedia || sending) return;

    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB');
      return;
    }

    if (!file.type.startsWith('image/') && !file.type.startsWith('video/') && !file.type.startsWith('audio/')) {
      alert('Only images, videos, and audio files are supported');
      return;
    }

    setSending(true);
    try {
      await onSendMedia(file);
    } finally {
      setSending(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }, [onSendMedia, sending]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendText();
    }
  };

  const handleInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
    const target = e.currentTarget;
    target.style.height = 'auto';
    target.style.height = `${Math.min(target.scrollHeight, 120)}px`;
  };

  return (
    <div className="relative border-t border-gray-200 bg-white p-3">
      <StickerPicker
        open={showStickers}
        onSelect={handleSendSticker}
        onClose={() => setShowStickers(false)}
      />

      <div className="flex items-end gap-2">
        {/* Media button */}
        {onSendMedia && (
          <>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled || sending}
              className="text-gray-400 hover:text-[#FF6B35] flex-shrink-0"
            >
              <ImageIcon className="w-5 h-5" />
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*,audio/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </>
        )}

        {/* Sticker button */}
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => setShowStickers(!showStickers)}
          disabled={disabled || sending}
          className="text-gray-400 hover:text-[#FF6B35] flex-shrink-0"
        >
          <Smile className="w-5 h-5" />
        </Button>

        {/* Text area */}
        <textarea
          ref={inputRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          onInput={handleInput}
          placeholder="Type a message..."
          disabled={disabled || sending}
          rows={1}
          className="flex-1 resize-none rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-[#FF6B35]/40 focus:bg-white transition-colors placeholder:text-gray-400"
          style={{ maxHeight: 120 }}
        />

        {/* Send button */}
        <Button
          size="icon-sm"
          onClick={handleSendText}
          disabled={!text.trim() || disabled || sending}
          className="flex-shrink-0 rounded-full bg-[#FF6B35]/50 hover:bg-[#FF6B35] text-white disabled:opacity-40"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
