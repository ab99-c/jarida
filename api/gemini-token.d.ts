import type { Request, Response } from "express";

declare function handler(req: Request | any, res: Response | any): Promise<any>;
export default handler;
