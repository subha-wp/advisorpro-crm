import type { ClientReportData } from "./client-report"
import { format } from "date-fns"

export function generateClientReportHTML(data: ClientReportData): string {
  const reportDate = format(new Date(), "dd MMMM yyyy")
  const reportTime = format(new Date(), "HH:mm")

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Client Report - ${data.client.name}</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.5;
            color: #1a202c;
            background: #ffffff;
            font-size: 14px;
        }
        
        .container {
            max-width: 210mm;
            margin: 0 auto;
            padding: 30px;
            background: white;
        }
        
        .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 40px;
            padding-bottom: 25px;
            border-bottom: 4px solid #2563eb;
            position: relative;
        }
        
        .header::after {
            content: '';
            position: absolute;
            bottom: -4px;
            left: 0;
            width: 100px;
            height: 4px;
            background: linear-gradient(90deg, #3b82f6, #1d4ed8);
        }
        
        .company-info {
            flex: 1;
        }
        
        .company-logo {
            width: 100px;
            height: 100px;
            object-fit: contain;
            margin-bottom: 15px;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        
        .company-name {
            font-size: 32px;
            font-weight: 700;
            color: #1e40af;
            margin-bottom: 8px;
            letter-spacing: -0.5px;
        }
        
        .company-details {
            font-size: 13px;
            color: #64748b;
            line-height: 1.6;
        }
        
        .report-info {
            text-align: right;
            font-size: 13px;
            color: #64748b;
            background: #f8fafc;
            padding: 20px;
            border-radius: 12px;
            border: 1px solid #e2e8f0;
        }
        
        .report-info strong {
            color: #1e40af;
            display: block;
            margin-bottom: 4px;
        }
        
        .report-title {
            font-size: 36px;
            font-weight: 800;
            text-align: center;
            margin: 40px 0;
            color: #1e40af;
            text-transform: uppercase;
            letter-spacing: 2px;
            position: relative;
        }
        
        .report-title::after {
            content: '';
            position: absolute;
            bottom: -10px;
            left: 50%;
            transform: translateX(-50%);
            width: 120px;
            height: 4px;
            background: linear-gradient(90deg, #0ea5e9, #6366f1);
            border-radius: 2px;
        }
        
        .section {
            margin-bottom: 35px;
            break-inside: avoid;
            background: #ffffff;
            border-radius: 12px;
            padding: 25px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            border: 1px solid #e2e8f0;
        }
        .detail-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
            gap: 16px;
        }
        .detail-card {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            padding: 16px 18px;
        }
        .detail-card .kv {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 16px;
        }
        .detail-card .kv .k {
            font-size: 12px;
            color: #64748b;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.4px;
        }
        .detail-card .kv .v {
            font-size: 14px;
            color: #111827;
            font-weight: 700;
        }
        .badge {
            display: inline-block;
            padding: 6px 10px;
            border-radius: 9999px;
            font-size: 12px;
            font-weight: 700;
            background: #eef2ff;
            color: #3730a3;
            border: 1px solid #c7d2fe;
        }
        .policy-cards {
            display: grid;
            grid-template-columns: 1fr;
            gap: 16px;
        }
        .policy-card {
            border: 1px solid #e5e7eb;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 1px 3px rgba(0,0,0,0.06);
        }
        .policy-card .header {
            display: flex;
            justify-content: space-between;
            padding: 14px 18px;
            background: linear-gradient(90deg, #eef2ff, #eff6ff);
            border-bottom: 1px solid #e5e7eb;
        }
        .policy-card .header .title {
            font-weight: 800;
            color: #1e40af;
        }
        .policy-card .body {
            padding: 16px 18px;
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
            gap: 14px;
        }
        .kv-item { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 10px; padding: 12px 14px; }
        .kv-item .k { font-size: 11px; color: #6b7280; font-weight: 700; letter-spacing: 0.3px; text-transform: uppercase; }
        .kv-item .v { font-size: 14px; color: #111827; font-weight: 700; margin-top: 4px; }
        .riders { grid-column: 1 / -1; background: #fff7ed; border: 1px solid #fed7aa; border-radius: 10px; padding: 12px 14px; }
        .riders .label { font-size: 12px; font-weight: 800; color: #9a3412; text-transform: uppercase; letter-spacing: 0.4px; }
        .riders .list { margin-top: 8px; display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 8px; }
        .rider { background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 8px 10px; font-size: 12px; color: #92400e; }
        
        .section-title {
            font-size: 22px;
            font-weight: 700;
            color: #1e40af;
            margin-bottom: 20px;
            padding-bottom: 8px;
            border-bottom: 3px solid #e5e7eb;
            display: flex;
            align-items: center;
            gap: 12px;
        }
        
        .section-icon {
            width: 24px;
            height: 24px;
            fill: currentColor;
        }
        
        .info-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 18px;
            margin-bottom: 25px;
        }
        
        .info-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 15px 18px;
            background: #f8fafc;
            border-radius: 10px;
            border-left: 5px solid #2563eb;
            transition: all 0.2s ease;
        }
        
        .info-item:hover {
            background: #f1f5f9;
            transform: translateY(-1px);
        }
        
        .info-label {
            font-weight: 600;
            color: #374151;
            font-size: 14px;
        }
        
        .info-value {
            color: #1f2937;
            font-weight: 600;
            font-size: 14px;
        }
        
        .table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 25px;
            font-size: 13px;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        
        .table th {
            background: linear-gradient(135deg, #1e40af, #3b82f6);
            color: white;
            padding: 16px 12px;
            text-align: left;
            font-weight: 700;
            font-size: 13px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .table td {
            padding: 14px 12px;
            border-bottom: 1px solid #e5e7eb;
            vertical-align: middle;
        }
        .table .meta { color: #6b7280; font-size: 11px; font-weight: 600; }
        
        .table tr:nth-child(even) {
            background: #f8fafc;
        }
        
        .table tr:hover {
            background: #f1f5f9;
        }
        
        .status-badge {
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .status-active { background: #dcfce7; color: #166534; }
        .status-lapsed { background: #fee2e2; color: #dc2626; }
        .status-matured { background: #dbeafe; color: #2563eb; }
        .status-surrendered { background: #f3f4f6; color: #6b7280; }
        
        .priority-urgent { background: #fee2e2; color: #dc2626; }
        .priority-high { background: #fef3c7; color: #d97706; }
        .priority-medium { background: #dbeafe; color: #2563eb; }
        .priority-low { background: #f0f9ff; color: #0369a1; }
        
        .chart-container {
            margin: 25px 0;
            padding: 30px;
            background: linear-gradient(135deg, #f9fafb, #f3f4f6);
            border-radius: 16px;
            border: 1px solid #e2e8f0;
            box-shadow: 0 4px 12px rgba(0,0,0,0.08);
        }

        .chart-container h3 {
            font-size: 18px;
            font-weight: 700;
            color: #1e40af;
            margin-bottom: 20px;
            text-align: center;
            letter-spacing: -0.5px;
        }

        .chart-wrapper {
            position: relative;
            width: 100%;
            height: 400px;
            max-width: 100%;
            margin: 0 auto;
            background: white;
            border-radius: 12px;
            padding: 15px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.06);
        }

        .chart-canvas {
            position: absolute !important;
            top: 15px !important;
            left: 15px !important;
            width: calc(100% - 30px) !important;
            height: calc(100% - 30px) !important;
        }
        
        .summary-cards {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
            gap: 20px;
            margin-bottom: 40px;
        }
        
        .summary-card {
            color: white;
            padding: 25px;
            border-radius: 16px;
            text-align: center;
            box-shadow: 0 6px 16px rgba(0,0,0,0.12);
            position: relative;
            overflow: hidden;
        }

        /* Corporate gradient variants */
        .summary-card.policies {
            background: linear-gradient(135deg, #0ea5e9 0%, #0369a1 100%);
        }
        .summary-card.coverage {
            background: linear-gradient(135deg, #10b981 0%, #047857 100%);
        }
        .summary-card.premium {
            background: linear-gradient(135deg, #f59e0b 0%, #b45309 100%);
        }
        .summary-card.paid {
            background: linear-gradient(135deg, #6366f1 0%, #4338ca 100%);
        }
        
        .summary-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 4px;
            background: rgba(255,255,255,0.35);
        }
        
        .summary-card h3 {
            font-size: 16px;
            opacity: 0.95;
            margin-bottom: 12px;
            font-weight: 600;
        }
        
        .summary-card .value {
            font-size: 32px;
            font-weight: 800;
            margin-bottom: 8px;
            text-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .summary-card .subtitle {
            font-size: 13px;
            opacity: 0.85;
            font-weight: 500;
        }
        
        .footer {
            margin-top: 50px;
            padding-top: 30px;
            border-top: 3px solid #e5e7eb;
            text-align: center;
            font-size: 12px;
            color: #6b7280;
            background: linear-gradient(180deg, #f8fafc 0%, #ffffff 60%);
            border-radius: 12px;
            padding: 30px;
        }
        
        .footer p {
            margin-bottom: 8px;
        }
        
        .footer strong {
            color: #1e40af;
        }
        
        .page-break {
            page-break-before: always;
        }
        
        .family-tree {
            display: flex;
            flex-wrap: wrap;
            gap: 15px;
            margin-top: 20px;
        }
        
        .family-member {
            background: #f1f5f9;
            border: 2px solid #cbd5e1;
            border-radius: 12px;
            padding: 18px;
            min-width: 220px;
            text-align: center;
            transition: all 0.2s ease;
        }
        
        .family-member:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        
        .family-member.head {
            background: #dbeafe;
            border-color: #2563eb;
        }
        
        .family-member-name {
            font-weight: 700;
            color: #1e40af;
            margin-bottom: 6px;
            font-size: 16px;
        }
        
        .family-member-relation {
            font-size: 12px;
            color: #64748b;
            margin-bottom: 12px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            font-weight: 600;
        }
        
        .family-member-details {
            font-size: 12px;
            color: #475569;
            line-height: 1.4;
        }
        
        .watermark {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(-45deg);
            font-size: 120px;
            color: rgba(37, 99, 235, 0.05);
            font-weight: 900;
            z-index: -1;
            pointer-events: none;
        }

        /* Responsive adjustments */
        @media (max-width: 768px) {
            .chart-container {
                padding: 20px 15px;
                margin: 20px 0;
            }
            
            .chart-wrapper {
                height: 300px;
                padding: 10px;
            }
            
            .chart-canvas {
                top: 10px !important;
                left: 10px !important;
                width: calc(100% - 20px) !important;
                height: calc(100% - 20px) !important;
            }
            
            .chart-container h3 {
                font-size: 16px;
                margin-bottom: 15px;
            }
        }
        
        @media print {
            .container {
                max-width: none;
                margin: 0;
                padding: 20px;
            }
            
            .chart-container {
                break-inside: avoid;
                box-shadow: none;
                border: 1px solid #e2e8f0;
                page-break-inside: avoid;
            }
            
            .chart-wrapper {
                box-shadow: none;
                height: 350px;
            }
            
            .section {
                break-inside: avoid;
                box-shadow: none;
                border: 1px solid #e2e8f0;
            }
            
            .summary-card {
                box-shadow: none;
                border: 1px solid #e2e8f0;
            }
        }
    </style>
</head>
<body>
    <div class="watermark">CONFIDENTIAL</div>
    <div class="container">
        <!-- Header -->
        <div class="header">
            <div class="company-info">
                ${data.workspace.logoUrl ? `<img src="${data.workspace.logoUrl}" alt="Company Logo" class="company-logo">` : ""}
                <div class="company-name">${data.workspace.name}</div>
                <div class="company-details">
                    ${data.workspace.officeAddressFull ? `<div><strong>Address:</strong> ${data.workspace.officeAddressFull}</div>` : ""}
                    ${data.workspace.officePhone ? `<div><strong>Phone:</strong> ${data.workspace.officePhone}</div>` : ""}
                    ${data.workspace.officeEmail ? `<div><strong>Email:</strong> ${data.workspace.officeEmail}</div>` : ""}
                    ${data.workspace.websiteUrl ? `<div><strong>Website:</strong> ${data.workspace.websiteUrl}</div>` : ""}
                    ${data.workspace.gstNumber ? `<div><strong>GST:</strong> ${data.workspace.gstNumber}</div>` : ""}
                    ${data.workspace.businessRegistration ? `<div><strong>Registration:</strong> ${data.workspace.businessRegistration}</div>` : ""}
                </div>
            </div>
            <div class="report-info">
                <div><strong>Report Generated</strong></div>
                <div>${reportDate}</div>
                <div>${reportTime}</div>
                <div style="margin-top: 15px;"><strong>Report Type</strong></div>
                <div>Comprehensive Client Analysis</div>
                <div style="margin-top: 15px;"><strong>Confidentiality</strong></div>
                <div>Internal Use Only</div>
            </div>
        </div>

        <!-- Report Title -->
        <h1 class="report-title">Client Portfolio Report</h1>

        <!-- Summary Cards -->
        <div class="summary-cards">
            <div class="summary-card policies">
                <h3>Total Policies</h3>
                <div class="value">${data.analytics.totalPolicies}</div>
                <div class="subtitle">${data.analytics.activePolicies} Active Policies</div>
            </div>
            <div class="summary-card coverage">
                <h3>Total Coverage</h3>
                <div class="value">₹${(data.analytics.totalSumAssured / 100000).toFixed(1)}L</div>
                <div class="subtitle">Sum Assured</div>
            </div>
            <div class="summary-card premium">
                <h3>Annual Premium</h3>
                <div class="value">₹${(data.analytics.totalAnnualPremium / 1000).toFixed(0)}K</div>
                <div class="subtitle">Per Year</div>
            </div>
            <div class="summary-card paid">
                <h3>Premiums Paid</h3>
                <div class="value">₹${(data.analytics.totalPremiumsPaid / 1000).toFixed(0)}K</div>
                <div class="subtitle">Total Collected</div>
            </div>
        </div>

        <!-- Client Information -->
        <div class="section">
            <h2 class="section-title">
                <svg class="section-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                </svg>
                Client Information
            </h2>
            <div class="detail-grid">
                <div class="detail-card">
                    <div class="kv"><span class="k">Full Name</span><span class="v">${data.client.name}</span></div>
                </div>
                ${data.client.relationshipToHead ? `<div class="detail-card"><div class="kv"><span class="k">Relationship</span><span class="v">${data.client.relationshipToHead}</span></div></div>` : ""}
                ${data.client.dob ? `<div class="detail-card"><div class="kv"><span class="k">Date of Birth</span><span class="v">${format(data.client.dob, "dd MMMM yyyy")}</span></div></div>` : ""}
                ${data.client.mobile ? `<div class="detail-card"><div class="kv"><span class="k">Mobile</span><span class="v">${data.client.mobile}</span></div></div>` : ""}
                ${data.client.email ? `<div class="detail-card"><div class="kv"><span class="k">Email</span><span class="v">${data.client.email}</span></div></div>` : ""}
                ${data.client.address ? `<div class="detail-card" style="grid-column: 1 / -1;"><div class="kv"><span class="k">Address</span><span class="v">${data.client.address}</span></div></div>` : ""}
                ${data.client.panNo ? `<div class="detail-card"><div class="kv"><span class="k">PAN</span><span class="v">${data.client.panNo}</span></div></div>` : ""}
                ${data.client.aadhaarNo ? `<div class="detail-card"><div class="kv"><span class="k">Aadhaar</span><span class="v">**** **** ${data.client.aadhaarNo.slice(-4)}</span></div></div>` : ""}
                <div class="detail-card"><div class="kv"><span class="k">Client Since</span><span class="v">${format(data.client.createdAt, "dd MMMM yyyy")}</span></div></div>
                ${data.client.tags.length > 0 ? `<div class="detail-card" style="grid-column: 1 / -1;"><div class="kv"><span class="k">Tags</span><span class="v">${data.client.tags.map(t => `<span class=\"badge\">${t}</span>`).join(" ")}</span></div></div>` : ""}
            </div>
        </div>

        ${
          data.clientGroup
            ? `
        <!-- Family Information -->
        <div class="section">
            <h2 class="section-title">
                <svg class="section-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
                Family Group: ${data.clientGroup.name}
            </h2>
            <div class="family-tree">
                ${data.clientGroup.members
                  .map(
                    (member) => `
                <div class="family-member ${member.relationshipToHead === "Head" ? "head" : ""}">
                    <div class="family-member-name">${member.name}</div>
                    ${member.relationshipToHead ? `<div class="family-member-relation">${member.relationshipToHead}</div>` : ""}
                    <div class="family-member-details">
                        ${member.dob ? `<strong>DOB:</strong> ${format(member.dob, "dd/MM/yyyy")}<br>` : ""}
                        ${member.mobile ? `<strong>Mobile:</strong> ${member.mobile}<br>` : ""}
                        ${member.panNo ? `<strong>PAN:</strong> ${member.panNo}` : ""}
                    </div>
                </div>
                `,
                  )
                  .join("")}
            </div>
        </div>
        `
            : ""
        }

        <!-- Portfolio Analytics -->
        <div class="section">
            <h2 class="section-title">
                <svg class="section-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M3 3v18h18"></path>
                    <path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3"></path>
                </svg>
                Portfolio Analytics
            </h2>
            
            <div class="chart-container">
                <h3>Policy Distribution by Insurer</h3>
                <div class="chart-wrapper">
                    <canvas id="insurerChart" class="chart-canvas"></canvas>
                </div>
            </div>

            <div class="chart-container">
                <h3>Premium Payment Trend (Last 12 Months)</h3>
                <div class="chart-wrapper">
                    <canvas id="premiumTrendChart" class="chart-canvas"></canvas>
                </div>
            </div>
        </div>

        <!-- Policy Details -->
        <div class="section page-break">
            <h2 class="section-title">
                <svg class="section-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14,2 14,8 20,8"></polyline>
                    <line x1="16" y1="13" x2="8" y2="13"></line>
                    <line x1="16" y1="17" x2="8" y2="17"></line>
                    <polyline points="10,9 9,9 8,9"></polyline>
                </svg>
                Policy Portfolio (${data.policies.length} Policies)
            </h2>
            
            ${
              data.policies.length === 0
                ? `
            <div style="text-align: center; padding: 60px; color: #6b7280; background: #f8fafc; border-radius: 12px;">
                <p style="font-size: 18px; font-weight: 600;">No policies found for this client.</p>
                <p style="margin-top: 8px;">Contact your advisor to add policies to this account.</p>
            </div>
            `
                : `
            <table class="table">
                <thead>
                    <tr>
                        <th>Policy Number</th>
                        <th>Insurer</th>
                        <th>Plan</th>
                        <th>Sum Assured</th>
                        <th>Premium</th>
                        <th>Next Due</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.policies
                      .map(
                        (policy) => `
                    <tr>
                        <td><strong>${policy.policyNumber}</strong></td>
                        <td>${policy.insurer}</td>
                        <td>${policy.planName || "-"}</td>
                        <td>${policy.sumAssured ? `₹${policy.sumAssured.toLocaleString()}` : "-"}</td>
                        <td>${policy.premiumAmount ? `₹${policy.premiumAmount.toLocaleString()}` : "-"}</td>
                        <td>${policy.nextDueDate ? format(new Date(policy.nextDueDate), "dd/MM/yyyy") : "-"}</td>
                        <td><span class="status-badge status-${policy.status.toLowerCase()}">${policy.status}</span></td>
                    </tr>
                    `,
                      )
                      .join("")}
                </tbody>
            </table>

            <div class="policy-cards">
              ${data.policies.map(p => `
                <div class=\"policy-card\">
                  <div class=\"header\">
                    <div class=\"title\">${p.policyNumber} • ${p.insurer}</div>
                    <div><span class=\"status-badge status-${p.status.toLowerCase()}\">${p.status}</span></div>
                  </div>
                  <div class=\"body\">
                    <div class=\"kv-item\"><div class=\"k\">Plan</div><div class=\"v\">${p.planName || "-"}</div></div>
                    <div class=\"kv-item\"><div class=\"k\">Type</div><div class=\"v\">${p.policyType || "-"}</div></div>
                    <div class=\"kv-item\"><div class=\"k\">Sum Assured</div><div class=\"v\">${p.sumAssured ? `₹${p.sumAssured.toLocaleString()}` : "-"}</div></div>
                    <div class=\"kv-item\"><div class=\"k\">Premium</div><div class=\"v\">${p.premiumAmount ? `₹${p.premiumAmount.toLocaleString()}` : "-"}${p.premiumMode ? ` / ${p.premiumMode}` : ""}</div></div>
                    <div class=\"kv-item\"><div class=\"k\">Commencement</div><div class=\"v\">${p.commencementDate ? format(p.commencementDate, "dd/MM/yyyy") : "-"}</div></div>
                    <div class=\"kv-item\"><div class=\"k\">Maturity</div><div class=\"v\">${p.maturityDate ? format(p.maturityDate, "dd/MM/yyyy") : "-"}</div></div>
                    <div class=\"kv-item\"><div class=\"k\">Last Paid</div><div class=\"v\">${p.lastPaidDate ? format(p.lastPaidDate, "dd/MM/yyyy") : "-"}</div></div>
                    <div class=\"kv-item\"><div class=\"k\">Next Due</div><div class=\"v\">${p.nextDueDate ? format(p.nextDueDate, "dd/MM/yyyy") : "-"}</div></div>
                    ${p.riders && p.riders.length > 0 ? `
                      <div class=\"riders\">
                        <div class=\"label\">Riders</div>
                        <div class=\"list\">
                          ${p.riders.map(r => `<div class=\\"rider\\">${r.name}${r.sumAssured ? ` • SA: ₹${r.sumAssured.toLocaleString()}` : ""}${r.premium ? ` • Premium: ₹${r.premium.toLocaleString()}` : ""}</div>`).join("")}
                        </div>
                      </div>
                    ` : ""}
                  </div>
                </div>
              `).join("")}
            </div>
            `
            }
        </div>

        <!-- Recent Premium Payments -->
        ${
          data.premiumPayments.length > 0
            ? `
        <div class="section">
            <h2 class="section-title">
                <svg class="section-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 2v20m8-10H4"></path>
                </svg>
                Premium Payment History
            </h2>
            <table class="table">
                <thead>
                    <tr>
                        <th>Payment Date</th>
                        <th>Policy</th>
                        <th>Amount</th>
                        <th>Mode</th>
                        <th>Receipt</th>
                        <th>Txn / Bank</th>
                        <th>Adjustments</th>
                        <th>Remarks</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.premiumPayments
                      .sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime())
                      .map((payment) => {
                        const policy = data.policies.find((p) => p.id === payment.policyId)
                        const adjustments = [
                          payment.lateFee ? `Late Fee: ₹${payment.lateFee.toLocaleString()}` : "",
                          payment.discount ? `Discount: ₹${payment.discount.toLocaleString()}` : ""
                        ].filter(Boolean).join(" | ")
                        const txnBank = payment.transactionId
                          ? `Txn: ${payment.transactionId}`
                          : payment.bankName
                          ? `${payment.bankName}${payment.chequeNumber ? ` / Chq: ${payment.chequeNumber}` : ""}`
                          : "-"
                        return `
                        <tr>
                            <td>${format(payment.paymentDate, "dd/MM/yyyy")}</td>
                            <td>${policy?.policyNumber || "Unknown"}</td>
                            <td><strong>₹${payment.amountPaid.toLocaleString()}</strong></td>
                            <td>${payment.paymentMode}</td>
                            <td>${payment.receiptNumber || "-"}</td>
                            <td class="meta">${txnBank}</td>
                            <td class="meta">${adjustments || "-"}</td>
                            <td class="meta">${payment.remarks || "-"}</td>
                        </tr>
                        `
                      })
                      .join("")}
                </tbody>
            </table>
        </div>
        `
            : ""
        }

        <!-- Recent Activities -->
        ${
          data.tasks.length > 0
            ? `
        <div class="section">
            <h2 class="section-title">
                <svg class="section-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M9 12l2 2 4-4"></path>
                    <path d="M21 12c-1 0-3-1-3-3s2-3 3-3 3 1 3 3-2 3-3 3"></path>
                    <path d="M3 12c1 0 3-1 3-3s-2-3-3-3-3 1-3 3 2 3 3 3"></path>
                    <path d="M12 3c0 1-1 3-3 3s-3-2-3-3 1-3 3-3 3 2 3 3"></path>
                    <path d="M12 21c0-1 1-3 3-3s3 2 3 3-1 3-3 3-3-2-3-3"></path>
                </svg>
                Recent Activities (Last 10)
            </h2>
            <table class="table">
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Activity</th>
                        <th>Type</th>
                        <th>Priority</th>
                        <th>Status</th>
                        <th>Assigned To</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.tasks
                      .slice(0, 10)
                      .map(
                        (task) => `
                    <tr>
                        <td>${format(task.createdAt, "dd/MM/yyyy")}</td>
                        <td>${task.title}</td>
                        <td>${task.type.replace(/_/g, " ")}</td>
                        <td><span class="status-badge priority-${task.priority.toLowerCase()}">${task.priority}</span></td>
                        <td><span class="status-badge status-${task.status.toLowerCase()}">${task.status}</span></td>
                        <td>${task.assignedTo?.name || "Unassigned"}</td>
                    </tr>
                    `,
                      )
                      .join("")}
                </tbody>
            </table>
        </div>
        `
            : ""
        }

        <!-- Footer -->
        <div class="footer">
            <p><strong>This report is confidential and generated for internal use only.</strong></p>
            <p>Generated by ${data.workspace.name} CRM System • ${reportDate} at ${reportTime}</p>
            <p>© ${new Date().getFullYear()} ${data.workspace.name} • All rights reserved</p>
            <p style="margin-top: 15px; font-size: 11px;">This document contains sensitive financial information. Please handle with appropriate care and dispose of securely when no longer needed.</p>
        </div>
    </div>

    <script>
        // Enhanced Chart.js configuration
        Chart.defaults.font.family = "'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif";
        Chart.defaults.font.size = 12;
        Chart.defaults.color = '#374151';

        // Wait for DOM to be fully loaded
        document.addEventListener('DOMContentLoaded', function() {
            // Insurer Distribution Chart
            const insurerData = ${JSON.stringify(data.analytics.insurerBreakdown)};
            const insurerLabels = Object.keys(insurerData);
            const insurerValues = Object.values(insurerData);
            
            if (insurerLabels.length > 0) {
                const ctx1 = document.getElementById('insurerChart');
                if (ctx1) {
                    new Chart(ctx1, {
                        type: 'doughnut',
                        data: {
                            labels: insurerLabels,
                            datasets: [{
                                data: insurerValues,
                                backgroundColor: [
                                    '#3b82f6', '#ef4444', '#10b981', '#f59e0b', 
                                    '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16',
                                    '#f97316', '#06b6d4'
                                ],
                                borderWidth: 2,
                                borderColor: '#fff',
                                hoverBorderWidth: 3
                            }]
                        },
                        options: {
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                                legend: {
                                    position: 'bottom',
                                    labels: {
                                        padding: 20,
                                        usePointStyle: true,
                                        pointStyle: 'circle',
                                        font: {
                                            size: 11,
                                            weight: '600'
                                        }
                                    }
                                },
                                tooltip: {
                                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                                    titleFont: {
                                        size: 12,
                                        weight: '600'
                                    },
                                    bodyFont: {
                                        size: 11
                                    },
                                    cornerRadius: 8,
                                    callbacks: {
                                        label: function(context) {
                                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                            const percentage = ((context.parsed * 100) / total).toFixed(1);
                                            return context.label + ': ' + context.parsed + ' (' + percentage + '%)';
                                        }
                                    }
                                }
                            },
                            animation: {
                                animateRotate: true,
                                duration: 1000
                            }
                        }
                    });
                }
            }

            // Premium Trend Chart
            const trendData = ${JSON.stringify(data.analytics.monthlyPremiumTrend)};
            
            if (trendData.length > 0) {
                const ctx2 = document.getElementById('premiumTrendChart');
                if (ctx2) {
                    new Chart(ctx2, {
                        type: 'line',
                        data: {
                            labels: trendData.map(d => d.month),
                            datasets: [{
                                label: 'Premium Payments',
                                data: trendData.map(d => d.amount),
                                borderColor: '#3b82f6',
                                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                                borderWidth: 3,
                                fill: true,
                                tension: 0.4,
                                pointBackgroundColor: '#3b82f6',
                                pointBorderColor: '#fff',
                                pointBorderWidth: 2,
                                pointRadius: 6,
                                pointHoverRadius: 8,
                                pointHoverBorderWidth: 3
                            }]
                        },
                        options: {
                            responsive: true,
                            maintainAspectRatio: false,
                            interaction: {
                                intersect: false,
                                mode: 'index'
                            },
                            plugins: {
                                legend: {
                                    display: false
                                },
                                tooltip: {
                                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                                    titleFont: {
                                        size: 12,
                                        weight: '600'
                                    },
                                    bodyFont: {
                                        size: 11
                                    },
                                    cornerRadius: 8,
                                    callbacks: {
                                        label: function(context) {
                                            return 'Amount: ₹' + context.parsed.y.toLocaleString();
                                        }
                                    }
                                }
                            },
                            scales: {
                                y: {
                                    beginAtZero: true,
                                    ticks: {
                                        callback: function(value) {
                                            return '₹' + (value / 1000).toFixed(0) + 'K';
                                        },
                                        font: {
                                            size: 10,
                                            weight: '500'
                                        },
                                        color: '#6b7280',
                                        maxTicksLimit: 8
                                    },
                                    grid: {
                                        color: 'rgba(0, 0, 0, 0.08)',
                                        borderDash: [5, 5]
                                    },
                                    border: {
                                        display: false
                                    }
                                },
                                x: {
                                    grid: {
                                        display: false
                                    },
                                    ticks: {
                                        font: {
                                            size: 10,
                                            weight: '500'
                                        },
                                        color: '#6b7280',
                                        maxTicksLimit: 6
                                    },
                                    border: {
                                        display: false
                                    }
                                }
                            },
                            animation: {
                                duration: 1000,
                                easing: 'easeInOutCubic'
                            }
                        }
                    });
                }
            }
        });
    </script>
</body>
</html>
  `
}