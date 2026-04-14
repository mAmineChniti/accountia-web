'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MessageSquare, Send, Loader2, Trash2, Pencil } from 'lucide-react';
import { toast } from 'sonner';

import { CommentsService } from '@/lib/requests';
import type { Comment, CommentListResponse } from '@/types/services';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';

export function CommentsSidebar({
  businessId,
  entityType,
  entityId,
  currentUserId,
}: {
  businessId: string;
  entityType: 'invoice' | 'expense' | 'purchase_order';
  entityId: string;
  currentUserId: string;
}) {
  const queryClient = useQueryClient();
  const [newComment, setNewComment] = useState('');
  const [editingId, setEditingId] = useState<string | undefined>(undefined);
  const [editBody, setEditBody] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['comments', businessId, entityType, entityId],
    queryFn: () => CommentsService.getComments({ businessId, entityType, entityId }),
    staleTime: 2 * 60 * 1000,
  });

  const comments = (data as CommentListResponse)?.comments ?? [];

  const createMutation = useMutation({
    mutationFn: () => CommentsService.createComment({ businessId, entityType, entityId, body: newComment }),
    onSuccess: () => {
      setNewComment('');
      queryClient.invalidateQueries({ queryKey: ['comments', businessId, entityType, entityId] });
    },
    onError: (err: Error) => toast.error(err.message || 'Failed to post comment'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: string }) =>
      CommentsService.updateComment(id, { businessId, body }),
    onSuccess: () => {
      setEditingId(undefined);
      queryClient.invalidateQueries({ queryKey: ['comments', businessId, entityType, entityId] });
    },
    onError: (err: Error) => toast.error(err.message || 'Failed to update comment'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => CommentsService.deleteComment(id, businessId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', businessId, entityType, entityId] });
    },
    onError: (err: Error) => toast.error(err.message || 'Failed to delete comment'),
  });

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b pb-3">
        <MessageSquare className="h-4 w-4" />
        <span className="font-medium">Comments</span>
        <span className="text-muted-foreground text-sm">({comments.length})</span>
      </div>

      {/* Comments list */}
      <div className="flex-1 space-y-3 overflow-y-auto py-3">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
          </div>
        ) : comments.length === 0 ? (
          <p className="text-muted-foreground py-6 text-center text-sm">No comments yet. Be the first to comment!</p>
        ) : (
          comments.map((comment: Comment) => (
            <div key={comment.id} className="rounded-lg border bg-muted/30 p-3 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{comment.authorName}</span>
                <div className="flex items-center gap-1">
                  <span className="text-muted-foreground text-xs">
                    {new Date(comment.createdAt).toLocaleString()}
                  </span>
                  {comment.isEdited && <span className="text-muted-foreground text-xs">(edited)</span>}
                  {comment.authorId === currentUserId && !comment.isDeleted && (
                    <>
                      <Button
                        variant="ghost" size="icon" className="h-6 w-6"
                        onClick={() => { setEditingId(comment.id); setEditBody(comment.body); }}
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost" size="icon" className="h-6 w-6 text-destructive"
                        onClick={() => deleteMutation.mutate(comment.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
              {editingId === comment.id ? (
                <div className="space-y-2">
                  <Textarea value={editBody} onChange={(e) => setEditBody(e.target.value)} rows={2} className="text-sm" />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => updateMutation.mutate({ id: comment.id, body: editBody })} disabled={updateMutation.isPending}>
                      {updateMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Save'}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setEditingId(undefined)}>Cancel</Button>
                  </div>
                </div>
              ) : (
                <p className={`text-sm ${comment.isDeleted ? 'text-muted-foreground italic' : ''}`}>
                  {comment.body}
                </p>
              )}
            </div>
          ))
        )}
      </div>

      {/* New comment input */}
      <div className="border-t pt-3 space-y-2">
        <Textarea
          placeholder="Write a comment... Use @name to mention someone"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          rows={3}
          className="text-sm resize-none"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey) && newComment.trim()) {
              e.preventDefault();
              createMutation.mutate();
            }
          }}
        />
        <Button
          size="sm"
          className="w-full gap-2"
          onClick={() => createMutation.mutate()}
          disabled={!newComment.trim() || createMutation.isPending}
        >
          {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          Post Comment
        </Button>
      </div>
    </div>
  );
}
