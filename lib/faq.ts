import {
  ClipboardList,
  CreditCard,
  HelpCircle,
  Receipt,
  TrainFront,
  XCircle,
  Zap,
  type LucideIcon,
} from "lucide-react";

import { api } from "./api";

// Mirrors the backend FaqCategory enum exactly:
//   BOOKING | REFUND | PAYMENT | CANCELLATION | TATKAL | PNR | GENERAL
export type FaqCategory =
  | "BOOKING"
  | "REFUND"
  | "PAYMENT"
  | "CANCELLATION"
  | "TATKAL"
  | "PNR"
  | "GENERAL";

// Item shape returned by GET /faq/all.
export type FaqItem = {
  id: string;
  question: string;
  answer: string;
  category: FaqCategory;
  display_order: number;
};

export type FaqMeta = {
  total: number;
  page: number;
  size: number;
  pages: number;
};

export type FaqTopic = {
  key: FaqCategory;
  label: string;
  blurb: string;
  icon: LucideIcon;
};

// Display config for the "Browse by topic" grid — one entry per enum value,
// ordered for the grid with a UI label, blurb and icon.
export const FAQ_TOPICS: FaqTopic[] = [
  {
    key: "BOOKING",
    label: "Booking",
    blurb: "Search, book & seat selection",
    icon: TrainFront,
  },
  {
    key: "PNR",
    label: "PNR & Status",
    blurb: "Waitlist, charts, confirmation",
    icon: ClipboardList,
  },
  {
    key: "PAYMENT",
    label: "Payments",
    blurb: "UPI, cards, failures",
    icon: CreditCard,
  },
  {
    key: "CANCELLATION",
    label: "Cancellation",
    blurb: "Cancel a ticket & fees",
    icon: XCircle,
  },
  {
    key: "REFUND",
    label: "Refunds",
    blurb: "Status, timelines, amount",
    icon: Receipt,
  },
  {
    key: "TATKAL",
    label: "Tatkal",
    blurb: "Windows, quota, tips",
    icon: Zap,
  },
  {
    key: "GENERAL",
    label: "General",
    blurb: "Account, profile, app",
    icon: HelpCircle,
  },
];

export const FAQ_TOPIC_LABEL = Object.fromEntries(
  FAQ_TOPICS.map((t) => [t.key, t.label])
) as Record<FaqCategory, string>;

export const faqApi = {
  // GET /faq/all?category=BOOKING&order_by=created_at&page=1&size=5
  // Response: { data: FaqItem[], meta: FaqMeta }.
  all: (params: {
    category?: FaqCategory;
    orderBy?: string;
    page?: number;
    size?: number;
  }) =>
    api
      .get<{ data: FaqItem[]; meta: FaqMeta }>("/faq/all", {
        params: {
          ...(params.category ? { category: params.category } : {}),
          order_by: params.orderBy ?? "created_at",
          page: params.page ?? 1,
          size: params.size ?? 50,
        },
      })
      .then((r) => ({ items: r.data.data, meta: r.data.meta })),
};
