declare module "pdf-parse*" {
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
