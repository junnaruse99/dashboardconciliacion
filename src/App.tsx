import {
  ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Activity,
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Download,
  FileWarning,
  Filter,
  LayoutDashboard,
  Menu,
  RefreshCw,
  Search,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";
import Papa from "papaparse";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import "./App.css";

type TabId = "overview" | "alta" | "cancelacion" | "renovacion" | "cobranza";
type ProcessCode = "CAN" | "REN" | "INV";
type StatusCode = "PEN" | "SOL";
type ContractStatus = "ANU" | "BAJ" | "ERR" | "FOR" | "PEN" | "INC";
interface Row {
  id: number;
  entity: string;
  branch: string;
  account: string;
  policy: string;
  receipt: number;
  process: ProcessCode;
  errorCode: string;
  errorDescription: string;
  status: StatusCode;
  createdAt: string;
  auditAt: string;
  auditUser: string;
}
interface Movement {
  id: number;
  reconciliationId: number;
  process: ProcessCode;
  paymentAmount: number;
  operatedAmount: number;
  inputFileName: string;
  errorCode: string;
  errorDescription: string;
  originalDetail: string;
  reconciliationDescription: string;
  createdBy: string;
  createdAt: string;
  auditUser: string;
  auditAt: string;
}
interface MovementSummary {
  count: number;
  paymentAmount: number;
  operatedAmount: number;
  difference: number;
}
interface Contract {
  id: string;
  entity: string;
  branch: string;
  policy: string;
  customer: string;
  productId: string;
  renewalStatus: string;
  rimacStatus: ContractStatus;
  bankStatus: ContractStatus;
  createdAt: string;
  sourcePlatform: string;
}
type RenewalContractStatusType = "ENV" | "NRE" | "REN" | "PRN" | "PRE" | "RZD";
interface IcdtcapRecord {
  key: string;
  productCode: string;
  startDate: string;
  expiryDate: string;
  chargeDate: string;
  baixaDate: string;
  annulmentDate: string;
  modality: string;
  paymentFrequency: string;
  periodicPremium: number | null;
  currency: string;
  channelInfo: string;
  updatedAt: string;
  movementDate: string;
}
interface EnrichedContract extends Contract {
  productCode: string;
  productDescription: string;
  startDate: string;
  expiryDate: string;
  chargeDate: string;
  baixaDate: string;
  annulmentDate: string;
  modality: string;
  modalityDescription: string;
  paymentFrequency: string;
  periodicPremium: number | null;
  currency: string;
  channel: string;
  subchannel: string;
  icdtcapMatched: boolean;
}
interface IcdtcamRecord {
  key: string;
  movementNumber: number;
  settlementDate: string;
  collectionDate: string;
  attemptCount: number;
  chargedAmount: number;
  collectionStatus: string;
}
interface IcdtlitRecord {
  literal: string;
  languageId: string;
  description: string;
  updatedAt: string;
}

const PROCESS_LABELS: Record<ProcessCode, string> = {
  CAN: "Cancelación",
  REN: "Renovación",
  INV: "Cobranza",
};
const PROCESS_COLORS: Record<ProcessCode, string> = {
  CAN: "#ef6c69",
  REN: "#665cf6",
  INV: "#20a77a",
};
const ERRORS = {
  CAN: [
    ["CAN_FILE_NOT_SENT", "Archivo de cancelación no enviado"],
    ["CAN_DUPLICATE_RESP", "Respuesta de cancelación duplicada"],
    ["CAN_UNEXPECTED_ERR", "Error inesperado en cancelación"],
    ["CAN_CONCILIATION", "Cancelación enviada a conciliación"],
  ],
  REN: [
    [
      "PRE_NOTFOUND_ERR",
      "RIMAC no envió la confirmación de renovación para un producto sin renovación automática",
    ],
    [
      "PRE_AUT_NOTFOUND_ERR",
      "RIMAC no envió la confirmación de renovación para un producto con renovación automática",
    ],
    [
      "REN_NOTFOUND_ERR",
      "RIMAC no envió los recibos de renovación para un producto sin renovación automática",
    ],
    [
      "REN_AUT_NOTFOUND_ERR",
      "RIMAC no envió los recibos de renovación para un producto con renovación automática",
    ],
  ],
  INV: [
    ["INV_RIMAC_NOT_SENT", "Cobro automático no informado por RIMAC"],
    ["INV_RIMAC_NOT_CHAR", "Cobro no realizado ni informado por RIMAC"],
  ],
} as const;
type RenewalStage = "PRE" | "RECEIPT";
type RenewalMode = "AUTOMATIC" | "NON_AUTOMATIC";
const RENEWAL_ERROR_META: Record<
  string,
  { stage: RenewalStage; mode: RenewalMode }
> = {
  PRE_NOTFOUND_ERR: { stage: "PRE", mode: "NON_AUTOMATIC" },
  PRE_AUT_NOTFOUND_ERR: { stage: "PRE", mode: "AUTOMATIC" },
  REN_NOTFOUND_ERR: { stage: "RECEIPT", mode: "NON_AUTOMATIC" },
  REN_AUT_NOTFOUND_ERR: { stage: "RECEIPT", mode: "AUTOMATIC" },
};
const CONTRACT_STATUS_LABELS: Record<ContractStatus, string> = {
  ANU: "Anulado",
  BAJ: "Baja",
  ERR: "Error",
  FOR: "Formalizado",
  PEN: "Pendiente",
  INC: "Iniciado",
};
const fmt = (n: number) => new Intl.NumberFormat("es-PE").format(n);
const money = (n: number) =>
  new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
const moneyUsd = (n: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
const dateFmt = (s: string) =>
  s
    ? new Intl.DateTimeFormat("es-PE", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }).format(new Date(`${s.slice(0, 10)}T12:00:00`))
    : "—";
const addCalendarDays = (date: string, amount: number) => {
  if (!date) return "";
  const value = new Date(`${date.slice(0, 10)}T12:00:00`);
  if (Number.isNaN(value.getTime())) return "";
  value.setDate(value.getDate() + amount);
  return value.toISOString().slice(0, 10);
};
const days = (a: string, b: string) =>
  Math.max(
    0,
    Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000),
  );
const signedCalendarDays = (from: string, to: string) => {
  if (!from || !to) return 0;
  const start = new Date(`${from.slice(0, 10)}T12:00:00`),
    end = new Date(`${to.slice(0, 10)}T12:00:00`);
  return Math.round((end.getTime() - start.getTime()) / 86400000);
};
const normalizeKeyPart = (value: string, length: number) => {
  const clean = (value || "").trim();
  return clean ? clean.padStart(length, "0").slice(-length) : "";
};
const contractKey = (
  entity: string,
  branch: string,
  first: string,
  second: string,
  account: string,
) => {
  const parts = [
    normalizeKeyPart(entity, 4),
    normalizeKeyPart(branch, 4),
    normalizeKeyPart(first, 1),
    normalizeKeyPart(second, 1),
    normalizeKeyPart(account, 10),
  ];
  return parts.every(Boolean) ? parts.join("") : "";
};
const contractReferenceKey = (
  entity: string,
  branch: string,
  account: string,
) =>
  `${normalizeKeyPart(entity, 4)}${normalizeKeyPart(branch, 4)}${normalizeKeyPart(account, 10)}`;
const PAYMENT_FREQUENCY_LABELS: Record<string, string> = {
  M: "Mensual",
  B: "Bimestral",
  T: "Trimestral",
  S: "Semestral",
  A: "Anual",
};
const PAYMENT_FREQUENCY_FILTER_OPTIONS = [
  ["ALL", "Todas las frecuencias"],
  ["M", "Mensual"],
  ["T", "Trimestral"],
  ["B", "Bimestral"],
  ["S", "Semestral"],
  ["A", "Anual"],
];
const APPROVED_PRODUCT_CATALOG: Record<string, string> = {
  "1001": "SEGURO VEHICULAR BBVA",
  "1002": "SEGURO HOGAR TOTAL BBVA",
  "1003": "SEGURO NEGOCIO A TU MEDIDA BBVA",
  "1004": "SEGURO PROTECCION DE TARJETAS BBVA",
  "1005": "SEGURO DE VIDA EASY YES",
  "1006": "SEGURO RESPALDO TOTAL",
  "1007": "SEGURO DESEMPLEO BBVA",
  "1008": "SEGURO VIDA INVERSION BBVA",
  "1009": "SEGURO VIDA LEY",
  "1010": "SEGURO CUIDA+",
};
const approvedProductName = (code: string, fallback?: string) =>
  APPROVED_PRODUCT_CATALOG[code] || fallback || `Producto ${code}`;
const CHANNEL_OPTIONS = [
  ["ALL", "Todos los canales"],
  ["PIC", "PIC"],
  ["GLOMO", "Glomo"],
  ["BXI", "BxI"],
  ["ATM", "ATM"],
  ["TELEMARKETING", "Telemarketing"],
  ["CONTACT_CENTER", "Contact Center"],
];
const CHANNEL_BY_CODE: Record<string, string> = {
  PI: "PIC",
  GL: "Glomo",
  BX: "BxI",
  AT: "ATM",
  TM: "Telemarketing",
  CC: "Contact Center",
};
const RENEWAL_CONTRACT_STATUS_LABELS: Record<RenewalContractStatusType, string> = {
  ENV: "Enviado a RIMAC",
  NRE: "No renueva",
  REN: "Renueva",
  PRN: "Por renovar",
  PRE: "Pre renovado",
  RZD: "Rechazado",
};
const SUBCHANNEL_BY_CODE: Record<string, string> = {
  KO: "Konecta",
};
const productFilterOptions = (contracts: EnrichedContract[]) => {
  const products = new Map<string, string>(
    Object.entries(APPROVED_PRODUCT_CATALOG),
  );
  contracts.forEach((contract) => {
    const code = contract.productCode || contract.productId;
    if (code)
      products.set(
        code,
        approvedProductName(
          code,
          contract.productDescription && contract.productDescription !== "—"
            ? contract.productDescription
            : undefined,
        ),
      );
  });
  const approvedCodes = new Set(Object.keys(APPROVED_PRODUCT_CATALOG));
  const orderedApproved = Object.entries(APPROVED_PRODUCT_CATALOG)
    .filter(([code]) => products.has(code))
    .map(([code, description]) => [code, description]);
  const extraProducts = [...products.entries()]
    .filter(([code]) => !approvedCodes.has(code))
    .sort((a, b) => a[1].localeCompare(b[1]));
  return [
    ["ALL", "Todos los productos"],
    ...orderedApproved,
    ...extraProducts,
  ];
};
const paymentFrequencyLabel = (code: string) =>
  code ? PAYMENT_FREQUENCY_LABELS[code] || "Sin catálogo" : "—";
const premiumLabel = (amount: number | null) =>
  amount === null
    ? "—"
    : new Intl.NumberFormat("es-PE", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount);
const literalProductKey = (productCode: string) => {
  const code = (productCode || "").trim();
  return code ? `P${code}1` : "";
};
const literalModalityKey = (productCode: string, modalityCode: string) => {
  const product = (productCode || "").trim().slice(0, 4),
    modality = (modalityCode || "").trim().slice(0, 2);
  return product && modality ? `${product}${modality}` : "";
};
const parseChannelSubchannel = (channelInfo: string) => {
  const raw = (channelInfo || "").toUpperCase(),
    positionalChannel = raw.slice(4, 6),
    positionalSubchannel = raw.slice(5, 7);
  let channel = CHANNEL_BY_CODE[positionalChannel] || "",
    subchannel = SUBCHANNEL_BY_CODE[positionalSubchannel] || "";
  if (!channel) {
    if (raw.includes("CONTACT")) channel = "Contact Center";
    else if (raw.includes("TELE")) channel = "Telemarketing";
    else if (raw.includes("GLOMO")) channel = "Glomo";
    else if (raw.includes("BXI")) channel = "BxI";
    else if (raw.includes("ATM")) channel = "ATM";
    else if (raw.includes("PIC")) channel = "PIC";
  }
  if (!subchannel && raw.includes("KONECTA")) subchannel = "Konecta";
  return {
    channel: channel || "Sin canal",
    subchannel: subchannel || "",
  };
};
const resolveLiteralDescription = (
  index: Map<string, string>,
  literal: string,
  fallback: string,
) => index.get(literal) || fallback || "—";

function demoRows(): Row[] {
  const contracts = demoContracts();
  return Array.from({ length: 186 }, (_, i) => {
    const process = (["CAN", "REN", "INV"] as ProcessCode[])[i % 3];
    const contract = contracts[i % contracts.length];
    const status: StatusCode = i % 5 === 0 || i % 7 === 0 ? "PEN" : "SOL";
    const created = new Date("2026-08-03T09:00:00");
    created.setDate(created.getDate() - ((i * 7) % 345));
    const audit = new Date(created);
    audit.setDate(
      audit.getDate() +
        (status === "SOL" ? 1 + (i % 12) : Math.min(45, i % 38)),
    );
    const processErrors = ERRORS[process],
      error = processErrors[i % processErrors.length];
    return {
      id: 100001 + i,
      entity: contract.entity,
      branch: contract.branch,
      account: contract.id.slice(10),
      policy: "",
      receipt: 1000 + (i % 999),
      process,
      errorCode: error[0],
      errorDescription: error[1],
      status,
      createdAt: created.toISOString(),
      auditAt: audit.toISOString(),
      auditUser:
        status === "SOL"
          ? ["USR1042", "USR2301", "USR4570"][i % 3]
          : "PENDIENTE",
    };
  }).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
function demoMovements(): Movement[] {
  return Array.from({ length: 268 }, (_, i) => {
    const reconciliationId = 100001 + (i % 186),
      process = (["CAN", "REN", "INV"] as ProcessCode[])[i % 3];
    const paymentAmount = process === "INV" ? 150 + ((i * 73) % 4200) : 0,
      operatedAmount =
        process === "INV" && i % 37 === 0
          ? paymentAmount - (0.01 + (i % 8) / 100)
          : paymentAmount;
    const created = new Date("2026-08-03T09:00:00");
    created.setDate(created.getDate() - ((i * 5) % 345));
    const processErrors = ERRORS[process],
      error = processErrors[i % processErrors.length];
    return {
      id: 700001 + i,
      reconciliationId,
      process,
      paymentAmount,
      operatedAmount,
      inputFileName: `RIMAC_${String(created.getMonth() + 1).padStart(2, "0")}${String(created.getDate()).padStart(2, "0")}.CSV`,
      errorCode: error[0],
      errorDescription: error[1],
      originalDetail: "Movimiento recibido desde archivo RIMAC",
      reconciliationDescription:
        paymentAmount === operatedAmount
          ? "Importes coincidentes"
          : "Diferencia de centavos detectada",
      createdBy: "BATCH001",
      createdAt: created.toISOString(),
      auditUser: "AUDIT01",
      auditAt: created.toISOString(),
    };
  });
}
function movementSummaries(movements: Movement[]) {
  const summaries = new Map<number, MovementSummary>();
  movements.forEach((m) => {
    const current = summaries.get(m.reconciliationId) || {
      count: 0,
      paymentAmount: 0,
      operatedAmount: 0,
      difference: 0,
    };
    current.count += 1;
    current.paymentAmount += m.paymentAmount;
    current.operatedAmount += m.operatedAmount;
    current.difference += m.paymentAmount - m.operatedAmount;
    summaries.set(m.reconciliationId, current);
  });
  return summaries;
}
function demoContracts(): Contract[] {
  return Array.from({ length: 112 }, (_, i) => {
    const d = new Date("2026-08-03T09:00:00");
    d.setDate(d.getDate() - ((i * 11) % 345));
    const entity = "0011",
      branch = ["0101", "0204", "0312", "0420"][i % 4],
      account = String(7300000000 + i).slice(-10),
      first = String(i % 10),
      second = String((i + 3) % 10),
      rimacStatus: ContractStatus =
        i % 9 === 0
          ? "PEN"
          : i % 17 === 0
            ? "INC"
            : i % 23 === 0
              ? "ERR"
              : i % 13 === 0
                ? "BAJ"
                : "FOR",
      bankStatus: ContractStatus =
        i % 19 === 0 ? "BAJ" : i % 13 === 0 ? "ANU" : "FOR";
    return {
      id: `${entity}${branch}${first}${second}${account}`,
      entity,
      branch,
      policy: String(6100000 + i * 17),
      customer: String(10000001 + i).slice(-8),
      productId: String(1001 + (i % 10)),
      renewalStatus: (
        ["ENV", "NRE", "REN", "PRN", "PRE", "RZD"] as RenewalContractStatusType[]
      )[i % 6],
      rimacStatus,
      bankStatus,
      createdAt: d.toISOString(),
      sourcePlatform: ["PIC", "WEB", "OFC", "MOBILE"][i % 4],
    };
  }).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
function demoIcdtcap(): IcdtcapRecord[] {
  const currentDate = new Date().toISOString().slice(0, 10);
  const modalityByProduct: Record<string, string[]> = {
    "1001": ["01", "02"],
    "1002": ["01"],
    "1003": ["01", "02"],
    "1004": ["01", "02"],
    "1005": ["01", "02", "03"],
    "1006": ["01"],
    "1007": ["01"],
    "1008": ["01"],
    "1009": ["01"],
    "1010": ["01"],
  };
  const channelSource = [
    "0000PIC",
    "0000GLOMO",
    "0000BXI",
    "0000ATM",
    "0000TELEMARKETING",
    "0000CONTACT_CENTER|KONECTA",
  ];
  const fromDashboard = demoContracts().map((contract, i) => {
    const start = new Date(`${contract.createdAt.slice(0, 10)}T12:00:00`);
    start.setDate(start.getDate() + [0, 2, 5, 10][i % 4]);
    const cancellation = new Date("2026-08-04T12:00:00");
    cancellation.setDate(cancellation.getDate() - (i % 32));
    const charge = new Date(`${currentDate}T12:00:00`);
    charge.setDate(charge.getDate() - (i % 35));
    const expiry = new Date(`${currentDate}T12:00:00`);
    expiry.setDate(expiry.getDate() + [-5, 0, 10, 45, 50, 60, 90][i % 7]);
    return {
      key: contract.id,
      productCode: contract.productId,
      startDate: start.toISOString().slice(0, 10),
      expiryDate: expiry.toISOString().slice(0, 10),
      chargeDate: charge.toISOString().slice(0, 10),
      baixaDate:
        contract.bankStatus === "BAJ"
          ? cancellation.toISOString().slice(0, 10)
          : "",
      annulmentDate:
        contract.bankStatus === "ANU"
          ? cancellation.toISOString().slice(0, 10)
          : "",
      modality:
        modalityByProduct[contract.productId]?.[
          i % modalityByProduct[contract.productId].length
        ] || "01",
      paymentFrequency: (["M", "T", "S", "A"] as const)[i % 4],
      periodicPremium: 35 + (i % 12) * 7.5,
      currency: "PEN",
      channelInfo: channelSource[i % channelSource.length],
      updatedAt: `2026-08-04T${String(8 + (i % 10)).padStart(2, "0")}:00:00`,
      movementDate: "2026-08-04",
    };
  });
  const sampleDates = [
    "2026-08-05",
    "2026-08-10",
    "2026-08-03",
    "2026-08-02",
    "2026-08-08",
    "2026-07-30",
    "2026-07-25",
    "2026-06-20",
    "2026-06-02",
    "2026-05-15",
    "2026-04-08",
    "2026-03-20",
  ];
  const fromSampleMaster = Array.from({ length: 12 }, (_, i) => ({
    key: contractKey(
      "0011",
      ["0101", "0204", "0312", "0420"][i % 4],
      String((i + 3) % 10),
      String((i + 7) % 10),
      String(7300000001 + i),
    ),
    productCode: String(1001 + (i % 4)),
    startDate: sampleDates[i],
    expiryDate: (() => {
      const expiry = new Date(`${currentDate}T12:00:00`);
      expiry.setDate(expiry.getDate() + [0, 15, 45, 50, 75, 100][i % 6]);
      return expiry.toISOString().slice(0, 10);
    })(),
    chargeDate:
      i < 3 ? currentDate : `2026-07-${String(20 + i).padStart(2, "0")}`,
    baixaDate: i === 5 || i === 9 ? "2026-08-04" : "",
    annulmentDate: "",
    modality: modalityByProduct[String(1001 + (i % 4))]?.[0] || "01",
    paymentFrequency: (["M", "T", "S", "A"] as const)[i % 4],
    periodicPremium: 45 + i * 8.25,
    currency: "PEN",
    channelInfo: channelSource[(i + 2) % channelSource.length],
    updatedAt: `2026-08-04T${String(10 + (i % 10)).padStart(2, "0")}:00:00`,
    movementDate: "2026-08-04",
  }));
  return [...fromDashboard, ...fromSampleMaster];
}
function demoIcdtlit(): IcdtlitRecord[] {
  return [
    {
      literal: "P10011",
      languageId: "1",
      description: "SEGURO VEHICULAR BBVA",
      updatedAt: "2026-08-04T10:00:00",
    },
    {
      literal: "P10021",
      languageId: "1",
      description: "SEGURO HOGAR TOTAL BBVA",
      updatedAt: "2026-08-04T10:00:00",
    },
    {
      literal: "P10031",
      languageId: "1",
      description: "SEGURO NEGOCIO A TU MEDIDA BBVA",
      updatedAt: "2026-08-04T10:00:00",
    },
    {
      literal: "P10041",
      languageId: "1",
      description: "SEGURO PROTECCION DE TARJETAS BBVA",
      updatedAt: "2026-08-04T10:00:00",
    },
    {
      literal: "P10051",
      languageId: "1",
      description: "SEGURO DE VIDA EASY YES",
      updatedAt: "2026-08-04T10:00:00",
    },
    {
      literal: "P10061",
      languageId: "1",
      description: "SEGURO RESPALDO TOTAL",
      updatedAt: "2026-08-04T10:00:00",
    },
    {
      literal: "P10071",
      languageId: "1",
      description: "SEGURO DESEMPLEO BBVA",
      updatedAt: "2026-08-04T10:00:00",
    },
    {
      literal: "P10081",
      languageId: "1",
      description: "SEGURO VIDA INVERSION BBVA",
      updatedAt: "2026-08-04T10:00:00",
    },
    {
      literal: "P10091",
      languageId: "1",
      description: "SEGURO VIDA LEY",
      updatedAt: "2026-08-04T10:00:00",
    },
    {
      literal: "P10101",
      languageId: "1",
      description: "SEGURO CUIDA+",
      updatedAt: "2026-08-04T10:00:00",
    },
    {
      literal: "10001",
      languageId: "1",
      description: "Plan Premium",
      updatedAt: "2026-08-04T10:00:00",
    },
    {
      literal: "10002",
      languageId: "1",
      description: "Plan Flexible",
      updatedAt: "2026-08-04T10:00:00",
    },
    {
      literal: "100301",
      languageId: "1",
      description: "Protección Total",
      updatedAt: "2026-08-04T10:00:00",
    },
    {
      literal: "100501",
      languageId: "1",
      description: "Opción 1",
      updatedAt: "2026-08-04T10:00:00",
    },
    {
      literal: "100502",
      languageId: "1",
      description: "Opción 2",
      updatedAt: "2026-08-04T10:00:00",
    },
    {
      literal: "100503",
      languageId: "1",
      description: "Opción 3",
      updatedAt: "2026-08-04T10:00:00",
    },
    {
      literal: "100401",
      languageId: "1",
      description: "Plan Premium",
      updatedAt: "2026-08-04T10:00:00",
    },
    {
      literal: "100402",
      languageId: "1",
      description: "Plan Total",
      updatedAt: "2026-08-04T10:00:00",
    },
  ];
}
function demoIcdtcam(): IcdtcamRecord[] {
  const today = new Date(),
    contracts = demoContracts(),
    receipts: IcdtcamRecord[] = [];
  contracts.forEach((contract, i) => {
    const receiptCount = 1 + (i % 3);
    for (let receipt = 0; receipt < receiptCount; receipt++) {
      const settlement = new Date(today);
      settlement.setDate(settlement.getDate() - ((i + receipt) % 6));
      const charged = (i + receipt) % 4 !== 0,
        collection = new Date(settlement);
      collection.setDate(collection.getDate() + ((i + receipt) % 2));
      receipts.push({
        key: contract.id,
        movementNumber: 900000 + i * 3 + receipt,
        settlementDate: settlement.toISOString().slice(0, 10),
        collectionDate: charged ? collection.toISOString().slice(0, 10) : "",
        attemptCount: charged
          ? 1 + ((i + receipt) % 2)
          : 1 + ((i + receipt) % 4),
        chargedAmount: charged ? 45 + ((i * 17 + receipt * 9) % 850) : 0,
        collectionStatus: charged ? "COB" : "PEN",
      });
    }
  });
  return receipts;
}
function enrichContracts(
  contracts: Contract[],
  icdtcap: IcdtcapRecord[],
  icdtlit: IcdtlitRecord[],
): EnrichedContract[] {
  const index = new Map(icdtcap.map((record) => [record.key, record])),
    literalIndex = new Map<
      string,
      { description: string; updatedAt: string }
    >();
  icdtlit
    .filter((record) => record.languageId === "1")
    .forEach((record) => {
      const current = literalIndex.get(record.literal);
      if (!current || record.updatedAt > current.updatedAt)
        literalIndex.set(record.literal, {
          description: record.description,
          updatedAt: record.updatedAt,
        });
    });
  const dictionary = new Map(
    Array.from(literalIndex.entries()).map(([key, value]) => [
      key,
      value.description,
    ]),
  );
  return contracts.map((contract) => {
    const match = index.get(contract.id),
      productCode = (match?.productCode || contract.productId || "").trim(),
      modality = (match?.modality || "").trim(),
      channelInfo = match?.channelInfo || "",
      channelParsed = parseChannelSubchannel(channelInfo),
      productDescription = resolveLiteralDescription(
        dictionary,
        literalProductKey(productCode),
        productCode || contract.productId || "—",
      ),
      modalityDescription = resolveLiteralDescription(
        dictionary,
        literalModalityKey(productCode, modality),
        modality || "—",
      );
    return {
      ...contract,
      productCode,
      productDescription,
      startDate: match?.startDate || "",
      expiryDate: match?.expiryDate || "",
      chargeDate: match?.chargeDate || "",
      baixaDate: match?.baixaDate || "",
      annulmentDate: match?.annulmentDate || "",
      modality,
      modalityDescription,
      paymentFrequency: match?.paymentFrequency || "",
      periodicPremium: match?.periodicPremium ?? null,
      currency: match?.currency || "",
      channel: channelParsed.channel,
      subchannel: channelParsed.subchannel,
      icdtcapMatched: Boolean(match),
    };
  });
}
const TABS: { id: TabId; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "alta", label: "Alta" },
  { id: "cancelacion", label: "Cancelación" },
  { id: "renovacion", label: "Renovación" },
  { id: "cobranza", label: "Cobranza" },
];
const TAB_PROCESS: Partial<Record<TabId, ProcessCode>> = {
  cancelacion: "CAN",
  renovacion: "REN",
  cobranza: "INV",
};

export default function App() {
  const [tab, setTab] = useState<TabId>("overview"),
    [rows] = useState<Row[]>(demoRows()),
    [movements] = useState<Movement[]>(demoMovements()),
    [status, setStatus] = useState<"ALL" | StatusCode>("ALL"),
    [from, setFrom] = useState(""),
    [to, setTo] = useState(""),
    [product, setProduct] = useState("ALL"),
    [paymentFrequency, setPaymentFrequency] = useState("ALL"),
    [filters, setFilters] = useState(true),
    [menu, setMenu] = useState(false);
  const [contracts] = useState<Contract[]>(demoContracts()),
    [icdtcap] = useState<IcdtcapRecord[]>(demoIcdtcap()),
    [icdtlit] = useState<IcdtlitRecord[]>(demoIcdtlit()),
    [icdtcam] = useState<IcdtcamRecord[]>(demoIcdtcam());
  const process = TAB_PROCESS[tab];
  const enrichedContracts = useMemo(
    () => enrichContracts(contracts, icdtcap, icdtlit),
    [contracts, icdtcap, icdtlit],
  );
  const [minRowDate, maxRowDate] = useMemo(() => {
    const min = rows.reduce(
        (current, row) =>
          row.createdAt.slice(0, 10) < current
            ? row.createdAt.slice(0, 10)
            : current,
        rows[0]?.createdAt.slice(0, 10) || new Date().toISOString().slice(0, 10),
      ),
      max = rows.reduce(
        (current, row) =>
          row.createdAt.slice(0, 10) > current
            ? row.createdAt.slice(0, 10)
            : current,
        rows[0]?.createdAt.slice(0, 10) || new Date().toISOString().slice(0, 10),
      );
    return [min, max];
  }, [rows]);
  useEffect(() => {
    if (!from) setFrom(minRowDate);
    if (!to) setTo(maxRowDate);
  }, [from, maxRowDate, minRowDate, to]);
  const overviewContractIndex = useMemo(
    () =>
      new Map(
        enrichedContracts.map((contract) => [
          contractReferenceKey(
            contract.entity,
            contract.branch,
            contract.id.slice(10),
          ),
          contract,
        ]),
      ),
    [enrichedContracts],
  );
  const filtered = useMemo(
    () =>
      rows.filter(
        (row) => {
          if (process && row.process !== process) return false;
          if (status !== "ALL" && row.status !== status) return false;
          const rowDate = row.createdAt.slice(0, 10);
          if (from && rowDate < from) return false;
          if (to && rowDate > to) return false;
          if (product === "ALL" && paymentFrequency === "ALL") return true;
          const contract = overviewContractIndex.get(
            contractReferenceKey(row.entity, row.branch, row.account),
          );
          if (!contract) return false;
          if (
            product !== "ALL" &&
            (contract.productCode || contract.productId) !== product
          )
            return false;
          if (
            paymentFrequency !== "ALL" &&
            contract.paymentFrequency !== paymentFrequency
          )
            return false;
          return true;
        },
      ),
    [
      rows,
      process,
      status,
      from,
      to,
      product,
      paymentFrequency,
      overviewContractIndex,
    ],
  );
  const go = (t: TabId) => {
    setTab(t);
    setStatus("ALL");
    setProduct("ALL");
    setPaymentFrequency("ALL");
    setFrom(minRowDate);
    setTo(maxRowDate);
    setMenu(false);
  };
  return (
    <div className="shell">
      <aside className={`sidebar ${menu ? "open" : ""}`}>
        <div className="brand">
          <b>
            <ShieldCheck size={22} />
          </b>
          <div>
            <strong>Seguros</strong>
            <span>Conciliación</span>
          </div>
          <button className="icon close" onClick={() => setMenu(false)}>
            <X />
          </button>
        </div>
        <small>DASHBOARD</small>
        <nav>
          {TABS.map((t) => (
            <button
              key={t.id}
              className={tab === t.id ? "active" : ""}
              onClick={() => go(t.id)}
            >
              {t.id === "overview" ? (
                <LayoutDashboard />
              ) : t.id === "alta" ? (
                <Users />
              ) : (
                <Activity />
              )}
              <span>{t.label}</span>
            </button>
          ))}
        </nav>
        <div className="refresh">
          <RefreshCw />
          <div>
            <span>Actualización</span>
            <strong>Diaria · 06:00</strong>
          </div>
        </div>
        <footer>
          <span>Fuente de datos</span>
          <strong>
            <Building2 /> Oracle / RIMAC
          </strong>
        </footer>
      </aside>
      <main>
        <header className="topbar">
          <button className="icon hamburger" onClick={() => setMenu(true)}>
            <Menu />
          </button>
          <div>
            <span>Operaciones de Seguros / </span>
            <strong>{TABS.find((t) => t.id === tab)?.label}</strong>
          </div>
          <section>
            <div className="source">
              <i />
              <span>
                SOLO LECTURA
                <strong>Sin carga manual</strong>
              </span>
            </div>
          </section>
        </header>
        <div className="page">
          <div className="heading">
            <div>
              {tab !== "overview" && (
                <small>
                  {tab === "alta"
                    ? "SEGUIMIENTO DE FORMALIZACIÓN"
                    : tab === "renovacion"
                      ? "DECISIONES OPERATIVAS · RENOVACIÓN"
                      : "CONTROL OPERATIVO · ÚLTIMOS 12 MESES"}
                </small>
              )}
              <h1>
                {tab === "overview"
                  ? "Conciliación de seguros"
                  : tab === "alta"
                    ? "Alta de contratos"
                    : tab === "renovacion"
                      ? "Seguimiento de renovación"
                    : `Conciliación · ${TABS.find((t) => t.id === tab)?.label}`}
              </h1>
              <p>
                {tab === "alta"
                  ? "Seguimiento de nuevos contratos registrados en la tabla maestra."
                  : tab === "renovacion"
                    ? "Identifica pólizas próximas a renovar, información pendiente de RIMAC y vencimientos que requieren regularización."
                  : "Visibilidad de inconsistencias entre los canales del banco y la información gestionada por RIMAC."}
              </p>
            </div>
            <section>
              {tab !== "alta" &&
                tab !== "cancelacion" &&
                tab !== "renovacion" &&
                tab !== "cobranza" && (
                  <button
                    className="btn outline"
                    onClick={() => setFilters(!filters)}
                  >
                    <Filter /> Filtros
                  </button>
                )}
              <button className="btn dark" onClick={() => window.print()}>
                <Download /> Exportar
              </button>
            </section>
          </div>
          {tab === "alta" ? (
            <Alta contracts={enrichedContracts} />
          ) : tab === "cancelacion" ? (
            <Cancellation
              rows={rows.filter((r) => r.process === "CAN")}
              contracts={enrichedContracts}
            />
          ) : tab === "renovacion" ? (
            <Renewal
              rows={rows.filter((r) => r.process === "REN")}
              contracts={enrichedContracts}
            />
          ) : tab === "cobranza" ? (
            <>
              <CollectionFilters
                status={status}
                from={from}
                to={to}
                product={product}
                paymentFrequency={paymentFrequency}
                minDate={minRowDate}
                maxDate={maxRowDate}
                productOptions={productFilterOptions(enrichedContracts)}
                setStatus={setStatus}
                setFrom={setFrom}
                setTo={setTo}
                setProduct={setProduct}
                setPaymentFrequency={setPaymentFrequency}
                reset={() => {
                  setStatus("ALL");
                  setFrom(minRowDate);
                  setTo(maxRowDate);
                  setProduct("ALL");
                  setPaymentFrequency("ALL");
                }}
              />
              <Reconciliation
                rows={filtered}
                movements={movements.filter((m) =>
                  filtered.some((r) => r.id === m.reconciliationId),
                )}
                tab={tab}
                go={go}
                icdtcam={icdtcam}
                contracts={enrichedContracts}
                activeProduct={product}
                activePaymentFrequency={paymentFrequency}
                allRows={rows}
              />
            </>
          ) : (
            <>
              {filters && (
                <Filters
                  status={status}
                  from={from}
                  to={to}
                  product={product}
                  paymentFrequency={paymentFrequency}
                  minDate={minRowDate}
                  maxDate={maxRowDate}
                  productOptions={productFilterOptions(enrichedContracts)}
                  setStatus={setStatus}
                  setFrom={setFrom}
                  setTo={setTo}
                  setProduct={setProduct}
                  setPaymentFrequency={setPaymentFrequency}
                  reset={() => {
                    setStatus("ALL");
                    setFrom(minRowDate);
                    setTo(maxRowDate);
                    setProduct("ALL");
                    setPaymentFrequency("ALL");
                  }}
                />
              )}
              <Reconciliation
                rows={filtered}
                movements={movements.filter((m) =>
                  filtered.some((r) => r.id === m.reconciliationId),
                )}
                tab={tab}
                go={go}
                icdtcam={icdtcam}
                contracts={enrichedContracts}
                activeProduct={product}
                activePaymentFrequency={paymentFrequency}
                allRows={rows}
              />
            </>
          )}
        </div>
      </main>
      {menu && <button className="backdrop" onClick={() => setMenu(false)} />}
    </div>
  );
}

function Filters(p: {
  status: "ALL" | StatusCode;
  from: string;
  to: string;
  minDate: string;
  maxDate: string;
  product: string;
  paymentFrequency: string;
  productOptions: string[][];
  setStatus: (v: "ALL" | StatusCode) => void;
  setFrom: (v: string) => void;
  setTo: (v: string) => void;
  setProduct: (v: string) => void;
  setPaymentFrequency: (v: string) => void;
  reset: () => void;
}) {
  return (
    <div className="filters overview-filters overview-filters-split">
      <b>
        <Filter /> Filtros del análisis
      </b>
      <section className="filter-group date-group">
        <h3>Rango de fechas</h3>
        <div className="filter-group-grid">
          <Field label="Desde">
            <input
              type="date"
              min={p.minDate}
              max={p.to || p.maxDate}
              value={p.from}
              onChange={(event) => p.setFrom(event.target.value)}
            />
          </Field>
          <Field label="Hasta">
            <input
              type="date"
              min={p.from || p.minDate}
              max={p.maxDate}
              value={p.to}
              onChange={(event) => p.setTo(event.target.value)}
            />
          </Field>
        </div>
      </section>
      <section className="filter-group business-group">
        <h3>Segmentación operativa</h3>
        <div className="filter-group-grid">
          <Select
            label="Producto"
            value={p.product}
            onChange={p.setProduct}
            options={p.productOptions}
          />
          <Select
            label="Frecuencia de pago"
            value={p.paymentFrequency}
            onChange={p.setPaymentFrequency}
            options={PAYMENT_FREQUENCY_FILTER_OPTIONS}
          />
          <Select
            label="Estado"
            value={p.status}
            onChange={(v) => p.setStatus(v as "ALL" | StatusCode)}
            options={[
              ["ALL", "Todos los estados"],
              ["PEN", "Pendiente"],
              ["SOL", "Solucionado"],
            ]}
          />
          <button className="reset" onClick={p.reset}>
            Limpiar
          </button>
        </div>
      </section>
    </div>
  );
}

function CollectionFilters(p: {
  status: "ALL" | StatusCode;
  from: string;
  to: string;
  minDate: string;
  maxDate: string;
  product: string;
  paymentFrequency: string;
  productOptions: string[][];
  setStatus: (v: "ALL" | StatusCode) => void;
  setFrom: (v: string) => void;
  setTo: (v: string) => void;
  setProduct: (v: string) => void;
  setPaymentFrequency: (v: string) => void;
  reset: () => void;
}) {
  return (
    <div className="filters collection-filters collection-filters-split">
      <b>
        <Filter /> Filtros de cobranza
      </b>
      <section className="filter-group date-group">
        <h3>Rango de fechas</h3>
        <div className="filter-group-grid">
          <Field label="Desde">
            <input
              type="date"
              min={p.minDate}
              max={p.to || p.maxDate}
              value={p.from}
              onChange={(event) => p.setFrom(event.target.value)}
            />
          </Field>
          <Field label="Hasta">
            <input
              type="date"
              min={p.from || p.minDate}
              max={p.maxDate}
              value={p.to}
              onChange={(event) => p.setTo(event.target.value)}
            />
          </Field>
        </div>
      </section>
      <section className="filter-group business-group">
        <h3>Segmentación operativa</h3>
        <div className="filter-group-grid">
          <Select
            label="Producto"
            value={p.product}
            onChange={p.setProduct}
            options={p.productOptions}
          />
          <Select
            label="Frecuencia de pago"
            value={p.paymentFrequency}
            onChange={p.setPaymentFrequency}
            options={PAYMENT_FREQUENCY_FILTER_OPTIONS}
          />
          <Select
            label="Estado"
            value={p.status}
            onChange={(v) => p.setStatus(v as "ALL" | StatusCode)}
            options={[
              ["ALL", "Todos los estados"],
              ["PEN", "Pendiente"],
              ["SOL", "Solucionado"],
            ]}
          />
          <button className="reset" onClick={p.reset}>
            Limpiar
          </button>
        </div>
      </section>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="field">
      <span>{label}</span>
      <div>{children}</div>
    </label>
  );
}
function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[][];
}) {
  const [open, setOpen] = useState(false),
    root = useRef<HTMLDivElement>(null),
    selected = options.find((option) => option[0] === value)?.[1] || value;
  useEffect(() => {
    const close = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, []);
  return (
    <div className={`field custom-select ${open ? "open" : ""}`} ref={root}>
      <span>{label}</span>
      <div>
        <button
          type="button"
          aria-label={label}
          aria-haspopup="listbox"
          aria-expanded={open}
          onClick={() => setOpen((current) => !current)}
        >
          <span>{selected}</span>
          <ChevronDown />
        </button>
        {open && (
          <div
            className="select-menu"
            role="listbox"
            aria-label={`Opciones de ${label}`}
          >
            {options.map((option) => (
              <button
                type="button"
                role="option"
                aria-selected={option[0] === value}
                className={option[0] === value ? "selected" : ""}
                key={option[0]}
                onClick={() => {
                  onChange(option[0]);
                  setOpen(false);
                }}
              >
                {option[1]}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Cancellation({
  rows,
  contracts,
}: {
  rows: Row[];
  contracts: EnrichedContract[];
}) {
  const today = new Date().toISOString().slice(0, 10),
    year = today.slice(0, 4),
    month = today.slice(0, 7),
    minDate = rows.reduce(
      (min, x) =>
        x.createdAt.slice(0, 10) < min ? x.createdAt.slice(0, 10) : min,
      today,
    ),
    maxDate = rows.reduce(
      (max, x) =>
        x.createdAt.slice(0, 10) > max ? x.createdAt.slice(0, 10) : max,
      today,
    );
  const [status, setStatus] = useState<"ALL" | StatusCode>("ALL"),
    [product, setProduct] = useState("ALL"),
    [paymentFrequency, setPaymentFrequency] = useState("ALL"),
    [preset, setPreset] = useState("YEAR"),
    [from, setFrom] = useState(`${year}-01-01`),
    [to, setTo] = useState(today);
  const applyPreset = (value: string) => {
    setPreset(value);
    if (value === "MONTH") {
      setFrom(`${month}-01`);
      setTo(today);
    } else if (value === "YEAR") {
      setFrom(`${year}-01-01`);
      setTo(today);
    } else if (value === "12M") {
      const d = new Date(`${today}T12:00:00`);
      d.setFullYear(d.getFullYear() - 1);
      setFrom(d.toISOString().slice(0, 10));
      setTo(today);
    } else if (value === "ALL") {
      setFrom(minDate);
      setTo(maxDate);
    }
  };
  const effectiveFrom = preset === "ALL" ? minDate : from,
    effectiveTo = preset === "ALL" ? maxDate : to,
    contractIndex = new Map(
      contracts.map((contract) => [
        contractReferenceKey(
          contract.entity,
          contract.branch,
          contract.id.slice(10),
        ),
        contract,
      ]),
    ),
    matchesContractFilters = (row: Row) => {
      if (product === "ALL" && paymentFrequency === "ALL") return true;
      const contract = contractIndex.get(
        contractReferenceKey(row.entity, row.branch, row.account),
      );
      return Boolean(
        contract &&
          (product === "ALL" ||
            (contract.productCode || contract.productId) === product) &&
          (paymentFrequency === "ALL" ||
            contract.paymentFrequency === paymentFrequency),
      );
    },
    filtered = rows.filter(
      (r) =>
        (status === "ALL" || r.status === status) &&
        r.createdAt.slice(0, 10) >= effectiveFrom &&
        r.createdAt.slice(0, 10) <= effectiveTo &&
        matchesContractFilters(r),
    );
  const solved = filtered.filter((r) => r.status === "SOL"),
    pending = filtered.filter((r) => r.status === "PEN"),
    resolutionRate = filtered.length
      ? (solved.length / filtered.length) * 100
      : 0,
    averageResolution = solved.length
      ? solved.reduce((sum, r) => sum + days(r.createdAt, r.auditAt), 0) /
        solved.length
      : 0,
    notSent = pending.filter((r) => r.errorCode === "CAN_FILE_NOT_SENT").length;
  const cancellationDate = (contract: EnrichedContract) =>
    contract.bankStatus === "BAJ"
      ? contract.baixaDate
      : contract.bankStatus === "ANU"
        ? contract.annulmentDate
        : "";
  const cancelledContracts = contracts.filter(
      (contract) =>
        (contract.bankStatus === "BAJ" || contract.bankStatus === "ANU") &&
        cancellationDate(contract),
    ),
    cancelledToday = cancelledContracts.filter(
      (contract) => cancellationDate(contract) === today,
    ).length,
    cancelledMonth = cancelledContracts.filter(
      (contract) => cancellationDate(contract).slice(0, 7) === month,
    ).length;
  const trend = cancellationTrend(filtered, effectiveFrom, effectiveTo),
    cancellationSplit = buildCancellationStatusPie(
      filtered,
      contractIndex,
    ),
    ageBuckets = [
      ["0–2 días", 0, 2],
      ["3–7 días", 3, 7],
      ["8–15 días", 8, 15],
      ["16+ días", 16, 99999],
    ].map(([name, min, max]) => ({
      name,
      casos: pending.filter((r) => {
        const age = days(r.createdAt, today);
        return age >= Number(min) && age <= Number(max);
      }).length,
    }));
  return (
    <>
      <div className="filters cancellation-filters cancellation-filters-split">
        <b>
          <Filter /> Filtros de cancelación
        </b>
        <section className="filter-group date-group">
          <h3>Rango de fechas</h3>
          <div className="filter-group-grid">
            <Field label="Desde">
              <input
                type="date"
                value={effectiveFrom}
                onChange={(e) => {
                  setFrom(e.target.value);
                  setPreset("CUSTOM");
                }}
              />
            </Field>
            <Field label="Hasta">
              <input
                type="date"
                value={effectiveTo}
                onChange={(e) => {
                  setTo(e.target.value);
                  setPreset("CUSTOM");
                }}
              />
            </Field>
            <Select
              label="Periodo"
              value={preset}
              onChange={applyPreset}
              options={[
                ["MONTH", "Mes actual"],
                ["YEAR", "Año actual"],
                ["12M", "Últimos 12 meses"],
                ["ALL", "Histórico"],
                ["CUSTOM", "Personalizado"],
              ]}
            />
          </div>
        </section>
        <section className="filter-group business-group">
          <h3>Segmentación operativa</h3>
          <div className="filter-group-grid">
            <Select
              label="Estado"
              value={status}
              onChange={(value) => setStatus(value as "ALL" | StatusCode)}
              options={[
                ["ALL", "Todos"],
                ["PEN", "Pendiente"],
                ["SOL", "Solucionado"],
              ]}
            />
            <Select
              label="Producto"
              value={product}
              onChange={setProduct}
              options={productFilterOptions(contracts)}
            />
            <Select
              label="Frecuencia de pago"
              value={paymentFrequency}
              onChange={setPaymentFrequency}
              options={PAYMENT_FREQUENCY_FILTER_OPTIONS}
            />
          </div>
        </section>
        <button
          className="reset"
          onClick={() => {
            setStatus("ALL");
            setProduct("ALL");
            setPaymentFrequency("ALL");
            applyPreset("YEAR");
          }}
        >
          Limpiar
        </button>
      </div>
      <section className="metric-section fixed-metrics">
        <header>
          <div>
            <h2>Corte fijo del día</h2>
            <p>No cambia con los filtros del análisis.</p>
          </div>
          <span>Hoy y mes actual</span>
        </header>
        <div className="kpis">
          <Kpi
            label="Cancelados hoy"
            value={fmt(cancelledToday)}
            help="Banco BAJ/ANU con fecha ICDTCAP de hoy"
            icon={<CalendarDays />}
            tone="purple"
          />
          <Kpi
            label="Cancelados del mes"
            value={fmt(cancelledMonth)}
            help="Banco BAJ/ANU en el mes actual"
            icon={<ShieldCheck />}
            tone="blue"
          />
        </div>
      </section>
      <section className="metric-section variable-metrics">
        <header>
          <div>
            <h2>Resultado de los filtros</h2>
            <p>Se actualiza por período, estado, producto y frecuencia de pago.</p>
          </div>
          <span>{fmt(filtered.length)} conciliaciones</span>
        </header>
        <div className="kpis">
          <Kpi
            label="Abiertos sin cancelar en RIMAC"
            value={fmt(notSent)}
            help="PEN con CAN_FILE_NOT_SENT en el rango"
            icon={<FileWarning />}
            tone="red"
          />
          <Kpi
            label="Tasa de resolución"
            value={`${resolutionRate.toFixed(1)}%`}
            help={`${solved.length} de ${filtered.length} conciliaciones`}
            icon={<CheckCircle2 />}
            tone="green"
          />
          <Kpi
            label="Tiempo medio de resolución"
            value={`${averageResolution.toFixed(1)} d`}
            help="CREATION_DATE a AUDIT_DATE para SOL"
            icon={<Clock3 />}
            tone="amber"
          />
        </div>
      </section>
      <div className="charts">
        <Chart
          title="Conciliaciones abiertas y resueltas"
          sub="Altas por CREATION_DATE y resoluciones SOL por AUDIT_DATE"
          wide
        >
          <ResponsiveContainer width="100%" height={270}>
            <LineChart data={trend} margin={{ top: 15, right: 20, left: -20 }}>
              <CartesianGrid stroke="#edf0f5" vertical={false} />
              <XAxis dataKey="period" axisLine={false} tickLine={false} />
              <YAxis axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Line
                dataKey="abiertas"
                name="Abiertas"
                stroke="#ef6c69"
                strokeWidth={2.5}
              />
              <Line
                dataKey="resueltas"
                name="Resueltas"
                stroke="#20a77a"
                strokeWidth={2.5}
              />
            </LineChart>
          </ResponsiveContainer>
        </Chart>
        <Chart
          title="Anulados vs bajas"
          sub="Distribución de cancelaciones por estado contractual"
        >
          <div className="donut">
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={cancellationSplit}
                  innerRadius={60}
                  outerRadius={88}
                  paddingAngle={3}
                  dataKey="value"
                  nameKey="name"
                >
                  <Cell fill="#665cf6" />
                  <Cell fill="#ef6c69" />
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div>
              <strong>{fmt(cancellationSplit.reduce((sum, item) => sum + item.value, 0))}</strong>
              <span>cancelaciones clasificadas</span>
            </div>
          </div>
          <div className="legend">
            {cancellationSplit.map((item) => (
              <span key={item.name}>
                <i
                  style={{
                    background:
                      item.name === "ANU"
                        ? "#665cf6"
                        : "#ef6c69",
                  }}
                />
                {item.name} <b>{item.value}</b>
              </span>
            ))}
          </div>
        </Chart>
        <Chart
          title="Antigüedad de conciliaciones abiertas"
          sub="Casos PEN según días desde su creación"
          wide
        >
          <ResponsiveContainer width="100%" height={270}>
            <BarChart
              data={ageBuckets}
              margin={{ top: 15, right: 15, left: -20 }}
            >
              <CartesianGrid stroke="#edf0f5" vertical={false} />
              <XAxis dataKey="name" axisLine={false} tickLine={false} />
              <YAxis axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip />
              <Bar
                dataKey="casos"
                name="Pendientes"
                fill="#ef6c69"
                radius={[6, 6, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </Chart>
      </div>
      <CancellationTable
        rows={filtered}
        contracts={contracts}
        today={today}
      />
    </>
  );
}

function CancellationTable({
  rows,
  contracts,
  today,
}: {
  rows: Row[];
  contracts: EnrichedContract[];
  today: string;
}) {
  const contractIndex = new Map(
      contracts.map((contract) => [
        contractReferenceKey(
          contract.entity,
          contract.branch,
          contract.id.slice(10),
        ),
        contract,
      ]),
    ),
    contract = (row: Row) =>
      contractIndex.get(
        contractReferenceKey(row.entity, row.branch, row.account),
      ),
    download = () => {
      const data = rows.map((row) => {
          const match = contract(row);
          return {
            conciliationId: row.id,
            policy: match?.policy || "",
            product: match?.productDescription || "",
            modality: match?.modalityDescription || "",
            errorCode: row.errorCode,
            errorDescription: row.errorDescription,
            creationDate: row.createdAt,
            status: row.status,
            openDays:
              row.status === "PEN"
                ? days(row.createdAt.slice(0, 10), today)
                : days(row.createdAt.slice(0, 10), row.auditAt.slice(0, 10)),
          };
        }),
        url = URL.createObjectURL(
          new Blob([Papa.unparse(data)], { type: "text/csv" }),
        ),
        a = document.createElement("a");
      a.href = url;
      a.download = "cancelaciones_con_contrato.csv";
      a.click();
      URL.revokeObjectURL(url);
    };
  return (
    <section className="table-card cancellation-detail">
      <header>
        <div>
          <h2>Detalle de conciliaciones de cancelación</h2>
          <p>
            {fmt(rows.length)} casos · datos de producto obtenidos mediante
            cruce con MAESTRA_CONTRATOS e ICDTCAP
          </p>
        </div>
        <button className="btn outline" onClick={download}>
          <Download /> Descargar CSV
        </button>
      </header>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>ID conciliación</th>
              <th>Póliza</th>
              <th>Producto</th>
              <th>Modalidad</th>
              <th>Código error</th>
              <th>Fecha creación</th>
              <th>Estado</th>
              <th>Tiempo abierto</th>
            </tr>
          </thead>
          <tbody>
            {rows.slice(0, 12).map((row) => {
              const match = contract(row);
              return (
                <tr key={row.id}>
                  <td>#{row.id}</td>
                  <td>
                    <b>{match?.policy || <em>Sin match contrato</em>}</b>
                  </td>
                  <td>
                    <b>{match?.productDescription || "—"}</b>
                  </td>
                  <td>{match?.modalityDescription || "—"}</td>
                  <td>
                    <b>{row.errorCode}</b>
                  </td>
                  <td>{dateFmt(row.createdAt)}</td>
                  <td>
                    <Badge status={row.status} />
                  </td>
                  <td>
                    <b>
                      {row.status === "PEN"
                        ? `${days(row.createdAt.slice(0, 10), today)} días`
                        : `${days(row.createdAt.slice(0, 10), row.auditAt.slice(0, 10))} días`}
                    </b>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Renewal({
  rows,
  contracts,
}: {
  rows: Row[];
  contracts: EnrichedContract[];
}) {
  type Milestone = "ALL" | "PRE" | "RECEIPT" | "RENEWAL";
  const today = new Date().toISOString().slice(0, 10),
    year = today.slice(0, 4),
    month = today.slice(0, 7),
    contractsWithExpiry = contracts.filter((contract) => contract.expiryDate),
    allExpiryDates = contractsWithExpiry.map((contract) => contract.expiryDate),
    minDate = allExpiryDates.length
      ? allExpiryDates.reduce((min, date) => (date < min ? date : min))
      : today,
    maxDate = allExpiryDates.length
      ? allExpiryDates.reduce((max, date) => (date > max ? date : max))
      : today,
    contractIndex = new Map(
      contracts.map((contract) => [
        contractReferenceKey(
          contract.entity,
          contract.branch,
          contract.id.slice(10),
        ),
        contract,
      ]),
    ),
    matchContract = (row: Row) =>
      contractIndex.get(
        contractReferenceKey(row.entity, row.branch, row.account),
      );
  const [status, setStatus] = useState<"ALL" | StatusCode>("ALL"),
    [milestone, setMilestone] = useState<Milestone>("ALL"),
    [mode, setMode] = useState<"ALL" | RenewalMode>("ALL"),
    [product, setProduct] = useState("ALL"),
    [paymentFrequency, setPaymentFrequency] = useState("ALL"),
    [preset, setPreset] = useState("NEXT60"),
    [from, setFrom] = useState(today),
    [to, setTo] = useState(addCalendarDays(today, 60));
  const applyPreset = (value: string) => {
    setPreset(value);
    if (value === "NEXT30") {
      setFrom(today);
      setTo(addCalendarDays(today, 30));
    } else if (value === "NEXT60") {
      setFrom(today);
      setTo(addCalendarDays(today, 60));
    } else if (value === "NEXT90") {
      setFrom(today);
      setTo(addCalendarDays(today, 90));
    } else if (value === "TODAY") {
      setFrom(today);
      setTo(today);
    } else if (value === "MONTH") {
      setFrom(`${month}-01`);
      setTo(today);
    } else if (value === "YEAR") {
      setFrom(`${year}-01-01`);
      setTo(today);
    } else if (value === "12M") {
      const date = new Date(`${today}T12:00:00`);
      date.setFullYear(date.getFullYear() - 1);
      setFrom(date.toISOString().slice(0, 10));
      setTo(today);
    } else if (value === "ALL") {
      setFrom(minDate);
      setTo(maxDate);
    }
  };
  const effectiveFrom = preset === "ALL" ? minDate : from,
    effectiveTo = preset === "ALL" ? maxDate : to,
    inRange = (date: string) =>
      Boolean(date && date >= effectiveFrom && date <= effectiveTo),
    allIncidentEntries = rows
      .map((row) => {
        const contract = matchContract(row),
          meta = RENEWAL_ERROR_META[row.errorCode],
          eventDate = contract
            ? addCalendarDays(
                contract.expiryDate,
                meta?.stage === "PRE" ? -50 : -45,
              )
            : row.createdAt.slice(0, 10);
        return { row, contract, meta, eventDate };
      })
      .filter((entry) => entry.meta && entry.contract),
    openStagesByContract = new Map<string, Set<RenewalStage>>();
  allIncidentEntries
    .filter((entry) => entry.row.status === "PEN")
    .forEach((entry) => {
      if (!entry.contract || !entry.meta) return;
      const stages = openStagesByContract.get(entry.contract.id) || new Set();
      stages.add(entry.meta.stage);
      openStagesByContract.set(entry.contract.id, stages);
    });
  const hasOpenStage = (contract: EnrichedContract, stage: RenewalStage) =>
      openStagesByContract.get(contract.id)?.has(stage) || false,
    isActive = (contract: EnrichedContract) =>
      !["BAJ", "ANU", "ERR"].includes(contract.bankStatus),
    matchesContractFilters = (contract: EnrichedContract) =>
      (product === "ALL" ||
        (contract.productCode || contract.productId) === product) &&
      (paymentFrequency === "ALL" ||
        contract.paymentFrequency === paymentFrequency),
    confirmationStatus = (contract: EnrichedContract) => {
      const expectedDate = addCalendarDays(contract.expiryDate, -50);
      if (today < expectedDate) return "Aún no corresponde";
      return hasOpenStage(contract, "PRE") ? "Pendiente" : "Confirmado";
    },
    receiptsStatus = (contract: EnrichedContract) => {
      const expectedDate = addCalendarDays(contract.expiryDate, -45);
      if (today < expectedDate) return "Aún no corresponde";
      return hasOpenStage(contract, "RECEIPT") ? "Pendiente" : "Recibidos";
    },
    incidentEntries = allIncidentEntries.filter(
        (entry) =>
          inRange(entry.contract?.expiryDate || "") &&
          Boolean(entry.contract && matchesContractFilters(entry.contract)) &&
          (status === "ALL" || entry.row.status === status) &&
          (mode === "ALL" || entry.meta.mode === mode) &&
          (milestone === "ALL" ||
            milestone === entry.meta.stage),
      ),
    selectedRows = incidentEntries
      .map((entry) => ({
        row: entry.row,
        contract: entry.contract as EnrichedContract,
      }))
      .filter((entry) => Boolean(entry.row.id));
  const periodContracts = contractsWithExpiry.filter(
    (contract) =>
      isActive(contract) &&
      matchesContractFilters(contract) &&
      inRange(contract.expiryDate),
    ),
    fixedContracts = contractsWithExpiry.filter(
      (contract) => isActive(contract) && matchesContractFilters(contract),
    ),
    confirmedByRimac = periodContracts.filter(
      (contract) => confirmationStatus(contract) === "Confirmado",
    ),
    receiptsReceived = periodContracts.filter(
      (contract) => receiptsStatus(contract) === "Recibidos",
    ),
    pendingInformation = periodContracts.filter(
      (contract) =>
        contract.expiryDate >= today &&
        (hasOpenStage(contract, "PRE") || hasOpenStage(contract, "RECEIPT")),
    ),
    missingConfirmation = periodContracts.filter(
      (contract) =>
        contract.expiryDate >= today && hasOpenStage(contract, "PRE"),
    ),
    renewedToday = fixedContracts.filter(
      (contract) =>
        contract.renewalStatus === "REN" && contract.expiryDate === today,
    ).length,
    renewedThisMonth = fixedContracts.filter(
      (contract) =>
        contract.renewalStatus === "REN" &&
        contract.expiryDate.slice(0, 7) === month,
    ).length,
    notRenewedByDecision = periodContracts.filter((contract) =>
      ["NRE", "RZD"].includes(contract.renewalStatus),
    ).length,
    expiredWithoutRenewal = periodContracts.filter(
      (contract) =>
        contract.expiryDate < today &&
        contract.renewalStatus !== "REN" &&
        (hasOpenStage(contract, "PRE") || hasOpenStage(contract, "RECEIPT")),
    ).length,
    progress = [
      { stage: "Previstas para renovar", value: periodContracts.length },
      { stage: "Confirmación recibida", value: confirmedByRimac.length },
      { stage: "Recibos recibidos", value: receiptsReceived.length },
      {
        stage: "Renovación completada",
        value: periodContracts.filter(
          (contract) => contract.renewalStatus === "REN",
        ).length,
      },
    ],
    pendingContracts = periodContracts.filter(
      (contract) => contract.renewalStatus !== "REN",
    ),
    alerts = [
      {
        name: "Vigencia vencida",
        casos: pendingContracts.filter(
          (contract) => signedCalendarDays(today, contract.expiryDate) < 0,
        ).length,
      },
      ...[
        ["0 a 7 días", 0, 7],
        ["8 a 15 días", 8, 15],
        ["16 a 30 días", 16, 30],
        ["Más de 30 días", 31, Number.POSITIVE_INFINITY],
      ].map(([name, minimum, maximum]) => ({
        name: String(name),
        casos: pendingContracts.filter((contract) => {
          const remaining = signedCalendarDays(today, contract.expiryDate);
          return remaining >= Number(minimum) && remaining <= Number(maximum);
        }).length,
      })),
    ],
    failingByProduct = buildRenewalFailureByProduct(periodContracts, 4);
  return (
    <>
      <div className="filters renewal-filters renewal-filters-split">
        <b>
          <Filter /> Filtros de renovación
        </b>
        <section className="filter-group date-group">
          <h3>Rango de fechas</h3>
          <div className="filter-group-grid">
            <Field label="Desde">
              <input
                type="date"
                value={effectiveFrom}
                onChange={(event) => {
                  setFrom(event.target.value);
                  setPreset("CUSTOM");
                }}
              />
            </Field>
            <Field label="Hasta">
              <input
                type="date"
                value={effectiveTo}
                onChange={(event) => {
                  setTo(event.target.value);
                  setPreset("CUSTOM");
                }}
              />
            </Field>
            <Select
              label="Periodo"
              value={preset}
              onChange={applyPreset}
              options={[
                ["NEXT30", "Próximos 30 días"],
                ["NEXT60", "Próximos 60 días"],
                ["NEXT90", "Próximos 90 días"],
                ["TODAY", "Hoy"],
                ["MONTH", "Mes actual"],
                ["YEAR", "Año actual"],
                ["12M", "Últimos 12 meses"],
                ["ALL", "Histórico"],
                ["CUSTOM", "Personalizado"],
              ]}
            />
          </div>
        </section>
        <section className="filter-group business-group">
          <h3>Segmentación operativa</h3>
          <div className="filter-group-grid">
            <Select
              label="Información de RIMAC"
              value={milestone}
              onChange={(value) => setMilestone(value as Milestone)}
              options={[
                ["ALL", "Todo el seguimiento"],
                ["PRE", "Confirmación de renovación"],
                ["RECEIPT", "Recibos enviados"],
                ["RENEWAL", "Resultado de renovación"],
              ]}
            />
            <Select
              label="Estado"
              value={status}
              onChange={(value) => setStatus(value as "ALL" | StatusCode)}
              options={[
                ["ALL", "Todos"],
                ["PEN", "Pendiente"],
                ["SOL", "Solucionado"],
              ]}
            />
            <Select
              label="Tipo de incidencia"
              value={mode}
              onChange={(value) => setMode(value as "ALL" | RenewalMode)}
              options={[
                ["ALL", "Todas"],
                ["AUTOMATIC", "Renovación automática"],
                ["NON_AUTOMATIC", "No automática"],
              ]}
            />
            <Select
              label="Producto"
              value={product}
              onChange={setProduct}
              options={productFilterOptions(contracts)}
            />
            <Select
              label="Frecuencia de pago"
              value={paymentFrequency}
              onChange={setPaymentFrequency}
              options={PAYMENT_FREQUENCY_FILTER_OPTIONS}
            />
          </div>
        </section>
        <button
          className="reset"
          onClick={() => {
            setStatus("ALL");
            setMilestone("ALL");
            setMode("ALL");
            setProduct("ALL");
            setPaymentFrequency("ALL");
            applyPreset("NEXT60");
          }}
        >
          Limpiar
        </button>
      </div>
      <section className="metric-section fixed-metrics">
        <header>
          <div>
            <h2>Corte fijo del día</h2>
          </div>
          <span>Hoy y mes actual</span>
        </header>
        <div className="kpis">
          <Kpi
            label="Renovadas hoy"
            value={fmt(renewedToday)}
            help="Estado de renovación REN y fin de vigencia hoy"
            icon={<CheckCircle2 />}
            tone="green"
          />
          <Kpi
            label="Renovadas en el mes"
            value={fmt(renewedThisMonth)}
            help="Estado de renovación REN y fin de vigencia en el mes actual"
            icon={<CalendarDays />}
            tone="blue"
          />
        </div>
      </section>
      <section className="metric-section variable-metrics">
        <header>
          <div>
            <h2>Resultado de los filtros</h2>
          </div>
          <span>{fmt(periodContracts.length)} pólizas</span>
        </header>
        <div className="kpis">
          <Kpi
            label="Pólizas previstas para renovar"
            value={fmt(periodContracts.length)}
            help="Contratos activos cuyo fin de vigencia está en el período"
            icon={<CalendarDays />}
            tone="purple"
          />
          <Kpi
            label="Confirmadas por RIMAC"
            value={fmt(confirmedByRimac.length)}
            help="Confirmación recibida o sin incidencia abierta al cumplirse la fecha esperada"
            icon={<CheckCircle2 />}
            tone="green"
          />
          <Kpi
            label="Recibos enviados por RIMAC"
            value={fmt(receiptsReceived.length)}
            help="Recibos recibidos o sin incidencia abierta al cumplirse la fecha esperada"
            icon={<ShieldCheck />}
            tone="blue"
          />
          <Kpi
            label="En riesgo: sin confirmación"
            value={fmt(missingConfirmation.length)}
            help="Pólizas vigentes con confirmación de RIMAC pendiente"
            icon={<FileWarning />}
            tone="red"
          />
          <Kpi
            label="Por renovar con información pendiente"
            value={fmt(pendingInformation.length)}
            help="Pólizas aún vigentes con confirmación o recibos pendientes"
            icon={<FileWarning />}
            tone="amber"
          />
          <Kpi
            label="Vencidas sin renovar por información pendiente"
            value={fmt(expiredWithoutRenewal)}
            help="Vigencia terminada, sin estado REN y con incidencia abierta"
            icon={<FileWarning />}
            tone="red"
          />
          <Kpi
            label="No renovación por decisión RIMAC"
            value={fmt(notRenewedByDecision)}
            help="Estados NRE y RZD en el período"
            icon={<Activity />}
            tone="purple"
          />
        </div>
      </section>
      <div className="charts renewal-charts">
        <Chart
          title="Avance de las próximas renovaciones"
          sub="Confirmación y recibos se infieren por la ausencia de incidencias abiertas"
        >
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={progress}
              layout="vertical"
              margin={{ top: 10, right: 25, left: 45, bottom: 5 }}
            >
              <CartesianGrid stroke="#edf0f5" vertical={false} />
              <XAxis type="number" axisLine={false} tickLine={false} allowDecimals={false} />
              <YAxis type="category" dataKey="stage" axisLine={false} tickLine={false} width={145} />
              <Tooltip />
              <Bar dataKey="value" name="Contratos" fill="#665cf6" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Chart>
        <Chart
          title="Pólizas por urgencia de regularización"
          sub="Contratos no renovados agrupados por días hasta el fin de vigencia"
        >
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={alerts}
              layout="vertical"
              margin={{ top: 12, right: 18, left: 8, bottom: 8 }}
            >
              <CartesianGrid stroke="#edf0f5" horizontal={false} />
              <XAxis type="number" axisLine={false} tickLine={false} allowDecimals={false} />
              <YAxis
                type="category"
                dataKey="name"
                width={130}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip />
              <Bar dataKey="casos" name="Pólizas" fill="#ef6c69" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Chart>
        <Chart
          title="Productos con fallas de renovación"
          sub="Top productos con incidencias abiertas; resto agrupado en Otros"
          wide
        >
          <div className="donut">
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={failingByProduct}
                  innerRadius={62}
                  outerRadius={92}
                  paddingAngle={3}
                  dataKey="value"
                  nameKey="name"
                >
                  {failingByProduct.map((entry, index) => (
                    <Cell
                      key={`${entry.name}-${index}`}
                      fill={[
                        "#665cf6",
                        "#3b8eea",
                        "#ef6c69",
                        "#20a77a",
                        "#8b93a6",
                      ][index % 5]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div>
              <strong>{fmt(failingByProduct.reduce((sum, item) => sum + item.value, 0))}</strong>
              <span>pólizas con falla</span>
            </div>
          </div>
          <div className="legend">
            {failingByProduct.map((slice) => (
              <span key={slice.name}>
                <i className="purple" />
                {slice.name} <b>{slice.value}</b>
              </span>
            ))}
          </div>
        </Chart>
      </div>
      <RenewalTable
        conciliationRows={selectedRows}
        today={today}
      />
    </>
  );
}

function RenewalTable({
  conciliationRows,
  today,
}: {
  conciliationRows: Array<{ row: Row; contract: EnrichedContract }>;
  today: string;
}) {
  const openStage = (row: Row, stage: RenewalStage) =>
      row.status === "PEN" && RENEWAL_ERROR_META[row.errorCode]?.stage === stage,
    statusToken = (value: string) =>
      value === "Pendiente"
        ? "Pend."
        : value === "Confirmado" || value === "Recibidos"
          ? "✓"
          : "—",
    informationStatus = (
      contract: EnrichedContract,
      row: Row,
      stage: RenewalStage,
      expectedDaysBeforeExpiry: number,
    ) => {
      const expectedDate = addCalendarDays(
        contract.expiryDate,
        -expectedDaysBeforeExpiry,
      );
      if (today < expectedDate) return "Aún no corresponde";
      if (openStage(row, stage)) return "Pendiente";
      return stage === "PRE" ? "Confirmado" : "Recibidos";
    },
    daysRemainingLabel = (contract: EnrichedContract, row: Row) => {
      if (row.status === "SOL") return "Conciliado";
      const remaining = signedCalendarDays(today, contract.expiryDate);
      if (remaining < 0) return `Venció hace ${Math.abs(remaining)} d`;
      if (remaining === 0) return "Vence hoy";
      return `${remaining} días`;
    },
    download = () => {
      const data = conciliationRows.map(({ row, contract }) => {
          const meta = RENEWAL_ERROR_META[row.errorCode],
            renewalCode =
              (contract.renewalStatus as RenewalContractStatusType) || "PRN";
          return {
            conciliationId: row.id,
            policy: contract.policy,
            product: contract.productDescription,
            modality: contract.modalityDescription,
            coverageEndDate: contract.expiryDate,
            daysUntilCoverageEnd:
              row.status === "SOL"
                ? ""
                : signedCalendarDays(today, contract.expiryDate),
            rimacRenewalConfirmation: statusToken(
              informationStatus(contract, row, "PRE", 50),
            ),
            rimacReceipts: statusToken(
              informationStatus(contract, row, "RECEIPT", 45),
            ),
            renewalResultCode: renewalCode,
            renewalResultLabel:
              RENEWAL_CONTRACT_STATUS_LABELS[renewalCode] || renewalCode,
            incidentStage:
              meta?.stage === "PRE"
                ? "Confirmación de renovación"
                : "Recibos de renovación",
            incidentMode:
              meta?.mode === "AUTOMATIC" ? "Automática" : "No automática",
            errorCode: row.errorCode,
            errorDescription: row.errorDescription,
            reconciliationStatus: row.status,
            openedAt: row.createdAt,
            solvedAt: row.status === "SOL" ? row.auditAt : "",
          };
        }),
        url = URL.createObjectURL(
          new Blob([Papa.unparse(data)], { type: "text/csv" }),
        ),
        anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "seguimiento_operativo_renovacion.csv";
      anchor.click();
      URL.revokeObjectURL(url);
    };
  return (
    <section className="table-card renewal-detail">
      <header>
        <div>
          <h2>Detalle operativo de renovación</h2>
          <p>
            {fmt(conciliationRows.length)} conciliaciones · seguimiento por ID
            obligatorio
          </p>
        </div>
        <button className="btn outline" onClick={download}>
          <Download /> Descargar CSV
        </button>
      </header>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>ID conciliación</th>
              <th>Póliza</th>
              <th>Producto</th>
              <th>Modalidad</th>
              <th>Fin de vigencia</th>
              <th>Días para regularizar</th>
              <th>
                Confirmación de renovación
                <small>Información de RIMAC</small>
              </th>
              <th>
                Recibos de renovación
                <small>Enviados por RIMAC</small>
              </th>
              <th>Resultado de renovación</th>
              <th>Información pendiente</th>
              <th>Tipo</th>
              <th>Código error</th>
              <th>Apertura</th>
              <th>Solución</th>
              <th>Estado conciliación</th>
            </tr>
          </thead>
          <tbody>
            {conciliationRows.slice(0, 12).map(({ row, contract }) => {
              const meta = RENEWAL_ERROR_META[row.errorCode],
                renewalCode =
                  (contract.renewalStatus as RenewalContractStatusType) ||
                  "PRN";
              return (
                <tr key={row.id}>
                  <td>#{row.id}</td>
                  <td>
                    <b>{contract.policy || <em>Sin póliza</em>}</b>
                  </td>
                  <td>
                    <b>{contract.productDescription || "—"}</b>
                  </td>
                  <td>{contract.modalityDescription || "—"}</td>
                  <td>{dateFmt(contract.expiryDate)}</td>
                  <td>
                    <b>{daysRemainingLabel(contract, row)}</b>
                  </td>
                  <td>
                    <b>
                      {statusToken(
                        informationStatus(contract, row, "PRE", 50),
                      )}
                    </b>
                  </td>
                  <td>
                    <b>
                      {statusToken(
                        informationStatus(contract, row, "RECEIPT", 45),
                      )}
                    </b>
                  </td>
                  <td>
                    <b>
                      {`${renewalCode} · ${RENEWAL_CONTRACT_STATUS_LABELS[renewalCode] || renewalCode}`}
                    </b>
                  </td>
                  <td>
                    {meta?.stage === "PRE"
                      ? "Confirmación de RIMAC"
                      : meta?.stage === "RECEIPT"
                        ? "Recibos de RIMAC"
                        : "Sin incidencia"}
                  </td>
                  <td>
                    {meta?.mode === "AUTOMATIC"
                      ? "Automática"
                      : meta?.mode === "NON_AUTOMATIC"
                        ? "No automática"
                        : "—"}
                  </td>
                  <td>
                    <b>{row.errorCode || "—"}</b>
                  </td>
                  <td>{dateFmt(row.createdAt || "")}</td>
                  <td>
                    {dateFmt(row.status === "SOL" ? row.auditAt : "")}
                  </td>
                  <td>
                    <Badge status={row.status} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Reconciliation({
  rows,
  movements,
  tab,
  go,
  icdtcam,
  contracts,
  activeProduct,
  activePaymentFrequency,
  allRows,
}: {
  rows: Row[];
  movements: Movement[];
  tab: TabId;
  go: (t: TabId) => void;
  icdtcam: IcdtcamRecord[];
  contracts: EnrichedContract[];
  activeProduct: string;
  activePaymentFrequency: string;
  allRows: Row[];
}) {
  const showAmounts = tab === "cobranza";
  const contractIndex = new Map(
      contracts.map((contract) => [
        contractReferenceKey(
          contract.entity,
          contract.branch,
          contract.id.slice(10),
        ),
        contract,
      ]),
    ),
    matchesContractFilters = (contract?: EnrichedContract) =>
      activeProduct === "ALL" && activePaymentFrequency === "ALL"
        ? true
        : Boolean(
            contract &&
              (activeProduct === "ALL" ||
                (contract.productCode || contract.productId) === activeProduct) &&
              (activePaymentFrequency === "ALL" ||
                contract.paymentFrequency === activePaymentFrequency),
          ),
    analysisRows = rows,
    analysisRowIds = new Set(analysisRows.map((row) => row.id)),
    analysisMovements = movements.filter((movement) =>
      analysisRowIds.has(movement.reconciliationId),
    ),
    selectedContractIds = new Set(
      contracts.filter(matchesContractFilters).map((contract) => contract.id),
    ),
    analysisIcdtcam =
      showAmounts &&
      (activeProduct !== "ALL" || activePaymentFrequency !== "ALL")
        ? icdtcam.filter((receipt) => selectedContractIds.has(receipt.key))
        : icdtcam,
    pen = analysisRows.filter((r) => r.status === "PEN"),
    sol = analysisRows.filter((r) => r.status === "SOL"),
    rate = analysisRows.length ? (sol.length / analysisRows.length) * 100 : 0;
  const analysisRowsById = new Map(analysisRows.map((row) => [row.id, row])),
    movementCurrency = (movement: Movement) => {
      const row = analysisRowsById.get(movement.reconciliationId);
      if (!row) return "PEN";
      const contract = contractIndex.get(
          contractReferenceKey(row.entity, row.branch, row.account),
        ),
        currency = (contract?.currency || "PEN").toUpperCase();
      return currency.includes("USD") || currency.includes("DOL")
        ? "USD"
        : "PEN";
    },
    collectionMovements = analysisMovements.filter(
      (movement) => movement.process === "INV",
    ),
    operatedAmountPen = collectionMovements
      .filter((movement) => movementCurrency(movement) === "PEN")
      .reduce((sum, movement) => sum + movement.operatedAmount, 0),
    operatedAmountUsd = collectionMovements
      .filter((movement) => movementCurrency(movement) === "USD")
      .reduce((sum, movement) => sum + movement.operatedAmount, 0);
  const today = new Date().toISOString().slice(0, 10),
    month = today.slice(0, 7),
    allChargedReceipts = icdtcam.filter((receipt) => receipt.collectionDate),
    chargedToday = allChargedReceipts.filter(
      (receipt) => receipt.collectionDate === today,
    ).length,
    chargedMonth = allChargedReceipts.filter(
      (receipt) => receipt.collectionDate.slice(0, 7) === month,
    ).length,
    selectedChargedReceipts = analysisIcdtcam.filter(
      (receipt) => receipt.collectionDate,
    ),
    dueToday = icdtcam.filter((receipt) => receipt.settlementDate === today),
    attemptedToday = dueToday.filter((receipt) => receipt.attemptCount > 0),
    collectedDueToday = attemptedToday.filter(
      (receipt) => receipt.collectionDate === today,
    ),
    collectionRate = attemptedToday.length
      ? (collectedDueToday.length / attemptedToday.length) * 100
      : 0,
    automaticNotReported = analysisRows.filter(
      (row) => row.status === "PEN" && row.errorCode === "INV_RIMAC_NOT_SENT",
    ).length,
    notChargedNotReported = analysisRows.filter(
      (row) => row.status === "PEN" && row.errorCode === "INV_RIMAC_NOT_CHAR",
    ).length;
  const trend = buildTrend(analysisRows),
    processes = (["CAN", "REN", "INV"] as ProcessCode[]).map((code) => ({
      name: PROCESS_LABELS[code],
      code,
      pendientes: analysisRows.filter(
        (r) => r.process === code && r.status === "PEN",
      ).length,
      solucionados: analysisRows.filter(
        (r) => r.process === code && r.status === "SOL",
      ).length,
    })),
    collectionResultPie = [
      { name: "Cobrados en automático", value: automaticNotReported },
      { name: "No cobrados", value: notChargedNotReported },
    ],
    overviewRows = tab === "overview" ? allRows : analysisRows,
    overviewAltaTotal = contracts.length,
    overviewCancelacionTotal = overviewRows.filter(
      (row) => row.process === "CAN",
    ).length,
    overviewRenovacionTotal = overviewRows.filter(
      (row) => row.process === "REN",
    ).length,
    overviewCobranzaTotal = overviewRows.filter(
      (row) => row.process === "INV",
    ).length,
    overviewOpen = overviewRows.filter((row) => row.status === "PEN").length,
    overviewClosed = overviewRows.filter((row) => row.status === "SOL").length,
    overviewClosedRate = overviewRows.length
      ? (overviewClosed / overviewRows.length) * 100
      : 0,
    overviewAns = overviewRows.length
      ? overviewRows.reduce(
          (sum, row) =>
            sum +
            days(
              row.createdAt.slice(0, 10),
              row.status === "SOL" ? row.auditAt.slice(0, 10) : today,
            ),
          0,
        ) / overviewRows.length
      : 0,
    overviewRowsWithPolicy =
      tab === "overview"
        ? analysisRows.map((row) => {
            const contract = contractIndex.get(
              contractReferenceKey(row.entity, row.branch, row.account),
            );
            return {
              ...row,
              policy: contract?.policy || row.policy,
            };
          })
        : analysisRows;
  const productConcentration =
    tab === "overview"
      ? buildProductConcentration(analysisRows, contractIndex)
      : [];
  return (
    <>
      {showAmounts ? (
        <>
          <section className="metric-section fixed-metrics">
            <header>
              <div>
                <h2>Corte fijo del día</h2>
              </div>
              <span>ICDTCAM · hoy y mes actual</span>
            </header>
            <div className="kpis">
            <Kpi
              label="Recibos cobrados"
              value={fmt(allChargedReceipts.length)}
              help=""
              icon={<CheckCircle2 />}
              tone="green"
            />
            <Kpi
              label="Cobrados hoy"
              value={fmt(chargedToday)}
              help=""
              icon={<CalendarDays />}
              tone="purple"
            />
            <Kpi
              label="Cobrados del mes"
              value={fmt(chargedMonth)}
              help=""
              icon={<ShieldCheck />}
              tone="blue"
            />
            <Kpi
              label="Recibos intentados hoy"
              value={fmt(attemptedToday.length)}
              help=""
              icon={<RefreshCw />}
              tone="amber"
            />
            <Kpi
              label="Efectividad de cobro"
              value={`${collectionRate.toFixed(1)}%`}
              help=""
              icon={<Activity />}
              tone="green"
            />
            </div>
          </section>
          <section className="metric-section variable-metrics">
            <header>
              <div>
                <h2>Resultado de los filtros</h2>
              </div>
              <span>{fmt(analysisRows.length)} conciliaciones</span>
            </header>
            <div className="kpis">
            <Kpi
              label="Recibos cobrados seleccionados"
              value={fmt(selectedChargedReceipts.length)}
              help=""
              icon={<CheckCircle2 />}
              tone="green"
            />
            <Kpi
              label="Cobro automático no informado"
              value={fmt(automaticNotReported)}
              help=""
              icon={<ShieldCheck />}
              tone="purple"
            />
            <Kpi
              label="No cobrado ni informado"
              value={fmt(notChargedNotReported)}
              help=""
              icon={<FileWarning />}
              tone="red"
            />
            <Kpi
              label="Conciliaciones abiertas"
              value={fmt(pen.length)}
              help=""
              icon={<Clock3 />}
              tone="red"
            />
            <Kpi
              label="Monto operado en soles"
              value={money(operatedAmountPen)}
              help=""
              icon={<Activity />}
              tone="blue"
            />
            <Kpi
              label="Monto operado en dólares"
              value={moneyUsd(operatedAmountUsd)}
              help=""
              icon={<CheckCircle2 />}
              tone="green"
            />
            </div>
          </section>
        </>
      ) : (
        <section className="metric-section fixed-metrics">
          <header>
            <div>
              <h2>Resumen operativo de hoy</h2>
            </div>
            <span>Corte general</span>
          </header>
          <div className="kpis">
            <Kpi
              label="Alta"
              value={fmt(overviewAltaTotal)}
              help="Contratos en la maestra"
              icon={<Users />}
              tone="blue"
            />
            <Kpi
              label="Cancelación"
              value={fmt(overviewCancelacionTotal)}
              help="Conciliaciones proceso CAN"
              icon={<FileWarning />}
              tone="red"
            />
            <Kpi
              label="Renovación"
              value={fmt(overviewRenovacionTotal)}
              help="Conciliaciones proceso REN"
              icon={<Activity />}
              tone="purple"
            />
            <Kpi
              label="Cobranza"
              value={fmt(overviewCobranzaTotal)}
              help="Conciliaciones proceso INV"
              icon={<CheckCircle2 />}
              tone="green"
            />
            <Kpi
              label="Conciliaciones abiertas"
              value={fmt(overviewOpen)}
              help="Estado PEN"
              icon={<Clock3 />}
              tone="red"
            />
            <Kpi
              label="Conciliaciones cerradas"
              value={fmt(overviewClosed)}
              help="Estado SOL"
              icon={<CheckCircle2 />}
              tone="green"
            />
            <Kpi
              label="Porcentaje cerradas"
              value={`${overviewClosedRate.toFixed(1)}%`}
              help="SOL sobre total"
              icon={<Activity />}
              tone="blue"
            />
            <Kpi
              label="ANS de conciliación"
              value={`${overviewAns.toFixed(1)} días`}
              help="Promedio desde creación hasta cierre/hoy"
              icon={<CalendarDays />}
              tone="amber"
            />
          </div>
        </section>
      )}
      <div className="charts">
        <Chart
          title="Evolución de incidencias"
          sub="Casos creados y solucionados por mes"
          wide
        >
          <ResponsiveContainer width="100%" height={270}>
            <AreaChart data={trend} margin={{ top: 15, right: 15, left: -25 }}>
              <CartesianGrid stroke="#edf0f5" vertical={false} />
              <XAxis dataKey="month" axisLine={false} tickLine={false} />
              <YAxis axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Area
                name="Pendientes"
                dataKey="pendientes"
                stroke="#ef6c69"
                fill="#ef6c6930"
                strokeWidth={2.5}
              />
              <Line
                name="Solucionados"
                dataKey="solucionados"
                stroke="#20a77a"
                strokeWidth={2.5}
              />
            </AreaChart>
          </ResponsiveContainer>
        </Chart>
        {!showAmounts && (
          <Chart title="Estado actual" sub="Distribución de los casos">
            <div className="donut">
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={[
                      { name: "Pendientes", value: pen.length },
                      { name: "Solucionados", value: sol.length },
                    ]}
                    innerRadius={68}
                    outerRadius={88}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    <Cell fill="#ef6c69" />
                    <Cell fill="#20a77a" />
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div>
                <strong>{rate.toFixed(0)}%</strong>
                <span>solucionado</span>
              </div>
            </div>
            <div className="legend">
              <span>
                <i className="red" />
                Pendientes <b>{pen.length}</b>
              </span>
              <span>
                <i className="green" />
                Solucionados <b>{sol.length}</b>
              </span>
            </div>
          </Chart>
        )}
        {showAmounts && (
          <Chart
            title="Resultado de información RIMAC"
            sub="Cobrados en automático y no cobrados"
            wide
          >
            <div className="donut">
              <ResponsiveContainer width="100%" height={230}>
                <PieChart>
                  <Pie
                    data={collectionResultPie}
                    innerRadius={68}
                    outerRadius={90}
                    paddingAngle={4}
                    dataKey="value"
                    nameKey="name"
                  >
                    <Cell fill="#665cf6" />
                    <Cell fill="#ef6c69" />
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div>
                <strong>{fmt(collectionResultPie.reduce((sum, item) => sum + item.value, 0))}</strong>
                <span>conciliaciones PEN</span>
              </div>
            </div>
            <div className="legend">
              <span>
                <i className="purple" />
                Cobrados en automático <b>{automaticNotReported}</b>
              </span>
              <span>
                <i className="red" />
                No cobrados <b>{notChargedNotReported}</b>
              </span>
            </div>
          </Chart>
        )}
        {!showAmounts && (
          <Chart
            title={
              tab === "overview"
                ? "Backlog por proceso"
                : "Resolución por estado"
            }
            sub="Comparativo operativo"
          >
            <ResponsiveContainer width="100%" height={270}>
              <BarChart
                data={processes}
                onClick={(e) => {
                  const c = e?.activePayload?.[0]?.payload?.code as
                    ProcessCode | undefined;
                  if (tab === "overview" && c)
                    go(
                      c === "CAN"
                        ? "cancelacion"
                        : c === "REN"
                          ? "renovacion"
                          : "cobranza",
                    );
                }}
                margin={{ top: 15, right: 5, left: -25 }}
              >
                <CartesianGrid stroke="#edf0f5" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar
                  dataKey="pendientes"
                  name="Pendientes"
                  stackId="a"
                  fill="#ef6c69"
                />
                <Bar
                  dataKey="solucionados"
                  name="Solucionados"
                  stackId="a"
                  fill="#20a77a"
                  radius={[5, 5, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </Chart>
        )}
        {tab === "overview" && (
          <Chart
            title="Conciliaciones por producto"
            sub="Top 10 por volumen; productos restantes agrupados en Otros"
            wide
          >
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={productConcentration}
                layout="vertical"
                margin={{ top: 10, right: 20, left: 40, bottom: 5 }}
              >
                <CartesianGrid stroke="#edf0f5" horizontal={false} />
                <XAxis type="number" axisLine={false} tickLine={false} allowDecimals={false} />
                <YAxis
                  type="category"
                  dataKey="product"
                  width={220}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip />
                <Bar
                  dataKey="count"
                  name="Conciliaciones"
                  fill="#3b8eea"
                  radius={[0, 6, 6, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </Chart>
        )}
      </div>
      {showAmounts ? (
        <CollectionTable
          rows={analysisRows}
          movements={analysisMovements}
          contracts={contracts}
        />
      ) : (
        <Table
          rows={overviewRowsWithPolicy}
          movements={analysisMovements}
          showAmounts={false}
        />
      )}
    </>
  );
}
function Alta({ contracts }: { contracts: EnrichedContract[] }) {
  type AltaRimacStatus = "BAJ" | "ERR" | "INC" | "FOR" | "PEN";
  const today = new Date().toISOString().slice(0, 10),
    year = today.slice(0, 4),
    month = today.slice(0, 7),
    minDate = contracts.reduce(
      (min, x) =>
        x.createdAt.slice(0, 10) < min ? x.createdAt.slice(0, 10) : min,
      today,
    ),
    maxDate = contracts.reduce(
      (max, x) =>
        x.createdAt.slice(0, 10) > max ? x.createdAt.slice(0, 10) : max,
      today,
    );
  const [rimac, setRimac] = useState<"ALL" | AltaRimacStatus>("ALL"),
    [product, setProduct] = useState("ALL"),
    [paymentFrequency, setPaymentFrequency] = useState("ALL"),
    [channel, setChannel] = useState("ALL"),
    [preset, setPreset] = useState("YEAR"),
    [from, setFrom] = useState(`${year}-01-01`),
    [to, setTo] = useState(today);
  const applyPreset = (value: string) => {
    setPreset(value);
    if (value === "TODAY") {
      setFrom(today);
      setTo(today);
    } else if (value === "MONTH") {
      setFrom(`${month}-01`);
      setTo(today);
    } else if (value === "YEAR") {
      setFrom(`${year}-01-01`);
      setTo(today);
    } else if (value === "12M") {
      const d = new Date(`${today}T12:00:00`);
      d.setFullYear(d.getFullYear() - 1);
      setFrom(d.toISOString().slice(0, 10));
      setTo(today);
    } else if (value === "ALL") {
      setFrom(minDate);
      setTo(maxDate);
    }
  };
  const productOptions = productFilterOptions(contracts),
    statusOptions = [
      ["ALL", "Todos"],
      ["FOR", "FOR · Formalizado"],
      ["PEN", "PEN · Pendiente"],
      ["BAJ", "BAJ · Baja"],
      ["ERR", "ERR · Error"],
      ["INC", "INC · Iniciado"],
    ];
  const channelOptions = [
    ...CHANNEL_OPTIONS,
    ...Array.from(
      new Set(
        contracts
          .map((contract) => contract.channel)
          .filter(
            (value) =>
              value &&
              value !== "Sin canal" &&
              !CHANNEL_OPTIONS.some((option) => option[1] === value),
          ),
      ),
    )
      .sort((a, b) => a.localeCompare(b))
      .map((value) => [value.toUpperCase().replace(/\s+/g, "_"), value]),
  ];
  const effectiveFrom = preset === "ALL" ? minDate : from,
    effectiveTo = preset === "ALL" ? maxDate : to,
    matchesChannel = (contract: EnrichedContract) =>
      channel === "ALL" ||
      contract.channel.toUpperCase().replace(/\s+/g, "_") === channel,
    baseContracts = contracts.filter(
      (contract) =>
        (product === "ALL" ||
          (contract.productCode || contract.productId) === product) &&
        (paymentFrequency === "ALL" ||
          contract.paymentFrequency === paymentFrequency) &&
        matchesChannel(contract),
    ),
    scoped = baseContracts.filter(
      (x) => rimac === "ALL" || x.rimacStatus === rimac,
    ),
    filtered = scoped.filter(
      (x) =>
        x.createdAt.slice(0, 10) >= effectiveFrom &&
        x.createdAt.slice(0, 10) <= effectiveTo,
    );
  const todayCount = scoped.filter(
      (x) => x.createdAt.slice(0, 10) === today,
    ).length,
    monthCount = scoped.filter((x) => x.createdAt.slice(0, 7) === month).length,
    pendingInPeriod = filtered.filter(
      (x) => x.rimacStatus === "PEN",
    ).length,
    formalized = filtered.filter(
      (x) => x.rimacStatus === "FOR" || x.rimacStatus === "INC",
    ).length,
    rate = filtered.length ? (formalized / filtered.length) * 100 : 0;
  const timeline = altaTimelineByProduct(filtered, effectiveFrom, effectiveTo, 4);
  const channelVolume = buildAltaChannelVolume(filtered);
  const topProductsPie = buildTopProductsPie(filtered, 3);
  const statusPie = buildAltaStatusPie(filtered);
  const productKeys = Array.from(
    new Set(
      timeline.flatMap((item) => Object.keys(item)).filter((key) => key !== "period" && key !== "total"),
    ),
  );
  const palette = [
    "#3b8eea",
    "#665cf6",
    "#20a77a",
    "#ef6c69",
    "#ffb020",
    "#0ea5e9",
    "#8b5cf6",
    "#14b8a6",
    "#f97316",
    "#64748b",
    "#111827",
  ];
  return (
    <>
      <div className="filters alta-contracts alta-filters-split">
        <b>
          <Filter /> Filtros del análisis
        </b>
        <section className="filter-group date-group">
          <h3>Rango de fechas</h3>
          <div className="filter-group-grid">
            <Field label="Desde">
              <input
                type="date"
                value={effectiveFrom}
                onChange={(e) => {
                  setFrom(e.target.value);
                  setPreset("CUSTOM");
                }}
              />
            </Field>
            <Field label="Hasta">
              <input
                type="date"
                value={effectiveTo}
                onChange={(e) => {
                  setTo(e.target.value);
                  setPreset("CUSTOM");
                }}
              />
            </Field>
            <Select
              label="Periodo rápido"
              value={preset}
              onChange={applyPreset}
              options={[
                ["TODAY", "Hoy"],
                ["MONTH", "Mes actual"],
                ["YEAR", "Año actual"],
                ["12M", "Últimos 12 meses"],
                ["ALL", "Histórico"],
                ["CUSTOM", "Personalizado"],
              ]}
            />
          </div>
        </section>
        <section className="filter-group business-group">
          <h3>Segmentación operativa</h3>
          <div className="filter-group-grid">
            <Select
              label="Producto"
              value={product}
              onChange={setProduct}
              options={productOptions}
            />
            <Select
              label="Canal"
              value={channel}
              onChange={setChannel}
              options={channelOptions}
            />
            <Select
              label="Frecuencia de pago"
              value={paymentFrequency}
              onChange={setPaymentFrequency}
              options={PAYMENT_FREQUENCY_FILTER_OPTIONS}
            />
            <Select
              label="Estado RIMAC"
              value={rimac}
              onChange={(value) => setRimac(value as "ALL" | AltaRimacStatus)}
              options={statusOptions}
            />
          </div>
        </section>
        <button
          className="reset"
          onClick={() => {
            setRimac("ALL");
            setProduct("ALL");
            setChannel("ALL");
            setPaymentFrequency("ALL");
            applyPreset("YEAR");
          }}
        >
          Limpiar
        </button>
      </div>
      <section className="metric-section fixed-metrics">
        <header>
          <div>
            <h2>Corte operativo fuera de período</h2>
          </div>
          <span>Indicadores base</span>
        </header>
        <div className="kpis">
          <Kpi
            label="Altas de hoy"
            value={fmt(todayCount)}
            help="No depende del rango de fechas"
            icon={<CalendarDays />}
            tone="purple"
          />
          <Kpi
            label="Altas del mes"
            value={fmt(monthCount)}
            help="No depende del rango de fechas"
            icon={<Users />}
            tone="blue"
          />
        </div>
      </section>
      <section className="metric-section variable-metrics">
        <header>
          <div>
            <h2>Desempeño del período seleccionado</h2>
          </div>
          <span>{fmt(filtered.length)} altas en el período</span>
        </header>
        <div className="kpis">
          <Kpi
            label="Formalizadas RIMAC"
            value={fmt(formalized)}
            help="Estados FOR e INC según período y filtros"
            icon={<CheckCircle2 />}
            tone="green"
            onClick={() => setRimac("FOR")}
            active={rimac === "FOR"}
          />
          <Kpi
            label="Pendientes RIMAC"
            value={fmt(pendingInPeriod)}
            help="Estado PEN según período y filtros"
            icon={<Clock3 />}
            tone="red"
            onClick={() => setRimac("PEN")}
            active={rimac === "PEN"}
          />
          <Kpi
            label="Tasa de formalización"
            value={`${rate.toFixed(1)}%`}
            help="FOR sobre altas del período"
            icon={<ShieldCheck />}
            tone="amber"
          />
        </div>
      </section>
      <div className="charts alta-charts-full">
        <Chart
          title="Altas diarias por producto"
          sub="Línea de tiempo secuencial con acumulado diario y desglose por producto"
          wide
        >
          <ResponsiveContainer width="100%" height={270}>
            <LineChart data={timeline} margin={{ top: 15, right: 20, left: -20 }}>
              <CartesianGrid stroke="#edf0f5" vertical={false} />
              <XAxis dataKey="period" axisLine={false} tickLine={false} />
              <YAxis axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip />
              <Legend />
              {productKeys.map((key, index) => (
                <Line
                  key={key}
                  dataKey={key}
                  name={key}
                  stroke={palette[index % palette.length]}
                  strokeWidth={1.8}
                  dot={false}
                />
              ))}
              <Line
                dataKey="total"
                name="Total altas"
                stroke="#111827"
                strokeWidth={3}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </Chart>
      </div>
      <div className="charts alta-insight-charts">
        <Chart
          title="Altas por canal"
          sub="Volumen de altas por canal con los filtros actuales"
          wide
        >
          <ResponsiveContainer width="100%" height={290}>
            <BarChart
              data={channelVolume}
              margin={{ top: 12, right: 12, left: -18, bottom: 6 }}
            >
              <CartesianGrid stroke="#edf0f5" vertical={false} />
              <XAxis dataKey="channel" axisLine={false} tickLine={false} />
              <YAxis axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip />
              <Bar
                dataKey="count"
                name="Altas"
                fill="#3b8eea"
                radius={[6, 6, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </Chart>
        <Chart
          title="Top productos por venta"
          sub="Top 3 productos del contexto y el resto agrupado en Otros"
        >
          <div className="donut">
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={topProductsPie}
                  innerRadius={58}
                  outerRadius={86}
                  paddingAngle={3}
                  dataKey="value"
                  nameKey="name"
                >
                  {topProductsPie.map((entry, index) => (
                    <Cell
                      key={`${entry.name}-${index}`}
                      fill={[
                        "#665cf6",
                        "#3b8eea",
                        "#20a77a",
                        "#8a93a5",
                      ][index % 4]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div>
              <strong>{fmt(filtered.length)}</strong>
              <span>altas analizadas</span>
            </div>
          </div>
          <div className="legend">
            {topProductsPie.map((slice, index) => (
              <span key={`${slice.name}-${index}`}>
                <i
                  style={{
                    background: ["#665cf6", "#3b8eea", "#20a77a", "#8a93a5"][
                      index % 4
                    ],
                  }}
                />
                {slice.name} <b>{slice.value}</b>
              </span>
            ))}
          </div>
        </Chart>
        <Chart
          title="Pendientes vs formalizadas"
          sub="Distribución operativa con el filtro activo"
        >
          <div className="donut">
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={statusPie}
                  innerRadius={58}
                  outerRadius={86}
                  paddingAngle={4}
                  dataKey="value"
                  nameKey="name"
                >
                  <Cell fill="#ef6c69" />
                  <Cell fill="#20a77a" />
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div>
              <strong>{fmt(filtered.length)}</strong>
              <span>total en contexto</span>
            </div>
          </div>
          <div className="legend">
            <span>
              <i className="red" />
              Pendientes <b>{statusPie.find((x) => x.name === "Pendientes")?.value || 0}</b>
            </span>
            <span>
              <i className="green" />
              Formalizadas <b>{statusPie.find((x) => x.name === "Formalizadas")?.value || 0}</b>
            </span>
          </div>
        </Chart>
      </div>
      <ContractTable rows={filtered} today={today} />
    </>
  );
}
function Kpi({
  label,
  value,
  help,
  icon,
  tone,
  onClick,
  active,
}: {
  label: string;
  value: string;
  help?: string;
  icon: ReactNode;
  tone: string;
  onClick?: () => void;
  active?: boolean;
}) {
  const content = (
    <>
      <b className={tone}>{icon}</b>
      <span>{label}</span>
      <strong>{value}</strong>
      {help ? <small>{help}</small> : null}
    </>
  );
  return onClick ? (
    <button
      type="button"
      className={`kpi kpi-action ${active ? "selected" : ""}`}
      onClick={onClick}
    >
      {content}
    </button>
  ) : (
    <article className="kpi">{content}</article>
  );
}
function Chart({
  title,
  sub,
  children,
  wide,
}: {
  title: string;
  sub: string;
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    <article className={`chart ${wide ? "wide" : ""}`}>
      <header>
        <div>
          <h2>{title}</h2>
          <p>{sub}</p>
        </div>
        <Menu />
      </header>
      {children}
    </article>
  );
}
function buildProductConcentration(
  rows: Row[],
  contractIndex: Map<string, EnrichedContract>,
) {
  const grouped = new Map<string, number>();
  rows.forEach((row) => {
    const contract = contractIndex.get(
        contractReferenceKey(row.entity, row.branch, row.account),
      ),
      productName =
        contract?.productDescription && contract.productDescription !== "—"
          ? contract.productDescription
          : contract?.productCode || contract?.productId || "Sin producto";
    grouped.set(productName, (grouped.get(productName) || 0) + 1);
  });
  const sorted = [...grouped.entries()]
    .map(([product, count]) => ({ product, count }))
    .sort((a, b) => b.count - a.count);
  if (sorted.length <= 10) return sorted;
  const top = sorted.slice(0, 10),
    others = sorted.slice(10).reduce((sum, item) => sum + item.count, 0);
  return [...top, { product: "Otros", count: others }];
}
function Badge({ status, label }: { status: StatusCode; label?: string }) {
  return (
    <span className={`badge ${status.toLowerCase()}`}>
      {status === "SOL" ? <CheckCircle2 /> : <Clock3 />}
      {label || status === "SOL" ? "Solucionado" : "Pendiente"}
    </span>
  );
}
function Table({
  rows,
  movements,
  showAmounts,
}: {
  rows: Row[];
  movements: Movement[];
  showAmounts: boolean;
}) {
  const [page, setPage] = useState(1),
    size = 10,
    pages = Math.max(1, Math.ceil(rows.length / size)),
    current = Math.min(page, pages),
    visible = rows.slice((current - 1) * size, current * size),
    today = new Date().toISOString().slice(0, 10),
    summaries = movementSummaries(movements);
  const summary = (id: number) =>
    summaries.get(id) || {
      count: 0,
      paymentAmount: 0,
      operatedAmount: 0,
      difference: 0,
    };
  const download = () => {
    const joined = rows.map((r) => {
        const base = {
          conciliationId: r.id,
          process: r.process,
          policy: r.policy,
          receipt: r.receipt,
          errorCode: r.errorCode,
          errorDescription: r.errorDescription,
          status: r.status,
          createdAt: r.createdAt,
          ansDays: days(r.createdAt.slice(0, 10), today),
        };
        return showAmounts
          ? {
              ...base,
              paymentAmount: summary(r.id).paymentAmount,
              operatedAmount: summary(r.id).operatedAmount,
              centDifference: summary(r.id).difference,
            }
          : base;
      }),
      url = URL.createObjectURL(
        new Blob([Papa.unparse(joined)], { type: "text/csv" }),
      ),
      a = document.createElement("a");
    a.href = url;
    a.download = showAmounts
      ? "cobranza_con_montos.csv"
      : "conciliaciones_overview.csv";
    a.click();
    URL.revokeObjectURL(url);
  };
  return (
    <section className="table-card">
      <header>
        <div>
          <h2>Detalle de conciliaciones</h2>
          <p>
            {fmt(rows.length)} conciliaciones del análisis
          </p>
        </div>
        <button className="btn outline" onClick={download}>
          <Download /> Descargar CSV
        </button>
      </header>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>ID conciliación</th>
              <th>Proceso</th>
              <th>Póliza</th>
              <th>Código error</th>
              {showAmounts && (
                <>
                  <th>Monto pagado</th>
                  <th>Monto operado</th>
                  <th>Diferencia</th>
                </>
              )}
              <th>Fecha creación</th>
              <th>Estado</th>
              <th>ANS conciliación</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((r) => {
              const amounts = summary(r.id);
              return (
                <tr key={r.id}>
                  <td>#{r.id}</td>
                  <td>
                    <i
                      className="process"
                      style={{
                        color: PROCESS_COLORS[r.process],
                        background: `${PROCESS_COLORS[r.process]}15`,
                      }}
                    >
                      {PROCESS_LABELS[r.process]}
                    </i>
                  </td>
                  <td>
                    <b>{r.policy || "—"}</b>
                  </td>
                  <td>
                    <b>{r.errorCode}</b>
                  </td>
                  {showAmounts && (
                    <>
                      <td>{money(amounts.paymentAmount)}</td>
                      <td>{money(amounts.operatedAmount)}</td>
                      <td>
                        <i
                          className={`amount-diff ${Math.abs(amounts.difference) >= 0.1 ? "high" : ""}`}
                        >
                          {money(amounts.difference)}
                        </i>
                      </td>
                    </>
                  )}
                  <td>{dateFmt(r.createdAt)}</td>
                  <td>
                    <Badge status={r.status} />
                  </td>
                  <td>
                    <b>{`${days(r.createdAt.slice(0, 10), today)} días`}</b>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!visible.length && (
          <div className="empty">
            <Search />
            <b>No hay resultados</b>
            <span>Ajusta los filtros.</span>
          </div>
        )}
      </div>
      <footer>
        <span>
          Mostrando {visible.length ? (current - 1) * size + 1 : 0}–
          {Math.min(current * size, rows.length)} de {rows.length}
        </span>
        <div>
          <button disabled={current === 1} onClick={() => setPage(current - 1)}>
            Anterior
          </button>
          <b>{current}</b>
          <button
            disabled={current === pages}
            onClick={() => setPage(current + 1)}
          >
            Siguiente
          </button>
        </div>
      </footer>
    </section>
  );
}
function CollectionTable({
  rows,
  movements,
  contracts,
}: {
  rows: Row[];
  movements: Movement[];
  contracts: EnrichedContract[];
}) {
  const today = new Date().toISOString().slice(0, 10),
    amountWithoutCurrency = (value: number) =>
      new Intl.NumberFormat("es-PE", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(value),
    summaries = movementSummaries(movements),
    summary = (id: number) =>
      summaries.get(id) || {
        count: 0,
        paymentAmount: 0,
        operatedAmount: 0,
        difference: 0,
      },
    contractIndex = new Map(
      contracts.map((contract) => [
        contractReferenceKey(
          contract.entity,
          contract.branch,
          contract.id.slice(10),
        ),
        contract,
      ]),
    ),
    contract = (row: Row) =>
      contractIndex.get(
        contractReferenceKey(row.entity, row.branch, row.account),
      ),
    download = () => {
      const data = rows.map((row) => {
          const match = contract(row),
            amounts = summary(row.id),
            informedAmount = row.status === "PEN" ? 0 : amounts.paymentAmount,
            differenceAmount = row.status === "PEN" ? 0 : amounts.difference;
          return {
            conciliationId: row.id,
            policy: match?.policy || "",
            product: match?.productDescription || "",
            modality: match?.modalityDescription || "",
            currency: match?.currency || "",
            policyReceiptId: row.receipt,
            errorCode: row.errorCode,
            errorDescription: row.errorDescription,
            paymentAmount: informedAmount,
            operatedAmount: amounts.operatedAmount,
            difference: differenceAmount,
            creationDate: row.createdAt,
            status: row.status,
            openDays: days(row.createdAt.slice(0, 10), today),
          };
        }),
        url = URL.createObjectURL(
          new Blob([Papa.unparse(data)], { type: "text/csv" }),
        ),
        anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "cobranza_con_contrato_y_montos.csv";
      anchor.click();
      URL.revokeObjectURL(url);
    };
  return (
    <section className="table-card collection-detail">
      <header>
        <div>
          <h2>Detalle de conciliaciones de cobranza</h2>
          <p>
            {fmt(rows.length)} casos · resultado de cobro diferenciado por
            código de error
          </p>
        </div>
        <button className="btn outline" onClick={download}>
          <Download /> Descargar CSV
        </button>
      </header>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>ID conciliación</th>
              <th>Póliza</th>
              <th>Producto</th>
              <th>Modalidad</th>
              <th>Recibo</th>
              <th>Código error</th>
              <th>Monto informado</th>
              <th>Monto operado</th>
              <th>Moneda</th>
              <th>Diferencia</th>
              <th>Fecha creación</th>
              <th>Estado</th>
              <th>Días abierto</th>
            </tr>
          </thead>
          <tbody>
            {rows.slice(0, 12).map((row) => {
              const match = contract(row),
                amounts = summary(row.id),
                informedAmount = row.status === "PEN" ? 0 : amounts.paymentAmount,
                differenceAmount = row.status === "PEN" ? 0 : amounts.difference;
              return (
                <tr key={row.id}>
                  <td>#{row.id}</td>
                  <td>
                    <b>{match?.policy || <em>Sin match contrato</em>}</b>
                  </td>
                  <td>
                    <b>{match?.productDescription || "—"}</b>
                  </td>
                  <td>{match?.modalityDescription || "—"}</td>
                  <td>{row.receipt || "—"}</td>
                  <td>
                    <b>{row.errorCode}</b>
                  </td>
                  <td>{amountWithoutCurrency(informedAmount)}</td>
                  <td>{amountWithoutCurrency(amounts.operatedAmount)}</td>
                  <td>{match?.currency || "—"}</td>
                  <td>
                    <i
                      className={`amount-diff ${Math.abs(differenceAmount) >= 0.1 ? "high" : ""}`}
                    >
                      {amountWithoutCurrency(differenceAmount)}
                    </i>
                  </td>
                  <td>{dateFmt(row.createdAt)}</td>
                  <td>
                    <Badge status={row.status} />
                  </td>
                  <td>
                    <b>{`${days(row.createdAt.slice(0, 10), today)} días`}</b>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
function ContractTable({
  rows,
  today,
}: {
  rows: EnrichedContract[];
  today: string;
}) {
  const download = () => {
    const data = rows.map((r) => ({
        contractId: r.id,
        policy: r.policy,
        customerId: r.customer,
        product: r.productDescription,
        creationDate: r.createdAt,
        modality: r.modalityDescription,
        paymentFrequency: paymentFrequencyLabel(r.paymentFrequency),
        periodicPremium: r.periodicPremium,
        currency: r.currency,
        channel: r.channel,
        subchannel: r.subchannel,
        bankStatus: r.bankStatus,
        rimacStatus: r.rimacStatus,
        pendingDays:
          r.rimacStatus === "PEN"
            ? days(r.createdAt.slice(0, 10), today)
            : "",
        sourcePlatform: r.sourcePlatform,
      })),
      url = URL.createObjectURL(
        new Blob([Papa.unparse(data)], { type: "text/csv" }),
      ),
      a = document.createElement("a");
    a.href = url;
    a.download = "altas_contratos_enriquecidos.csv";
    a.click();
    URL.revokeObjectURL(url);
  };
  return (
    <section className="table-card alta-detail">
      <header>
        <div>
          <h2>Detalle de altas de contratos</h2>
          <p>
            {fmt(rows.length)} contratos en el rango seleccionado ·
            enriquecidos con ICDTCAP
          </p>
        </div>
        <button className="btn outline" onClick={download}>
          <Download /> Descargar altas CSV
        </button>
      </header>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>ID contrato completo</th>
              <th>Póliza</th>
              <th>Customer ID</th>
              <th>Producto</th>
              <th>Modalidad</th>
              <th>Frecuencia de pago</th>
              <th>Prima periódica</th>
              <th>Moneda</th>
              <th>Fecha de alta</th>
              <th>Canal</th>
              <th>Subcanal</th>
              <th>Estado Banco</th>
              <th>Estado RIMAC</th>
              <th>Días pendiente RIMAC</th>
            </tr>
          </thead>
          <tbody>
            {rows.slice(0, 12).map((r) => (
              <tr key={r.id}>
                <td>
                  <b>{r.id}</b>
                </td>
                <td>
                  <b>{r.policy || <em>Sin póliza</em>}</b>
                </td>
                <td>{r.customer || "—"}</td>
                <td>{r.productDescription || "—"}</td>
                <td>{r.modalityDescription || "—"}</td>
                <td>{paymentFrequencyLabel(r.paymentFrequency)}</td>
                <td>{premiumLabel(r.periodicPremium)}</td>
                <td>{r.currency || "—"}</td>
                <td>{dateFmt(r.createdAt)}</td>
                <td>{r.channel || "—"}</td>
                <td>{r.subchannel || ""}</td>
                <td>
                  <ContractStatusBadge status={r.bankStatus} />
                </td>
                <td>
                  <ContractStatusBadge status={r.rimacStatus} />
                </td>
                <td>
                  {r.rimacStatus === "PEN"
                    ? `${days(r.createdAt.slice(0, 10), today)} días`
                    : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
function ContractStatusBadge({ status }: { status: ContractStatus }) {
  const pending = status === "PEN";
  return (
    <span
      className={`badge ${status === "FOR" ? "sol" : pending ? "pen" : "neutral"}`}
    >
      {status === "FOR" ? (
        <CheckCircle2 />
      ) : pending ? (
        <Clock3 />
      ) : (
        <Activity />
      )}
      {status} · {CONTRACT_STATUS_LABELS[status]}
    </span>
  );
}
function buildTrend(rows: Row[]) {
  return Array.from({ length: 12 }, (_, i) => {
    const d = new Date(2025, 7 + i, 1),
      m = rows.filter((r) => {
        const c = new Date(r.createdAt);
        return (
          c.getMonth() === d.getMonth() && c.getFullYear() === d.getFullYear()
        );
      });
    return {
      month: new Intl.DateTimeFormat("es-PE", { month: "short" }).format(d),
      pendientes: m.filter((r) => r.status === "PEN").length,
      solucionados: m.filter((r) => r.status === "SOL").length,
    };
  });
}
function cancellationTrend(rows: Row[], from: string, to: string) {
  const grouped = new Map<
      string,
      { period: string; abiertas: number; resueltas: number }
    >(),
    ensure = (period: string) => {
      const current = grouped.get(period) || {
        period,
        abiertas: 0,
        resueltas: 0,
      };
      grouped.set(period, current);
      return current;
    };
  rows.forEach((row) => {
    ensure(row.createdAt.slice(0, 7)).abiertas++;
    const audit = row.auditAt.slice(0, 10);
    if (row.status === "SOL" && audit >= from && audit <= to)
      ensure(audit.slice(0, 7)).resueltas++;
  });
  return [...grouped.values()].sort((a, b) => a.period.localeCompare(b.period));
}
function buildCancellationStatusPie(
  rows: Row[],
  contractIndex: Map<string, EnrichedContract>,
) {
  const totals = {
    anu: 0,
    baj: 0,
  };
  rows.forEach((row) => {
    const contract = contractIndex.get(
      contractReferenceKey(row.entity, row.branch, row.account),
    );
    if (!contract) return;
    if (contract.bankStatus === "ANU") totals.anu++;
    else if (contract.bankStatus === "BAJ") totals.baj++;
  });
  return [
    { name: "ANU", value: totals.anu },
    { name: "BAJ", value: totals.baj },
  ];
}
function altaTimelineByProduct(
  rows: EnrichedContract[],
  from: string,
  to: string,
  topLimit: number,
) {
  const productTotals = new Map<string, number>();
  rows.forEach((row) => {
    const product = approvedProductName(
      row.productCode || row.productId,
      row.productDescription && row.productDescription !== "—"
        ? row.productDescription
        : undefined,
    );
    productTotals.set(product, (productTotals.get(product) || 0) + 1);
  });
  const topProducts = [...productTotals.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, topLimit)
      .map(([name]) => name),
    hasOthers = productTotals.size > topProducts.length,
    products = hasOthers ? [...topProducts, "Otros"] : topProducts,
    records: Array<Record<string, string | number>> = [];
  const cursor = new Date(`${from}T12:00:00`),
    end = new Date(`${to}T12:00:00`);
  while (cursor <= end) {
    const period = cursor.toISOString().slice(0, 10),
      entry: Record<string, string | number> = { period, total: 0 };
    products.forEach((product) => {
      entry[product] = 0;
    });
    rows
      .filter((row) => row.createdAt.slice(0, 10) === period)
      .forEach((row) => {
        const product = approvedProductName(
          row.productCode || row.productId,
          row.productDescription && row.productDescription !== "—"
            ? row.productDescription
            : undefined,
        );
        const bucket = topProducts.includes(product) ? product : "Otros";
        if (bucket === "Otros" && !hasOthers) return;
        entry[bucket] = Number(entry[bucket] || 0) + 1;
        entry.total = Number(entry.total || 0) + 1;
      });
    records.push(entry);
    cursor.setDate(cursor.getDate() + 1);
  }
  return records;
}
function buildAltaChannelVolume(rows: EnrichedContract[]) {
  const grouped = new Map<string, number>();
  rows.forEach((row) => {
    const key = row.channel || "Sin canal";
    grouped.set(key, (grouped.get(key) || 0) + 1);
  });
  return [...grouped.entries()]
    .map(([channel, count]) => ({ channel, count }))
    .sort((a, b) => b.count - a.count);
}
function buildTopProductsPie(rows: EnrichedContract[], topLimit: number) {
  const grouped = new Map<string, number>();
  rows.forEach((row) => {
    const key = approvedProductName(
      row.productCode || row.productId,
      row.productDescription && row.productDescription !== "—"
        ? row.productDescription
        : undefined,
    );
    grouped.set(key, (grouped.get(key) || 0) + 1);
  });
  const sorted = [...grouped.entries()].sort((a, b) => b[1] - a[1]);
  const top = sorted.slice(0, topLimit).map(([name, value]) => ({ name, value }));
  const others = sorted.slice(topLimit).reduce((sum, item) => sum + item[1], 0);
  if (others > 0) top.push({ name: "Otros", value: others });
  return top.length ? top : [{ name: "Sin datos", value: 0 }];
}
function buildRenewalFailureByProduct(
  rows: EnrichedContract[],
  topLimit: number,
) {
  const grouped = new Map<string, number>();
  rows
    .filter((row) => row.renewalStatus !== "REN")
    .forEach((row) => {
      const key = approvedProductName(
        row.productCode || row.productId,
        row.productDescription && row.productDescription !== "—"
          ? row.productDescription
          : undefined,
      );
      grouped.set(key, (grouped.get(key) || 0) + 1);
    });
  const sorted = [...grouped.entries()].sort((a, b) => b[1] - a[1]);
  const top = sorted.slice(0, topLimit).map(([name, value]) => ({ name, value }));
  const others = sorted.slice(topLimit).reduce((sum, item) => sum + item[1], 0);
  if (others > 0) top.push({ name: "Otros", value: others });
  return top.length ? top : [{ name: "Sin fallas", value: 0 }];
}
function buildAltaStatusPie(rows: EnrichedContract[]) {
  const pending = rows.filter((row) => row.rimacStatus === "PEN").length,
    formalized = rows.filter(
      (row) => row.rimacStatus === "FOR" || row.rimacStatus === "INC",
    ).length;
  return [
    { name: "Pendientes", value: pending },
    { name: "Formalizadas", value: formalized },
  ];
}
