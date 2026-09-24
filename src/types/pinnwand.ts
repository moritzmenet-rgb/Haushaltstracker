export type PostItType = 'standard' | 'poll';

export type PostItColor = 
  | 'yellow' 
  | 'pink' 
  | 'green' 
  | 'blue' 
  | 'purple' 
  | 'orange' 
  | 'white';

export type PinColor = 'red' | 'wood' | 'gold' | 'blue' | 'black';

export interface PollOption {
  id: string;
  text: string;
  votes: number;
  voterIds?: string[];
}

export interface PostIt {
  id: string;
  boardId: string;
  type: PostItType;
  parentId?: string | null;
  level: number; // 0 = Haupt-Thema, 1 = Antwort, 2 = Kommentar/Verschachtelt
  title?: string;
  content: string;
  author: string;
  authorId: string;
  color: PostItColor;
  pinColor?: PinColor;
  x: number;
  y: number;
  rotation: number;
  reactions: Record<string, number>;
  votedReactions?: Record<string, string[]>; // emoji -> array of authorIds
  pollQuestion?: string;
  pollOptions?: PollOption[];
  createdAt: number;
  updatedAt: number;
}

export interface BoardSettings {
  id: string;
  title: string;
  theme: 'cork' | 'dark-cork' | 'blueprint' | 'slate';
  createdAt: number;
  updatedAt: number;
}

export interface ViewportState {
  x: number;
  y: number;
  scale: number;
}
