import { Instagram, Facebook, Twitter, MessageCircle } from "lucide-react";
import React from "react";

export interface SocialPlatform {
  id: string;
  label: string;
  icon: string; // Lucide icon name or SVG path
  color: string;
  urlPrefix?: string;
  metricField?: string;
}

export const SOCIAL_NETWORKS = [
  {
    id: "instagram",
    label: "Instagram",
    color: "text-pink-600",
    metricField: "real_reach_instagram",
    urlPrefix: "https://instagram.com/"
  },
  {
    id: "tiktok",
    label: "TikTok",
    color: "text-black dark:text-white",
    metricField: "real_reach_tiktok",
    urlPrefix: "https://tiktok.com/@"
  },
  {
    id: "facebook",
    label: "Facebook",
    color: "text-blue-600",
    metricField: "real_reach_facebook",
    urlPrefix: "https://facebook.com/"
  },
  {
    id: "x",
    label: "X",
    color: "text-slate-900 dark:text-slate-100",
    metricField: "real_reach_x",
    urlPrefix: "https://x.com/"
  },
  {
    id: "threads",
    label: "Threads",
    color: "text-slate-950 dark:text-slate-50",
    metricField: "real_reach_threads",
    urlPrefix: "https://threads.net/@"
  }
];

export const PLATFORMS_CONFIG = {
  instagram: { label: "Instagram", color: "#E1306C" },
  tiktok: { label: "TikTok", color: "#000000" },
  facebook: { label: "Facebook", color: "#1877F2" },
  x: { label: "X", color: "#000000" },
  threads: { label: "Threads", color: "#000000" }
};
