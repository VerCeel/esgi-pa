<?php

namespace App\Services;

use App\Models\User;
use BaconQrCode\Renderer\Image\SvgImageBackEnd;
use BaconQrCode\Renderer\ImageRenderer;
use BaconQrCode\Renderer\RendererStyle\RendererStyle;
use BaconQrCode\Writer;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use PragmaRX\Google2FA\Google2FA;

class TwoFactorService
{
    private Google2FA $google2fa;

    public function __construct()
    {
        $this->google2fa = new Google2FA();
        // Tolère une dérive d'horloge de +/- 1 fenêtre (soit +/- 30s) entre le téléphone et le serveur.
        $this->google2fa->setWindow(1);
    }

    /**
     * Génère un nouveau secret TOTP (base32, 32 caractères).
     */
    public function generateSecret(): string
    {
        return $this->google2fa->generateSecretKey(32);
    }

    /**
     * Construit l'URI otpauth:// que le QR code encode.
     * C'est ce que l'app authenticator lit pour créer l'entrée.
     */
    public function otpauthUrl(User $user, string $secret): string
    {
        return $this->google2fa->getQRCodeUrl(
            config('app.name'),
            $user->email,
            $secret,
        );
    }

    /**
     * Rend le QR code en SVG encodé en data URI, directement affichable dans un <img src="...">.
     */
    public function qrCodeDataUri(string $otpauthUrl): string
    {
        $writer = new Writer(
            new ImageRenderer(
                new RendererStyle(300, 1),
                new SvgImageBackEnd(),
            ),
        );

        return 'data:image/svg+xml;base64,' . base64_encode($writer->writeString($otpauthUrl));
    }

    /**
     * Vérifie un code TOTP à 6 chiffres contre le secret de l'utilisateur.
     */
    public function verifyCode(string $secret, string $code): bool
    {
        return (bool) $this->google2fa->verifyKey($secret, $code);
    }

    /**
     * Génère 8 codes de secours à usage unique, au format "xxxxx-xxxxx".
     * Ils sont retournés en clair (à afficher une seule fois) ET hashés (à stocker).
     *
     * @return array{plain: string[], hashed: string[]}
     */
    public function generateRecoveryCodes(): array
    {
        $plain = collect(range(1, 8))
            ->map(fn () => Str::lower(Str::random(5) . '-' . Str::random(5)))
            ->all();

        return [
            'plain' => $plain,
            'hashed' => array_map(fn (string $code) => Hash::make($code), $plain),
        ];
    }

    /**
     * Consomme un code de secours : si le code correspond, il est retiré de la liste.
     * Retourne la nouvelle liste de codes, ou null si aucun code ne correspond.
     *
     * @param  string[]  $hashedCodes
     * @return string[]|null
     */
    public function consumeRecoveryCode(array $hashedCodes, string $candidate): ?array
    {
        foreach ($hashedCodes as $index => $hashed) {
            if (Hash::check($candidate, $hashed)) {
                unset($hashedCodes[$index]);

                return array_values($hashedCodes);
            }
        }

        return null;
    }
}
