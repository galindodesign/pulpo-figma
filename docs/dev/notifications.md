# Email notifications

Get an email when someone reports a bug or requests a feature from the [Contact](/contact) page (via GitHub Issues).

## 1. GitHub repo secrets

In your repo: **Settings → Secrets and variables → Actions → New repository secret**

| Secret | Example | Notes |
|--------|---------|-------|
| `NOTIFY_EMAIL` | `galindo.designer@gmail.com` | Where notifications are sent |
| `SMTP_SERVER` | `smtp.gmail.com` | Your mail provider’s SMTP host |
| `SMTP_PORT` | `587` | Usually `587` (TLS) or `465` (SSL) |
| `SMTP_USERNAME` | `you@gmail.com` | SMTP login (often same as email) |
| `SMTP_PASSWORD` | *(app password)* | Not your normal password — use an [app password](https://support.google.com/accounts/answer/185833) for Gmail |

The workflow [`.github/workflows/issue-notify.yml`](https://github.com/galindodesign/growthlab-infigma/blob/main/.github/workflows/issue-notify.yml) runs on every new issue. If any secret is missing, it skips silently (no failure).

## 2. Contact page email (optional)

To show **Email us** on the [Contact](/contact) page and in the Figma plugin footer, set in [`site-constants.ts`](https://github.com/galindodesign/growthlab-infigma/blob/main/site-constants.ts):

```ts
export const FEEDBACK_EMAIL = 'galindo.designer@gmail.com';
```

Use the same address as `NOTIFY_EMAIL` if you want one inbox for everything.

## 3. GitHub’s built-in notifications (free backup)

Watch the repo on GitHub (**Watch → All Activity**) and enable email in [GitHub notification settings](https://github.com/settings/notifications). You’ll also get emails for new issues without SMTP setup.
