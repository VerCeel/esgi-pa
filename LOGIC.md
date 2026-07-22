# Budgie — Logique métier & calculs

Où se trouve la logique de l'application et **comment se font les calculs**.

## Principe d'architecture

La logique métier est **séparée des controllers**. Les controllers ne font que :
**valider** la requête (`FormRequest`) → **vérifier les droits** → **déléguer** à un service → renvoyer du JSON.

Le vrai travail vit dans deux endroits :

```
app/Services/                       ← logique métier pure (le "cerveau")
├── ForecastService.php             ← ⭐ le moteur de calcul des prévisions
├── PlanLimits.php                  ← limites plan FREE / PREMIUM
└── TwoFactorService.php            ← génération / vérification 2FA (TOTP)

app/Http/Controllers/Concerns/      ← traits partagés entre controllers
├── ResolvesAccounts.php            ← droits d'accès (propriétaire vs invité)
└── FiltersTransactions.php         ← recherche texte (insensible à la casse)
```

---

## ⭐ 1. Le calcul central — `ForecastService`

**Fichier : `app/Services/ForecastService.php`**
C'est **ici que se calcule tout** : la projection du solde des comptes dans le futur.

### Le principe

On **simule l'historique mois par mois**, depuis la date de création du compte
(`creation_date`) jusqu'au mois demandé. Chaque mois, dans l'ordre :

1. **Encaisser les revenus** du mois → cumul `total_income`
2. **Payer les dépenses** du mois → cumul `total_expense`
3. **Calculer le solde** : `balance = total_income − total_expense + total_interest`
4. **Verser les intérêts** nets d'impôt sur le solde positif → intérêts **composés**

> Les intérêts sont composés (réinjectés dans le solde chaque mois), comme sur un vrai
> livret — c'est le sens de « primes d'intérêts versées mensuellement ».

### Les formules

| Calcul | Formule |
|---|---|
| Taux mensuel | `monthlyRate = (remuneration_rate / 100) / 12` *(annuel → mensuel)* |
| Intérêt brut du mois | `gross = balance × monthlyRate` |
| Intérêt net (après impôt) | `net = gross × (1 − tax_rate/100)` |
| Nouveau solde | `balance += net` |

**Règles importantes :**
- ❌ **Pas d'intérêts sur un découvert** : si le solde est négatif, aucun intérêt (`balance > 0` requis).
- ✅ Intérêts uniquement si le compte est **rémunéré** (`remuneration_rate > 0`, via `Account::isInterestBearing()`).
- 🛡️ Garde-fou `MAX_MONTHS = 1200` (100 ans) contre une saisie aberrante.
- Tous les montants sont arrondis à 2 décimales en sortie.

### Les méthodes

| Méthode | Rôle |
|---|---|
| `accountBalance(Account, $month)` | Boucle mois par mois sur **un** compte. Retourne `{ balance, total_income, total_expense, total_interest }`. |
| `forecast(Collection $accounts, $month)` | Applique `accountBalance` à **plusieurs** comptes + calcule le **total consolidé**. |
| `amountForMonth($transaction, $month)` | Montant d'une dépense/revenu pour ce mois (**0** si elle ne tombe pas ce mois-là). |
| `exceptionForMonth($transaction, $month)` | Cherche une exception qui **remplace** le montant ce mois-là (la plus récente `id` l'emporte). |
| `occursIn(start, end, type, months, $month)` | **Cœur de la récurrence** — voir ci-dessous. |

### La récurrence — `occursIn()`

Détermine si une règle (dépense, revenu ou exception) « tombe » sur un mois donné :

- Avant `start_date_time` ou après `end_date_time` → **non**.
- `frequency_type = ONCE` → vrai **uniquement** le mois de départ.
- `frequency_type = RECURRING` → vrai si `start.diffInMonths(month) % frequency_months === 0`
  (« tous les N mois » à partir du mois de départ).

### Les exceptions

Une `TransactionException` **surcharge** le montant d'une dépense/revenu sur une période,
**sans jamais modifier le montant en base**. Dans `amountForMonth()` :

```
montant du mois = exception qui couvre ce mois (si elle existe) ? son montant : montant initial
```

S'il y a plusieurs exceptions sur le même mois, la **dernière créée** (plus grand `id`) gagne.

### Le point d'entrée

`ForecastController@index` — route `GET /api/forecast?month=YYYY-MM` :

```
valider ?month=Y-m
  → récupérer les comptes lisibles (possédés + partagés) via ResolvesAccounts
  → charger expenses.exceptions + incomes.exceptions (eager load, anti N+1)
  → ForecastService::forecast($accounts, $targetMonth)
  → JSON
```

---

## 2. Limites de plan — `PlanLimits`

**Fichier : `app/Services/PlanLimits.php`**
Vérifie **côté serveur** ce qu'un utilisateur a le droit de créer (le front peut cacher un
bouton, mais ça n'empêche pas d'appeler l'API directement).

| Constante | Valeur (plan FREE) |
|---|---|
| `FREE_MAX_ACCOUNTS` | 2 comptes |
| `FREE_MAX_EXPENSES_PER_ACCOUNT` | 7 dépenses / compte |
| `FREE_MAX_INCOMES_PER_ACCOUNT` | 2 revenus / compte |

Le plan **PREMIUM est illimité** (`$user->isPremium()` court-circuite toutes les vérifications).
`canCreateAccount()`, `canCreateExpense()`, `canCreateIncome()` renvoient un booléen ;
`summary()` expose le plan, les limites et l'usage au front.

---

## 3. Double authentification — `TwoFactorService`

**Fichier : `app/Services/TwoFactorService.php`** — TOTP via `pragmarx/google2fa`.

| Méthode | Rôle |
|---|---|
| `generateSecret()` | Secret TOTP base32 (32 car.) |
| `otpauthUrl()` / `qrCodeDataUri()` | URI `otpauth://` + QR code SVG en data URI (`<img src>`) |
| `verifyCode(secret, code)` | Vérifie un code à 6 chiffres (tolérance ±30 s d'horloge, `setWindow(1)`) |
| `generateRecoveryCodes()` | 8 codes de secours `xxxxx-xxxxx` — retournés **en clair** (affichés une fois) **et** hashés (stockés) |
| `consumeRecoveryCode()` | Consomme un code de secours à usage unique (le retire de la liste) |

---

## 4. Droits d'accès — `ResolvesAccounts` (trait)

**Fichier : `app/Http/Controllers/Concerns/ResolvesAccounts.php`**
Deux niveaux d'accès à ne **jamais** confondre :

- **Propriétaire** → lecture **et** écriture ;
- **Invité** (via partage) → **lecture seule**, sur le compte comme sur ses dépenses/revenus.

| Méthode | Rôle |
|---|---|
| `ownedAccount(user, id)` | Le compte **seulement si** l'utilisateur en est propriétaire |
| `readableAccount(user, id)` | Le compte s'il est possédé **ou** partagé en lecture |
| `readableAccountIds(user)` | Tous les IDs lisibles (possédés + partagés) — utilisé par le forecast |
| `scopeToOwnedAccounts(query, user)` | Restreint une requête aux comptes **possédés** (exclut les partagés, en lecture seule) |

---

## 5. Recherche — `FiltersTransactions` (trait)

**Fichier : `app/Http/Controllers/Concerns/FiltersTransactions.php`**
`applySearch(query, $search)` filtre dépenses/revenus par `name` ou `description` :
- comparaison en **minuscules des deux côtés** (`LOWER(...) LIKE`) car `LIKE` est
  sensible à la casse sous PostgreSQL ;
- les jokers `%` `_` `\` saisis par l'utilisateur sont **échappés** (sinon `%` remonterait toute la table).

---

## En résumé — « c'est où que ça se calcule ? »

| Question | Réponse |
|---|---|
| **Le calcul des prévisions / soldes / intérêts ?** | `app/Services/ForecastService.php` |
| Déclenché par ? | `GET /api/forecast?month=YYYY-MM` → `ForecastController` |
| Les limites gratuit/payant ? | `app/Services/PlanLimits.php` |
| Les codes 2FA ? | `app/Services/TwoFactorService.php` |
| Qui a le droit de lire/écrire ? | `app/Http/Controllers/Concerns/ResolvesAccounts.php` |
| La recherche texte ? | `app/Http/Controllers/Concerns/FiltersTransactions.php` |
