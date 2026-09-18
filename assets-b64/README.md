# Binary sidecars

JPEG, PDF, and ZIP cannot go through the text-only GitHub file API, so the real
bytes live here as standard base64. A GitHub Action decodes them on push.

| Sidecar | Destination |
| --- | --- |
| `parts/og-*` | `public/og.jpg` (1200×630 Open Graph image) |
| `parts/xb-*` | `public/x-banner.jpg` (50:11 X feed card) |
| `parts/pdf-*` | `attachments/CoDA-Synth_Traditional_ML_Colab_Guide.pdf` |

The Action also writes `public/coda-synth-github.zip` (a snapshot of this repo).

Decode on your machine:

```bash
cat assets-b64/parts/og-* | base64 -d > public/og.jpg
cat assets-b64/parts/xb-* | base64 -d > public/x-banner.jpg
cat assets-b64/parts/pdf-* | base64 -d > attachments/CoDA-Synth_Traditional_ML_Colab_Guide.pdf
```

Always-current source zip (does not need the Action):

https://github.com/Rishabh-bgp/coda-synth/archive/refs/heads/main.zip
