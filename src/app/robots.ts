import type { MetadataRoute } from "next";
import { isCompetitionMode } from "../lib/competition-mode";

export default function robots(): MetadataRoute.Robots {
  return isCompetitionMode()
    ? { rules: { userAgent: "*", disallow: "/" } }
    : { rules: { userAgent: "*", allow: "/" } };
}
