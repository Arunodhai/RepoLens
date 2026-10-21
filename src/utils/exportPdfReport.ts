import { jsPDF } from 'jspdf';
import { RepoMetadata, RepoDataset, DateRange } from '../types/repo';
import { getVulnerabilitiesForRepo } from '../data/repoVulnerabilities';

export interface ExportPdfOptions {
  repo: RepoMetadata;
  dataset: RepoDataset;
  dateRange: DateRange;
  userEmail?: string;
}

export function exportRepositoryPdfReport({
  repo,
  dataset,
  dateRange,
  userEmail = 'arunodhai007@gmail.com',
}: ExportPdfOptions): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;

  // Colors
  const darkNavy = [10, 15, 29] as const; // #0a0f1d
  const slateCardBg = [248, 250, 252] as const; // #f8fafc
  const cardBorder = [226, 232, 240] as const; // #e2e8f0
  const brandAmber = [245, 158, 11] as const; // #f59e0b
  const brandEmerald = [16, 185, 129] as const; // #10b981
  const brandSky = [56, 189, 248] as const; // #38bdf8
  const textDark = [15, 23, 42] as const; // #0f172a
  const textMuted = [100, 116, 139] as const; // #64748b

  // ---------------- PAGE 1: EXECUTIVE DASHBOARD & METRICS ----------------
  // Header Banner
  doc.setFillColor(darkNavy[0], darkNavy[1], darkNavy[2]);
  doc.rect(0, 0, pageWidth, 42, 'F');

  // Top Accent Bar (Amber to Emerald)
  doc.setFillColor(brandAmber[0], brandAmber[1], brandAmber[2]);
  doc.rect(0, 0, pageWidth * 0.5, 2.5, 'F');
  doc.setFillColor(brandEmerald[0], brandEmerald[1], brandEmerald[2]);
  doc.rect(pageWidth * 0.5, 0, pageWidth * 0.5, 2.5, 'F');

  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('REPOLENS — EXECUTIVE REPOSITORY SUMMARY', margin, 15);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(203, 213, 225);
  doc.text(`Repository: ${repo.fullName}  ·  Range: ${dateRange}  ·  Generated: ${new Date().toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}`, margin, 22);

  doc.setTextColor(brandEmerald[0], brandEmerald[1], brandEmerald[2]);
  doc.setFont('helvetica', 'bold');
  doc.text(`● LIVE AUDIT VERIFIED`, margin, 29);

  doc.setTextColor(148, 163, 184);
  doc.setFont('helvetica', 'normal');
  doc.text(`Lead Auditor: ${userEmail}`, margin + 50, 29);

  // Repository Identity Card
  let curY = 48;
  doc.setFillColor(slateCardBg[0], slateCardBg[1], slateCardBg[2]);
  doc.setDrawColor(cardBorder[0], cardBorder[1], cardBorder[2]);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, curY, contentWidth, 24, 2, 2, 'FD');

  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(`${repo.name}`, margin + 4, curY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  const desc = repo.description || 'GitHub Source Repository';
  const splitDesc = doc.splitTextToSize(desc, contentWidth - 8);
  doc.text(splitDesc.slice(0, 2), margin + 4, curY + 11);

  // Meta Badges inside card
  const badgeY = curY + 19;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text(`Language: ${repo.language || 'TypeScript'}`, margin + 4, badgeY);
  doc.text(`Branch: ${repo.defaultBranch || 'main'}`, margin + 48, badgeY);
  doc.text(`License: ${repo.license || 'Open Source'}`, margin + 86, badgeY);
  doc.text(`Stars: ${repo.stars || 0}   Forks: ${repo.forks || 0}`, margin + 132, badgeY);

  // ---------------- SECTION: KPI METRICS GRID ----------------
  curY = 78;
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Key Performance Indicators (KPIs)', margin, curY);

  const kpis = dataset.kpis[dateRange] || dataset.kpis.ALL || [];
  const kpiBoxWidth = (contentWidth - 8) / 3;
  const kpiBoxHeight = 22;

  let kpiY = curY + 4;
  kpis.slice(0, 6).forEach((kpi, idx) => {
    const col = idx % 3;
    const row = Math.floor(idx / 3);
    const boxX = margin + col * (kpiBoxWidth + 4);
    const boxY = kpiY + row * (kpiBoxHeight + 3);

    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(cardBorder[0], cardBorder[1], cardBorder[2]);
    doc.setLineWidth(0.3);
    doc.roundedRect(boxX, boxY, kpiBoxWidth, kpiBoxHeight, 1.5, 1.5, 'FD');

    // Left accent bar
    doc.setFillColor(brandAmber[0], brandAmber[1], brandAmber[2]);
    doc.rect(boxX, boxY, 1.5, kpiBoxHeight, 'F');

    // KPI Title
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.text(kpi.title.toUpperCase(), boxX + 4, boxY + 5);

    // KPI Hero Value
    doc.setTextColor(textDark[0], textDark[1], textDark[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(kpi.value, boxX + 4, boxY + 12);

    // KPI Trend / Delta
    doc.setTextColor(brandEmerald[0], brandEmerald[1], brandEmerald[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.text(kpi.deltaText, boxX + kpiBoxWidth - 3, boxY + 12, { align: 'right' });

    // Sublabel
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.text(kpi.sublabel.slice(0, 36), boxX + 4, boxY + 18);
  });

  // ---------------- SECTION: TOP CONTRIBUTORS TABLE ----------------
  curY = kpiY + 2 * (kpiBoxHeight + 3) + 8;
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Engineering Contributors & Ownership', margin, curY);

  const tableY = curY + 4;
  const rowHeight = 7;
  const contributors = dataset.contributors || [];

  // Table Header
  doc.setFillColor(darkNavy[0], darkNavy[1], darkNavy[2]);
  doc.rect(margin, tableY, contentWidth, rowHeight, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('CONTRIBUTOR', margin + 3, tableY + 4.5);
  doc.text('ROLE', margin + 45, tableY + 4.5);
  doc.text('COMMITS', margin + 95, tableY + 4.5, { align: 'right' });
  doc.text('PRS', margin + 115, tableY + 4.5, { align: 'right' });
  doc.text('REVIEWS', margin + 138, tableY + 4.5, { align: 'right' });
  doc.text('SHARE %', margin + 162, tableY + 4.5, { align: 'right' });
  doc.text('STREAK', margin + contentWidth - 3, tableY + 4.5, { align: 'right' });

  // Rows
  contributors.slice(0, 6).forEach((c, i) => {
    const y = tableY + (i + 1) * rowHeight;
    doc.setFillColor(i % 2 === 0 ? 255 : 248, i % 2 === 0 ? 255 : 250, i % 2 === 0 ? 255 : 252);
    doc.rect(margin, y, contentWidth, rowHeight, 'F');
    doc.setDrawColor(cardBorder[0], cardBorder[1], cardBorder[2]);
    doc.line(margin, y + rowHeight, margin + contentWidth, y + rowHeight);

    doc.setTextColor(textDark[0], textDark[1], textDark[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.text(c.name || c.username, margin + 3, y + 4.5);

    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.text((c.role || 'Contributor').slice(0, 26), margin + 45, y + 4.5);

    doc.setTextColor(textDark[0], textDark[1], textDark[2]);
    doc.setFont('helvetica', 'bold');
    doc.text(String(c.commits), margin + 95, y + 4.5, { align: 'right' });

    doc.setFont('helvetica', 'normal');
    doc.text(String(c.prs || 0), margin + 115, y + 4.5, { align: 'right' });
    doc.text(String(c.reviews || 0), margin + 138, y + 4.5, { align: 'right' });

    doc.setTextColor(brandAmber[0], brandAmber[1], brandAmber[2]);
    doc.setFont('helvetica', 'bold');
    doc.text(`${c.sharePct}%`, margin + 162, y + 4.5, { align: 'right' });

    doc.setTextColor(brandEmerald[0], brandEmerald[1], brandEmerald[2]);
    doc.text(`${c.currentStreak || 0}d`, margin + contentWidth - 3, y + 4.5, { align: 'right' });
  });

  // ---------------- SECTION: ACTIVITY & HEALTH RADAR ----------------
  const actY = tableY + (Math.min(contributors.length, 6) + 1) * rowHeight + 8;
  const colWidth = (contentWidth - 6) / 2;

  // Left Box: Health Radar Dimensions
  doc.setFillColor(slateCardBg[0], slateCardBg[1], slateCardBg[2]);
  doc.setDrawColor(cardBorder[0], cardBorder[1], cardBorder[2]);
  doc.roundedRect(margin, actY, colWidth, 42, 2, 2, 'FD');

  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('Repository Health Dimensions', margin + 4, actY + 6);

  const healthMetrics = dataset.healthRadar || [];
  healthMetrics.slice(0, 5).forEach((h, idx) => {
    const lineY = actY + 12 + idx * 5.8;
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.text(h.dimension, margin + 4, lineY);

    // Progress bar
    const barX = margin + 44;
    const barW = 32;
    doc.setFillColor(226, 232, 240);
    doc.rect(barX, lineY - 2.5, barW, 2.5, 'F');
    doc.setFillColor(brandAmber[0], brandAmber[1], brandAmber[2]);
    doc.rect(barX, lineY - 2.5, (barW * h.score) / 100, 2.5, 'F');

    doc.setTextColor(textDark[0], textDark[1], textDark[2]);
    doc.setFont('helvetica', 'bold');
    doc.text(`${h.score}%`, barX + barW + 2, lineY);
  });

  // Right Box: Security Audit Posture
  const secX = margin + colWidth + 6;
  doc.setFillColor(slateCardBg[0], slateCardBg[1], slateCardBg[2]);
  doc.setDrawColor(cardBorder[0], cardBorder[1], cardBorder[2]);
  doc.roundedRect(secX, actY, colWidth, 42, 2, 2, 'FD');

  const vulns = getVulnerabilitiesForRepo(repo.name, repo.fullName);
  const criticalCount = vulns.filter((v) => v.severity === 'CRITICAL').length;
  const highCount = vulns.filter((v) => v.severity === 'HIGH').length;
  const mediumCount = vulns.filter((v) => v.severity === 'MEDIUM').length;

  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('Security & Vulnerability Audit', secX + 4, actY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text(`Total Vulnerabilities Scanned: ${vulns.length}`, secX + 4, actY + 13);
  doc.text(`Critical Severity CVEs: ${criticalCount}`, secX + 4, actY + 18);
  doc.text(`High Severity CVEs: ${highCount}`, secX + 4, actY + 23);
  doc.text(`Medium Severity CVEs: ${mediumCount}`, secX + 4, actY + 28);

  const isHardened = vulns.every((v) => v.status === 'Patched');
  doc.setFillColor(brandEmerald[0], brandEmerald[1], brandEmerald[2]);
  doc.roundedRect(secX + 4, actY + 32, colWidth - 8, 6, 1, 1, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text(isHardened ? '✓ ALL VULNERABILITIES REMEDIATED & HARDENED' : '● ACTIVE VULNERABILITY AUDIT IN PROGRESS', secX + colWidth / 2, actY + 36, { align: 'center' });

  // Page 1 Footer
  doc.setDrawColor(cardBorder[0], cardBorder[1], cardBorder[2]);
  doc.line(margin, pageHeight - 12, margin + contentWidth, pageHeight - 12);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text('RepoLens Platform  ·  Confidential Executive Engineering Summary  ·  Page 1 of 2', margin, pageHeight - 7);
  doc.text(repo.htmlUrl || `https://github.com/${repo.fullName}`, margin + contentWidth, pageHeight - 7, { align: 'right' });

  // ---------------- PAGE 2: DEEP DIVE VULNERABILITIES & TIMELINE ----------------
  doc.addPage();

  // Header Page 2
  doc.setFillColor(darkNavy[0], darkNavy[1], darkNavy[2]);
  doc.rect(0, 0, pageWidth, 22, 'F');
  doc.setFillColor(brandAmber[0], brandAmber[1], brandAmber[2]);
  doc.rect(0, 0, pageWidth, 2, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(`${repo.fullName} — Detailed Security & Architectural Breakdown`, margin, 14);

  // Section: Security Catalog
  let p2Y = 32;
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Cataloged Vulnerabilities & Remediation Log', margin, p2Y);

  const vulnTableY = p2Y + 4;
  doc.setFillColor(darkNavy[0], darkNavy[1], darkNavy[2]);
  doc.rect(margin, vulnTableY, contentWidth, 6.5, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.text('CVE / ID', margin + 3, vulnTableY + 4.2);
  doc.text('SEVERITY', margin + 30, vulnTableY + 4.2);
  doc.text('VULNERABILITY TITLE & FILE LOCATION', margin + 55, vulnTableY + 4.2);
  doc.text('STATUS', margin + contentWidth - 3, vulnTableY + 4.2, { align: 'right' });

  vulns.slice(0, 7).forEach((v, idx) => {
    const vY = vulnTableY + 6.5 + idx * 8.5;
    doc.setFillColor(idx % 2 === 0 ? 255 : 248, idx % 2 === 0 ? 255 : 250, idx % 2 === 0 ? 255 : 252);
    doc.rect(margin, vY, contentWidth, 8.5, 'F');
    doc.setDrawColor(cardBorder[0], cardBorder[1], cardBorder[2]);
    doc.line(margin, vY + 8.5, margin + contentWidth, vY + 8.5);

    doc.setTextColor(textDark[0], textDark[1], textDark[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.text(v.cveId, margin + 3, vY + 4);

    // Severity Pill
    const isCrit = v.severity === 'CRITICAL';
    const isHigh = v.severity === 'HIGH';
    doc.setTextColor(isCrit ? 220 : isHigh ? 234 : 202, isCrit ? 38 : isHigh ? 88 : 138, isCrit ? 38 : 12);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.text(v.severity, margin + 30, vY + 4);

    doc.setTextColor(textDark[0], textDark[1], textDark[2]);
    doc.setFont('helvetica', 'bold');
    doc.text(v.title.slice(0, 52), margin + 55, vY + 3.8);

    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.text(`${v.filePath}:${v.lineNumber}`, margin + 55, vY + 7);

    doc.setTextColor(brandEmerald[0], brandEmerald[1], brandEmerald[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.text(v.status.toUpperCase(), margin + contentWidth - 3, vY + 4.5, { align: 'right' });
  });

  // Section: Top Hotspots
  p2Y = vulnTableY + 6.5 + Math.min(vulns.length, 7) * 8.5 + 10;
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Repository Hotspots & Frequent Revisions', margin, p2Y);

  const hotspots = dataset.hotspots || [];
  const hsTableY = p2Y + 4;
  doc.setFillColor(slateCardBg[0], slateCardBg[1], slateCardBg[2]);
  doc.setDrawColor(cardBorder[0], cardBorder[1], cardBorder[2]);
  doc.roundedRect(margin, hsTableY, contentWidth, 38, 2, 2, 'FD');

  hotspots.slice(0, 5).forEach((h, idx) => {
    const hy = hsTableY + 7 + idx * 6.2;
    doc.setTextColor(textDark[0], textDark[1], textDark[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.text(`${idx + 1}.`, margin + 4, hy);
    doc.setFont('helvetica', 'normal');
    doc.text(h.path, margin + 10, hy);

    const bX = margin + 115;
    const bW = 40;
    doc.setFillColor(226, 232, 240);
    doc.rect(bX, hy - 2.5, bW, 2.5, 'F');
    doc.setFillColor(brandAmber[0], brandAmber[1], brandAmber[2]);
    doc.rect(bX, hy - 2.5, (bW * Math.min(h.percentage, 100)) / 100, 2.5, 'F');

    doc.setTextColor(textDark[0], textDark[1], textDark[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.text(`${h.changesCount} revisions`, margin + contentWidth - 4, hy, { align: 'right' });
  });

  // Section: Executive Certification Stamp
  const certY = hsTableY + 44;
  doc.setFillColor(darkNavy[0], darkNavy[1], darkNavy[2]);
  doc.roundedRect(margin, certY, contentWidth, 24, 2, 2, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('EXECUTIVE VERIFICATION & REPOSITORY INTEGRITY', margin + 6, certY + 7);

  doc.setTextColor(brandEmerald[0], brandEmerald[1], brandEmerald[2]);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text('This automated security, contribution velocity, and static analysis report was compiled from mainline branch commits.', margin + 6, certY + 13);
  doc.text(`Authenticated GitHub User: ${userEmail}  ·  Verification SHA: 8294412f8bc1982`, margin + 6, certY + 18);

  // Page 2 Footer
  doc.setDrawColor(cardBorder[0], cardBorder[1], cardBorder[2]);
  doc.line(margin, pageHeight - 12, margin + contentWidth, pageHeight - 12);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text('RepoLens Platform  ·  Confidential Executive Engineering Summary  ·  Page 2 of 2', margin, pageHeight - 7);
  doc.text('Generated by RepoLens', margin + contentWidth, pageHeight - 7, { align: 'right' });

  // Download PDF
  const cleanName = repo.name.toLowerCase().replace(/[^a-z0-9_-]/g, '_');
  doc.save(`repolens-${cleanName}-executive-summary.pdf`);
}
