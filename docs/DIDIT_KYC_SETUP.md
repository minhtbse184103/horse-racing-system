# Didit KYC V3 setup

The application uses Didit only to open a wallet and enable betting. Owner and
Jockey role approval is independent from KYC.

## Environment

Set these values on the backend process. Never commit their real values.

```text
DIDIT_BASE_URL=https://verification.didit.me
DIDIT_API_KEY=...
DIDIT_WORKFLOW_ID=...
DIDIT_WEBHOOK_SECRET=...
DIDIT_EXPECTED_ENVIRONMENT=sandbox
DIDIT_REQUIRED_FEATURES=ID_VERIFICATION,LIVENESS,FACE_MATCH
FRONTEND_URL=http://localhost:5173
```

Add `IP_ANALYSIS` to `DIDIT_REQUIRED_FEATURES` only when that component is part
of the selected Didit workflow.

## Didit Console

1. Select a KYC workflow with ID verification, liveness and face match.
2. Set the webhook URL to `https://<backend-host>/api/webhooks/didit`.
3. The callback URL is `<FRONTEND_URL>/wallet/kyc/result`.
4. Put the API key, workflow ID and webhook secret in backend environment variables.
5. Set `DIDIT_EXPECTED_ENVIRONMENT` to the workflow environment.

Run `backend/src/main/resources/db/migration_manual/V20260716__replace_manual_kyc_with_didit.sql`
once against an existing database. It intentionally deletes legacy manual KYC
records because they are not Didit decisions. Use `team_schema.sql` for a fresh database.
