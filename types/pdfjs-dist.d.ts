declare module "pdfjs-dist" {
  interface PDFDocumentProxy {
    numPages: number;
    getPage(pageNumber: number): Promise<PDFPageProxy>;
  }

  interface PDFPageProxy {
    getTextContent(): Promise<TextContent>;
  }

  interface TextContent {
    items: Array<{
      str: string;
      transform: number[];
      width: number;
      height: number;
      dir: string;
    }>;
    styles: { [key: string]: any };
  }

  interface PDFDocumentLoadingTask {
    promise: Promise<PDFDocumentProxy>;
  }

  interface GetDocumentParams {
    data: Uint8Array;
  }

  interface GlobalWorkerOptions {
    workerSrc: string;
  }

  const GlobalWorkerOptions: GlobalWorkerOptions;
  function getDocument(params: GetDocumentParams): PDFDocumentLoadingTask;

  export {
    GlobalWorkerOptions,
    getDocument,
    PDFDocumentProxy,
    PDFPageProxy,
    TextContent,
    PDFDocumentLoadingTask,
    GetDocumentParams,
  };
}
