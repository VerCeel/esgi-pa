import { useState } from "react"
import { AlertTriangle, Check, Copy, Download } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"

interface RecoveryCodesProps {
  codes: string[]
}

/**
 * Les codes de secours ne sont affichés qu'une seule fois (le serveur ne stocke que
 * leur hash), d'où l'avertissement et les boutons copier / télécharger.
 */
export function RecoveryCodes({ codes }: RecoveryCodesProps) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(codes.join("\n"))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleDownload() {
    const blob = new Blob([codes.join("\n")], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = "budgie-recovery-codes.txt"
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-3">
      <Alert>
        <AlertTriangle />
        <AlertDescription>
          Save these codes somewhere safe. Each one can be used once to sign in if
          you lose your device. They won&apos;t be shown again.
        </AlertDescription>
      </Alert>

      <div className="bg-muted grid grid-cols-2 gap-2 rounded-md p-3 font-mono text-sm">
        {codes.map((code) => (
          <span key={code} className="text-center">
            {code}
          </span>
        ))}
      </div>

      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={handleCopy}
        >
          {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
          {copied ? "Copied" : "Copy"}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={handleDownload}
        >
          <Download className="size-4" />
          Download
        </Button>
      </div>
    </div>
  )
}
