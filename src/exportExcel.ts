import * as XLSX from "xlsx";
import { CocomoInputs, calcAll } from "./model/cocomocalculations";

/**
 * exportExcel.ts
 * Single-sheet export of all steps as separated tables (with blank rows between).
 *
 * - One worksheet ("Estimator")
 * - Tables for:
 *   1) Assumptions
 *   2) ESLOC
 *   3) Scale Factors
 *   4) Effort Multipliers
 *   5) Calibration
 *   6) Resources & Rates
 *   7) Results (final page)
 */
export function exportEstimatorToExcel(inputs: CocomoInputs, fileName = "COCOMO_II_Modernization_Estimator_V3.xlsx") {
  const r = calcAll(inputs);

  const aoa: (string | number)[][] = [];

  const pushBlank = (n = 1) => {
    for (let i = 0; i < n; i++) aoa.push([]);
  };

  const pushTitle = (title: string) => {
    aoa.push([title]);
  };

  const pushTable = (title: string, rows: [string, string | number, string?][]) => {
    pushTitle(title);
    aoa.push(["Field", "Value", "Notes"]);
    rows.forEach((row) => aoa.push([row[0], row[1], row[2] ?? ""]));
    pushBlank(2);
  };

  // Header
  aoa.push(["COCOMO II Modernization Estimator V3"]);
  aoa.push([`Exported: ${new Date().toLocaleString()}`]);
  pushBlank(2);

  pushTable("Step 1 — Assumptions", [
    ["Total LOC", inputs.assumptions.totalLoc, "LOC"],
    ["Avg Total R&D FTE Pool", inputs.assumptions.avgTotalFTE, "FTE"],
    ["Schedule (months)", inputs.assumptions.scheduleMonths, "months"],
    ["R&D Allocation", inputs.assumptions.rdAllocation, "0–1 share"],
    ["Hours per Month", inputs.assumptions.hoursPerMonth, "hours"],
    ["FTE Rate Low", inputs.assumptions.fteRateLow, "$/hr"],
    ["FTE Rate High", inputs.assumptions.fteRateHigh, "$/hr"],
    ["Contractor Rate Low", inputs.assumptions.contractorRateLow, "$/hr"],
    ["Contractor Rate High", inputs.assumptions.contractorRateHigh, "$/hr"],
  ]);

  pushTable("Step 2 — ESLOC (Reuse Inputs)", [
    ["ASLOC (legacy LOC)", inputs.esloc.asloc, "LOC"],
    ["DM", inputs.esloc.dm, "%"],
    ["CM", inputs.esloc.cm, "%"],
    ["IM", inputs.esloc.im, "%"],
    ["AA", inputs.esloc.aa, "%"],
    ["SU", inputs.esloc.su, "%"],
    ["UNFM", inputs.esloc.unfm, "0–1"],
  ]);

  pushTable("Step 3 — Scale Factors (weights)", [
    ["PREC", inputs.scaleFactors.prec, "weight"],
    ["FLEX", inputs.scaleFactors.flex, "weight"],
    ["RESL", inputs.scaleFactors.resl, "weight"],
    ["TEAM", inputs.scaleFactors.team, "weight"],
    ["PMAT", inputs.scaleFactors.pmat, "weight"],
  ]);

  pushTable("Step 4 — Effort Multipliers (multipliers)", [
    ["RELY", inputs.effortMultipliers.rely, "multiplier"],
    ["DATA", inputs.effortMultipliers.data, "multiplier"],
    ["CPLX", inputs.effortMultipliers.cplx, "multiplier"],
    ["RUSE", inputs.effortMultipliers.ruse, "multiplier"],
    ["DOCU", inputs.effortMultipliers.docu, "multiplier"],
    ["TIME", inputs.effortMultipliers.time, "multiplier"],
    ["STOR", inputs.effortMultipliers.stor, "multiplier"],
    ["PVOL", inputs.effortMultipliers.pvol, "multiplier"],
    ["ACAP", inputs.effortMultipliers.acap, "multiplier"],
    ["PCAP", inputs.effortMultipliers.pcap, "multiplier"],
    ["PCON", inputs.effortMultipliers.pcon, "multiplier"],
    ["TOOL", inputs.effortMultipliers.tool, "multiplier"],
    ["SITE", inputs.effortMultipliers.site, "multiplier"],
    ["SCED", inputs.effortMultipliers.sced, "multiplier"],
  ]);

  pushTable("Step 5 — Calibration", [
    ["A", inputs.calibration.a, "COCOMO II A"],
    ["Base B (fixed)", inputs.calibration.bBase ?? 0.91, "COCOMO II Post-Architecture"],
  ]);

  pushTable("Step 6 — Resources & Rates", [
    ["Schedule (months)", inputs.resources.scheduleMonths, "months"],
    ["Hours per Person-Month", inputs.resources.hoursPerPM, "hours/PM"],
    ["Avg Total R&D FTE Pool", inputs.resources.avgTotalFTE, "FTE"],
    ["Internal Allocation", inputs.resources.internalAllocation, "0–1 share"],
    ["FTE Rate Low", inputs.resources.fteRateLow, "$/hr"],
    ["FTE Rate High", inputs.resources.fteRateHigh, "$/hr"],
    ["Contractor Rate Low", inputs.resources.contractorRateLow, "$/hr"],
    ["Contractor Rate High", inputs.resources.contractorRateHigh, "$/hr"],
  ]);

  pushTitle("Final — Results");
  aoa.push(["Metric", "Value", "Notes"]);
  aoa.push(["ESLOC", r.eslocKsloc, "Equivalent SLOC"]);
  aoa.push(["Effort (PM)", r.pm, "Person-months"]);
  aoa.push(["Schedule (months)", r.scheduleMonths, "COCOMO schedule estimate"]);
  aoa.push(["Avg Staffing (FTE)", r.internalFTE, "PM / months"]);
  aoa.push(["Avg Staffing (Non-FTE)", r.contractors, "PM / months"]);
  aoa.push(["Internal Cost Low", r.internalCostLow, "USD"]);
  aoa.push(["Internal Cost High", r.internalCostHigh, "USD"]);
  aoa.push(["Contractor Cost Low", r.costLow, "USD"]);
  aoa.push(["Contractor Cost High", r.costHigh, "USD"]);
  aoa.push(["Total Cost Low", r.totalCostLow, "USD"]);
  aoa.push(["Total Cost High", r.totalCostHigh, "USD"]);

  const ws = XLSX.utils.aoa_to_sheet(aoa);
  ws["!cols"] = [{ wch: 34 }, { wch: 22 }, { wch: 36 }];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Estimator");

  XLSX.writeFile(wb, fileName, { bookType: "xlsx" });
}
