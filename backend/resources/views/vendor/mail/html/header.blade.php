@props(['url'])
<tr>
<td class="header">
<a href="{{ $url }}" style="display: inline-block;">
{{-- Logo Budgie hébergé par le front (Caddy sert /budgie-logo.png). Un PNG, pas un SVG :
     Gmail et Outlook ne rendent pas le SVG dans les emails. --}}
<img src="{{ rtrim(config('app.frontend_url'), '/') }}/budgie-logo.png"
     class="logo" alt="Budgie" width="52" height="52"
     style="width: 52px; height: 52px; border: none;">
<br>
<span style="font-size: 20px; font-weight: 700; color: #22d3ee; vertical-align: middle;">Budgie</span>
</a>
</td>
</tr>
