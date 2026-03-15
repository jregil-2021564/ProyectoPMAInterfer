'use strict';

import ExcelJS from 'exceljs';
import { Company } from '../companies/company.model.js';
import { asyncHandler } from '../../middlewares/error-handler.js';

// ── Constantes de estilo ──────────────────────────────────────────────────────
const COLORS = {
    headerBg:    '1E3A5F',   // Azul oscuro corporativo
    headerFont:  'FFFFFF',   // Blanco
    rowAlt:      'EBF3FB',   // Azul muy claro (filas pares)
    rowNormal:   'FFFFFF',   // Blanco (filas impares)
    accent:      '2E75B6',   // Azul medio (totales / separadores)
    accentFont:  'FFFFFF',
    border:      'B8CCE4',
    titleFont:   '1E3A5F',
};

const FONT_NAME = 'Arial';

/**
 * GET /api/v1/reports/excel
 * Genera y descarga un reporte Excel con todas las empresas registradas
 */
export const generateExcelReport = asyncHandler(async (req, res) => {
    // ── 1. Obtener datos ───────────────────────────────────────────────────────
    const companies = await Company.find({ status: true })
        .sort({ companyName: 1 })
        .populate('registeredBy', 'name email')
        .lean();

    if (companies.length === 0) {
        return res.status(404).json({
            success: false,
            message: 'No hay empresas registradas para generar el reporte',
        });
    }

    // ── 2. Crear workbook ──────────────────────────────────────────────────────
    const workbook = new ExcelJS.Workbook();
    workbook.creator   = 'COPEREX - Sistema Interfer';
    workbook.lastModifiedBy = 'COPEREX API';
    workbook.created   = new Date();
    workbook.modified  = new Date();

    // ── 3. Hoja principal: Directorio de Empresas ─────────────────────────────
    await buildDirectorySheet(workbook, companies);

    // ── 4. Hoja de resumen por categoría ──────────────────────────────────────
    await buildSummarySheet(workbook, companies);

    // ── 5. Enviar como descarga ────────────────────────────────────────────────
    const filename = `Interfer_Empresas_${formatDateForFilename(new Date())}.xlsx`;

    res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    await workbook.xlsx.write(res);
    res.end();
});

// ── Helpers ───────────────────────────────────────────────────────────────────

async function buildDirectorySheet(workbook, companies) {
    const sheet = workbook.addWorksheet('Directorio de Empresas', {
        pageSetup: { paperSize: 9, orientation: 'landscape', fitToPage: true },
        views: [{ state: 'frozen', ySplit: 5 }],
    });

    // Columnas y anchos
    sheet.columns = [
        { key: 'no',             width: 6  },
        { key: 'companyName',    width: 32 },
        { key: 'businessName',   width: 32 },
        { key: 'category',       width: 18 },
        { key: 'impactLevel',    width: 18 },
        { key: 'yearsOfExp',     width: 14 },
        { key: 'contactEmail',   width: 28 },
        { key: 'contactPhone',   width: 16 },
        { key: 'representative', width: 28 },
        { key: 'position',       width: 22 },
        { key: 'website',        width: 28 },
        { key: 'registeredBy',   width: 22 },
        { key: 'registeredAt',   width: 18 },
    ];

    // ── Fila 1: Título principal ───────────────────────────────────────────────
    sheet.mergeCells('A1:M1');
    const titleCell = sheet.getCell('A1');
    titleCell.value = 'FERIA INTERFER — DIRECTORIO DE EMPRESAS PARTICIPANTES';
    titleCell.font  = { name: FONT_NAME, size: 14, bold: true, color: { argb: COLORS.titleFont } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    sheet.getRow(1).height = 32;

    // ── Fila 2: Subtítulo ──────────────────────────────────────────────────────
    sheet.mergeCells('A2:M2');
    const subCell = sheet.getCell('A2');
    subCell.value = `COPEREX — Reporte generado: ${formatDateReadable(new Date())}  |  Total de empresas: ${companies.length}`;
    subCell.font  = { name: FONT_NAME, size: 10, italic: true, color: { argb: '555555' } };
    subCell.alignment = { horizontal: 'center', vertical: 'middle' };
    sheet.getRow(2).height = 20;

    // ── Fila 3: Espacio ────────────────────────────────────────────────────────
    sheet.getRow(3).height = 8;

    // ── Fila 4: Encabezados de columna ─────────────────────────────────────────
    const headers = [
        '#', 'Nombre de Empresa', 'Razón Social', 'Categoría',
        'Nivel de Impacto', 'Años de Trayectoria', 'Email de Contacto',
        'Teléfono', 'Representante', 'Cargo', 'Sitio Web',
        'Registrado Por', 'Fecha de Registro',
    ];

    const headerRow = sheet.getRow(4);
    headerRow.height = 24;

    headers.forEach((header, i) => {
        const cell = headerRow.getCell(i + 1);
        cell.value = header;
        applyHeaderStyle(cell);
    });

    // ── Filas de datos (desde fila 5) ─────────────────────────────────────────
    companies.forEach((company, index) => {
        const rowNum = index + 5;
        const row    = sheet.getRow(rowNum);
        row.height   = 18;

        const isEven = index % 2 === 0;
        const bgColor = isEven ? COLORS.rowAlt : COLORS.rowNormal;

        const values = [
            index + 1,
            company.companyName,
            company.businessName,
            company.category,
            company.impactLevel,
            company.yearsOfExperience,
            company.contactEmail,
            company.contactPhone,
            company.representativeName,
            company.representativePosition,
            company.website || '—',
            company.registeredBy?.name || '—',
            formatDateReadable(company.createdAt),
        ];

        values.forEach((value, colIndex) => {
            const cell = row.getCell(colIndex + 1);
            cell.value = value;
            applyDataStyle(cell, bgColor, colIndex === 0 || colIndex === 5);
        });
    });

    // ── Fila de total ──────────────────────────────────────────────────────────
    const totalRow = sheet.getRow(companies.length + 5);
    totalRow.height = 20;

    sheet.mergeCells(`A${companies.length + 5}:E${companies.length + 5}`);
    const totalLabelCell = totalRow.getCell(1);
    totalLabelCell.value = 'TOTAL DE EMPRESAS REGISTRADAS';
    totalLabelCell.font  = { name: FONT_NAME, size: 10, bold: true, color: { argb: COLORS.accentFont } };
    totalLabelCell.fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.accent } };
    totalLabelCell.alignment = { horizontal: 'right', vertical: 'middle' };

    const totalValueCell = totalRow.getCell(6);
    totalValueCell.value = companies.length;
    totalValueCell.font  = { name: FONT_NAME, size: 10, bold: true, color: { argb: COLORS.accentFont } };
    totalValueCell.fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.accent } };
    totalValueCell.alignment = { horizontal: 'center', vertical: 'middle' };

    // Aplicar bordes externos a la tabla
    applyTableBorders(sheet, 4, companies.length + 5, 13);
}

async function buildSummarySheet(workbook, companies) {
    const sheet = workbook.addWorksheet('Resumen por Categoría');

    sheet.columns = [
        { key: 'category',    width: 22 },
        { key: 'count',       width: 14 },
        { key: 'avgYears',    width: 18 },
        { key: 'impact',      width: 18 },
    ];

    // Título
    sheet.mergeCells('A1:D1');
    const titleCell = sheet.getCell('A1');
    titleCell.value = 'RESUMEN POR CATEGORÍA — FERIA INTERFER';
    titleCell.font  = { name: FONT_NAME, size: 13, bold: true, color: { argb: COLORS.titleFont } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    sheet.getRow(1).height = 30;

    sheet.mergeCells('A2:D2');
    sheet.getCell('A2').value = `Generado: ${formatDateReadable(new Date())}`;
    sheet.getCell('A2').font  = { name: FONT_NAME, size: 9, italic: true, color: { argb: '888888' } };
    sheet.getCell('A2').alignment = { horizontal: 'center' };
    sheet.getRow(2).height = 16;

    sheet.getRow(3).height = 8;

    // Encabezados
    const headerLabels = ['Categoría', 'N° Empresas', 'Promedio Años Trayectoria', 'Nivel de Impacto Predominante'];
    const headerRow = sheet.getRow(4);
    headerRow.height = 22;

    headerLabels.forEach((label, i) => {
        applyHeaderStyle(headerRow.getCell(i + 1), label);
    });

    // Agrupar por categoría
    const categoryMap = {};
    companies.forEach((c) => {
        if (!categoryMap[c.category]) {
            categoryMap[c.category] = { count: 0, totalYears: 0, impactCount: {} };
        }
        const cat = categoryMap[c.category];
        cat.count++;
        cat.totalYears += c.yearsOfExperience;
        cat.impactCount[c.impactLevel] = (cat.impactCount[c.impactLevel] || 0) + 1;
    });

    const categories = Object.entries(categoryMap).sort((a, b) => b[1].count - a[1].count);

    categories.forEach(([category, data], index) => {
        const rowNum  = index + 5;
        const row     = sheet.getRow(rowNum);
        row.height    = 18;
        const bgColor = index % 2 === 0 ? COLORS.rowAlt : COLORS.rowNormal;

        const avgYears      = Math.round(data.totalYears / data.count);
        const topImpact     = Object.entries(data.impactCount).sort((a, b) => b[1] - a[1])[0][0];

        [category, data.count, avgYears, topImpact].forEach((value, colIndex) => {
            const cell = row.getCell(colIndex + 1);
            cell.value = value;
            applyDataStyle(cell, bgColor, colIndex === 1 || colIndex === 2);
        });
    });

    // Fila total
    const totalRowNum = categories.length + 5;
    const totalRow    = sheet.getRow(totalRowNum);
    totalRow.height   = 20;

    sheet.mergeCells(`A${totalRowNum}:A${totalRowNum}`);
    const tlCell = totalRow.getCell(1);
    tlCell.value = 'TOTAL';
    tlCell.font  = { name: FONT_NAME, size: 10, bold: true, color: { argb: COLORS.accentFont } };
    tlCell.fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.accent } };
    tlCell.alignment = { horizontal: 'center', vertical: 'middle' };

    const tvCell = totalRow.getCell(2);
    tvCell.value = companies.length;
    tvCell.font  = { name: FONT_NAME, size: 10, bold: true, color: { argb: COLORS.accentFont } };
    tvCell.fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.accent } };
    tvCell.alignment = { horizontal: 'center', vertical: 'middle' };

    applyTableBorders(sheet, 4, totalRowNum, 4);
}

// ── Aplicar estilos ────────────────────────────────────────────────────────────

function applyHeaderStyle(cell, value) {
    if (value !== undefined) cell.value = value;
    cell.font  = { name: FONT_NAME, size: 10, bold: true, color: { argb: COLORS.headerFont } };
    cell.fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.headerBg } };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.border = {
        top:    { style: 'thin', color: { argb: COLORS.headerBg } },
        bottom: { style: 'thin', color: { argb: COLORS.headerBg } },
        left:   { style: 'thin', color: { argb: COLORS.headerBg } },
        right:  { style: 'thin', color: { argb: COLORS.headerBg } },
    };
}

function applyDataStyle(cell, bgColor, center = false) {
    cell.font  = { name: FONT_NAME, size: 9 };
    cell.fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
    cell.alignment = {
        horizontal: center ? 'center' : 'left',
        vertical: 'middle',
        wrapText: false,
    };
    cell.border = {
        top:    { style: 'hair', color: { argb: COLORS.border } },
        bottom: { style: 'hair', color: { argb: COLORS.border } },
        left:   { style: 'hair', color: { argb: COLORS.border } },
        right:  { style: 'hair', color: { argb: COLORS.border } },
    };
}

function applyTableBorders(sheet, startRow, endRow, totalCols) {
    for (let r = startRow; r <= endRow; r++) {
        const row = sheet.getRow(r);
        // Borde izquierdo de col 1
        const firstCell = row.getCell(1);
        firstCell.border = {
            ...firstCell.border,
            left: { style: 'medium', color: { argb: COLORS.accent } },
        };
        // Borde derecho de última col
        const lastCell = row.getCell(totalCols);
        lastCell.border = {
            ...lastCell.border,
            right: { style: 'medium', color: { argb: COLORS.accent } },
        };
    }
    // Bordes superior e inferior
    for (let c = 1; c <= totalCols; c++) {
        const topCell = sheet.getRow(startRow).getCell(c);
        topCell.border = { ...topCell.border, top: { style: 'medium', color: { argb: COLORS.accent } } };
        const botCell  = sheet.getRow(endRow).getCell(c);
        botCell.border = { ...botCell.border, bottom: { style: 'medium', color: { argb: COLORS.accent } } };
    }
}

function formatDateReadable(date) {
    return new Date(date).toLocaleDateString('es-GT', {
        year: 'numeric', month: 'long', day: 'numeric',
        hour: '2-digit', minute: '2-digit',
    });
}

function formatDateForFilename(date) {
    const d = new Date(date);
    return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
}
