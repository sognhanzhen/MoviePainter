import type { NextApiRequest, NextApiResponse } from "next";
import { createApp } from "../../server/src/app";

export const config = {
  api: {
    bodyParser: false,
    externalResolver: true
  }
};

const app = createApp();

export default function apiHandler(req: NextApiRequest, res: NextApiResponse) {
  app(req, res);
}
