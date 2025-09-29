// types/comments.ts

export interface Comment {
  id: string;
  sceneId: string;
  text: string;
  createdAt: string; // ISO string
  resolved: boolean;
  parentId?: string; // For replies
}
