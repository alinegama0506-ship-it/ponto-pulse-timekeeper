<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

## Project rules
- Punch/balance rules live in `src/lib/ponto.ts` (pure, tested in `ponto.test.ts`); UI must reuse them so balance never counts pending requests.
- Request approval/rejection only via the `decidir_solicitacao` SQL function (security definer: checks gestor role, blocks self-approval, writes audit fields); clients have no UPDATE on `solicitacoes`/`marcacoes`.
- Punches store device local date/time + tz offset; `created_at` is the server audit timestamp — never overwrite one with the other.
- Roles live in `user_roles`; signup derives privileges only from a locked, email-bound, unexpired invitation issued by an existing manager, never from the chosen UI area.
- App punches must use `registrar_marcacao`; authenticated direct INSERT is revoked so geolocation policy cannot be bypassed. SQL recalculates geolocation and device/server clock divergence; approval remains exclusively in `decidir_solicitacao`.
- Geolocation is requested only on explicit registration/retry actions, never watched; pure preview helpers live in `src/lib/geo.ts` with tests, while SQL is authoritative.
- Authenticated routes share AppShell; manager routes only gate roles and render Outlet to avoid duplicate navigation and main landmarks.
- Profile preferences are validated in the database and applied by PreferenciasProvider before authenticated content is revealed; translations and locale formatting use useT.
- Personal exports scope every query to the authenticated user and paginate all records; CSV cells escape spreadsheet formulas.
- Rules SELECT is restricted to the configured company row and application roles; work-location SELECT gives managers all locations and collaborators eligible active locations plus locations referenced by their own punches, preserving historical labels without exposing unrelated locations.
- Weekly reporting reuses pure helpers in ponto.ts and owner-scoped paginated queries; use the provisional five-day target without inventing schedules, holidays, punctuality or FIFO expiry before the schedule engine exists.
- Manager filters use optional validated URL search parameters and paginated interval reads so navigation preserves scope without truncation.
- Batch decisions wrap decidir_solicitacao atomically; no independent approval path may bypass its ownership, role and audit checks.
- Monthly PDF reports reuse ponto.ts and user-scoped paginated queries, preserving device local times and excluding pending requests from totals.
- Password recovery uses Cloud Auth recovery OTP/link verification on a public reset page; never generate local codes or allow password updates before a verified recovery session.
