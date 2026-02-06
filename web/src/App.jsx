import { useState, useEffect, useMemo } from 'react'
import Sankey from './Sankey'

// Oslo kommune-inspirerte farger per gravplass
const STED_COLORS = {
  "Ikke spesifisert": "#999",
  "Alfaset gravlund": "#E67E22",
  "Høybråten kirkegård": "#8E44AD",
  "Nordre gravlund": "#1f42aa",
  "Ris kirkegård": "#034b45",
  "Ullern kirkegård": "#C0392B",
  "Vestre gravlund": "#16A085",
  "Voksen kirkegård": "#B8860B",
  "Vår Frelsers gravlund": "#2a2859",
  "Østre Aker kirkegård": "#6C3483",
}

const TEMA_COLORS = {
  "Bevare ro": "#C0392B",
}

const DEFAULT_TEMA_COLOR = "#555"

// Tema-gruppering fra granulære tags
const TEMA_MAP = {
  "digital formidling": "Digital formidling",
  "QR-koder": "Digital formidling",
  "app": "Digital formidling",
  "video": "Digital formidling",
  "lydformidling": "Digital formidling",
  "lydopplevelse": "Digital formidling",
  "omvisning": "Omvisning / vandring",
  "historisk vandring": "Omvisning / vandring",
  "vandring": "Omvisning / vandring",
  "informasjon": "Informasjon om gravlagte",
  "skilting": "Informasjon om gravlagte",
  "kjente personer": "Informasjon om gravlagte",
  "slektshistorie": "Informasjon om gravlagte",
  "slektsforskning": "Informasjon om gravlagte",
  "kulturhistorie": "Kulturhistorie",
  "kulturformidling": "Kulturhistorie",
  "lokalhistorie": "Kulturhistorie",
  "byhistorie": "Kulturhistorie",
  "litteratur": "Kulturhistorie",
  "kultur": "Kulturhistorie",
  "foredrag": "Foredrag / formidling",
  "gravskikker": "Foredrag / formidling",
  "trosretninger": "Foredrag / formidling",
  "natur": "Natur / botanikk",
  "botanikk": "Natur / botanikk",
  "biologisk mangfold": "Natur / botanikk",
  "bevare ro": "Bevare ro",
  "gravvern": "Bevare ro",
  "musikk": "Musikk / kultur",
  "konsert": "Musikk / kultur",
  "kulturarrangement": "Musikk / kultur",
  "kunst": "Musikk / kultur",
  "lysvandring": "Lysvandring",
  "vedlikehold": "Vedlikehold / infrastruktur",
  "infrastruktur": "Vedlikehold / infrastruktur",
  "belysning": "Vedlikehold / infrastruktur",
  "tilgjengelighet": "Vedlikehold / infrastruktur",
  "minnestund": "Minnestund / seremoni",
  "seremoni": "Minnestund / seremoni",
  "minnekultur": "Minnestund / seremoni",
  "barn og unge": "Pedagogikk / skoler",
  "pedagogikk": "Pedagogikk / skoler",
  "krigshistorie": "Pedagogikk / skoler",
  "barneaktiviteter": "Pedagogikk / skoler",
  "turområde": "Annet",
  "forskning": "Annet",
  "meditasjon": "Annet",
  "kafé": "Annet",
  "rusproblematikk": "Annet",
}

const NEGATIVE_HOLDNINGER = new Set(["kritisk", "negativ", "sterkt negativ"])

function buildSankeyData(innspill) {
  const linkMap = new Map()

  for (const item of innspill) {
    const isNeg = NEGATIVE_HOLDNINGER.has(item.holdning)
    const sentiment = isNeg ? "negativ" : "positiv"

    // Bruk spesifikke steder, eller "Ikke spesifisert" for innspill uten bestemt gravplass
    let steder = item.steder.filter(s => s !== "alle")
    if (steder.length === 0) steder = ["Ikke spesifisert"]

    for (const sted of steder) {
      for (const rawTema of item.tema) {
        const tema = TEMA_MAP[rawTema] || rawTema
        const key = `${sted}|||${tema}|||${sentiment}`
        linkMap.set(key, (linkMap.get(key) || 0) + 1)
      }
    }
  }

  const steder = new Set()
  const temaer = new Set()
  const links = []

  for (const [key, value] of linkMap) {
    const [sted, tema, sentiment] = key.split("|||")
    steder.add(sted)
    temaer.add(tema)
    links.push({ source: `sted:${sted}`, target: `tema:${tema}`, value, sentiment })
  }

  const nodes = [
    ...Array.from(steder).sort((a, b) => a.localeCompare(b, 'nb')).map(s => ({
      id: `sted:${s}`,
      label: s,
      type: "sted",
      color: STED_COLORS[s] || "#888",
    })),
    ...Array.from(temaer).sort((a, b) => {
      const aTotal = links.filter(l => l.target === `tema:${a}`).reduce((s, l) => s + l.value, 0)
      const bTotal = links.filter(l => l.target === `tema:${b}`).reduce((s, l) => s + l.value, 0)
      return bTotal - aTotal
    }).map(t => ({
      id: `tema:${t}`,
      label: t,
      type: "tema",
      color: TEMA_COLORS[t] || DEFAULT_TEMA_COLOR,
    })),
  ]

  return { nodes, links }
}

export default function App() {
  const [rawData, setRawData] = useState(null)
  const [spenninger, setSpenninger] = useState([])
  // filter: null | { type: 'sted'|'tema', value: string }
  const [filter, setFilter] = useState(null)

  useEffect(() => {
    fetch('/innspill.json')
      .then(r => r.json())
      .then(json => {
        setRawData(json.innspill)
        setSpenninger(json.oppsummering?.sentrale_spenninger || [])
      })
  }, [])

  const data = useMemo(() => {
    if (!rawData) return null
    return buildSankeyData(rawData)
  }, [rawData])

  if (!data) return null

  const steder = data.nodes.filter(n => n.type === "sted")
  const temaer = data.nodes.filter(n => n.type === "tema")

  const handleFilter = (type, value) => {
    if (filter && filter.type === type && filter.value === value) {
      setFilter(null)
    } else {
      setFilter({ type, value })
    }
  }

  return (
    <>
      <div className="app-header">
        <div className="pkt-container">
          <h1 className="pkt-txt-30-medium">Høringsinnspill – Aktiviteter på gravplasser</h1>
          <p className="pkt-txt-16-light">Klikk på en gravplass eller et tema for å filtrere</p>
        </div>
      </div>
      <div className="pkt-container">
        <div className="pkt-messagebox pkt-messagebox--compact" style={{ marginTop: '16px' }}>
          <div className="pkt-messagebox__text">
            Dette er en prototype-visualisering, ikke til reell bruk.
          </div>
        </div>
        <div className="description">
          <h2 className="pkt-txt-20-medium">Om visualiseringen</h2>
          <p>
            Diagrammet viser hva innbyggerne ønsker for Oslos gravplasser.
            Gravplasser står til venstre, typer innspill til høyre.
            Bredden på koblingene viser antall innspill.
          </p>
          <p>
            En språkmodell har kategorisert hvert innspill etter gravplass,
            holdning og tema. Beslektede temaer er slått sammen – for eksempel
            blir «QR-koder», «app» og «video» til «Digital formidling».
            Røde koblinger viser negativ eller kritisk holdning.
          </p>
          <p>
            Visualiseringen ble laget på en time i KI vibe-koding workshop 6.2.2026, lag issue på <a href="https://github.com/haakon-rokenes-dig/gravplasser" target="_blank" rel="noopener noreferrer">GitHub</a> for innspill/kontakt.
          </p>
        </div>

        {spenninger.length > 0 && (
          <div className="highlights">
            <h2 className="pkt-txt-20-medium">Nøkkeltemaer</h2>
            <div className="highlights-grid">
              {spenninger.map((s, i) => (
                <div key={i} className="highlight-card">
                  <div className="highlight-tema">{s.tema}</div>
                  <div className="highlight-desc">{s.beskrivelse}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="legend">
          <div className="legend-item">
            <div className="legend-swatch" style={{ background: '#2a2859' }} />
            <span>Strømfarge = gravplass</span>
          </div>
          <div className="legend-item">
            <div className="legend-swatch" style={{ background: '#C0392B' }} />
            <span>Negativ / kritisk holdning</span>
          </div>
        </div>

        <div className="chart-container">
          <Sankey
            data={data}
            filter={filter}
            stedColors={STED_COLORS}
            onClickSted={(label) => handleFilter('sted', label)}
            onClickTema={(label) => handleFilter('tema', label)}
          />
        </div>

        <div className="filters">
          <div className="filter-section">
            <div className="filter-label">Gravplass</div>
            <div className="filter-row">
              <button
                className={`filter-btn reset ${filter === null ? 'active' : ''}`}
                onClick={() => setFilter(null)}
              >
                Vis alle
              </button>
              {steder.map(s => (
                <button
                  key={s.id}
                  className={`filter-btn ${filter?.type === 'sted' && filter.value === s.label ? 'active' : ''}`}
                  style={{
                    borderColor: s.color,
                    color: filter?.type === 'sted' && filter.value === s.label ? 'white' : s.color,
                    background: filter?.type === 'sted' && filter.value === s.label ? s.color : 'white',
                  }}
                  onClick={() => handleFilter('sted', s.label)}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div className="filter-section">
            <div className="filter-label">Type innspill</div>
            <div className="filter-row">
              {temaer.map(t => (
                <button
                  key={t.id}
                  className={`filter-btn ${filter?.type === 'tema' && filter.value === t.label ? 'active' : ''}`}
                  style={{
                    borderColor: t.color,
                    color: filter?.type === 'tema' && filter.value === t.label ? 'white' : t.color,
                    background: filter?.type === 'tema' && filter.value === t.label ? t.color : 'white',
                  }}
                  onClick={() => handleFilter('tema', t.label)}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
