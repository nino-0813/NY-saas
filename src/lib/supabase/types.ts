export type ClientStatus = "active" | "paused" | "archived";

export type Client = {
  id: string;
  name: string;
  industry: string | null;
  status: ClientStatus;
  current_issue: string | null;
  monthly_goal: string | null;
  share_token: string;
  logo_url: string | null;
  created_at: string;
  updated_at: string;
};

export type Kpi = {
  id: string;
  client_id: string;
  month: string;
  site_visits: number | null;
  line_signups: number | null;
  inquiries: number | null;
  expected_revenue: number | null;
  improvements_count: number | null;
  estimated_impact: string | null;
  created_at: string;
  updated_at: string;
};

export type Improvement = {
  id: string;
  client_id: string;
  title: string;
  description: string | null;
  purpose: string | null;
  result: string | null;
  done_at: string;
  created_at: string;
};

export type NextActionPriority = "high" | "medium" | "low";
export type NextActionStatus = "todo" | "doing" | "done";

export type NextAction = {
  id: string;
  client_id: string;
  title: string;
  expected_effect: string | null;
  priority: NextActionPriority;
  status: NextActionStatus;
  due_date: string | null;
  created_at: string;
  updated_at: string;
};

export type KpiSnapshot = Pick<
  Kpi,
  | "site_visits"
  | "line_signups"
  | "inquiries"
  | "expected_revenue"
  | "improvements_count"
  | "estimated_impact"
>;

export type ImprovementSnapshot = Pick<
  Improvement,
  "title" | "description" | "purpose" | "result" | "done_at"
>;

export type NextActionSnapshot = Pick<
  NextAction,
  "title" | "expected_effect" | "priority" | "due_date"
>;

export type HearingStatus = "new" | "contacted" | "converted" | "archived";

export type BookingMethod = "form" | "line" | "both" | "phone" | "none" | null;

export type HearingSubmission = {
  id: string;

  company_name: string;
  industry: string | null;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  contact_line: string | null;
  website_url: string | null;

  main_product: string | null;
  price_range: string | null;
  target_customer: string | null;

  has_website: boolean | null;
  has_gbp: boolean | null;
  gbp_review_count: number | null;
  gbp_rating: number | null;
  has_line: boolean | null;
  line_subscriber_count: number | null;
  has_instagram: boolean | null;
  instagram_follower_count: number | null;
  booking_method: BookingMethod;
  has_ads: boolean | null;

  monthly_visitors: number | null;
  monthly_bookings: number | null;
  monthly_revenue_range: string | null;
  repeat_rate_percent: number | null;

  biggest_issue: string | null;
  six_month_goal: string | null;
  past_attempts: string | null;

  status: HearingStatus;
  converted_to_client_id: string | null;
  admin_note: string | null;

  created_at: string;
  updated_at: string;
};

export type Report = {
  id: string;
  client_id: string;
  month: string;
  highlight: string | null;
  achievements: string | null;
  implemented_summary: string | null;
  next_focus: string | null;
  kpi_snapshot: KpiSnapshot | null;
  improvements_snapshot: ImprovementSnapshot[] | null;
  next_actions_snapshot: NextActionSnapshot[] | null;
  published: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};
