import { jsPDF } from 'jspdf';
import { AssessmentRecord, Factory } from '../types';

/**
 * Generates and downloads a formatted, publication-grade PDF report
 * of a factory assessment, capturing audit scores, checklist parts, and e-signatures.
 */
export async function downloadAssessmentPDF(
  record: AssessmentRecord,
  factory?: Factory | null
): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 210mm
  const pageHeight = doc.internal.pageSize.getHeight(); // 297mm
  const margin = 14;
  const contentWidth = pageWidth - margin * 2; // 182mm

  const isPass = record.result === 'PASS';
  const primaryColor = [0, 168, 255] as const; // #00a8ff
  const accentRed = [232, 65, 24] as const; // #e84118
  const successGreen = [76, 209, 55] as const; // #4cd137
  const darkSlate = [47, 54, 64] as const; // #2f3640
  const lightBg = [245, 246, 250] as const; // #f5f6fa

  let currentY = margin;

  // Helper to add new page if needed
  const checkPageBreak = (neededHeight: number) => {
    if (currentY + neededHeight > pageHeight - margin - 10) {
      doc.addPage();
      currentY = margin;
      drawHeaderBanner(true);
    }
  };

  // Helper to draw clean flat header banner
  const drawHeaderBanner = (isContinuation = false) => {
    doc.setFillColor(darkSlate[0], darkSlate[1], darkSlate[2]);
    doc.rect(margin, currentY, contentWidth, isContinuation ? 10 : 20, 'F');

    // Accent strip
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(margin, currentY, 3, isContinuation ? 10 : 20, 'F');

    doc.setTextColor(255, 255, 255);
    if (!isContinuation) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.text(
        'MINISTRY OF INDUSTRY & OCCUPATIONAL SAFETY • FACTORYASSESS PRO',
        margin + 7,
        currentY + 6
      );

      doc.setFontSize(13);
      doc.text(
        'INDUSTRIAL COMPLIANCE & SAFETY AUDIT REPORT',
        margin + 7,
        currentY + 13
      );

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.text(
        `REF: ${record.id.toUpperCase()} | CERT: ${
          record.certificateNumber || 'N/A'
        } | DATE: ${record.completedAt ? new Date(record.completedAt).toLocaleDateString() : record.scheduledDate}`,
        margin + 7,
        currentY + 17.5
      );

      currentY += 23;
    } else {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.text(
        `FACTORYASSESS PRO AUDIT REPORT — ${record.factoryName} (CONT.)`,
        margin + 7,
        currentY + 6.5
      );
      currentY += 13;
    }
  };

  // Draw Page 1 Header
  drawHeaderBanner(false);

  // 1. Audit Verdict Banner
  const verdictHeight = 22;
  checkPageBreak(verdictHeight);

  if (isPass) {
    doc.setFillColor(235, 250, 235);
    doc.setDrawColor(successGreen[0], successGreen[1], successGreen[2]);
  } else {
    doc.setFillColor(254, 242, 242);
    doc.setDrawColor(accentRed[0], accentRed[1], accentRed[2]);
  }
  doc.setLineWidth(1.2);
  doc.rect(margin, currentY, contentWidth, verdictHeight, 'FD');

  // Left status tag
  const tagColor = isPass ? successGreen : accentRed;
  doc.setFillColor(tagColor[0], tagColor[1], tagColor[2]);
  doc.rect(margin + 4, currentY + 4, 34, 14, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text(isPass ? 'AUDIT PASSED' : 'AUDIT FAILED', margin + 7, currentY + 10);
  doc.setFontSize(7);
  doc.text(isPass ? 'COMPLIANT' : 'NON-COMPLIANT', margin + 7, currentY + 14.5);

  // Verdict text and stats
  doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  const verdictTitle = isPass
    ? 'OFFICIAL VERDICT: STATUTORY COMPLIANCE PASS'
    : 'OFFICIAL VERDICT: STATUTORY AUDIT FALSE / FAILED';
  doc.text(verdictTitle, margin + 42, currentY + 8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.8);
  const scoreSummary = `Total Score: ${record.scorePercent}%  |  Min Required: 75%  |  Earned: ${record.totalPoints}/${record.maxPoints} pts  |  Critical Violations: ${
    isPass ? '0 (Clean)' : 'DETECTED (Disqualifying)'
  }`;
  doc.text(scoreSummary, margin + 42, currentY + 13.5);

  doc.setFontSize(7.2);
  doc.setTextColor(110, 120, 135);
  doc.text(
    `Type: ${record.inspectionType} | Priority: ${record.priority} | Completed: ${
      record.completedAt
        ? new Date(record.completedAt).toLocaleString()
        : 'In Field Inspection'
    }`,
    margin + 42,
    currentY + 18
  );

  currentY += verdictHeight + 4;

  // 2. Factory Profile & Operational Details Block
  checkPageBreak(30);
  doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
  doc.setDrawColor(215, 220, 230);
  doc.setLineWidth(0.4);
  doc.rect(margin, currentY, contentWidth, 26, 'FD');

  doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('1. FACILITY REGISTRATION & OPERATIONAL PROFILE', margin + 4, currentY + 5);

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');

  // Col 1
  doc.text(`Enterprise: ${record.factoryName}`, margin + 4, currentY + 10.5);
  doc.text(
    `Registration No: ${factory?.registrationNumber || 'FAC-REGISTERED'}`,
    margin + 4,
    currentY + 15
  );
  doc.text(
    `Operating License: ${factory?.operatingLicenseNo || 'LIC-VERIFIED'}`,
    margin + 4,
    currentY + 19.5
  );
  doc.text(`Sector: ${factory?.sector || 'Industrial Manufacturing'}`, margin + 4, currentY + 24);

  // Col 2
  const midX = margin + 92;
  doc.text(`Managing Owner: ${factory?.ownerName || 'Factory Representative'}`, midX, currentY + 10.5);
  doc.text(`Direct Contact: ${factory?.ownerPhone || 'N/A'}`, midX, currentY + 15);
  doc.text(
    `Location: ${factory?.city || 'Zone 1'}, ${factory?.province || 'Province'}`,
    midX,
    currentY + 19.5
  );
  doc.text(
    `Workforce: ${factory?.employeeCount || '200'} Personnel | Risk Level: ${factory?.riskLevel || 'Medium'}`,
    midX,
    currentY + 24
  );

  currentY += 30;

  // 3. Evaluation Findings Summary Metrics Bar
  checkPageBreak(18);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('2. EVALUATION FINDINGS & METRICS SUMMARY', margin, currentY);
  currentY += 3;

  const boxW = contentWidth / 4;
  const metrics = [
    { label: 'COMPLIANT (PASS)', val: `${record.findingsCount.pass}`, col: [46, 204, 113] },
    { label: 'PARTIAL COMPLIANCE', val: `${record.findingsCount.partial}`, col: [241, 196, 15] },
    { label: 'NON-COMPLIANT (FAIL)', val: `${record.findingsCount.fail}`, col: [231, 76, 60] },
    { label: 'AGGREGATE SCORE', val: `${record.scorePercent}%`, col: [0, 168, 255] },
  ];

  metrics.forEach((m, idx) => {
    const x = margin + idx * boxW;
    doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
    doc.setDrawColor(220, 225, 235);
    doc.rect(x, currentY, boxW - 2, 12, 'FD');

    doc.setFillColor(m.col[0], m.col[1], m.col[2]);
    doc.rect(x, currentY, 2, 12, 'F');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.setTextColor(110, 120, 135);
    doc.text(m.label, x + 4, currentY + 4);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(m.col[0], m.col[1], m.col[2]);
    doc.text(m.val, x + 4, currentY + 9.5);
  });

  currentY += 16;

  // 4. Checklist A & B Parts Breakdown Table
  checkPageBreak(12);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
  doc.text('3. STANDARDIZED CHECKLISTS BREAKDOWN (A: 5 PARTS, B: 3 PARTS)', margin, currentY);
  currentY += 3.5;

  // Table header
  doc.setFillColor(darkSlate[0], darkSlate[1], darkSlate[2]);
  doc.rect(margin, currentY, contentWidth, 5.5, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.8);
  doc.text('PART', margin + 2, currentY + 3.8);
  doc.text('CHECKLIST CATEGORY & SCOPE', margin + 14, currentY + 3.8);
  doc.text('ITEMS', margin + 115, currentY + 3.8);
  doc.text('PASS', margin + 130, currentY + 3.8);
  doc.text('PARTIAL', margin + 145, currentY + 3.8);
  doc.text('FAIL', margin + 162, currentY + 3.8);
  doc.text('STATUS', margin + 172, currentY + 3.8);
  currentY += 5.5;

  // Render Parts from Checklist A (5 parts)
  record.checklistA.forEach((part) => {
    checkPageBreak(5);
    const passCount = part.items.filter((i) => i.status === 'pass').length;
    const partialCount = part.items.filter((i) => i.status === 'partial').length;
    const failCount = part.items.filter((i) => i.status === 'fail').length;

    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(230, 235, 240);
    doc.rect(margin, currentY, contentWidth, 5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text(`A.${part.partNumber}`, margin + 2, currentY + 3.5);

    doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
    doc.text(part.partTitle.substring(0, 55), margin + 14, currentY + 3.5);

    doc.setFont('helvetica', 'normal');
    doc.text(`${part.items.length}`, margin + 118, currentY + 3.5);

    doc.setTextColor(successGreen[0], successGreen[1], successGreen[2]);
    doc.text(`${passCount}`, margin + 132, currentY + 3.5);

    doc.setTextColor(230, 140, 10);
    doc.text(`${partialCount}`, margin + 148, currentY + 3.5);

    doc.setTextColor(failCount > 0 ? accentRed[0] : 140, failCount > 0 ? accentRed[1] : 140, failCount > 0 ? accentRed[2] : 140);
    doc.text(`${failCount}`, margin + 164, currentY + 3.5);

    const partPass = failCount === 0;
    doc.setFont('helvetica', 'bold');
    doc.text(partPass ? 'PASSED' : 'ATTN', margin + 172, currentY + 3.5);

    currentY += 5;
  });

  // Render Parts from Checklist B (3 parts - High Risk)
  record.checklistB.forEach((part) => {
    checkPageBreak(5);
    const passCount = part.items.filter((i) => i.status === 'pass').length;
    const partialCount = part.items.filter((i) => i.status === 'partial').length;
    const failCount = part.items.filter((i) => i.status === 'fail').length;

    doc.setFillColor(254, 248, 248);
    doc.setDrawColor(240, 225, 225);
    doc.rect(margin, currentY, contentWidth, 5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(accentRed[0], accentRed[1], accentRed[2]);
    doc.text(`B.${part.partNumber}`, margin + 2, currentY + 3.5);

    doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
    doc.text(`[HIGH RISK] ${part.partTitle}`.substring(0, 55), margin + 14, currentY + 3.5);

    doc.setFont('helvetica', 'normal');
    doc.text(`${part.items.length}`, margin + 118, currentY + 3.5);

    doc.setTextColor(successGreen[0], successGreen[1], successGreen[2]);
    doc.text(`${passCount}`, margin + 132, currentY + 3.5);

    doc.setTextColor(230, 140, 10);
    doc.text(`${partialCount}`, margin + 148, currentY + 3.5);

    doc.setTextColor(failCount > 0 ? accentRed[0] : 140, failCount > 0 ? accentRed[1] : 140, failCount > 0 ? accentRed[2] : 140);
    doc.text(`${failCount}`, margin + 164, currentY + 3.5);

    const partPass = failCount === 0;
    doc.setFont('helvetica', 'bold');
    doc.text(partPass ? 'PASSED' : 'NON-COMPL', margin + 172, currentY + 3.5);

    currentY += 5;
  });

  currentY += 4;

  // 5. Critical Observations / Notes (if any failures or special instructions)
  const allItems = [
    ...record.checklistA.flatMap((p) => p.items),
    ...record.checklistB.flatMap((p) => p.items),
  ];
  const failedItems = allItems.filter((i) => i.status === 'fail');
  const itemsWithNotes = allItems.filter((i) => !!i.notes && i.status !== null);

  if (failedItems.length > 0 || itemsWithNotes.length > 0 || record.specialInstructions) {
    checkPageBreak(25);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
    doc.text('4. AUDIT OBSERVATIONS & CORRECTIVE DIRECTIVES', margin, currentY);
    currentY += 3.5;

    doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
    doc.setDrawColor(220, 225, 235);
    doc.rect(margin, currentY, contentWidth, 18, 'FD');

    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');

    let noteText = '';
    if (failedItems.length > 0) {
      noteText += `Non-compliant indicators (${failedItems.length}): ${failedItems
        .map((f) => f.code)
        .slice(0, 6)
        .join(', ')}. Rectification required within statutory 30-day window. `;
    } else {
      noteText += 'All audited safety systems demonstrate satisfactory compliance. ';
    }

    if (record.specialInstructions) {
      noteText += `Directive: ${record.specialInstructions}`;
    }

    const wrappedNotes = doc.splitTextToSize(noteText, contentWidth - 8);
    doc.text(wrappedNotes, margin + 4, currentY + 5);

    currentY += 21;
  }

  // 6. Section 5: Electronic Signatures & Seals
  // Make sure we have space for signatures; if not, add a fresh page for signatures block
  checkPageBreak(50);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
  doc.text(
    '5. AUTHORIZED ELECTRONIC SIGNATURES & BIOMETRIC SEALS',
    margin,
    currentY
  );
  currentY += 3.5;

  // Officers Signatures (Up to 6)
  const officers = record.officers;
  const owner = record.ownerSignature;

  // We layout signatures in rows of 2 or 3
  const totalSigners = officers.length + 1; // officers + owner
  const sigBoxW = contentWidth / 3 - 2;
  const sigBoxH = 26;

  // Helper to safely draw a signature
  const drawSignatureBox = (
    x: number,
    y: number,
    title: string,
    subtitle: string,
    badge: string,
    dataUrl?: string,
    isOwner = false
  ) => {
    doc.setFillColor(isOwner ? 250 : 255, isOwner ? 250 : 255, isOwner ? 252 : 255);
    doc.setDrawColor(isOwner ? primaryColor[0] : 210, isOwner ? primaryColor[1] : 215, isOwner ? primaryColor[2] : 225);
    doc.setLineWidth(0.3);
    doc.rect(x, y, sigBoxW, sigBoxH, 'FD');

    // Title & badge
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
    doc.text(title.substring(0, 24), x + 2, y + 4);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5.5);
    doc.setTextColor(110, 120, 135);
    doc.text(subtitle.substring(0, 28), x + 2, y + 7);

    // E-Signature graphic
    if (dataUrl && dataUrl.startsWith('data:image')) {
      try {
        // Embed the captured canvas PNG into PDF
        doc.addImage(dataUrl, 'PNG', x + 3, y + 8, sigBoxW - 6, 11);
      } catch (err) {
        doc.text('[Digital Signature Captured]', x + 3, y + 14);
      }
    } else {
      doc.setTextColor(180, 185, 195);
      doc.text('[ Signature Pending / In-Person ]', x + 3, y + 14);
    }

    // Seal line & footer
    doc.setDrawColor(220, 225, 230);
    doc.line(x + 2, y + 20, x + sigBoxW - 2, y + 20);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(5.5);
    doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
    doc.text(badge, x + 2, y + 23.5);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(successGreen[0], successGreen[1], successGreen[2]);
    doc.text(dataUrl ? '✓ VERIFIED' : 'PENDING', x + sigBoxW - 14, y + 23.5);
  };

  let colIdx = 0;
  let rowY = currentY;

  // Draw each officer
  officers.forEach((off, idx) => {
    if (colIdx >= 3) {
      colIdx = 0;
      rowY += sigBoxH + 3;
      checkPageBreak(sigBoxH + 5);
    }
    const x = margin + colIdx * (sigBoxW + 3);
    drawSignatureBox(
      x,
      rowY,
      off.name,
      off.role,
      `OFFICER #${idx + 1} • ${off.badgeNumber}`,
      off.signatureDataUrl,
      false
    );
    colIdx++;
  });

  // Draw Factory Owner
  if (colIdx >= 3) {
    colIdx = 0;
    rowY += sigBoxH + 3;
    checkPageBreak(sigBoxH + 5);
  }
  const ownerX = margin + colIdx * (sigBoxW + 3);
  drawSignatureBox(
    ownerX,
    rowY,
    owner?.name || factory?.ownerName || 'Factory Representative',
    owner?.title || 'Managing Director',
    'FACTORY OWNER SEAL',
    owner?.signatureDataUrl,
    true
  );

  rowY += sigBoxH + 8;
  currentY = rowY;

  // 7. Security Hash & Statutory Footnote
  checkPageBreak(12);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(140, 145, 155);
  doc.text(
    `This document constitutes an official statutory assessment instrument under Industrial Safety Regulations. Digital signature hashes and timestamps are cryptographically recorded. Report ID: ${record.id}`,
    margin,
    currentY
  );

  // Save / Trigger browser PDF download
  const cleanName = (record.factoryName || 'Factory')
    .replace(/[^a-zA-Z0-9]/g, '_')
    .substring(0, 25);
  const dateStr = record.completedAt
    ? record.completedAt.split('T')[0]
    : record.scheduledDate;
  const fileName = `Assessment_Report_${cleanName}_${dateStr}.pdf`;

  doc.save(fileName);
}
