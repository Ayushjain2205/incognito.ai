declare module "@langchain/community/document_loaders/fs/pdf" {
  export class PDFLoader {
    constructor(file: any);
    load(): Promise<Document[]>;
  }
}

declare module "langchain/text_splitter" {
  export interface TextSplitterOptions {
    chunkSize?: number;
    chunkOverlap?: number;
  }

  export class RecursiveCharacterTextSplitter {
    constructor(options: TextSplitterOptions);
    splitDocuments(docs: Document[]): Promise<Document[]>;
  }
}

interface Document {
  pageContent: string;
  metadata: Record<string, any>;
}
