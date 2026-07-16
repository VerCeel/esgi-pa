import { Link } from "react-router-dom"
import { BudgieLogo } from "@/components/BudgieLogo"

/**
 * Pied de page commun à toutes les pages. Les informations légales (SIRET,
 * adresse, RCS…) sont fictives : Budgie est un projet étudiant, pas une
 * société immatriculée.
 */
export function Footer() {
  return (
    <footer className="mt-auto border-t">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <Link to="/" className="flex items-center gap-2">
            <BudgieLogo className="size-5" />
            <span className="font-semibold tracking-tight">Budgie SAS</span>
          </Link>
          <p className="text-muted-foreground max-w-xs text-sm text-pretty">
            La gestion de budget simple et partagée, pour garder un œil sur
            chaque euro.
          </p>
        </div>

        <div className="text-muted-foreground space-y-1 text-sm">
          <p className="text-foreground font-medium">Coordonnées</p>
          <p>24 rue des Lilas, 75011 Paris, France</p>
          <p>contact@budgie.example — +33 1 84 25 36 47</p>
        </div>

        <div className="text-muted-foreground space-y-1 text-sm">
          <p className="text-foreground font-medium">Mentions légales</p>
          <p>SAS au capital de 10 000 €</p>
          <p>SIRET 902 481 337 00019 — RCS Paris</p>
          <p>TVA FR 42 902481337</p>
        </div>
      </div>

      <div className="border-t">
        <p className="text-muted-foreground mx-auto w-full max-w-5xl px-4 py-4 text-xs">
          © 2026 Budgie SAS. Tous droits réservés.
        </p>
      </div>
    </footer>
  )
}
