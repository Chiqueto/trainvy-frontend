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

export function validCpf(value: string) {
  const digits = value.replace(/\D/g, "");
  if (!/^\d{11}$/.test(digits) || /^(\d)\1{10}$/.test(digits)) return false;
  return [9, 10].every((length) => {
    const sum = [...digits.slice(0, length)].reduce(
      (total, n, index) => total + Number(n) * (length + 1 - index),
      0,
    );
    return ((sum * 10) % 11) % 10 === Number(digits[length]);
  });
}
