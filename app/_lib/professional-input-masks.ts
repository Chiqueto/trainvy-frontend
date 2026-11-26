export function maskCpf(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  return digits
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3}\.\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3}\.\d{3}\.\d{3})(\d)/, "$1-$2");
}

export function maskCpfOrCnpj(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 14);
  if (digits.length <= 11) {
    return digits
      .replace(/^(\d{3})(\d)/, "$1.$2")
      .replace(/^(\d{3}\.\d{3})(\d)/, "$1.$2")
      .replace(/^(\d{3}\.\d{3}\.\d{3})(\d)/, "$1-$2");
  }
  return digits
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2}\.\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{2}\.\d{3}\.\d{3})(\d)/, "$1/$2")
    .replace(/^(\d{2}\.\d{3}\.\d{3}\/\d{4})(\d)/, "$1-$2");
}

export function maskCref(value: string) {
  const upper = value.toUpperCase();
  const normalized = upper.replace(/[^0-9GP]/g, "");
  const digits = normalized.replace(/\D/g, "").slice(0, 6);
  const category = normalized.match(/[GP]/)?.[0];
  if (digits.length === 6 && category) {
    return `${digits}-${category}`;
  }
  if (digits.length === 6 && upper.includes("-")) {
    return `${digits}-`;
  }
  return digits;
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

export function validCnpj(value: string) {
  const digits = value.replace(/\D/g, "");
  if (!/^\d{14}$/.test(digits) || /^(\d)\1{13}$/.test(digits)) return false;
  const calc = (base: string, weights: number[]) => {
    const sum = weights.reduce(
      (acc, weight, idx) => acc + Number(base[idx]) * weight,
      0,
    );
    const mod = sum % 11;
    return mod < 2 ? 0 : 11 - mod;
  };
  const d1 = calc(digits.slice(0, 12), [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  if (d1 !== Number(digits[12])) return false;
  const d2 = calc(digits.slice(0, 13), [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  return d2 === Number(digits[13]);
}

export function validCpfOrCnpj(value: string) {
  const digits = value.replace(/\D/g, "");
  if (digits.length === 11) return validCpf(digits);
  if (digits.length === 14) return validCnpj(digits);
  return false;
}
