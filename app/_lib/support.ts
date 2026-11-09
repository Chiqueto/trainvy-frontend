export const supportEmail =
  process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim() || "lfchiqueto@gmail.com";
export function supportUrl(subject = "Suporte Trainvy") {
  return `mailto:${supportEmail}?subject=${encodeURIComponent(subject)}`;
}
