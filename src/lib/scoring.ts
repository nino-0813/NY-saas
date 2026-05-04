import type { HearingSubmission } from "@/lib/supabase/types";

export type CategoryScore = {
  key: "web" | "line" | "social" | "booking" | "numbers";
  label: string;
  score: number;
  max: number;
  recommendations: string[];
};

export type Diagnosis = {
  total: number;
  categories: CategoryScore[];
  highlights: string[];
  grade: "S" | "A" | "B" | "C" | "D";
};

export function diagnose(s: HearingSubmission): Diagnosis {
  const categories: CategoryScore[] = [
    scoreWeb(s),
    scoreLine(s),
    scoreSocial(s),
    scoreBooking(s),
    scoreNumbers(s),
  ];

  const total = categories.reduce((sum, c) => sum + c.score, 0);

  const sorted = [...categories].sort((a, b) => a.score - b.score);
  const highlights = sorted.flatMap((c) => c.recommendations).slice(0, 5);

  const grade =
    total >= 85 ? "S"
    : total >= 70 ? "A"
    : total >= 55 ? "B"
    : total >= 35 ? "C"
    : "D";

  return { total, categories, highlights, grade };
}

function scoreWeb(s: HearingSubmission): CategoryScore {
  let score = 0;
  const recs: string[] = [];

  if (s.has_website) {
    score += 8;
  } else {
    recs.push(
      "公式サイトまたはLPがありません。集客導線の起点となるLPがあるだけで、SNS・広告・SEOからの流入をすべて受け止められます。",
    );
  }

  if (s.has_gbp) {
    score += 4;
    const reviews = s.gbp_review_count ?? 0;
    const rating = s.gbp_rating ?? 0;

    if (reviews >= 30) score += 4;
    else if (reviews >= 10) score += 2;
    else
      recs.push(
        `Google口コミが${reviews}件です。MEOで集客するには30件以上が目安。来店時の口コミ依頼導線を入れると一気に伸びます。`,
      );

    if (rating >= 4.5) score += 4;
    else if (rating >= 4.0) score += 2;
    else if (rating > 0)
      recs.push(
        `Googleの評価が${rating.toFixed(1)}です。低評価レビューへの返信運用と、来店体験の改善で4.5以上を目指せます。`,
      );
  } else {
    recs.push(
      "Googleビジネスプロフィールが未整備です。地域集客の最重要施策で、整備するだけで月+10〜20件の問い合わせが見込めるケースも珍しくありません。",
    );
  }

  return {
    key: "web",
    label: "Web基盤",
    score: clampScore(score, 20),
    max: 20,
    recommendations: recs,
  };
}

function scoreLine(s: HearingSubmission): CategoryScore {
  let score = 0;
  const recs: string[] = [];

  if (s.has_line) {
    score += 8;
    const subs = s.line_subscriber_count ?? 0;
    if (subs >= 500) score += 12;
    else if (subs >= 200) score += 8;
    else if (subs >= 50) score += 4;
    else
      recs.push(
        `LINE登録者が${subs}人です。LP・店頭・予約完了画面に登録導線を埋めれば、月+30〜50人ペースで増やせます。`,
      );
  } else {
    recs.push(
      "LINE公式アカウントが未開設です。リピート顧客への直接配信ができないため、最も改善余地の大きい領域です。導入だけで翌月から成果が見えます。",
    );
  }

  return {
    key: "line",
    label: "LINE導線",
    score: clampScore(score, 20),
    max: 20,
    recommendations: recs,
  };
}

function scoreSocial(s: HearingSubmission): CategoryScore {
  let score = 0;
  const recs: string[] = [];

  if (s.has_instagram) {
    score += 4;
    const followers = s.instagram_follower_count ?? 0;
    if (followers >= 5000) score += 10;
    else if (followers >= 1000) score += 6;
    else if (followers >= 300) score += 3;
    else
      recs.push(
        "Instagramフォロワーが300人未満です。投稿テーマと頻度を整備し、リール中心に切り替えると伸びやすい段階です。",
      );
  } else {
    recs.push(
      "Instagram運用がありません。サロン・宿泊・飲食など写真映えする業種では集客の柱になります。",
    );
  }

  if (s.has_ads) {
    score += 6;
  } else {
    recs.push(
      "広告運用なし。MEOと口コミ施策が固まったら、Google指名検索広告から始めると無駄打ちが少ないです。",
    );
  }

  return {
    key: "social",
    label: "SNS / 広告",
    score: clampScore(score, 20),
    max: 20,
    recommendations: recs,
  };
}

function scoreBooking(s: HearingSubmission): CategoryScore {
  let score = 0;
  const recs: string[] = [];

  switch (s.booking_method) {
    case "both":
      score = 20;
      break;
    case "line":
      score = 18;
      break;
    case "form":
      score = 16;
      break;
    case "phone":
      score = 8;
      recs.push(
        "予約が電話のみです。営業時間外の機会損失が大きいため、最低でもLINE予約か予約フォームの追加で夜間予約の取りこぼしを減らせます。",
      );
      break;
    case "none":
    default:
      score = 0;
      recs.push(
        "デジタル予約導線が未整備です。フォームかLINE予約の導入が最優先施策です。",
      );
      break;
  }

  return {
    key: "booking",
    label: "予約導線",
    score: clampScore(score, 20),
    max: 20,
    recommendations: recs,
  };
}

function scoreNumbers(s: HearingSubmission): CategoryScore {
  const fields = [
    s.monthly_visitors,
    s.monthly_bookings,
    s.monthly_revenue_range,
    s.repeat_rate_percent,
  ];
  const filled = fields.filter((v) => v != null && v !== "").length;
  const score = filled * 5;

  const recs: string[] = [];
  if (filled < 2) {
    recs.push(
      "数字の把握が不足しています。GA4・予約データ・月商の3点が見えるだけで、改善判断のスピードが2〜3倍になります。",
    );
  } else if (filled < 4) {
    recs.push(
      "数字の把握度は中程度。月次レビューで自然に追える運用に切り替えると、改善サイクルが回り始めます。",
    );
  }

  return {
    key: "numbers",
    label: "数字把握",
    score,
    max: 20,
    recommendations: recs,
  };
}

function clampScore(n: number, max: number): number {
  return Math.max(0, Math.min(n, max));
}
