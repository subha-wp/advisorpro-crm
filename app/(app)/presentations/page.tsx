"use client"

import { useEffect, useMemo, useState } from "react"
import useSWR from "swr"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { lic_products } from "@/lib/lic-products"

type Client = { id: string; name: string }
type Policy = { id: string; policyNumber: string; insurer: string; planName?: string | null }

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function PresentationsPage() {
  const [clientId, setClientId] = useState<string>("")
  const [selectedPolicies, setSelectedPolicies] = useState<string[]>([])
  // Title will be auto-generated from prospect + plan
  const [title, setTitle] = useState<string>("")
  const [mixPlans, setMixPlans] = useState<Array<{ insurer?: string; planName?: string; policyType?: string; sumAssured?: number; premium?: number }>>([])
  const [images, setImages] = useState<Array<{ url: string; caption?: string }>>([])
  const [customSections, setCustomSections] = useState<Array<{ title: string; html?: string }>>([])
  const [isGenerating, setIsGenerating] = useState(false)

  // Prospect inputs for proposal
  const [prospectName, setProspectName] = useState<string>("")
  const [prospectAge, setProspectAge] = useState<number | "">("")
  const [prospectDob, setProspectDob] = useState<string>("")
  const [prospectPan, setProspectPan] = useState<string>("")
  const [selectedLicPlan, setSelectedLicPlan] = useState<string>("")
  const [licSumAssured, setLicSumAssured] = useState<number | "">("")
  const [termYears, setTermYears] = useState<number | "">("")
  const [pptYears, setPptYears] = useState<number | "">("")
  const [premiumMode, setPremiumMode] = useState<string>("Yly")
  const [firstYearPremium, setFirstYearPremium] = useState<number | "">("")
  const [subseqYearPremium, setSubseqYearPremium] = useState<number | "">("")
  const [annualBonus, setAnnualBonus] = useState<number | "">("")
  const [fabPerThousand, setFabPerThousand] = useState<number | "">(0)
  const [taxSaved, setTaxSaved] = useState<number | "">("")

  // Client selection removed for streamlined flow; leave hooks for future linking
  const clients: Client[] = []

  const { data: policiesData } = useSWR<{ items: Policy[] }>(clientId ? `/api/policies?clientId=${clientId}&pageSize=200` : null, fetcher)
  const policies = policiesData?.items || []

  useEffect(() => {
    setSelectedPolicies([])
  }, [clientId])

  // Auto-calc age from DOB
  useEffect(() => {
    if (!prospectDob) return
    const dob = new Date(prospectDob)
    const today = new Date()
    let age = today.getFullYear() - dob.getFullYear()
    const m = today.getMonth() - dob.getMonth()
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--
    setProspectAge(age)
  }, [prospectDob])

  // Auto-generate title
  useEffect(() => {
    const t = `${prospectName ? prospectName + " - " : ""}${selectedLicPlan || "LIC Proposal"}`
    setTitle(t)
  }, [prospectName, selectedLicPlan])

  const togglePolicy = (id: string) => {
    setSelectedPolicies((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]))
  }

  const addMixPlan = () => setMixPlans((m) => [...m, {}])
  const updateMixPlan = (idx: number, key: string, value: any) => {
    setMixPlans((m) => m.map((it, i) => (i === idx ? { ...it, [key]: value } : it)))
  }
  const removeMixPlan = (idx: number) => setMixPlans((m) => m.filter((_, i) => i !== idx))

  const addImage = () => setImages((arr) => [...arr, { url: "" }])
  const updateImage = (idx: number, key: string, value: any) => setImages((arr) => arr.map((it, i) => (i === idx ? { ...it, [key]: value } : it)))
  const removeImage = (idx: number) => setImages((arr) => arr.filter((_, i) => i !== idx))

  const addSection = () => setCustomSections((arr) => [...arr, { title: "Section" }])
  const updateSection = (idx: number, key: string, value: any) => setCustomSections((arr) => arr.map((it, i) => (i === idx ? { ...it, [key]: value } : it)))
  const removeSection = (idx: number) => setCustomSections((arr) => arr.filter((_, i) => i !== idx))

  const generate = async () => {
    setIsGenerating(true)
    try {
      const response = await fetch("/api/presentations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          presentationTitle: title,
          clientId,
          selectedPolicies,
          mixPlans,
          images,
          customSections,
          licProposal: selectedLicPlan
            ? {
                prospectName,
                prospectAge: prospectAge === "" ? undefined : Number(prospectAge),
                prospectPan: prospectPan || undefined,
                planName: selectedLicPlan,
                sumAssured: licSumAssured === "" ? undefined : Number(licSumAssured),
                termYears: termYears === "" ? undefined : Number(termYears),
                pptYears: pptYears === "" ? undefined : Number(pptYears),
                premiumMode,
                firstYearPremium: firstYearPremium === "" ? undefined : Number(firstYearPremium),
                subseqYearPremium: subseqYearPremium === "" ? undefined : Number(subseqYearPremium),
                annualBonus: annualBonus === "" ? undefined : Number(annualBonus),
                fabPerThousand: fabPerThousand === "" ? undefined : Number(fabPerThousand),
                taxSaved: taxSaved === "" ? undefined : Number(taxSaved),
              }
            : undefined,
        }),
      })
      if (!response.ok) throw new Error("Failed to generate presentation")
      const blob = await response.blob()
      const url = URL.createObjectURL(new Blob([blob], { type: "application/pdf" }))
      const a = document.createElement("a")
      a.href = url
      a.download = `${title.replace(/[^a-zA-Z0-9]/g, "-")}-${new Date().toISOString().split("T")[0]}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (e) {
      console.error(e)
      alert("Failed to generate presentation")
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <section className="space-y-6 p-2 sm:p-4">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Prospect</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-2 sm:col-span-2">
                <Label>Prospect Name</Label>
                <Input value={prospectName} onChange={(e) => setProspectName(e.target.value)} placeholder="Client full name" />
              </div>
              <div className="space-y-2">
                <Label>DOB</Label>
                <Input type="date" value={prospectDob} onChange={(e) => setProspectDob(e.target.value)} />
              </div>
              <div className="space-y-2 sm:col-span-3">
                <Label>PAN (optional)</Label>
                <Input value={prospectPan} onChange={(e) => setProspectPan(e.target.value.toUpperCase())} placeholder="ABCDE1234F" maxLength={10} />
              </div>
              <div className="space-y-2 sm:col-span-3">
                <Label>Auto Title</Label>
                <Input value={title} readOnly />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm">Select Policies</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {!clientId ? (
              <div className="text-sm text-muted-foreground">Choose a client to view policies</div>
            ) : !policies.length ? (
              <div className="text-sm text-muted-foreground">No policies found</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {policies.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => togglePolicy(p.id)}
                    className={`text-left rounded-md border p-2 ${selectedPolicies.includes(p.id) ? "border-primary bg-primary/5" : "border-border"}`}
                  >
                    <div className="text-sm font-medium">{p.insurer} {p.planName ? `• ${p.planName}` : ""}</div>
                    <div className="text-xs text-muted-foreground">{p.policyNumber}</div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">LIC Plan Proposal</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Label>LIC Product</Label>
              <Select value={selectedLicPlan} onValueChange={setSelectedLicPlan}>
                <SelectTrigger>
                  <SelectValue placeholder="Select LIC product" />
                </SelectTrigger>
                <SelectContent>
                  {lic_products
                    .filter((p) => p.category !== "Rider")
                    .map((p) => (
                      <SelectItem key={p.plan_name} value={p.plan_name}>{p.plan_name}</SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Assured Sum (₹)</Label>
              <Input type="number" value={licSumAssured} onChange={(e) => setLicSumAssured(e.target.value === "" ? "" : Number(e.target.value))} placeholder="e.g. 500000" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div className="space-y-2">
                <Label>Term (years)</Label>
                <Input type="number" value={termYears} onChange={(e) => setTermYears(e.target.value === "" ? "" : Number(e.target.value))} />
              </div>
              <div className="space-y-2">
                <Label>PPT (years)</Label>
                <Input type="number" value={pptYears} onChange={(e) => setPptYears(e.target.value === "" ? "" : Number(e.target.value))} />
              </div>
              <div className="space-y-2">
                <Label>Mode</Label>
                <Select value={premiumMode} onValueChange={setPremiumMode}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {['Yly','Hly','Qly','Mly'].map(m => (<SelectItem key={m} value={m}>{m}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="space-y-2">
                <Label>First Year Premium (₹)</Label>
                <Input type="number" value={firstYearPremium} onChange={(e) => setFirstYearPremium(e.target.value === "" ? "" : Number(e.target.value))} />
              </div>
              <div className="space-y-2">
                <Label>Subsequent Year Premium (₹)</Label>
                <Input type="number" value={subseqYearPremium} onChange={(e) => setSubseqYearPremium(e.target.value === "" ? "" : Number(e.target.value))} />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div className="space-y-2">
                <Label>Annual Bonus (₹)</Label>
                <Input type="number" value={annualBonus} onChange={(e) => setAnnualBonus(e.target.value === "" ? "" : Number(e.target.value))} placeholder="e.g. 7000" />
              </div>
              <div className="space-y-2">
                <Label>FAB per 1000 SA (₹)</Label>
                <Input type="number" value={fabPerThousand as number} onChange={(e) => setFabPerThousand(e.target.value === "" ? "" : Number(e.target.value))} />
              </div>
              <div className="space-y-2">
                <Label>Tax Saved (₹)</Label>
                <Input type="number" value={taxSaved} onChange={(e) => setTaxSaved(e.target.value === "" ? "" : Number(e.target.value))} />
              </div>
            </div>
            {selectedLicPlan ? (
              <div className="text-xs text-muted-foreground">
                {(() => {
                  const prod = lic_products.find((x) => x.plan_name === selectedLicPlan)
                  if (!prod) return null
                  const ageInfo = prod.eligibility.min_age || prod.eligibility.max_age ? `Age: ${prod.eligibility.min_age ?? "-"}–${prod.eligibility.max_age ?? "-"}` : ""
                  const termInfo = prod.eligibility.term_range_years ? `Term: ${prod.eligibility.term_range_years}` : ""
                  const pptInfo = prod.eligibility.ppt_options ? `PPT: ${Array.isArray(prod.eligibility.ppt_options) ? prod.eligibility.ppt_options.join("/") : prod.eligibility.ppt_options}` : ""
                  return [ageInfo, termInfo, pptInfo].filter(Boolean).join(" • ")
                })()}
              </div>
            ) : null}
          </CardContent>
        </Card>
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm">Proposed Mix Plans</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {mixPlans.map((m, idx) => (
              <div key={idx} className="grid grid-cols-1 sm:grid-cols-6 gap-2 items-end">
                <div className="space-y-1 sm:col-span-2">
                  <Label>Insurer</Label>
                  <Input value={m.insurer || ""} onChange={(e) => updateMixPlan(idx, "insurer", e.target.value)} />
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <Label>Plan</Label>
                  <Input value={m.planName || ""} onChange={(e) => updateMixPlan(idx, "planName", e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label>Sum Assured</Label>
                  <Input type="number" value={m.sumAssured ?? ""} onChange={(e) => updateMixPlan(idx, "sumAssured", Number(e.target.value || 0))} />
                </div>
                <div className="space-y-1">
                  <Label>Premium</Label>
                  <Input type="number" value={m.premium ?? ""} onChange={(e) => updateMixPlan(idx, "premium", Number(e.target.value || 0))} />
                </div>
                <div className="flex gap-2">
                  <Button variant="destructive" onClick={() => removeMixPlan(idx)}>Remove</Button>
                </div>
              </div>
            ))}
            <Button variant="secondary" onClick={addMixPlan}>Add Mix Plan</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Images</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {images.map((img, idx) => (
              <div key={idx} className="grid grid-cols-1 sm:grid-cols-5 gap-2 items-end">
                <div className="space-y-1 sm:col-span-3">
                  <Label>Image URL</Label>
                  <Input value={img.url} onChange={(e) => updateImage(idx, "url", e.target.value)} placeholder="https://..." />
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <Label>Caption</Label>
                  <Input value={img.caption || ""} onChange={(e) => updateImage(idx, "caption", e.target.value)} />
                </div>
                <div className="flex gap-2">
                  <Button variant="destructive" onClick={() => removeImage(idx)}>Remove</Button>
                </div>
              </div>
            ))}
            <Button variant="secondary" onClick={addImage}>Add Image</Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Custom Sections</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {customSections.map((s, idx) => (
            <div key={idx} className="grid grid-cols-1 sm:grid-cols-5 gap-2 items-start">
              <div className="space-y-1 sm:col-span-1">
                <Label>Title</Label>
                <Input value={s.title} onChange={(e) => updateSection(idx, "title", e.target.value)} />
              </div>
              <div className="space-y-1 sm:col-span-4">
                <Label>HTML</Label>
                <Textarea rows={5} value={s.html || ""} onChange={(e) => updateSection(idx, "html", e.target.value)} />
              </div>
              <div className="flex gap-2">
                <Button variant="destructive" onClick={() => removeSection(idx)}>Remove</Button>
              </div>
            </div>
          ))}
          <Button variant="secondary" onClick={addSection}>Add Section</Button>
        </CardContent>
      </Card>

      {/* Instant Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Instant Preview</CardTitle>
        </CardHeader>
        <CardContent>
          {selectedLicPlan ? (
            <div className="space-y-3 rounded-md border p-3" style={{ background: "#f5fbea" }}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-base font-semibold">{prospectName || "Prospect"}{typeof prospectAge === 'number' ? `, Age: ${prospectAge}` : ""}</div>
                  <div className="text-xs text-muted-foreground">{selectedLicPlan}</div>
                </div>
                <div className="text-xs">{title}</div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <div className="rounded-md border bg-white p-3">
                  <div className="text-xs text-muted-foreground">Plan details</div>
                  <div className="mt-2 space-y-1 text-sm">
                    <div className="flex justify-between"><span>Sum Assured</span><span>₹ {licSumAssured || 0}</span></div>
                    <div className="flex justify-between"><span>Term</span><span>{termYears || 0} Years</span></div>
                    <div className="flex justify-between"><span>Premium Payment</span><span>{pptYears || 0} Years</span></div>
                  </div>
                </div>
                <div className="rounded-md border bg-white p-3">
                  <div className="text-xs text-muted-foreground">Yearly Premium</div>
                  <div className="mt-2 space-y-1 text-sm">
                    <div className="flex justify-between"><span>First Year</span><span>₹ {firstYearPremium || 0}</span></div>
                    <div className="flex justify-between"><span>Subseq. Year</span><span>₹ {subseqYearPremium || 0}</span></div>
                    <div className="flex justify-between"><span>Mode</span><span>{premiumMode}</span></div>
                  </div>
                </div>
                <div className="rounded-md border bg-white p-3">
                  <div className="text-xs text-muted-foreground">Bonuses</div>
                  <div className="mt-2 space-y-1 text-sm">
                    <div className="flex justify-between"><span>Annual Bonus</span><span>₹ {annualBonus || 0}</span></div>
                    <div className="flex justify-between"><span>FAB / 1000 SA</span><span>₹ {fabPerThousand || 0}</span></div>
                    <div className="flex justify-between"><span>Tax Saved</span><span>₹ {taxSaved || 0}</span></div>
                  </div>
                </div>
              </div>
              {(() => {
                const sa = Number(licSumAssured || 0)
                const term = Number(termYears || 0)
                const fy = Number(firstYearPremium || 0)
                const sy = Number(subseqYearPremium || 0)
                const bonus = Number(annualBonus || 0)
                const fab = Number(fabPerThousand || 0)
                const totalPrem = fy + Math.max(term - 1, 0) * sy
                const totalBonus = bonus * term
                const fabTotal = fab * (sa / 1000)
                const maturity = sa + totalBonus + fabTotal
                return (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="rounded-md border bg-white p-4">
                      <div className="text-xs text-muted-foreground">You Pay</div>
                      <div className="text-2xl font-bold">₹ {totalPrem.toLocaleString()}</div>
                      <div className="text-xs">total premium</div>
                    </div>
                    <div className="rounded-md border bg-white p-4">
                      <div className="text-xs text-muted-foreground">You Get</div>
                      <div className="text-2xl font-bold">₹ {maturity.toLocaleString()}</div>
                      <div className="text-xs">total benefit</div>
                    </div>
                  </div>
                )
              })()}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">Select LIC product and inputs to preview</div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={generate} disabled={isGenerating}>{isGenerating ? "Generating…" : "Generate Presentation PDF"}</Button>
      </div>
    </section>
  )
}


