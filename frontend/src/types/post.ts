export interface Post {
    id: number;
    title: string;
    content: string;
    imageUrl?: string | null;
    createdAt: string;
    updatedAt: string;
    authorId: number;
    user: {
        id: number;
        email:string;
    };
}