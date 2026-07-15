<?php

namespace App\Notifications;

use App\Models\AccountShare;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class AccountShareInvitation extends Notification
{
    use Queueable;

    public function __construct(private AccountShare $share) {}

    /**
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $account = $this->share->account;
        $owner = $account->user;

        // Le lien porte le token : c'est lui qui prouve que le destinataire a bien reçu le mail.
        $url = rtrim(config('app.frontend_url'), '/') . '/shared/accept/' . $this->share->token;

        return (new MailMessage())
            ->subject("{$owner->name} shared the \"{$account->name}\" account with you on Budgie")
            ->greeting('Hello!')
            ->line("{$owner->name} ({$owner->email}) wants to share their account \"{$account->name}\" with you.")
            ->line('You will be able to see its balance, expenses and incomes — in read-only.')
            ->action('View the shared account', $url)
            ->line('If you were not expecting this invitation, you can simply ignore this email.');
    }
}
