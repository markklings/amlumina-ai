declare module "pdf-parse/lib/pdf-parse.js" {
  function parse(
    dataBuffer: Buffer | ArrayBuffer | Uint8Array,
    options?: any,
  ): Promise<{
    numpages: number;
    numrender: number;
    info: any;
    metadata: any;
    version: string;
    text: string;
  }>;
  export default parse;
}

declare module "pdf-parse" {
  const parse: (data: Buffer | ArrayBuffer | Uint8Array) => Promise<{
    text: string;
    numpages: number;
    numrender: number;
    info: any;
    metadata: any;
    version: string;
  }>;
  export default parse;
}
