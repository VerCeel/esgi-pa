<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // L'app tourne derrière Caddy puis le nginx du front : sans faire confiance à
        // ces proxies, Laravel voit le trafic en http et croit le port 8000, ce qui
        // casse la génération/validation des URLs signées (vérification d'email) et
        // fait porter le throttle sur l'IP du proxy plutôt que celle du client.
        // Le backend n'est joignable que via ce chemin, jamais exposé directement.
        $middleware->trustProxies(at: '*');
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*'),
        );
    })->create();
