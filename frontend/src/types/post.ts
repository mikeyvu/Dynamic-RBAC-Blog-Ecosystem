export interface PostDocument {
  id: number;
  imageUrl: string;
  postId: number;
  createdAt?: string;
}

export interface Post {
  id: number;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  authorId: number;
  
  documents: PostDocument[]; 

  user: {
    id: number;
    email: string;
  };
}