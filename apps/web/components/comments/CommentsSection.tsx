'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface Author {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  role: 'teen' | 'mentor' | 'parent' | 'admin';
}

interface Comment {
  id: string;
  project_id: string | null;
  task_id: string | null;
  author_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  author: Author;
}

interface CommentsSectionProps {
  projectId: string;
  currentUserId: string;
  currentUserRole: string;
}

export function CommentsSection({
  projectId,
  currentUserId,
  currentUserRole,
}: CommentsSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchComments();
  }, [projectId]);

  async function fetchComments() {
    try {
      const response = await fetch(`/api/comments?projectId=${projectId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch comments');
      }
      const data = await response.json();
      setComments(data.comments || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!newComment.trim() || submitting) return;

    setSubmitting(true);
    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          content: newComment.trim(),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to post comment');
      }

      const data = await response.json();
      setComments([...comments, data.comment]);
      setNewComment('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(commentId: string) {
    if (!confirm('Are you sure you want to delete this comment?')) return;

    try {
      const response = await fetch(`/api/comments?id=${commentId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete comment');
      }

      setComments(comments.filter((c) => c.id !== commentId));
    } catch (err: any) {
      setError(err.message);
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getInitials = (name: string | null) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'mentor':
        return (
          <Badge className="bg-[#FF6B35]/10 text-foreground text-xs ml-2">
            Mentor
          </Badge>
        );
      case 'admin':
        return (
          <Badge className="bg-red-100 text-red-800 text-xs ml-2">Admin</Badge>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/4" />
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="flex gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-200" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/4" />
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <span>Comments & Feedback</span>
        <Badge variant="outline" className="text-xs">
          {comments.length}
        </Badge>
      </h3>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {/* Comments List */}
      <div className="space-y-4 mb-6">
        {comments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No comments yet.</p>
            <p className="text-sm mt-1">
              {currentUserRole === 'mentor'
                ? 'Leave feedback to help guide this student!'
                : 'Your mentor can leave feedback here.'}
            </p>
          </div>
        ) : (
          comments.map((comment) => (
            <div
              key={comment.id}
              className={`flex gap-3 p-3 rounded-lg ${
                comment.author.role === 'mentor'
                  ? 'bg-[#FF6B35]/5 border border-[#FF6B35]/20'
                  : 'bg-gray-50'
              }`}
            >
              {/* Avatar */}
              <div className="flex-shrink-0">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
                    comment.author.role === 'mentor'
                      ? 'bg-[#FF6B35]/20 text-[#FF6B35]'
                      : 'bg-blue-200 text-blue-700'
                  }`}
                >
                  {comment.author.avatar_url ? (
                    <img
                      src={comment.author.avatar_url}
                      alt={comment.author.full_name || 'User'}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    getInitials(comment.author.full_name)
                  )}
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-sm">
                    {comment.author.full_name || 'User'}
                  </span>
                  {getRoleBadge(comment.author.role)}
                  <span className="text-xs text-gray-400">
                    {formatDate(comment.created_at)}
                  </span>
                </div>
                <p className="text-gray-700 text-sm whitespace-pre-wrap">
                  {comment.content}
                </p>

                {/* Delete button for own comments */}
                {comment.author_id === currentUserId && (
                  <button
                    onClick={() => handleDelete(comment.id)}
                    className="text-xs text-red-500 hover:text-red-700 mt-2"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* New Comment Form */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder={
            currentUserRole === 'mentor'
              ? 'Leave feedback or encouragement for your mentee...'
              : 'Add a note or ask a question...'
          }
          className="w-full min-h-[80px] p-3 border rounded-md text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent"
          disabled={submitting}
        />
        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={!newComment.trim() || submitting}
            className="bg-[#FF6B35] hover:bg-[#E85A24] text-white"
          >
            {submitting ? 'Posting...' : 'Post Comment'}
          </Button>
        </div>
      </form>
    </Card>
  );
}
