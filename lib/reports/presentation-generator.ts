import { format } from "date-fns"
import { getPrisma } from "@/lib/db"

type PresentationPayload = {
  presentationTitle?: string
  clientId?: string
  selectedPolicies?: string[]
  customSections?: Array<{ title: string; html?: string; markdown?: string }>
  images?: Array<{ url: string; caption?: string }>
  mixPlans?: Array<{ insurer?: string; planName?: string; policyType?: string; sumAssured?: number; premium?: number; metadata?: Record<string, any> }>
  licProposal?: {
    prospectName?: string
    prospectAge?: number
    prospectPan?: string
    planName: string
    sumAssured?: number
    termYears?: number
    pptYears?: number
    premiumMode?: string
    firstYearPremium?: number
    subseqYearPremium?: number
    annualBonus?: number
    fabPerThousand?: number
    taxSaved?: number
  }
}

export async function generatePresentationHTML({
  workspaceId,
  userId,
  payload,
}: {
  workspaceId: string
  userId: string
  payload: PresentationPayload
}): Promise<string> {
  const prisma = await getPrisma()

  const [workspace, client, policies] = await Promise.all([
    prisma.workspace.findUnique({ where: { id: workspaceId }, select: { name: true, logoUrl: true, websiteUrl: true, officePhone: true, officeEmail: true } }),
    payload.clientId
      ? prisma.client.findFirst({ where: { id: payload.clientId, workspaceId }, select: { id: true, name: true, email: true, mobile: true } })
      : Promise.resolve(null),
    payload.selectedPolicies?.length
      ? prisma.policy.findMany({ where: { id: { in: payload.selectedPolicies }, client: { workspaceId } }, include: { policyRiders: true } })
      : Promise.resolve([]),
  ])

  const title = payload.presentationTitle || (client ? `${client.name} - Insurance Presentation` : "Insurance Presentation")
  const date = format(new Date(), "dd MMM yyyy")

  const policyCards = policies
    .map((p) => {
      const riders = p.policyRiders?.map((r) => `<span class="rider">${r.riderName}</span>`).join("") || ""
      return `
      <div class="policy-card">
        <div class="header">
          <div class="title">${p.insurer} ${p.planName ? `- ${p.planName}` : ""}</div>
          <div class="badge">${p.status}</div>
        </div>
        <div class="body">
          <div class="kv-item"><div class="k">Policy No</div><div class="v">${p.policyNumber}</div></div>
          ${p.sumAssured ? `<div class="kv-item"><div class="k">Sum Assured</div><div class="v">₹ ${Number(p.sumAssured)}</div></div>` : ""}
          ${p.premiumAmount ? `<div class="kv-item"><div class="k">Premium</div><div class="v">₹ ${Number(p.premiumAmount)} / ${p.premiumMode || ""}</div></div>` : ""}
          ${riders ? `<div class="riders"><div class="label">Riders</div><div class="list">${riders}</div></div>` : ""}
        </div>
      </div>`
    })
    .join("")

  const mixPlanCards = (payload.mixPlans || [])
    .map((m) => `
      <div class="policy-card">
        <div class="header">
          <div class="title">${m.insurer || "Custom"} ${m.planName ? `- ${m.planName}` : ""}</div>
          <div class="badge">Proposed</div>
        </div>
        <div class="body">
          ${m.policyType ? `<div class="kv-item"><div class="k">Type</div><div class="v">${m.policyType}</div></div>` : ""}
          ${m.sumAssured ? `<div class="kv-item"><div class="k">Sum Assured</div><div class="v">₹ ${m.sumAssured}</div></div>` : ""}
          ${m.premium ? `<div class="kv-item"><div class="k">Premium</div><div class="v">₹ ${m.premium}</div></div>` : ""}
        </div>
      </div>
    `)
    .join("")

  const customSections = (payload.customSections || [])
    .map((s) => `
      <div class="section">
        <h2 class="section-title">${s.title}</h2>
        ${s.html || ""}
      </div>
    `)
    .join("")

  const images = (payload.images || [])
    .map((img) => `
      <figure class="image-figure">
        <img src="${img.url}" />
        ${img.caption ? `<figcaption>${img.caption}</figcaption>` : ""}
      </figure>
    `)
    .join("")

  // LIC proposal block (if provided)
  let licBlock = ""
  if (payload.licProposal?.planName) {
    const p = payload.licProposal
    licBlock = `
      <div class="section">
        <div class="section-title">LIC Proposal</div>
        <div class="info-grid">
          ${p.prospectName ? `<div class="info-item"><div class="info-label">Name</div><div class="info-value">${p.prospectName}</div></div>` : ""}
          ${typeof p.prospectAge === 'number' ? `<div class="info-item"><div class="info-label">Age</div><div class="info-value">${p.prospectAge} years</div></div>` : ""}
          ${p.prospectPan ? `<div class="info-item"><div class="info-label">PAN</div><div class="info-value">${p.prospectPan}</div></div>` : ""}
          <div class="info-item"><div class="info-label">LIC Product</div><div class="info-value">${p.planName}</div></div>
          ${typeof p.sumAssured === 'number' ? `<div class="info-item"><div class="info-label">Assured Sum</div><div class="info-value">₹ ${p.sumAssured}</div></div>` : ""}
          ${typeof p.termYears === 'number' ? `<div class="info-item"><div class="info-label">Term</div><div class="info-value">${p.termYears} years</div></div>` : ""}
          ${typeof p.pptYears === 'number' ? `<div class="info-item"><div class="info-label">PPT</div><div class="info-value">${p.pptYears} years</div></div>` : ""}
          ${p.premiumMode ? `<div class="info-item"><div class="info-label">Mode</div><div class="info-value">${p.premiumMode}</div></div>` : ""}
        </div>

        ${(typeof p.firstYearPremium === 'number' || typeof p.subseqYearPremium === 'number') ? `
        <table class="table" style="margin-top:10px">
          <thead><tr><th style="width:50%">Yearly Premium</th><th>First Year</th><th>Subseq. Year</th></tr></thead>
          <tbody>
            <tr><td>${p.premiumMode || 'Yly'}</td><td>${typeof p.firstYearPremium === 'number' ? `₹ ${p.firstYearPremium}` : '-'}</td><td>${typeof p.subseqYearPremium === 'number' ? `₹ ${p.subseqYearPremium}` : '-'}</td></tr>
          </tbody>
        </table>
        ` : ''}

        ${(typeof p.annualBonus === 'number' || typeof p.fabPerThousand === 'number' || typeof p.taxSaved === 'number') ? `
        <div class="info-grid" style="margin-top:10px">
          ${typeof p.annualBonus === 'number' ? `<div class="info-item"><div class="info-label">Annual Bonus</div><div class="info-value">₹ ${p.annualBonus}</div></div>` : ''}
          ${typeof p.fabPerThousand === 'number' ? `<div class="info-item"><div class="info-label">FAB / 1000 SA</div><div class="info-value">₹ ${p.fabPerThousand}</div></div>` : ''}
          ${typeof p.taxSaved === 'number' ? `<div class="info-item"><div class="info-label">Tax Saved (est.)</div><div class="info-value">₹ ${p.taxSaved}</div></div>` : ''}
        </div>
        ` : ''}
      </div>
    `
  }

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <style>
    body { font-family: 'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color:#111827; }
    .container { max-width: 210mm; margin: 0 auto; padding: 30px; }
    .header { display:flex; justify-content:space-between; align-items:center; border-bottom: 4px solid #2563eb; padding-bottom:16px; }
    .company { display:flex; align-items:center; gap:16px; }
    .company img { width:72px; height:72px; object-fit:contain; border-radius:8px; }
    .title { font-size:28px; font-weight:800; color:#1e40af; margin-top:4px; }
    .meta { color:#64748b; font-size:12px; }
    .section { margin-top:24px; border:1px solid #e5e7eb; border-radius:12px; padding:20px; }
    .section-title { font-size:18px; font-weight:700; color:#1e40af; margin-bottom:12px; }
    .policy-card { border:1px solid #e5e7eb; border-radius:12px; overflow:hidden; margin-bottom:12px; }
    .policy-card .header { background:#f8fafc; padding:12px 16px; display:flex; justify-content:space-between; align-items:center; }
    .policy-card .title { font-size:16px; color:#1e40af; font-weight:800; }
    .policy-card .badge { background:#eef2ff; color:#3730a3; border:1px solid #c7d2fe; padding:6px 10px; border-radius:9999px; font-size:12px; font-weight:700; }
    .policy-card .body { padding:12px 16px; display:grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap:12px; }
    .kv-item { background:#f9fafb; border:1px solid #e5e7eb; border-radius:10px; padding:10px 12px; }
    .kv-item .k { font-size:11px; color:#6b7280; font-weight:700; text-transform:uppercase; }
    .kv-item .v { font-size:14px; font-weight:700; margin-top:4px; }
    .image-figure { margin: 8px 0; }
    .image-figure img { max-width:100%; border-radius:8px; border:1px solid #e5e7eb; }
    .image-figure figcaption { text-align:center; font-size:12px; color:#6b7280; margin-top:4px; }
    .chart { width:100%; height:320px; }
    .info-grid { display:grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px; }
    .info-item { display:flex; align-items:center; justify-content:space-between; background:#f8fafc; border:1px solid #e5e7eb; border-radius:10px; padding:12px 14px; }
    .info-label { font-size:12px; color:#6b7280; font-weight:700; text-transform:uppercase; }
    .info-value { font-size:14px; font-weight:700; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="company">
        ${workspace?.logoUrl ? `<img src="${workspace.logoUrl}" alt="logo"/>` : ""}
        <div>
          <div class="title">${title}</div>
          <div class="meta">${workspace?.name || ""} • ${date}${client ? ` • Client: ${client.name}` : ""}</div>
        </div>
      </div>
      <div class="meta">${workspace?.websiteUrl || ""}<br/>${workspace?.officePhone || ""} • ${workspace?.officeEmail || ""}</div>
    </div>

    ${client ? `<div class="section"><div class="section-title">Client Overview</div><div class="meta">${client.email || ""} • ${client.mobile || ""}</div></div>` : ""}

    ${policies.length ? `<div class="section"><div class="section-title">Existing Policies</div>${policyCards}</div>` : ""}

    ${mixPlanCards ? `<div class="section"><div class="section-title">Proposed Mix Plans</div>${mixPlanCards}</div>` : ""}

    ${licBlock}

    ${customSections}

    ${images ? `<div class="section"><div class="section-title">Images</div>${images}</div>` : ""}

    <div class="section">
      <div class="section-title">Premium Projection</div>
      <canvas id="premiumChart" class="chart"></canvas>
    </div>
  </div>

  <script>
    (function(){
      try {
        const ctx = document.getElementById('premiumChart')?.getContext('2d')
        if (ctx && window.Chart) {
          const months = Array.from({ length: 12 }, (_, i) => new Date(new Date().setMonth(new Date().getMonth()-11+i)).toLocaleString('en-GB', { month: 'short' }))
          const values = months.map(()=> Math.round(Math.random()*10000))
          new Chart(ctx, { type: 'line', data: { labels: months, datasets: [{ label: 'Premium', data: values, borderColor: '#2563eb', backgroundColor: 'rgba(37,99,235,0.2)', tension: 0.35 }] }, options: { plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } } })
        }
      } catch(e) {}
    })()
  </script>
</body>
</html>
  `
}


