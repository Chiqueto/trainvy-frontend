export const CREF_REGIONS = [
  "AC",
  "AL",
  "AP",
  "AM",
  "BA",
  "CE",
  "DF",
  "ES",
  "GO",
  "MA",
  "MT",
  "MS",
  "MG",
  "PA",
  "PB",
  "PR",
  "PE",
  "PI",
  "RJ",
  "RN",
  "RS",
  "RO",
  "RR",
  "SC",
  "SP",
  "SE",
  "TO",
] as const;
export function officialCrefSource(region: string) {
  if (region === "SP")
    return {
      name: "Consulta oficial CREF/SP",
      url: "https://cref-sp.implanta.net.br/servicosOnline/Publico/ConsultaInscritos",
    };
  if (region === "RJ")
    return {
      name: "Consulta oficial CREF/RJ",
      url: "https://cref-rj.implanta.net.br/servicosOnline/Publico/ConsultaInscritos",
    };
  return {
    name: "Consultas oficiais CONFEF/CREFs",
    url: "https://www.confef.org.br/confef/registrados/",
  };
}
