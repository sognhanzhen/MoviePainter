import type { NextApiRequest, NextApiResponse } from "next";
import app from "../../server/src/app.js";

export const config = {
  api: {
    bodyParser: false,
    externalResolver: true
  }
};

export default function apiHandler(req: NextApiRequest, res: NextApiResponse) {
  app(req, res);
}
