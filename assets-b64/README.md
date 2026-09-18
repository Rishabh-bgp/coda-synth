# Binary sidecars

JPEG and PDF cannot go through the text-only GitHub file API, so the real
bytes live here as standard base64. A GitHub Action decodes them on push.

| Sidecar | Destination |
| --- | --- |
| `og.jpg.b64.0` + `og.jpg.b64.1` | `public/og.jpg` (1200×630 Open Graph image) |
| `x-banner.jpg.b64` | `public/x-banner.jpg` (50:11 X feed card) |
| `CoDA-Synth_Traditional_ML_Colab_Guide.pdf.b64` | `attachments/CoDA-Synth_Traditional_ML_Colab_Guide.pdf` |

Decode on your machine:

```bash
cat assets-b64/og.jpg.b64.0 assets-b64/og.jpg.b64.1 | base64 -d > public/og.jpg
base64 -d assets-b64/x-banner.jpg.b64 > public/x-banner.jpg
base64 -d assets-b64/CoDA-Synth_Traditional_ML_Colab_Guide.pdf.b64 \
  > attachments/CoDA-Synth_Traditional_ML_Colab_Guide.pdf
```

The source zip is not stored in git (it would duplicate the repo). Download:

https://github.com/Rishabh-bgp/coda-synth/archive/refs/heads/main.zip
