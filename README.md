# Høringsinnspill – Aktiviteter på gravplasser i Oslo

Interaktiv visualisering av 42 høringsinnspill om aktiviteter på gravplasser i Oslo.

**Se visualiseringen:** https://haakon-rokenes-dig.github.io/gravplasser/

## Hva viser dette?

Et Sankey-diagram som kobler gravplasser (venstre) til typer innspill (høyre). Bredden på koblingene viser antall innspill. Røde koblinger markerer negativ eller kritisk holdning.

Du kan klikke på gravplasser eller temaer for å filtrere.

## Datagrunnlag

Kildedataen er 42 høringsinnspill fra innbyggere i Oslo om aktiviteter på gravplasser. Datasettet inneholder ingen persondata eller originaltekst – kun strukturerte kategorier:

- **Gravplass** – hvilken gravplass innspillet gjelder (eller «Ikke spesifisert»)
- **Holdning** – positiv, negativ, kritisk, nøytral, ambivalent eller sterkt negativ
- **Tema** – ett eller flere temaer per innspill (f.eks. «digital formidling», «bevare ro»)

En språkmodell har analysert og kategorisert hvert innspill. Beslektede temaer er gruppert – for eksempel blir «QR-koder», «app» og «video» til «Digital formidling».

Se [`innspill.json`](innspill.json) for det fullstendige datasettet.

## Teknologi

- **React** + **d3-sankey** for visualisering
- **Vite** for bygging
- Oslo kommune **Punkt** designsystem for styling
- **GitHub Pages** via GitHub Actions for hosting

## Utvikling

```bash
cd web
npm install
npm run dev
```

## Bakgrunn

Visualiseringen ble laget på en time i en KI vibe-koding workshop 6. februar 2026.
