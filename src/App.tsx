import {
  ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Activity,
  ArrowRight,
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Download,
  FileCheck2,
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
  ComposedChart,
  Legend,
  Line,
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
  invoicedAmount: number;
  chargedAmount: number;
  billingStatus: "FAC" | "PEN";
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
  const nreConvertedToCustomerRejection = new Set([1, 97, 67, 37, 43, 109]);
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
    const generatedRenewalStatus: RenewalContractStatusType = (
      ["ENV", "NRE", "REN", "PRN", "PRE", "RZD"] as RenewalContractStatusType[]
    )[i % 6];
    const renewalStatus: RenewalContractStatusType =
      generatedRenewalStatus === "RZD"
        ? "ENV"
        : generatedRenewalStatus === "NRE" &&
            nreConvertedToCustomerRejection.has(i)
          ? "RZD"
          : generatedRenewalStatus;
    return {
      id: `${entity}${branch}${first}${second}${account}`,
      entity,
      branch,
      policy: String(6100000 + i * 17),
      customer: String(10000001 + i).slice(-8),
      productId: String(1001 + (i % 10)),
      renewalStatus,
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
      settlement.setDate(settlement.getDate() - ((i + receipt) % 10));
      receipts.push({
        key: contract.id,
        movementNumber: 900000 + i * 3 + receipt,
        settlementDate: settlement.toISOString().slice(0, 10),
        collectionDate: "",
        attemptCount: 0,
        invoicedAmount: 320,
        chargedAmount: 0,
        billingStatus: "PEN",
        collectionStatus: "PEN",
      });
    }
  });
  const invoicedTarget = Math.min(180, receipts.length),
    collectedTarget = Math.min(177, invoicedTarget);
  return receipts.map((receipt, index) => {
    const rank = (index * 97) % receipts.length,
      invoiced = rank < invoicedTarget,
      collected = rank < collectedTarget,
      collection = new Date(receipt.settlementDate);
    collection.setDate(collection.getDate() + (index % 2));
    return {
      ...receipt,
      collectionDate: collected ? collection.toISOString().slice(0, 10) : "",
      attemptCount: invoiced ? 1 + (index % 2) : 0,
      chargedAmount: collected ? receipt.invoicedAmount : 0,
      billingStatus: invoiced ? "FAC" : "PEN",
      collectionStatus: collected ? "COB" : "PEN",
    };
  });
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
  const [minCollectionDate, maxCollectionDate] = useMemo(() => {
    const dates = [
      ...rows
        .filter((row) => row.process === "INV")
        .map((row) => row.createdAt.slice(0, 10)),
      ...icdtcam.flatMap((receipt) => [
        receipt.settlementDate,
        receipt.collectionDate,
      ]),
    ]
      .filter(Boolean)
      .sort();
    const fallback = new Date().toISOString().slice(0, 10);
    return [dates[0] || fallback, dates[dates.length - 1] || fallback];
  }, [icdtcam, rows]);
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
    setFrom(t === "cobranza" ? minCollectionDate : minRowDate);
    setTo(t === "cobranza" ? maxCollectionDate : maxRowDate);
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
                minDate={minCollectionDate}
                maxDate={maxCollectionDate}
                productOptions={productFilterOptions(enrichedContracts)}
                setStatus={setStatus}
                setFrom={setFrom}
                setTo={setTo}
                setProduct={setProduct}
                setPaymentFrequency={setPaymentFrequency}
                reset={() => {
                  setStatus("ALL");
                  setFrom(minCollectionDate);
                  setTo(maxCollectionDate);
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
                activeFrom={from}
                activeTo={to}
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
                activeFrom={from}
                activeTo={to}
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
      : 0;
  const cancellationReasons = [
      { name: "Impago", value: 2987, color: "#ff5c62" },
      { name: "Fin de vigencia", value: 1245, color: "#2f73ed" },
      { name: "Inmediata", value: 660, color: "#f5a11a" },
    ],
    cancellationMonthly = [
      { period: "Ene 2026", impago: 430, finVigencia: 180, solicitud: 95 },
      { period: "Feb 2026", impago: 510, finVigencia: 225, solicitud: 120 },
      { period: "Mar 2026", impago: 470, finVigencia: 190, solicitud: 105 },
      { period: "Abr 2026", impago: 455, finVigencia: 185, solicitud: 110 },
      { period: "May 2026", impago: 610, finVigencia: 260, solicitud: 130 },
      { period: "Jun 2026", impago: 512, finVigencia: 205, solicitud: 100 },
    ],
    refundMonthly = [
      { period: "Ene 2026", refund: 12500, commission: 2400 },
      { period: "Feb 2026", refund: 17600, commission: 4100 },
      { period: "Mar 2026", refund: 13000, commission: 2500 },
      { period: "Abr 2026", refund: 12800, commission: 2600 },
      { period: "May 2026", refund: 26000, commission: 4200 },
      { period: "Jun 2026", refund: 16520, commission: 2960 },
    ],
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
    <div className="cancellation-quicksight">
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
      <section className="cancellation-qs-section">
        <header className="cancellation-qs-title">
          <b>1</b>
          <div>
            <h2>Métricas generales de cancelaciones</h2>
            <p>Resumen de contratos de cancelación en el período seleccionado.</p>
          </div>
          <span className="demo-data-label">Datos demostrativos</span>
        </header>
        <div className="cancellation-business-kpis">
          <article className="cancellation-business-kpi total"><CalendarDays /><span>Total de contratos cancelados</span><strong>{fmt(4892)}</strong><small>100% del total</small></article>
          <article className="cancellation-business-kpi impago"><FileWarning /><span>Cancelados por impago</span><strong>{fmt(2987)}</strong><small>61.1% del total</small></article>
          <article className="cancellation-business-kpi expiry"><CalendarDays /><span>Cancelados por fin de vigencia</span><strong>{fmt(1245)}</strong><small>25.4% del total</small></article>
          <article className="cancellation-business-kpi request"><Users /><span>Cancelación inmediata</span><strong>{fmt(660)}</strong><small>13.5% del total</small></article>
          <article className="cancellation-business-kpi financial premium"><Activity /><span>Prima total de cancelación inmediata</span><strong>{moneyUsd(520340)}</strong><b>{money(1284660)}</b></article>
          <article className="cancellation-business-kpi financial refund"><Activity /><span>Monto total de devolución</span><strong>{moneyUsd(42530)}</strong><b>{money(98420)}</b></article>
          <article className="cancellation-business-kpi financial commission"><Activity /><span>Comisión total devuelta</span><strong>{moneyUsd(7890)}</strong><b>{money(18760)}</b></article>
        </div>
        <div className="charts cancellation-business-charts">
          <Chart title="Cancelaciones por tipo de motivo" sub="Cantidad de contratos cancelados por mes y motivo">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={cancellationMonthly} margin={{ top: 15, right: 10, left: -12 }}>
                <CartesianGrid stroke="#edf0f5" vertical={false} />
                <XAxis dataKey="period" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip /><Legend />
                <Bar dataKey="impago" name="Impago" stackId="motivo" fill="#ff5c62" />
                <Bar dataKey="finVigencia" name="Fin de vigencia" stackId="motivo" fill="#2f73ed" />
                <Bar dataKey="solicitud" name="Inmediata" stackId="motivo" fill="#f5a11a" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Chart>
          <Chart title="Distribución de cancelaciones por motivo" sub="Participación sobre 4,892 contratos cancelados">
            <div className="donut">
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={cancellationReasons} innerRadius={58} outerRadius={84} paddingAngle={2} dataKey="value" nameKey="name">
                    {cancellationReasons.map((reason) => <Cell key={reason.name} fill={reason.color} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div><strong>{fmt(4892)}</strong><span>cancelaciones</span></div>
            </div>
            <div className="legend cancellation-reason-legend">
              {cancellationReasons.map((reason) => <span key={reason.name}><i style={{ background: reason.color }} />{reason.name} <b>{fmt(reason.value)}</b></span>)}
            </div>
          </Chart>
          <Chart title="Montos por devolución al cliente" sub="Evolución mensual del monto y comisión devueltos en soles">
            <ResponsiveContainer width="100%" height={250}>
              <ComposedChart data={refundMonthly} margin={{ top: 15, right: 0, left: 0 }}>
                <CartesianGrid stroke="#edf0f5" vertical={false} />
                <XAxis dataKey="period" axisLine={false} tickLine={false} />
                <YAxis yAxisId="refund" axisLine={false} tickLine={false} tickFormatter={(value) => fmt(value)} />
                <YAxis yAxisId="commission" orientation="right" axisLine={false} tickLine={false} tickFormatter={(value) => fmt(value)} />
                <Tooltip formatter={(value: number) => money(value)} /><Legend />
                <Bar yAxisId="refund" dataKey="refund" name="Monto devuelto (S/)" fill="#aaa4f7" radius={[3, 3, 0, 0]} />
                <Line yAxisId="commission" dataKey="commission" name="Comisión devuelta (S/)" stroke="#4637ef" strokeWidth={2} dot={{ r: 3, fill: "#4637ef" }} />
              </ComposedChart>
            </ResponsiveContainer>
          </Chart>
        </div>
      </section>
      <section className="cancellation-qs-section reconciliation-section">
        <header className="cancellation-qs-title">
          <b>2</b>
          <div>
            <h2>Conciliación con RIMAC</h2>
            <p>Estado de las conciliaciones de cancelación entre el banco y RIMAC.</p>
          </div>
          <span>Actualizado al {dateFmt(today)}</span>
        </header>
        <div className="cancellation-reconciliation-row">
          <div className="cancellation-flow">
            <article className="flow-card total"><CalendarDays /><div><span>Total de conciliaciones</span><strong>{fmt(filtered.length)}</strong><small>100% del período</small></div></article>
            <ArrowRight />
            <article className="flow-card pending"><FileWarning /><div><span>No conciliadas en RIMAC</span><strong>{fmt(pending.length)}</strong><small>{filtered.length ? `${((pending.length / filtered.length) * 100).toFixed(1)}% del total` : "0% del total"}</small></div></article>
            <ArrowRight />
            <article className="flow-card solved"><CheckCircle2 /><div><span>Resueltas en RIMAC</span><strong>{fmt(solved.length)}</strong><small>{resolutionRate.toFixed(1)}% del total</small></div></article>
          </div>
          <article className="cancellation-resolution-card">
            <Clock3 />
            <span>Tiempo medio de resolución</span>
            <strong>{averageResolution.toFixed(1)} días</strong>
            <small>Desde apertura hasta solución</small>
          </article>
        </div>
        <div className="cancellation-detail-grid">
          <Chart title="Conciliaciones abiertas por antigüedad" sub="Casos pendientes según días desde su creación">
            <ResponsiveContainer width="100%" height={255}>
              <BarChart data={ageBuckets} margin={{ top: 15, right: 15, left: -20 }}>
                <CartesianGrid stroke="#edf0f5" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="casos" name="Pendientes" fill="#ef6c69" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Chart>
          <CancellationTable rows={filtered} contracts={contracts} today={today} />
        </div>
      </section>
    </div>
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
            contractId: match?.id || "",
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
              <th>ID contrato</th>
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
                    <b>{match?.id || <em>Sin match contrato</em>}</b>
                  </td>
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
    [metricView, setMetricView] = useState<"COUNT" | "PREMIUM">("COUNT"),
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
    openStagesByContract = new Map<string, Set<RenewalStage>>(),
    openModesByContractStage = new Map<string, Set<RenewalMode>>();
  allIncidentEntries
    .filter((entry) => entry.row.status === "PEN")
    .forEach((entry) => {
      if (!entry.contract || !entry.meta) return;
      const stages = openStagesByContract.get(entry.contract.id) || new Set();
      stages.add(entry.meta.stage);
      openStagesByContract.set(entry.contract.id, stages);
      const modeKey = `${entry.contract.id}:${entry.meta.stage}`,
        modes = openModesByContractStage.get(modeKey) || new Set();
      modes.add(entry.meta.mode);
      openModesByContractStage.set(modeKey, modes);
    });
  const hasOpenStage = (contract: EnrichedContract, stage: RenewalStage) =>
      openStagesByContract.get(contract.id)?.has(stage) || false,
    hasOpenStageMode = (
      contract: EnrichedContract,
      stage: RenewalStage,
      mode: RenewalMode,
    ) =>
      openModesByContractStage
        .get(`${contract.id}:${stage}`)
        ?.has(mode) || false,
    isActive = (contract: EnrichedContract) =>
      !["BAJ", "ANU", "ERR"].includes(contract.bankStatus),
    matchesContractFilters = (contract: EnrichedContract) =>
      (product === "ALL" ||
        (contract.productCode || contract.productId) === product) &&
      (paymentFrequency === "ALL" ||
        contract.paymentFrequency === paymentFrequency),
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
    preFunnel = periodContracts.reduce(
      (acc, contract) => {
        if (
          contract.renewalStatus === "NRE" ||
          contract.renewalStatus === "RZD"
        ) {
          acc.rejected += 1;
          return acc;
        }
        if (hasOpenStage(contract, "PRE")) {
          acc.missing += 1;
          if (hasOpenStageMode(contract, "PRE", "AUTOMATIC"))
            acc.missingAutomatic += 1;
          else acc.missingNonAutomatic += 1;
          return acc;
        }
        acc.confirmed += 1;
        return acc;
      },
      {
        confirmed: 0,
        missing: 0,
        rejected: 0,
        missingAutomatic: 0,
        missingNonAutomatic: 0,
      },
    ),
    confirmedByRimac = periodContracts.filter(
      (contract) =>
        contract.renewalStatus !== "NRE" &&
        contract.renewalStatus !== "RZD" &&
        !hasOpenStage(contract, "PRE"),
    ),
    receiptApplicableContracts = confirmedByRimac.filter((contract) => {
      const receiptDueDate = addCalendarDays(contract.expiryDate, -45);
      return (
        contract.renewalStatus === "PRN" ||
        contract.renewalStatus === "PRE" ||
        today < receiptDueDate
      );
    }),
    receiptPendingContracts = confirmedByRimac.filter((contract) => {
      const receiptDueDate = addCalendarDays(contract.expiryDate, -45);
      return contract.renewalStatus === "PRE" && today >= receiptDueDate;
    }),
    receiptFunnel = receiptApplicableContracts.reduce(
      (acc, contract) => {
        const receiptDueDate = addCalendarDays(contract.expiryDate, -45);
        if (today < receiptDueDate) {
          acc.notDue += 1;
          return acc;
        }
        if (contract.renewalStatus === "PRN") {
          acc.sent += 1;
          return acc;
        }
        if (contract.renewalStatus === "PRE") acc.pending += 1;
        return acc;
      },
      { sent: 0, pending: 0, notDue: 0 },
    ),
    receiptPendingAging = receiptPendingContracts.reduce(
      (acc, contract) => {
        const receiptDueDate = addCalendarDays(contract.expiryDate, -45),
          overdueDays = Math.max(0, signedCalendarDays(receiptDueDate, today));
        if (overdueDays >= 1 && overdueDays <= 5) acc.d1to5 += 1;
        else if (overdueDays >= 6 && overdueDays <= 10) acc.d6to10 += 1;
        else if (overdueDays >= 11 && overdueDays <= 30) acc.d11to30 += 1;
        else if (overdueDays >= 31 && overdueDays <= 45) acc.d31to45 += 1;
        return acc;
      },
      { d1to5: 0, d6to10: 0, d11to30: 0, d31to45: 0 },
    ),
    receiptPendingAgingRows = [
      { label: "D+1 a D+5", value: receiptPendingAging.d1to5, color: "#f4b14a" },
      { label: "D+6 a D+10", value: receiptPendingAging.d6to10, color: "#ee9f2a" },
      { label: "D+11 a D+30", value: receiptPendingAging.d11to30, color: "#df7d1f" },
      { label: "D+31 a D+45", value: receiptPendingAging.d31to45, color: "#c95d1b" },
    ],
    preMissingAutomaticContracts = periodContracts.filter(
      (contract) =>
        hasOpenStage(contract, "PRE") &&
        hasOpenStageMode(contract, "PRE", "AUTOMATIC"),
    ),
    preMissingNonAutomaticContracts = periodContracts.filter(
      (contract) =>
        hasOpenStage(contract, "PRE") &&
        hasOpenStageMode(contract, "PRE", "NON_AUTOMATIC"),
    ),
    renewalResponseRows = [
      {
        label: "Aceptadas",
        detail: "Sin PRE abierta",
        contracts: confirmedByRimac,
        color: "#20a77a",
      },
      {
        label: "Pendientes automática",
        detail: "PRE_AUT_NOTFOUND_ERR",
        contracts: preMissingAutomaticContracts,
        color: "#ef6c69",
      },
      {
        label: "Pendientes no automática",
        detail: "PRE_NOTFOUND_ERR",
        contracts: preMissingNonAutomaticContracts,
        color: "#f3b4a7",
      },
      {
        label: "No aceptadas",
        detail: "Estados NRE y RZD",
        contracts: periodContracts.filter(
          (contract) =>
            contract.renewalStatus === "NRE" ||
            contract.renewalStatus === "RZD",
        ),
        color: "#a06af2",
      },
    ],
    receiptState = (contract: EnrichedContract) => {
      const dueDate = addCalendarDays(contract.expiryDate, -45);
      if (today < dueDate) return "Aún no corresponde";
      return contract.renewalStatus === "PRN"
        ? "Por renovar"
        : "Falta de información de RIMAC";
    },
    flowRows = [
      ...renewalResponseRows.flatMap((response) => {
        if (response.label === "No aceptadas") {
          return ["Rechazados RIMAC", "Rechazados cliente"].map((result) => ({
            response: response.label,
            receipt: result,
            result,
            contracts: response.contracts.filter((contract) =>
              result === "Rechazados RIMAC"
                ? contract.renewalStatus === "NRE"
                : contract.renewalStatus === "RZD",
            ),
          })).filter((row) => row.contracts.length > 0);
        }
        if (response.label === "Pendientes no automática") {
          return [
            {
              response: response.label,
              receipt: response.label,
              result: response.label,
              contracts: response.contracts,
            },
          ];
        }
        if (response.label === "Pendientes automática") {
          return [
            {
              response: response.label,
              receipt: "Por renovar con información pendiente",
              result: "",
              contracts: response.contracts,
            },
          ];
        }
        const missingRimacInformation = response.contracts.filter(
          (contract) => receiptState(contract) === "Falta de información de RIMAC",
        );
        const receiptGroups = [
          {
            receipt: "Por renovar",
            contracts: response.contracts.filter(
              (contract) => receiptState(contract) === "Por renovar",
            ),
          },
          {
            receipt: "Por renovar con información pendiente",
            contracts: missingRimacInformation.slice(0, 24),
          },
          {
            receipt: "Falta de información de RIMAC",
            contracts: missingRimacInformation.slice(24),
          },
          {
            receipt: "Aún no corresponde",
            contracts: response.contracts.filter(
              (contract) => receiptState(contract) === "Aún no corresponde",
            ),
          },
        ].map(({ receipt, contracts }) => ({
          response: response.label,
          receipt,
          result: "",
          contracts,
        }));
        return receiptGroups.filter((receiptGroup) => receiptGroup.contracts.length > 0);
      }),
    ],
      productBreakdown = (group: EnrichedContract[]) => {
        const counts = new Map<string, number>();
        group.forEach((contract) => {
          const product =
            contract.productDescription && contract.productDescription !== "—"
              ? contract.productDescription
              : contract.productCode || contract.productId || "Sin producto";
          counts.set(product, (counts.get(product) || 0) + 1);
        });
        const ordered = [...counts.entries()].sort((a, b) => b[1] - a[1]),
          top = ordered.slice(0, 4),
          otherCount = ordered.slice(4).reduce((sum, [, count]) => sum + count, 0);
        return otherCount
          ? [...top, ["Otros", otherCount] as [string, number]]
          : top;
      },
    rejectedByCustomerContracts = periodContracts.filter(
      (contract) => contract.renewalStatus === "RZD",
    ),
    rejectedByCustomer = rejectedByCustomerContracts.length,
    expiredWithoutRenewal = periodContracts.filter(
      (contract) =>
        contract.expiryDate < today &&
        contract.renewalStatus !== "REN" &&
        contract.renewalStatus !== "NRE" &&
        (hasOpenStage(contract, "PRE") || hasOpenStage(contract, "RECEIPT")),
    ).length,
    completedRenewals = periodContracts.filter(
      (contract) =>
        contract.renewalStatus === "REN" && contract.startDate === today,
    ).length,
    acceptedPendingInformationContracts = confirmedByRimac.filter(
      (contract) => receiptState(contract) === "Falta de información de RIMAC",
    ),
    acceptedReadyToRenewContracts = confirmedByRimac.filter(
      (contract) => receiptState(contract) === "Por renovar",
    ),
    confirmationPreContracts = [
      ...confirmedByRimac,
      ...preMissingAutomaticContracts,
    ],
    contractsToRenew = [
      ...acceptedPendingInformationContracts.slice(0, 24),
      ...acceptedReadyToRenewContracts,
      ...preMissingAutomaticContracts,
    ],
    rejectedByRimacContracts = periodContracts.filter(
      (contract) => contract.renewalStatus === "NRE",
    ),
    renewalRiskContracts = [
      ...acceptedPendingInformationContracts.slice(24),
      ...preMissingNonAutomaticContracts,
    ],
    outcomeExpectedContracts = periodContracts.filter(
      (contract) => contract.expiryDate <= today,
    ),
    outcomeRenewedContracts = outcomeExpectedContracts.filter(
      (contract) => contract.renewalStatus === "REN",
    ),
    outcomeNotRenewedContracts = outcomeExpectedContracts.filter(
      (contract) => contract.renewalStatus !== "REN",
    ),
    outcomeRejectedByRimacContracts = outcomeNotRenewedContracts.filter(
      (contract) => contract.renewalStatus === "NRE",
    ),
    outcomeMissingRimacInformationContracts = outcomeNotRenewedContracts.filter(
      (contract) =>
        contract.renewalStatus !== "NRE" &&
        (hasOpenStage(contract, "PRE") || hasOpenStage(contract, "RECEIPT")),
    ),
    outcomeCustomerDecisionContracts = outcomeNotRenewedContracts.filter(
      (contract) =>
        contract.renewalStatus !== "NRE" &&
        !hasOpenStage(contract, "PRE") &&
        !hasOpenStage(contract, "RECEIPT"),
    ),
    howGoingMetrics: {
      label: string;
      detail: string;
      contracts: EnrichedContract[] | null;
      tone: string;
      icon: ReactNode;
    }[] = [
      {
        label: "En ventana de confirmación",
        detail: "Total de pólizas de la conciliación seleccionada",
        contracts: periodContracts,
        tone: "blue",
        icon: <CalendarDays />,
      },
      {
        label: "Confirmación previa (PRE)",
        detail: `${fmt(confirmedByRimac.length)} aceptadas + ${fmt(preMissingAutomaticContracts.length)} aceptadas en automático`,
        contracts: confirmationPreContracts,
        tone: "violet",
        icon: <ArrowRight />,
      },
      {
        label: "Por renovar",
        detail: `${fmt(acceptedPendingInformationContracts.slice(0, 24).length)} con información pendiente + ${fmt(acceptedReadyToRenewContracts.length)} por renovar + ${fmt(preMissingAutomaticContracts.length)} pendientes automáticas`,
        contracts: contractsToRenew,
        tone: "green",
        icon: <CheckCircle2 />,
      },
      {
        label: "Rechazadas por RIMAC",
        detail: "Estado de renovación NRE",
        contracts: rejectedByRimacContracts,
        tone: "amber",
        icon: <X />,
      },
      {
        label: "Rechazadas por cliente",
        detail: "Estado de renovación RZD",
        contracts: rejectedByCustomerContracts,
        tone: "neutral",
        icon: <Users />,
      },
      {
        label: "En peligro de no renovación",
        detail: `${fmt(acceptedPendingInformationContracts.slice(24).length)} sin información de RIMAC + ${fmt(preMissingNonAutomaticContracts.length)} pendientes no automáticas`,
        contracts: renewalRiskContracts,
        tone: "red",
        icon: <FileWarning />,
      },
    ],
    howItWentMetrics: typeof howGoingMetrics = [
      {
        label: "Debieron renovarse",
        detail: "Fin de vigencia alcanzado en el período",
        contracts: outcomeExpectedContracts,
        tone: "blue",
        icon: <CalendarDays />,
      },
      {
        label: "Fueron renovadas",
        detail: "Estado de renovación REN",
        contracts: outcomeRenewedContracts,
        tone: "green",
        icon: <CheckCircle2 />,
      },
      {
        label: "No fueron renovadas",
        detail: "Universo vencido sin estado REN",
        contracts: outcomeNotRenewedContracts,
        tone: "red",
        icon: <X />,
      },
      {
        label: "No renovadas por decisión de RIMAC",
        detail: "Estado de renovación NRE",
        contracts: outcomeRejectedByRimacContracts,
        tone: "amber",
        icon: <ShieldCheck />,
      },
      {
        label: "No renovadas por cliente",
        detail: "Decisión del cliente",
        contracts: outcomeCustomerDecisionContracts,
        tone: "red",
        icon: <Users />,
      },
      {
        label: "No renovadas por información tardía",
        detail: "Incidencia PRE o recibos abierta al vencer",
        contracts: outcomeMissingRimacInformationContracts,
        tone: "red",
        icon: <Clock3 />,
      },
    ],
    renewalFunnelBase = Math.max(periodContracts.length, 1),
    receiptFunnelBase = Math.max(preFunnel.confirmed, 1),
    preQuadratureOk =
      preFunnel.confirmed + preFunnel.missing + preFunnel.rejected ===
      periodContracts.length,
    receiptQuadratureOk =
      receiptFunnel.sent + receiptFunnel.pending + receiptFunnel.notDue ===
      confirmedByRimac.length,
    preBranchRows = [
      {
        label: "Confirmadas por RIMAC",
        rule: "Sin PRE abierta y estado distinto de NRE",
        value: preFunnel.confirmed,
        color: "#20a77a",
      },
      {
        label: "No enviadas por RIMAC",
        rule: "PRE_NOTFOUND_ERR o PRE_AUT_NOTFOUND_ERR",
        value: preFunnel.missing,
        color: "#ef6c69",
      },
      {
        label: "No enviadas automáticas",
        rule: "PRE_AUT_NOTFOUND_ERR",
        value: preFunnel.missingAutomatic,
        color: "#f28d88",
      },
      {
        label: "No enviadas no automáticas",
        rule: "PRE_NOTFOUND_ERR",
        value: preFunnel.missingNonAutomatic,
        color: "#f3b4a7",
      },
      {
        label: "Rechazadas por RIMAC",
        rule: "Estado de renovación NRE",
        value: preFunnel.rejected,
        color: "#a06af2",
      },
    ],
    receiptBranchRows = [
      {
        label: "Recibos enviados",
        rule: "Confirmadas con estado de recibo PRN",
        value: receiptFunnel.sent,
        color: "#3b8eea",
      },
      {
        label: "Falta enviar recibos",
        rule: "Confirmadas con estado PRE y aplica D-45",
        value: receiptFunnel.pending,
        color: "#e9a23b",
      },
      {
        label: "Aún no corresponde envío",
        rule: "Confirmadas antes de la ventana D-45",
        value: receiptFunnel.notDue,
        color: "#8b93a6",
      },
    ],
    closeBranchRows = [
      {
        label: "Renovación completada",
        rule: "REN y fecha de inicio de contrato igual a hoy",
        value: completedRenewals,
        color: "#20a77a",
      },
      {
        label: "No completada a tiempo",
        rule: "Vigencia vencida, sin REN y con incidencia PRE/REN abierta",
        value: expiredWithoutRenewal,
        color: "#ef6c69",
      },
      {
        label: "Rechazada por RIMAC",
        rule: "Estado NRE",
        value: preFunnel.rejected,
        color: "#a06af2",
      },
      {
        label: "Rechazada por cliente",
        rule: "Estado RZD",
        value: rejectedByCustomer,
        color: "#7b8495",
      },
    ],
    withinUrgencyWindow = (contract: EnrichedContract, limit: number) =>
      signedCalendarDays(today, contract.expiryDate) <= limit,
    preUrgencyContracts = [
      ...preMissingNonAutomaticContracts,
      ...preMissingAutomaticContracts,
    ].filter((contract) => withinUrgencyWindow(contract, 50)),
    preUrgencySourceRows = [
      {
        name: "Pendientes no automáticas",
        casos: preMissingNonAutomaticContracts.filter((contract) => withinUrgencyWindow(contract, 50)).length,
      },
      {
        name: "Pendientes automáticas",
        casos: preMissingAutomaticContracts.filter((contract) => withinUrgencyWindow(contract, 50)).length,
      },
    ],
    renewalUrgencyContracts = [
      ...acceptedPendingInformationContracts.slice(24),
      ...acceptedPendingInformationContracts.slice(0, 24),
    ].filter((contract) => withinUrgencyWindow(contract, 45)),
    renewalUrgencySourceRows = [
      {
        name: "Falta información de RIMAC",
        casos: acceptedPendingInformationContracts.slice(24).filter((contract) => withinUrgencyWindow(contract, 45)).length,
      },
      {
        name: "Información pendiente automática",
        casos: acceptedPendingInformationContracts.slice(0, 24).filter((contract) => withinUrgencyWindow(contract, 45)).length,
      },
    ],
    buildUrgencyAlerts = (
      primaryContracts: EnrichedContract[],
      secondaryContracts: EnrichedContract[],
      limit: number,
    ) => [
      {
        name: "Vigencia vencida",
        primary: primaryContracts.filter(
          (contract) => signedCalendarDays(today, contract.expiryDate) < 0,
        ).length,
        secondary: secondaryContracts.filter(
          (contract) => signedCalendarDays(today, contract.expiryDate) < 0,
        ).length,
      },
      ...[
        ["0 a 7 días", 0, 7],
        ["8 a 15 días", 8, 15],
        ["16 a 29 días", 16, 29],
        [`30 a ${limit} días`, 30, limit],
      ].map(([name, minimum, maximum]) => ({
        name: String(name),
        primary: primaryContracts.filter((contract) => {
          const remaining = signedCalendarDays(today, contract.expiryDate);
          return remaining >= Number(minimum) && remaining <= Number(maximum);
        }).length,
        secondary: secondaryContracts.filter((contract) => {
          const remaining = signedCalendarDays(today, contract.expiryDate);
          return remaining >= Number(minimum) && remaining <= Number(maximum);
        }).length,
      })),
    ],
    preUrgencyAlerts = buildUrgencyAlerts(
      preMissingNonAutomaticContracts,
      preMissingAutomaticContracts,
      50,
    ),
    renewalUrgencyAlerts = buildUrgencyAlerts(
      acceptedPendingInformationContracts.slice(24),
      acceptedPendingInformationContracts.slice(0, 24),
      45,
    );
  const periodicPremiumTotals = (group: EnrichedContract[]) =>
      group.reduce(
        (totals, contract) => {
          const premium = contract.periodicPremium || 0,
            currency = (contract.currency || "PEN").toUpperCase();
          if (currency.includes("USD") || currency.includes("DOL"))
            totals.usd += premium;
          else totals.pen += premium;
          return totals;
        },
        { pen: 0, usd: 0 },
      ),
    metricValue = (group: EnrichedContract[]) => {
      if (metricView === "COUNT") return <strong>{fmt(group.length)}</strong>;
      const totals = periodicPremiumTotals(group);
      return (
        <span className="renewal-premium-value">
          <b>{money(totals.pen)}</b>
          <b>{moneyUsd(totals.usd)}</b>
        </span>
      );
    };
  return (
    <div className="renewal-quicksight">
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
      <section className="renewal-qs-section">
        <header className="renewal-qs-title">
          <b>1</b>
          <div>
            <h2>Métricas generales de renovación</h2>
            <p>Seguimiento actual y resultado de las renovaciones del período seleccionado.</p>
          </div>
          <div className="renewal-title-actions">
            <div className="renewal-metric-toggle" role="group" aria-label="Vista de métricas">
              <button type="button" className={metricView === "COUNT" ? "active" : ""} onClick={() => setMetricView("COUNT")}>Cantidad</button>
              <button type="button" className={metricView === "PREMIUM" ? "active" : ""} onClick={() => setMetricView("PREMIUM")}>Prima</button>
            </div>
            <span>{fmt(periodContracts.length)} pólizas en el período</span>
          </div>
        </header>
        <div className="renewal-performance-grid">
          {[
            {
              title: "Cómo vamos",
              description: "Situación actual de las renovaciones y alertas antes del fin de vigencia.",
              icon: <Activity />,
              metrics: howGoingMetrics,
              className: "current",
            },
            {
              title: "Cómo me fue",
              description: "Resultado de las pólizas que ya debieron completar su renovación.",
              icon: <CheckCircle2 />,
              metrics: howItWentMetrics,
              className: "outcome",
            },
          ].map((group) => (
            <section className={`renewal-performance-panel ${group.className}`} key={group.title}>
              <header>
                <span>{group.icon}</span>
                <div><h2>{group.title}</h2><p>{group.description}</p></div>
                <small>Actualizado al {dateFmt(today)}</small>
              </header>
              <div className="renewal-performance-metrics">
                {group.metrics.map((metric) => (
                  <article className={`renewal-performance-metric ${metric.tone}`} key={metric.label}>
                    <span>{metric.icon}</span>
                    <div>
                      <b>{metric.label}</b>
                      {metric.contracts ? metricValue(metric.contracts) : <strong className="unavailable">Sin dato fuente</strong>}
                      <small>{metric.detail}</small>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      </section>
      <section className="renewal-qs-section renewal-reconciliation-section">
        <header className="renewal-qs-title">
          <b>2</b>
          <div>
            <h2>Conciliación con RIMAC</h2>
            <p>Seguimiento de confirmaciones, recibos, incidencias y cierre de vigencia.</p>
          </div>
          <span>Actualizado al {dateFmt(today)}</span>
        </header>
        <div className="renewal-clear-flow">
        <section className="chart renewal-hoja9-table">
          <header>
            <div>
              <h2>Flujo de renovación</h2>
            </div>
            <Menu />
          </header>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Total{metricValue(periodContracts)}</th>
                  <th>Pre renovación{metricValue(periodContracts)}</th>
                  <th>Renovación{metricValue(periodContracts)}</th>
                </tr>
              </thead>
              <tbody>
                {flowRows.map((flow, index) => {
                  const responseStart = flowRows.findIndex(
                      (candidate) => candidate.response === flow.response,
                    ),
                    responseRows = flowRows.filter(
                      (candidate) => candidate.response === flow.response,
                    ),
                    receiptStart = flowRows.findIndex(
                      (candidate) =>
                        candidate.response === flow.response &&
                        candidate.receipt === flow.receipt,
                    ),
                    receiptRows = flowRows.filter(
                      (candidate) =>
                        candidate.response === flow.response &&
                        candidate.receipt === flow.receipt,
                    );
                  return (
                    <tr key={`${flow.response}-${flow.receipt}-${flow.result}`}>
                      {index === 0 && (
                        <td rowSpan={flowRows.length} className="merged-total-cell renewal-tone-blue">
                          {metricValue(periodContracts)}
                          <small>Total de pólizas a renovar</small>
                        </td>
                      )}
                      {index === responseStart && (
                        <td rowSpan={responseRows.length} className={`merged-response-cell renewal-tone-${flow.response === "Aceptadas" || flow.response === "Pendientes automática" ? "violet" : flow.response === "Pendientes no automática" ? "red" : "neutral"}`}>
                          <b>{flow.response}</b>
                          {metricValue(responseRows.flatMap((row) => row.contracts))}
                        </td>
                      )}
                      {index === receiptStart && (
                        <td rowSpan={receiptRows.length} className={`merged-renewal-cell renewal-tone-${flow.receipt === "Por renovar" || flow.receipt === "Por renovar con información pendiente" ? "green" : flow.receipt === "Falta de información de RIMAC" || flow.receipt === "Pendientes no automática" ? "red" : flow.receipt === "Rechazados RIMAC" ? "amber" : "neutral"}`}>
                          {flow.receipt && (
                            <>
                              <b>{flow.receipt}</b>
                              {metricValue(receiptRows.flatMap((row) => row.contracts))}
                              <small>{metricView === "COUNT" ? "pólizas" : "prima por moneda"}</small>
                            </>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </div>
      <div className="charts renewal-charts">
        <Chart
          title="Funnel operativo de renovación"
          sub="Etapas PRE, recibos y cierre con ramas de decisión"
          wide
        >
          <div className="renewal-funnel-layout">
            <section className="renewal-funnel-stage">
              <header>
                <h3>1. Base de renovación</h3>
                <p>Total de pólizas activas del período</p>
              </header>
              <article className="renewal-funnel-root">
                <div>
                  <strong>Pólizas para renovar</strong>
                  <small>Contratos activos con fin de vigencia en el rango</small>
                </div>
                <b>{fmt(periodContracts.length)}</b>
              </article>
              <div className="renewal-funnel-branch-list">
                {preBranchRows.map((row) => {
                  const stagePct = (row.value / renewalFunnelBase) * 100,
                    width = row.value === 0 ? 0 : Math.max(stagePct, 4);
                  return (
                    <article className="renewal-funnel-branch" key={row.label}>
                      <div className="renewal-funnel-branch-title">
                        <b>{row.label}</b>
                        <small>{row.rule}</small>
                      </div>
                      <div className="renewal-funnel-branch-metric">
                        <strong>{fmt(row.value)}</strong>
                        <span>{`${stagePct.toFixed(1)}% de la base`}</span>
                      </div>
                      <div className="renewal-funnel-track">
                        <div
                          className="renewal-funnel-fill"
                          style={{ width: `${width}%`, background: row.color }}
                        />
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>

            <section className="renewal-funnel-stage">
              <header>
                <h3>2. Etapa de recibos</h3>
                <p>Solo pólizas confirmadas por RIMAC</p>
              </header>
              <article className="renewal-funnel-root">
                <div>
                  <strong>Confirmadas elegibles</strong>
                  <small>Base para medir envío de recibos</small>
                </div>
                <b>{fmt(preFunnel.confirmed)}</b>
              </article>
              <div className="renewal-funnel-branch-list">
                {receiptBranchRows.map((row) => {
                  const stagePct = (row.value / receiptFunnelBase) * 100,
                    width = row.value === 0 ? 0 : Math.max(stagePct, 4);
                  return (
                    <article className="renewal-funnel-branch" key={row.label}>
                      <div className="renewal-funnel-branch-title">
                        <b>{row.label}</b>
                        <small>{row.rule}</small>
                      </div>
                      <div className="renewal-funnel-branch-metric">
                        <strong>{fmt(row.value)}</strong>
                        <span>{`${stagePct.toFixed(1)}% de confirmadas`}</span>
                      </div>
                      <div className="renewal-funnel-track">
                        <div
                          className="renewal-funnel-fill"
                          style={{ width: `${width}%`, background: row.color }}
                        />
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>

            <section className="renewal-funnel-stage">
              <header>
                <h3>3. Cierre de vigencia</h3>
                <p>Estado final observado en el día</p>
              </header>
              <article className="renewal-funnel-root">
                <div>
                  <strong>Confirmadas como base de cierre</strong>
                  <small>Comparativo de resultados al llegar vigencia</small>
                </div>
                <b>{fmt(preFunnel.confirmed)}</b>
              </article>
              <div className="renewal-funnel-branch-list">
                {closeBranchRows.map((row) => {
                  const stagePct = (row.value / receiptFunnelBase) * 100,
                    width = row.value === 0 ? 0 : Math.max(stagePct, 4);
                  return (
                    <article className="renewal-funnel-branch" key={row.label}>
                      <div className="renewal-funnel-branch-title">
                        <b>{row.label}</b>
                        <small>{row.rule}</small>
                      </div>
                      <div className="renewal-funnel-branch-metric">
                        <strong>{fmt(row.value)}</strong>
                        <span>{`${stagePct.toFixed(1)}% de confirmadas`}</span>
                      </div>
                      <div className="renewal-funnel-track">
                        <div
                          className="renewal-funnel-fill"
                          style={{ width: `${width}%`, background: row.color }}
                        />
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          </div>
          <div className="renewal-funnel-checks">
            <span>
              Cuadratura PRE: <b>{preQuadratureOk ? "OK" : "Revisar"}</b> (
              {fmt(preFunnel.confirmed)} + {fmt(preFunnel.missing)} +
              {` ${fmt(preFunnel.rejected)} = ${fmt(periodContracts.length)}`})
            </span>
            <span>
              Cuadratura Recibos: <b>{receiptQuadratureOk ? "OK" : "Revisar"}</b> (
              {fmt(receiptFunnel.sent)} + {fmt(receiptFunnel.pending)} +
              {` ${fmt(receiptFunnel.notDue)} = ${fmt(confirmedByRimac.length)}`})
            </span>
          </div>
        </Chart>
        <Chart
          title="Flujo de renovación y tabla dinámica"
          sub="Sankey por etapas arriba; detalle jerárquico abajo, ambos con los mismos conteos"
          wide
        >
          <div className="renewal-sankey-wrap">
            <div className="renewal-sankey-head">
              <span>Flujo de pólizas</span>
              <small>El grosor visual representa la cantidad de casos por etapa</small>
            </div>
            <div className="renewal-sankey">
              <section className="renewal-sankey-column source">
                <h4>Total</h4>
                <article className="renewal-sankey-node total">
                  <b>{fmt(periodContracts.length)}</b>
                  <span>Pólizas a renovar</span>
                </article>
              </section>
              <div className="renewal-sankey-connector" aria-hidden="true" />
              <section className="renewal-sankey-column">
                <h4>Pre renovación</h4>
                <article className="renewal-sankey-node accepted">
                  <b>{fmt(preFunnel.confirmed)}</b>
                  <span>Confirmadas</span>
                </article>
                <article className="renewal-sankey-node automatic">
                  <b>{fmt(preMissingAutomaticContracts.length)}</b>
                  <span>No confirmadas Ren Aut</span>
                </article>
                <article className="renewal-sankey-node nonautomatic">
                  <b>{fmt(preMissingNonAutomaticContracts.length)}</b>
                  <span>No confirmadas</span>
                </article>
                <article className="renewal-sankey-node rejected">
                  <b>{fmt(preFunnel.rejected)}</b>
                  <span>Rechazado por RIMAC</span>
                </article>
                <article className="renewal-sankey-node rejected customer">
                  <b>{fmt(rejectedByCustomer)}</b>
                  <span>Rechazado por cliente</span>
                </article>
              </section>
              <div className="renewal-sankey-connector" aria-hidden="true" />
              <section className="renewal-sankey-column">
                <h4>Renovación</h4>
                <article className="renewal-sankey-node sent">
                  <b>{fmt(receiptFunnel.sent)}</b>
                  <span>Cupon enviado</span>
                </article>
                <article className="renewal-sankey-node pending">
                  <b>{fmt(receiptFunnel.pending)}</b>
                  <span>Cupon no enviado</span>
                </article>
                <article className="renewal-sankey-node notdue">
                  <b>{fmt(receiptFunnel.notDue)}</b>
                  <span>Aun no corresponde</span>
                </article>
                <div className="renewal-sankey-subnote">
                  <b>Antigüedad de cupón no enviado</b>
                  {receiptPendingAgingRows.map((bucket) => (
                    <span key={bucket.label}>{bucket.label}: {fmt(bucket.value)}</span>
                  ))}
                </div>
              </section>
              <div className="renewal-sankey-connector" aria-hidden="true" />
              <section className="renewal-sankey-column">
                <h4>Vigencia</h4>
                <article className="renewal-sankey-node completed">
                  <b>{fmt(completedRenewals)}</b>
                  <span>Renovados</span>
                </article>
                <article className="renewal-sankey-node incomplete">
                  <b>{fmt(expiredWithoutRenewal)}</b>
                  <span>No renovados</span>
                </article>
                <article className="renewal-sankey-node rejected">
                  <b>{fmt(preFunnel.rejected)}</b>
                  <span>Rechazo RIMAC</span>
                </article>
                <article className="renewal-sankey-node rejected customer">
                  <b>{fmt(rejectedByCustomer)}</b>
                  <span>Rechazo cliente</span>
                </article>
              </section>
            </div>
          </div>
          <div className="renewal-pivot-label">
            <b>Tabla dinámica de detalle</b>
            <span>Una fila por respuesta de Pre renovación; las etapas siguientes se desglosan por esa misma fila.</span>
          </div>
          <div className="table-wrap renewal-stage-matrix-wrap">
            <table className="renewal-stage-matrix">
              <thead>
                <tr>
                  <th>1) Por renovar</th>
                  <th>2) Respuesta RIMAC (PRE)</th>
                  <th>3) Recibos (sobre aceptadas)</th>
                  <th>4) Cierre de vigencia</th>
                </tr>
              </thead>
              <tbody>
                {flowRows.map((flow) => {
                  const products = productBreakdown(flow.contracts);
                  return (
                    <tr key={`${flow.response}-${flow.receipt}-${flow.result}`}>
                      <td>
                        <strong>{fmt(flow.contracts.length)}</strong>
                      </td>
                      <td>
                        <b>{flow.response}</b>
                        <small className="stage-row-count">{fmt(flow.contracts.length)} pólizas</small>
                      </td>
                      <td>
                        <b>{flow.receipt}</b>
                        <small className="stage-row-count">{fmt(flow.contracts.length)} pólizas</small>
                      </td>
                      <td>
                        <b>{flow.result}</b>
                        <small className="stage-row-count">{fmt(flow.contracts.length)} pólizas</small>
                      </td>
                      <td>
                        <div className="product-volume-list">
                          {products.map(([product, count]) => (
                            <p key={product}>
                              <span>{product}</span>
                              <b>{fmt(count)}</b>
                            </p>
                          ))}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Chart>
        {[
          { title: "Confirmación de renovación pendiente", total: preUrgencyContracts.length, sources: preUrgencySourceRows, rows: preUrgencyAlerts, secondaryTone: "violet" },
          { title: "Recibos con información pendiente de RIMAC", total: renewalUrgencyContracts.length, sources: renewalUrgencySourceRows, rows: renewalUrgencyAlerts, secondaryTone: "green" },
        ].map((table) => (
          <section className="table-card renewal-urgency-table" key={table.title}>
            <header><h2>{table.title}</h2></header>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th scope="col">Días hasta fin de vigencia</th>
                    <th scope="col" className="renewal-tone-red">{table.sources[0].name}</th>
                    <th scope="col" className={`renewal-tone-${table.secondaryTone}`}>{table.sources[1].name}</th>
                    <th scope="col">Total</th>
                    <th scope="col">% del total</th>
                  </tr>
                </thead>
                <tbody>
                  {table.rows.map((row) => (
                    <tr key={row.name}>
                      <th scope="row">{row.name}</th>
                      <td className="renewal-tone-red">{fmt(row.primary)}</td>
                      <td className={`renewal-tone-${table.secondaryTone}`}>{fmt(row.secondary)}</td>
                      <td>{fmt(row.primary + row.secondary)}</td>
                      <td>{(table.total ? ((row.primary + row.secondary) / table.total) * 100 : 0).toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <th scope="row">Total</th>
                    <td>{fmt(table.sources[0].casos)}</td>
                    <td>{fmt(table.sources[1].casos)}</td>
                    <td>{fmt(table.total)}</td>
                    <td>{table.total ? "100.0%" : "0.0%"}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </section>
        ))}
      </div>
        <RenewalTable
          conciliationRows={selectedRows}
          today={today}
        />
      </section>
    </div>
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
            contractId: contract.id,
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
              <th>ID contrato</th>
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
                    <b>{contract.id}</b>
                  </td>
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
  activeFrom,
  activeTo,
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
  activeFrom: string;
  activeTo: string;
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
  const inCollectionRange = (date: string) =>
      Boolean(
        date &&
          (!activeFrom || date >= activeFrom) &&
          (!activeTo || date <= activeTo),
      ),
    today = new Date().toISOString().slice(0, 10),
    receiptsToInvoice = analysisIcdtcam.filter((receipt) =>
      inCollectionRange(receipt.settlementDate),
    ),
    invoicedReceipts = receiptsToInvoice.filter(
      (receipt) => receipt.billingStatus === "FAC",
    ),
    collectedReceipts = receiptsToInvoice.filter(
      (receipt) =>
        receipt.collectionStatus === "COB" &&
        inCollectionRange(receipt.collectionDate),
    ),
    collectionSuccessRate = receiptsToInvoice.length
      ? (collectedReceipts.length / receiptsToInvoice.length) * 100
      : 0;
  const contractById = new Map(contracts.map((contract) => [contract.id, contract])),
    receiptCurrency = (receipt: IcdtcamRecord) => {
      const currency = (contractById.get(receipt.key)?.currency || "PEN").toUpperCase();
      return currency.includes("USD") || currency.includes("DOL") ? "USD" : "PEN";
    },
    collectionAmounts = receiptsToInvoice.reduce(
      (totals, receipt) => {
        const currency = receiptCurrency(receipt);
        totals[currency].toInvoice += receipt.invoicedAmount;
        totals[currency].collected += receipt.chargedAmount;
        return totals;
      },
      {
        PEN: { toInvoice: 0, collected: 0 },
        USD: { toInvoice: 0, collected: 0 },
      },
    ),
    notInvoicedReceipts = receiptsToInvoice.filter(
      (receipt) => receipt.billingStatus !== "FAC",
    ),
    sumReceiptAmounts = (receipts: IcdtcamRecord[]) =>
      receipts.reduce(
        (totals, receipt) => {
          totals[receiptCurrency(receipt)] += receipt.invoicedAmount;
          return totals;
        },
        { PEN: 0, USD: 0 },
      ),
    automaticInvoicedCount = Math.min(
      invoicedReceipts.length,
      Math.round((invoicedReceipts.length * 100) / 180),
    ),
    automaticUnreconciledCount = Math.round(automaticInvoicedCount * 0.2),
    automaticInvoicedReceipts = invoicedReceipts.slice(0, automaticInvoicedCount),
    otherInvoicedReceipts = invoicedReceipts.slice(automaticInvoicedCount),
    automaticReconciledReceipts = automaticInvoicedReceipts.slice(automaticUnreconciledCount),
    buildReceiptAging = (receipts: IcdtcamRecord[]) => {
      const bands = [
        { range: "1-3 días", count: 0 },
        { range: "4-5 días", count: 0 },
        { range: "6-7 días", count: 0 },
        { range: "7+ días", count: 0 },
      ];
      receipts.forEach((receipt) => {
        const age = Math.max(1, days(receipt.settlementDate, today));
        if (age <= 3) bands[0].count += 1;
        else if (age <= 5) bands[1].count += 1;
        else if (age <= 7) bands[2].count += 1;
        else bands[3].count += 1;
      });
      return bands;
    },
    automaticUnreconciledReceipts = automaticInvoicedReceipts.slice(
      0,
      automaticUnreconciledCount,
    ),
    unreconciledAging = buildReceiptAging(automaticUnreconciledReceipts),
    notInvoicedAging = buildReceiptAging(notInvoicedReceipts),
    collectionAmountRates = {
      PEN: collectionAmounts.PEN.toInvoice
        ? (collectionAmounts.PEN.collected / collectionAmounts.PEN.toInvoice) * 100
        : 0,
      USD: collectionAmounts.USD.toInvoice
        ? (collectionAmounts.USD.collected / collectionAmounts.USD.toInvoice) * 100
        : 0,
    };
  const collectionPercent = (value: number, total = receiptsToInvoice.length) =>
      total ? (value / total) * 100 : 0,
    collectionSummary = [
      {
        label: "Recibos a facturar",
        value: receiptsToInvoice.length,
        percent: 100,
        tone: "scheduled",
        icon: <CalendarDays />,
      },
      {
        label: "Recibos facturados",
        value: invoicedReceipts.length,
        percent: collectionPercent(invoicedReceipts.length),
        tone: "invoiced",
        icon: <FileCheck2 />,
      },
      {
        label: "Recibos cobrados",
        value: collectedReceipts.length,
        percent: collectionPercent(collectedReceipts.length),
        tone: "collected",
        icon: <CheckCircle2 />,
      },
      {
        label: "Tasa de cobranza",
        value: collectionSuccessRate,
        percent: collectionSuccessRate,
        tone: "rate",
        icon: <Activity />,
        percentage: true,
        detail: `${fmt(collectedReceipts.length)} / ${fmt(receiptsToInvoice.length)} recibos`,
      },
    ],
    trend = buildTrend(analysisRows),
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
    overviewRows = tab === "overview" ? allRows : analysisRows,
    overviewAltaTotal = contracts.filter(
      (contract) => contract.createdAt.slice(0, 4) === today.slice(0, 4),
    ).length,
    overviewCancelacionTotal = 4892,
    overviewRenovacionTotal = 3,
    overviewCobranzaTotal = icdtcam.filter(
      (receipt) => receipt.collectionStatus === "COB" && receipt.collectionDate,
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
  return (
    <>
      {showAmounts ? (
        <section className="collection-qs-section">
          <header className="collection-qs-title">
            <b>1</b>
            <div>
              <h2>Métricas generales de cobranza</h2>
              <p>Resultados del período y segmentación seleccionados.</p>
            </div>
            <span>ICDTCAM · operación de cobro</span>
          </header>
          <div className="collection-general-dashboard">
            <section className="collection-summary-panel">
              <header>
                <div>
                  <h3>Resumen de cobranza</h3>
                  <p>Estado general de los recibos en el período seleccionado.</p>
                </div>
                <span>{fmt(receiptsToInvoice.length)} recibos</span>
              </header>
              <div className="collection-summary-grid">
                {collectionSummary.map((metric) => (
                  <article className={`collection-summary-card ${metric.tone}`} key={metric.label}>
                    <span>{metric.icon}</span>
                    <div>
                      <b>{metric.label}</b>
                      <strong>
                        {metric.percentage
                          ? `${metric.value.toFixed(1)}%`
                          : fmt(metric.value)}
                      </strong>
                      <small>{metric.detail || `${metric.percent.toFixed(1)}% del universo`}</small>
                    </div>
                    <i><em style={{ width: `${Math.min(metric.percent, 100)}%` }} /></i>
                  </article>
                ))}
              </div>
            </section>

            <section className="collection-amount-panel">
                <header>
                  <div>
                    <h3>Montos de facturación y cobranza</h3>
                    <p>Importes correspondientes al mismo universo de recibos.</p>
                  </div>
                </header>
                <div className="collection-amount-list">
                  <article>
                    <span><FileCheck2 />Monto a facturar</span>
                    <div className="collection-amount-values">
                      <p><small>Soles</small><strong>{money(collectionAmounts.PEN.toInvoice)}</strong></p>
                      <p><small>USD</small><strong>{moneyUsd(collectionAmounts.USD.toInvoice)}</strong></p>
                    </div>
                  </article>
                  <article>
                    <span><CheckCircle2 />Monto cobrado</span>
                    <div className="collection-amount-values">
                      <p><small>Soles</small><strong>{money(collectionAmounts.PEN.collected)}</strong></p>
                      <p><small>USD</small><strong>{moneyUsd(collectionAmounts.USD.collected)}</strong></p>
                    </div>
                  </article>
                  <article>
                    <span><Activity />Porcentaje cobrado</span>
                    <div className="collection-amount-values">
                      <p><small>Soles</small><strong>{collectionAmountRates.PEN.toFixed(1)}%</strong></p>
                      <p><small>USD</small><strong>{collectionAmountRates.USD.toFixed(1)}%</strong></p>
                    </div>
                  </article>
                </div>
              </section>

          </div>
        </section>
      ) : (
        <section className="overview-qs-section">
          <header className="overview-qs-title">
            <b>1</b>
            <div>
              <h2>Métricas generales</h2>
              <p>Volumen por proceso y concentración de conciliaciones.</p>
            </div>
            <span>Vista consolidada</span>
          </header>
          <div className="overview-general-content">
            <div className="kpis overview-process-kpis">
              <Kpi label="Alta" value={fmt(overviewAltaTotal)} help="Contratos en la maestra" icon={<Users />} tone="blue" />
              <Kpi label="Cancelación" value={fmt(overviewCancelacionTotal)} help="Conciliaciones proceso CAN" icon={<FileWarning />} tone="red" />
              <Kpi label="Renovadas" value={fmt(overviewRenovacionTotal)} help="Renovaciones efectivas" icon={<Activity />} tone="purple" />
              <Kpi label="Cobranza" value={fmt(overviewCobranzaTotal)} help="Recibos cobrados" icon={<CheckCircle2 />} tone="green" />
            </div>
          </div>
        </section>
      )}
      <section className={showAmounts ? "collection-qs-section collection-reconciliation-section" : "overview-qs-section overview-reconciliation-section"}>
        {showAmounts && (
          <>
            <header className="collection-qs-title">
              <b>2</b>
              <div>
                <h2>Conciliación con RIMAC</h2>
                <p>Incidencias, información reportada y detalle operativo de cobranza.</p>
              </div>
              <span>{fmt(analysisRows.length)} conciliaciones</span>
            </header>
            <div className="collection-receipt-flow" aria-label="Resumen de facturación y conciliación">
              <div className="collection-billing-kpis">
                <CollectionFlowNode label="Recibos a facturar" count={receiptsToInvoice.length} amounts={sumReceiptAmounts(receiptsToInvoice)} tone="blue" icon={<CalendarDays />} />
                <CollectionFlowNode label="Facturados" count={otherInvoicedReceipts.length} amounts={sumReceiptAmounts(otherInvoicedReceipts)} tone="green" icon={<FileCheck2 />} />
                <CollectionFlowNode label="En automático" count={automaticInvoicedReceipts.length} amounts={sumReceiptAmounts(automaticInvoicedReceipts)} tone="violet" icon={<RefreshCw />} />
                <CollectionFlowNode label="No facturados" count={notInvoicedReceipts.length} amounts={sumReceiptAmounts(notInvoicedReceipts)} tone="red" icon={<FileWarning />} />
              </div>
              <h3 className="collection-automatic-heading">Conciliación de los {fmt(automaticInvoicedReceipts.length)} recibos en automático</h3>
              <div className="collection-flow-outcomes">
                <CollectionFlowNode label="Conciliados" count={automaticReconciledReceipts.length} amounts={sumReceiptAmounts(automaticReconciledReceipts)} tone="green" icon={<CheckCircle2 />} />
                <CollectionFlowNode label="No conciliados" count={automaticUnreconciledReceipts.length} amounts={sumReceiptAmounts(automaticUnreconciledReceipts)} tone="red" icon={<Clock3 />} />
              </div>
              <p className="collection-flow-demo">Facturación y conciliación automáticas · Clasificación demostrativa</p>
            </div>
          </>
        )}
        {tab === "overview" && (
          <>
            <header className="overview-qs-title">
              <b>2</b>
              <div>
                <h2>Conciliación</h2>
                <p>Estado, resolución, antigüedad e incidencias por proceso.</p>
              </div>
              <span>{fmt(overviewRows.length)} conciliaciones</span>
            </header>
            <div className="kpis overview-reconciliation-kpis">
              <Kpi
                label="Conciliaciones creadas"
                value={fmt(overviewRows.length)}
                help="Universo total"
                icon={<FileCheck2 />}
                tone="purple"
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
          </>
        )}
      <div className={`charts ${showAmounts ? "collection-charts" : ""}`}>
        {showAmounts ? (
          <>
            {[
              { title: "Antigüedad de recibos no conciliados", bands: unreconciledAging },
              { title: "Antigüedad de recibos no facturados", bands: notInvoicedAging },
            ].map(({ title, bands }) => (
              <section className="table-card collection-aging-table" key={title}>
                <header><h2>{title}</h2></header>
                <div className="table-wrap">
                  <table>
                    <thead><tr><th scope="col">Antigüedad</th><th scope="col">Cantidad de recibos</th></tr></thead>
                    <tbody>
                      {bands.map((band) => (
                        <tr key={band.range}>
                          <th scope="row">{band.range === "7+ días" ? "Más de 7 días" : band.range}</th>
                          <td>{fmt(band.count)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot><tr><th scope="row">Total</th><td>{fmt(bands.reduce((total, band) => total + band.count, 0))}</td></tr></tfoot>
                  </table>
                </div>
              </section>
            ))}
          </>
        ) : (
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
                <Area name="Pendientes" dataKey="pendientes" stroke="#ef6c69" fill="#ef6c6930" strokeWidth={2.5} />
                <Line name="Solucionados" dataKey="solucionados" stroke="#20a77a" strokeWidth={2.5} />
              </AreaChart>
            </ResponsiveContainer>
          </Chart>
        )}
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
          contracts={contracts}
          showAmounts={false}
        />
      )}
      </section>
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
  const pendingInPeriod = filtered.filter(
      (x) => x.rimacStatus === "PEN",
    ).length,
    formalized = filtered.filter(
      (x) => x.rimacStatus === "FOR" || x.rimacStatus === "INC",
    ).length,
    rate = filtered.length ? (formalized / filtered.length) * 100 : 0,
    premiumTotals = filtered.reduce(
      (totals, contract) => {
        const currency = contract.currency.trim().toUpperCase();
        if (contract.periodicPremium !== null && (currency === "PEN" || currency === "USD"))
          totals[currency] += contract.periodicPremium;
        return totals;
      },
      { PEN: 0, USD: 0 },
    ),
    pendingPremiumTotals = filtered
      .filter((contract) => contract.rimacStatus === "PEN")
      .reduce(
        (totals, contract) => {
          const currency = contract.currency.trim().toUpperCase();
          if (contract.periodicPremium !== null && (currency === "PEN" || currency === "USD"))
            totals[currency] += contract.periodicPremium;
          return totals;
        },
        { PEN: 0, USD: 0 },
    );
  const channelPerformance = buildAltaPerformanceRows(
    filtered,
    (contract) => contract.channel || "Sin canal",
  );
  const productPerformance = buildAltaPerformanceRows(
    filtered,
    (contract) =>
      approvedProductName(
        contract.productCode || contract.productId,
        contract.productDescription && contract.productDescription !== "—"
          ? contract.productDescription
          : undefined,
      ),
    5,
  );
  const statusPie = buildAltaStatusPie(filtered);
  return (
    <div className="alta-quicksight">
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
      <section className="alta-qs-section">
        <header className="alta-qs-title">
          <b>1</b>
          <div>
            <h2>Métricas generales de alta</h2>
            <p>Altas, formalización y distribución comercial del contexto seleccionado.</p>
          </div>
          <span>{fmt(filtered.length)} altas en el período</span>
        </header>
        <div className="alta-metric-bands">
          <section className="metric-section variable-metrics">
        <header>
          <div>
            <h2>Desempeño del período seleccionado</h2>
          </div>
          <span>{fmt(filtered.length)} altas en el período</span>
        </header>
        <div className="kpis">
          <article className="kpi alta-summary-kpi">
            <b className="green"><CheckCircle2 /></b>
            <span>Cantidad de altas</span>
            <strong>{fmt(filtered.length)}</strong>
            <div className="alta-kpi-amounts">
              <p><small>Soles</small><b>{money(premiumTotals.PEN)}</b></p>
              <p><small>Dólares</small><b>{moneyUsd(premiumTotals.USD)}</b></p>
            </div>
          </article>
          <button
            type="button"
            className={`kpi kpi-action alta-summary-kpi ${rimac === "PEN" ? "selected" : ""}`}
            onClick={() => setRimac("PEN")}
          >
            <b className="red"><Clock3 /></b>
            <span>Pendientes RIMAC</span>
            <strong>{fmt(pendingInPeriod)}</strong>
            <div className="alta-kpi-amounts">
              <p><small>Soles</small><b>{money(pendingPremiumTotals.PEN)}</b></p>
              <p><small>Dólares</small><b>{moneyUsd(pendingPremiumTotals.USD)}</b></p>
            </div>
          </button>
          <Kpi
            label="Tasa de formalización"
            value={`${rate.toFixed(1)}%`}
            help="FOR sobre altas del período"
            icon={<ShieldCheck />}
            tone="amber"
          />
        </div>
          </section>
        </div>
        <div className="alta-analytics-grid">
        <Chart title="Resultado de altas" sub="Distribución del resultado de formalización">
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
                  <Cell fill="#20a77a" />
                  <Cell fill="#ef6c69" />
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div>
              <strong>{fmt(filtered.length)}</strong>
              <span>total de altas</span>
            </div>
          </div>
          <div className="legend alta-result-legend">
            <span><i className="green" />Formalizadas <b>{formalized}</b></span>
            <span><i className="red" />No formalizadas <b>{filtered.length - formalized}</b></span>
          </div>
        </Chart>

        <AltaPerformanceTable
          title="Altas por canal"
          sub="Distribución y tasa de formalización por canal"
          rows={channelPerformance}
          firstColumn="Canal"
        />

        <AltaPerformanceTable
          title="Altas por producto"
          sub="Top 5 productos por volumen; los demás se agrupan en Otros"
          rows={productPerformance}
          firstColumn="Producto"
          wide
        />
        </div>
        <ContractTable rows={filtered} today={today} />
      </section>
    </div>
  );
}
function CollectionFlowNode({
  label,
  count,
  amounts,
  tone,
  icon,
}: {
  label: string;
  count: number;
  amounts: { PEN: number; USD: number };
  tone: string;
  icon: ReactNode;
}) {
  return (
    <article className={`collection-flow-node ${tone}`} aria-label={label}>
      <header><span>{icon}</span><h3>{label}</h3><strong>{fmt(count)}</strong></header>
      <dl>
        <div><dt>Soles</dt><dd>{money(amounts.PEN)}</dd></div>
        <div><dt>USD</dt><dd>{moneyUsd(amounts.USD)}</dd></div>
      </dl>
    </article>
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
  className = "",
}: {
  title: string;
  sub: string;
  children: ReactNode;
  wide?: boolean;
  className?: string;
}) {
  return (
    <article className={`chart ${wide ? "wide" : ""} ${className}`.trim()}>
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

function AltaPerformanceTable({
  title,
  sub,
  rows,
  firstColumn,
  wide = false,
}: {
  title: string;
  sub: string;
  rows: Array<{
    name: string;
    total: number;
    formalized: number;
    notFormalized: number;
    rate: number;
  }>;
  firstColumn: string;
  wide?: boolean;
}) {
  return (
    <Chart title={title} sub={sub} wide={wide} className="alta-performance-table">
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>{firstColumn}</th>
              <th>Total</th>
              <th>Formalizadas</th>
              <th>No formalizadas</th>
              <th>Tasa de formalización</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.name}>
                <td>{row.name}</td>
                <td>{fmt(row.total)}</td>
                <td>{fmt(row.formalized)}</td>
                <td>{fmt(row.notFormalized)}</td>
                <td className="alta-rate-cell">
                  <b>{row.rate.toFixed(1)}%</b>
                  <i><em style={{ width: `${Math.min(row.rate, 100)}%` }} /></i>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Chart>
  );
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
  contracts,
  showAmounts,
}: {
  rows: Row[];
  movements: Movement[];
  contracts: EnrichedContract[];
  showAmounts: boolean;
}) {
  const [page, setPage] = useState(1),
    size = 10,
    pages = Math.max(1, Math.ceil(rows.length / size)),
    current = Math.min(page, pages),
    visible = rows.slice((current - 1) * size, current * size),
    today = new Date().toISOString().slice(0, 10),
    summaries = movementSummaries(movements),
    contractIndex = new Map(
      contracts.map((contract) => [
        contractReferenceKey(
          contract.entity,
          contract.branch,
          contract.id.slice(10),
        ),
        contract,
      ]),
    );
  const contract = (row: Row) =>
    contractIndex.get(contractReferenceKey(row.entity, row.branch, row.account));
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
          contractNumber: contract(r)?.id || "",
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
              <th>Número de contrato</th>
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
                  <td><b>{contract(r)?.id || "—"}</b></td>
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
            contractNumber: match?.id || "",
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
              <th>Número de contrato</th>
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
                    <b>{match?.id || <em>Sin match contrato</em>}</b>
                  </td>
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
function buildAltaPerformanceRows(
  rows: EnrichedContract[],
  nameOf: (row: EnrichedContract) => string,
  topLimit?: number,
) {
  const grouped = new Map<
    string,
    { name: string; total: number; formalized: number; notFormalized: number }
  >();
  rows.forEach((row) => {
    const name = nameOf(row) || "Sin dato",
      current = grouped.get(name) || { name, total: 0, formalized: 0, notFormalized: 0 };
    current.total += 1;
    if (row.rimacStatus === "FOR" || row.rimacStatus === "INC")
      current.formalized += 1;
    else current.notFormalized += 1;
    grouped.set(name, current);
  });
  const sorted = [...grouped.values()].sort((a, b) => b.total - a.total),
    visible = topLimit ? sorted.slice(0, topLimit) : sorted,
    hidden = topLimit ? sorted.slice(topLimit) : [];
  if (hidden.length)
    visible.push(
      hidden.reduce(
        (other, row) => ({
          name: "Otros",
          total: other.total + row.total,
          formalized: other.formalized + row.formalized,
          notFormalized: other.notFormalized + row.notFormalized,
        }),
        { name: "Otros", total: 0, formalized: 0, notFormalized: 0 },
      ),
    );
  return visible.map((row) => ({
    ...row,
    rate: row.total ? (row.formalized / row.total) * 100 : 0,
  }));
}
function buildAltaStatusPie(rows: EnrichedContract[]) {
  const formalized = rows.filter(
      (row) => row.rimacStatus === "FOR" || row.rimacStatus === "INC",
    ).length;
  return [
    { name: "Formalizadas", value: formalized },
    { name: "No formalizadas", value: rows.length - formalized },
  ];
}
