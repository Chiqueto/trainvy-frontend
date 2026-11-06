export function maskCpf(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  return digits
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3}\.\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3}\.\d{3}\.\d{3})(\d)/, "$1-$2");
}

export function maskCref(value: string) {
  const normalized = value.toUpperCase().replace(/[^0-9GP]/g, "");
  const digits = normalized.replace(/\D/g, "").slice(0, 6);
  const category = normalized.match(/[GP]/)?.[0];
  return digits + (digits.length === 6 && category ? `-${category}` : "");
}
