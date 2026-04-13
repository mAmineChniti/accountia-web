import { type BaseResponse } from './sharedTypes';

export interface Comment {
  id: string;
  businessId: string;
  entityType: 'invoice' | 'expense' | 'purchase_order';
  entityId: string;
  authorId: string;
  authorName: string;
  body: string;
  parentId?: string | null;
  mentions: string[];
  isEdited: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CommentListResponse extends BaseResponse {
  entityId: string;
  entityType: string;
  comments: Comment[];
}

export type CommentResponse = BaseResponse & Comment;
