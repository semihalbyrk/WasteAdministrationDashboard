export const ENTITIES = {
  reinis_nv: "Reinis N.V.",
  erasmus_mc: "Erasmus MC (Rotterdam)",
  maasstad: "Maasstad Ziekenhuis (Rotterdam)",
  havenbedrijf: "Port of Rotterdam Authority",
  rotterdam_municipality: "Municipality of Rotterdam",
  bouwcom: "Bouwcom Rotterdam BV (Construction)",
  avr: "AVR Afvalverwerking (Rotterdam)",
  renewi: "Renewi (Rotterdam)",
  indaver: "Indaver NL",
  attero: "Attero NL",
  atm: "ATM Moerdijk",
  sme_haz: "Specialist Hazardous Waste Center (NL)",
  suez: "SUEZ NL",
}

export const DISPOSERS = [
  { id: "erasmus_mc", label: ENTITIES.erasmus_mc },
  { id: "maasstad", label: ENTITIES.maasstad },
  { id: "havenbedrijf", label: ENTITIES.havenbedrijf },
  { id: "rotterdam_municipality", label: ENTITIES.rotterdam_municipality },
  { id: "bouwcom", label: ENTITIES.bouwcom },
  { id: "reinis_nv", label: ENTITIES.reinis_nv },
]

export const SENDERS = [
  { id: "reinis_nv", label: ENTITIES.reinis_nv },
  { id: "rotterdam_municipality", label: ENTITIES.rotterdam_municipality },
  { id: "havenbedrijf", label: ENTITIES.havenbedrijf },
  { id: "erasmus_mc", label: ENTITIES.erasmus_mc },
  { id: "bouwcom", label: ENTITIES.bouwcom },
]

export const TRANSPORTERS = [
  { id: "reinis_nv", label: ENTITIES.reinis_nv },
  { id: "renewi", label: ENTITIES.renewi },
]

export const RECEIVERS = [
  { id: "avr", label: ENTITIES.avr },
  { id: "renewi", label: ENTITIES.renewi },
  { id: "indaver", label: ENTITIES.indaver },
  { id: "attero", label: ENTITIES.attero },
  { id: "atm", label: ENTITIES.atm },
  { id: "sme_haz", label: ENTITIES.sme_haz },
  { id: "suez", label: ENTITIES.suez },
]

export const PROCESSING_METHODS = [
  "Material Recovery",
  "Energy Recovery",
  "Composting",
  "Secure Disposal",
  "Chemical Treatment",
]

export const SERVICE_POINTS: Record<string, Array<{ id: string; label: string }>> = {
  erasmus_mc: [
    { id: "erasmus_waste_dock", label: "Erasmus MC – Waste Dock" },
    { id: "erasmus_pharmacy_labs", label: "Erasmus MC – Pharmacy & Labs" },
  ],
  maasstad: [{ id: "maasstad_service_yard", label: "Maasstad – Service Yard" }],
  havenbedrijf: [
    { id: "maasvlakte_gate_a", label: "Maasvlakte – Gate A" },
    { id: "waalhaven_yard_3", label: "Waalhaven – Yard 3" },
  ],
  rotterdam_municipality: [
    { id: "municipal_transfer_zuid", label: "Municipal Transfer Station Zuid" },
    { id: "municipal_depot_noord", label: "Municipal Depot Noord" },
  ],
  bouwcom: [
    { id: "bouwcom_keileweg", label: "Bouwcom – Site Keileweg" },
    { id: "bouwcom_europoort", label: "Bouwcom – Site Europoort" },
  ],
  reinis_nv: [], // No service points for Reinis N.V.
}

export const REPORTING_SYSTEMS = ["Basic System", "Collector Scheme", "Route Collection"] as const

export const EWC_CODES = [
  { code: "18 01 03*", name: "Infectious Medical Waste", hazardous: true },
  { code: "18 01 09", name: "Pharmaceutical Waste", hazardous: false },
  { code: "20 03 01", name: "Mixed Municipal Waste", hazardous: false },
  { code: "20 01 08", name: "Biodegradable Kitchen/Garden Waste", hazardous: false },
  { code: "15 01 02", name: "Plastic Packaging", hazardous: false },
  { code: "20 01 01", name: "Paper and Cardboard", hazardous: false },
  { code: "20 03 07", name: "Bulky Waste", hazardous: false },
  { code: "17 09 04", name: "Construction & Demolition Waste", hazardous: false },
  { code: "17 05 03*", name: "Contaminated Soil", hazardous: true },
  { code: "16 05 06*", name: "Laboratory Chemicals", hazardous: true },
  { code: "16 02 14", name: "Discarded Electronic Equipment", hazardous: false },
  { code: "17 06 05*", name: "Construction Materials Containing Asbestos", hazardous: true },
  { code: "13 02 05*", name: "Mineral-Based Engine Oils", hazardous: true },
  { code: "15 01 10*", name: "Packaging Containing Hazardous Residues", hazardous: true },
]

export const ALL_ENTITIES = Array.from(new Set([...DISPOSERS.map((d) => d.id), ...SENDERS.map((s) => s.id)]))
  .map((id) => {
    const entity = DISPOSERS.find((d) => d.id === id) || SENDERS.find((s) => s.id === id)
    return entity!
  })
  .sort((a, b) => a.label.localeCompare(b.label))
