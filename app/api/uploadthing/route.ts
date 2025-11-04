import { createRouteHandler } from "uploadthing/next";
import { uploadRouter } from "./core";

export const { POST, GET } = createRouteHandler({ router: uploadRouter });
