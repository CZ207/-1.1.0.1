export enum Role {
  User = 'user',
  Assistant = 'assistant',
  System = 'system'
}

export interface Message {
  role: Role;
  content: string;
  id: string;
}

export interface ChatState {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
}

export interface DashScopeResponseChunk {
  output: {
    choices: Array<{
      message: {
        content: string;
        role: string;
      };
      finish_reason: string | null;
    }>;
  };
  request_id: string;
}