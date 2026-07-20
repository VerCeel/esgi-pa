# Budgie — Documentation des API

Liste de toutes les routes de l'API du backend **Budgie** (Laravel).
Source : `routes/api.php`.

- **Base URL** : `/api`
- **Format** : JSON
- **Authentification** : [Laravel Sanctum](https://laravel.com/docs/sanctum) — jeton `Bearer`
  envoyé dans l'en-tête `Authorization: Bearer <token>`.
- **Légende** : route publique · route protégée (`auth:sanctum`) · ⏱ *rate limited*.

---

## 1. Routes publiques 🔓

### Authentification

| Méthode | URI | Contrôleur | Description | Limites |
|---|---|---|---|---|
| `POST` | `/api/register` | `AuthController@register` | Inscription d'un nouvel utilisateur | — |
| `POST` | `/api/login` | `AuthController@login` | Connexion (email + mot de passe), renvoie un token Sanctum | ⏱ 5/min |
| `POST` | `/api/logout` | `AuthController@logout` | Déconnexion 🔒 | — |

### Double authentification (2FA)

| Méthode | URI | Contrôleur | Description | Limites |
|---|---|---|---|---|
| `POST` | `/api/2fa/challenge` | `TwoFactorController@challenge` | Valide le code 2FA à 6 chiffres via un `login_token` temporaire (pas encore de token Sanctum) | ⏱ 5/min |

### Mot de passe oublié

| Méthode | URI | Contrôleur | Description | Limites |
|---|---|---|---|---|
| `POST` | `/api/forgot-password` | `AuthController@forgotPassword` | Envoie l'email de réinitialisation | ⏱ 5/min |
| `POST` | `/api/reset-password` | `AuthController@resetPassword` | Réinitialise le mot de passe via le token reçu | ⏱ 5/min |

### Vérification d'email

| Méthode | URI | Contrôleur | Description | Limites |
|---|---|---|---|---|
| `GET` | `/api/email/verify/{id}/{hash}` | `EmailVerificationController@verify` | Lien signé de confirmation d'email (nommé `verification.verify`) | ⏱ 10/min |
| `POST` | `/api/email/verification-notification` | `EmailVerificationController@resend` | Renvoie l'email de vérification | ⏱ 5/min |

### Connexion sociale (OAuth — Google / GitHub / Apple)

| Méthode | URI | Contrôleur | Description | Limites |
|---|---|---|---|---|
| `GET` | `/api/auth/{provider}/redirect` | `SocialAuthController@redirect` | Redirige vers le fournisseur OAuth | ⏱ 10/min |
| `GET`\|`POST` | `/api/auth/{provider}/callback` | `SocialAuthController@callback` | Retour du fournisseur → renvoie vers le SPA avec un token Sanctum | ⏱ 10/min |

### Webhook Stripe

| Méthode | URI | Contrôleur | Description | Auth |
|---|---|---|---|---|
| `POST` | `/api/stripe/webhook` | `SubscriptionController@webhook` | Reçu depuis les serveurs Stripe (authentifié par la **signature** du webhook, pas par Sanctum) | Signature Stripe |

---

## 2. Routes protégées 🔒 (`auth:sanctum`)

### Utilisateur & Profil

| Méthode | URI | Contrôleur | Description |
|---|---|---|---|
| `GET` | `/api/user` | *closure* | Renvoie l'utilisateur authentifié |
| `GET` | `/api/profile` | `ProfileController@show` | Détail du profil |
| `PATCH` | `/api/profile` | `ProfileController@update` | Mise à jour du profil |

### 2FA (gestion, utilisateur connecté)

| Méthode | URI | Contrôleur | Description |
|---|---|---|---|
| `POST` | `/api/2fa/enable` | `TwoFactorController@enable` | Génère le secret 2FA (retourne le QR code) |
| `POST` | `/api/2fa/confirm` | `TwoFactorController@confirm` | Confirme l'activation avec un premier code valide |
| `POST` | `/api/2fa/disable` | `TwoFactorController@disable` | Désactive le 2FA |
| `POST` | `/api/2fa/recovery-codes` | `TwoFactorController@regenerateRecoveryCodes` | Régénère les codes de récupération |

### Comptes (`accounts`)

| Méthode | URI | Contrôleur | Description |
|---|---|---|---|
| `GET` | `/api/accounts` | `AccountController@index` | Liste des comptes de l'utilisateur |
| `POST` | `/api/accounts` | `AccountController@store` | Crée un compte |
| `GET` | `/api/accounts/{account}` | `AccountController@show` | Détail d'un compte |
| `PUT`\|`PATCH` | `/api/accounts/{account}` | `AccountController@update` | Met à jour un compte |
| `DELETE` | `/api/accounts/{account}` | `AccountController@destroy` | Supprime un compte (+ sa descendance) |
| `GET` | `/api/accounts/shared` | `AccountController@shared` | Comptes partagés **avec** l'utilisateur (lecture seule) |
| `DELETE` | `/api/accounts/shared/{account}` | `AccountController@leaveShared` | L'invité quitte un compte partagé (retire son accès) |

> ⚠️ `/accounts/shared` est déclaré **avant** `/accounts/{account}` pour que « shared » ne soit pas interprété comme un identifiant.

**Payload (`store`)** : `name` *(requis)*, `description`, `creation_date`, `remuneration_rate` (0–100), `tax_rate` (0–100).

### Dépenses (`expenses`) — `apiResource`

| Méthode | URI | Contrôleur | Description |
|---|---|---|---|
| `GET` | `/api/expenses` | `ExpenseController@index` | Liste des dépenses |
| `POST` | `/api/expenses` | `ExpenseController@store` | Crée une dépense |
| `GET` | `/api/expenses/{expense}` | `ExpenseController@show` | Détail |
| `PUT`\|`PATCH` | `/api/expenses/{expense}` | `ExpenseController@update` | Mise à jour |
| `DELETE` | `/api/expenses/{expense}` | `ExpenseController@destroy` | Suppression |

**Payload (`store`)** : `name` *(requis)*, `description`, `amount` *(requis, ≥0)*, `frequency_type` *(`ONCE`\|`RECURRING`)*, `frequency_months` *(requis si `RECURRING`, 1–600)*, `start_date_time` *(requis)*, `end_date_time` *(≥ start)*, `account_id` *(requis — doit appartenir à l'utilisateur)*.

### Revenus (`incomes`) — `apiResource`

| Méthode | URI | Contrôleur | Description |
|---|---|---|---|
| `GET` | `/api/incomes` | `IncomeController@index` | Liste des revenus |
| `POST` | `/api/incomes` | `IncomeController@store` | Crée un revenu |
| `GET` | `/api/incomes/{income}` | `IncomeController@show` | Détail |
| `PUT`\|`PATCH` | `/api/incomes/{income}` | `IncomeController@update` | Mise à jour |
| `DELETE` | `/api/incomes/{income}` | `IncomeController@destroy` | Suppression |

**Payload (`store`)** : identique aux dépenses.

### Exceptions de transaction (`transaction_exceptions`)

Toujours abordées via leur transaction parente (impossible d'en greffer une sur la dépense d'autrui).

| Méthode | URI | Contrôleur | Description |
|---|---|---|---|
| `GET` | `/api/expenses/{expense}/exceptions` | `TransactionExceptionController@indexForExpense` | Exceptions d'une dépense |
| `POST` | `/api/expenses/{expense}/exceptions` | `TransactionExceptionController@storeForExpense` | Ajoute une exception à une dépense |
| `GET` | `/api/incomes/{income}/exceptions` | `TransactionExceptionController@indexForIncome` | Exceptions d'un revenu |
| `POST` | `/api/incomes/{income}/exceptions` | `TransactionExceptionController@storeForIncome` | Ajoute une exception à un revenu |
| `PATCH` | `/api/exceptions/{exception}` | `TransactionExceptionController@update` | Mise à jour d'une exception |
| `DELETE` | `/api/exceptions/{exception}` | `TransactionExceptionController@destroy` | Suppression d'une exception |

**Payload (`store`)** : `name` *(requis)*, `description`, `amount` *(requis, ≥0)*, `frequency_type`, `frequency_months` *(requis si `RECURRING`)*, `start_date_time` *(requis)*, `end_date_time`.

### Partage de comptes (`account_shares`)

| Méthode | URI | Contrôleur | Description |
|---|---|---|---|
| `GET` | `/api/accounts/{account}/shares` | `AccountShareController@index` | Liste des partages/invitations d'un compte |
| `POST` | `/api/accounts/{account}/shares` | `AccountShareController@store` | Invite une adresse email à consulter le compte |
| `DELETE` | `/api/accounts/{account}/shares/{share}` | `AccountShareController@destroy` | Révoque un partage |
| `POST` | `/api/shares/{token}/accept` | `AccountShareController@accept` | Le destinataire accepte l'invitation via son token |

### Prévisions

| Méthode | URI | Contrôleur | Description |
|---|---|---|---|
| `GET` | `/api/forecast` | `ForecastController@index` | État prévisionnel des comptes pour un mois donné — param. `?month=YYYY-MM` (ex. `?month=2035-12`) |

### Abonnement (Stripe)

| Méthode | URI | Contrôleur | Description |
|---|---|---|---|
| `GET` | `/api/subscription` | `SubscriptionController@show` | État de l'abonnement |
| `POST` | `/api/subscription/checkout` | `SubscriptionController@checkout` | Démarre une session de paiement Stripe Checkout |
| `POST` | `/api/subscription/cancel` | `SubscriptionController@cancel` | Résilie l'abonnement (accès conservé jusqu'à `plan_ends_at`) |

---

## 3. Récapitulatif

| Domaine | Nb de routes | Auth |
|---|---|---|
| Authentification (login/register/logout/2FA challenge) | 4 | Publique (sauf logout) |
| Mot de passe oublié | 2 | Publique |
| Vérification email | 2 | Publique |
| OAuth social | 2 | Publique |
| Webhook Stripe | 1 | Signature |
| Utilisateur / Profil | 3 | 🔒 |
| 2FA (gestion) | 4 | 🔒 |
| Comptes | 7 | 🔒 |
| Dépenses | 5 | 🔒 |
| Revenus | 5 | 🔒 |
| Exceptions | 6 | 🔒 |
| Partages | 4 | 🔒 |
| Prévisions | 1 | 🔒 |
| Abonnement | 3 | 🔒 |

**Total : ~49 endpoints** (les `apiResource` comptent pour 5 chacun).

### Conventions
- Les ressources `expenses`, `incomes`, `accounts` utilisent `Route::apiResource` → 5 verbes REST standards (`index`, `store`, `show`, `update`, `destroy`).
- Les routes sensibles publiques sont **throttlées** (`throttle:N,1` = N requêtes/minute) contre le brute-force et l'énumération.
- La propriété des ressources est vérifiée au niveau des `FormRequest` (ex. `account_id` doit appartenir à l'utilisateur connecté) et des politiques d'accès des contrôleurs.
