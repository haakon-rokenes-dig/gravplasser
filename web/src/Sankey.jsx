import { useMemo, useState, useCallback } from 'react'
import { sankey as d3Sankey, sankeyLinkHorizontal } from 'd3-sankey'

const WIDTH = 1200
const HEIGHT = 650
const MARGIN = { top: 8, right: 210, bottom: 8, left: 170 }
const NODE_WIDTH = 18
const NODE_PAD = 16

function hexToRgba(hex, alpha) {
  const h = hex.replace('#', '')
  const r = parseInt(h.substring(0, 2), 16)
  const g = parseInt(h.substring(2, 4), 16)
  const b = parseInt(h.substring(4, 6), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

export default function Sankey({ data, filter, stedColors, onClickSted, onClickTema }) {
  const [tooltip, setTooltip] = useState(null)

  // Layout beregnes EN gang
  const { nodes, links, pathGen } = useMemo(() => {
    const generator = d3Sankey()
      .nodeId(d => d.id)
      .nodeWidth(NODE_WIDTH)
      .nodePadding(NODE_PAD)
      .nodeSort(null)
      .extent([
        [MARGIN.left, MARGIN.top],
        [WIDTH - MARGIN.right, HEIGHT - MARGIN.bottom],
      ])

    const layout = generator({
      nodes: data.nodes.map(d => ({ ...d })),
      links: data.links.map(d => ({ ...d })),
    })

    return {
      nodes: layout.nodes,
      links: layout.links,
      pathGen: sankeyLinkHorizontal(),
    }
  }, [data])

  // Visuell tilstand basert på filter
  const { nodeOpacity, linkOpacity, linkStroke } = useMemo(() => {
    const nOp = {}
    const lOp = {}
    const lStroke = {}

    if (filter === null) {
      for (const node of nodes) nOp[node.id] = 1
      for (let i = 0; i < links.length; i++) {
        const link = links[i]
        const src = link.source
        const stedColor = stedColors[src.label] || '#888'
        lOp[i] = link.sentiment === 'negativ' ? 0.55 : 0.4
        lStroke[i] = link.sentiment === 'negativ'
          ? 'rgba(192,57,43,0.65)'
          : hexToRgba(stedColor, 0.6)
      }
      return { nodeOpacity: nOp, linkOpacity: lOp, linkStroke: lStroke }
    }

    // Finn tilkoblede noder
    const connectedIds = new Set()
    const activeId = filter.type === 'sted' ? `sted:${filter.value}` : `tema:${filter.value}`
    connectedIds.add(activeId)

    for (let i = 0; i < links.length; i++) {
      const link = links[i]
      const srcId = link.source.id
      const tgtId = link.target.id

      if (filter.type === 'sted' && srcId === activeId) {
        connectedIds.add(tgtId)
      } else if (filter.type === 'tema' && tgtId === activeId) {
        connectedIds.add(srcId)
      }
    }

    // Noder
    for (const node of nodes) {
      nOp[node.id] = connectedIds.has(node.id) ? 1 : 0.07
    }

    // Linker
    for (let i = 0; i < links.length; i++) {
      const link = links[i]
      const srcId = link.source.id
      const tgtId = link.target.id
      const isActive =
        (filter.type === 'sted' && srcId === activeId) ||
        (filter.type === 'tema' && tgtId === activeId)

      if (isActive) {
        const stedColor = stedColors[link.source.label] || '#888'
        lOp[i] = link.sentiment === 'negativ' ? 0.7 : 0.6
        lStroke[i] = link.sentiment === 'negativ'
          ? 'rgba(192,57,43,0.75)'
          : hexToRgba(stedColor, 0.75)
      } else {
        lOp[i] = 0.02
        lStroke[i] = 'rgba(200,200,200,0.05)'
      }
    }

    return { nodeOpacity: nOp, linkOpacity: lOp, linkStroke: lStroke }
  }, [filter, nodes, links, stedColors])

  const handleLinkHover = useCallback((e, link) => {
    if (!link) { setTooltip(null); return }
    setTooltip({
      x: e.clientX + 14,
      y: e.clientY - 8,
      source: link.source.label,
      target: link.target.label,
      value: link.value,
      sentiment: link.sentiment,
    })
  }, [])

  return (
    <>
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} preserveAspectRatio="xMidYMid meet">
        {/* Linker (under noder) */}
        <g>
          {links.map((link, i) => (
            <g key={i} className="sankey-link">
              <path
                d={pathGen(link)}
                stroke={linkStroke[i]}
                strokeWidth={Math.max(1.5, link.width)}
                strokeOpacity={linkOpacity[i]}
                onMouseMove={(e) => handleLinkHover(e, link)}
                onMouseLeave={() => handleLinkHover(null, null)}
              />
            </g>
          ))}
        </g>

        {/* Noder */}
        <g>
          {nodes.map(node => {
            const isSted = node.type === 'sted'
            const opacity = nodeOpacity[node.id]
            const dimmed = opacity < 0.5

            return (
              <g
                key={node.id}
                className="sankey-node clickable"
                onClick={() => {
                  if (isSted) onClickSted(node.label)
                  else onClickTema(node.label)
                }}
              >
                <rect
                  x={node.x0}
                  y={node.y0}
                  width={node.x1 - node.x0}
                  height={node.y1 - node.y0}
                  fill={dimmed ? '#ddd' : node.color}
                  opacity={opacity}
                />
                <text
                  x={isSted ? node.x0 - 8 : node.x1 + 8}
                  y={(node.y0 + node.y1) / 2}
                  textAnchor={isSted ? 'end' : 'start'}
                  dominantBaseline="middle"
                  fontSize={13.5}
                  fontWeight={isSted ? 700 : 400}
                  fill={dimmed ? '#bbb' : '#2c2c2c'}
                  opacity={dimmed ? 0.25 : 1}
                >
                  {node.label}
                </text>
              </g>
            )
          })}
        </g>
      </svg>

      <div
        className={`tooltip ${tooltip ? 'visible' : ''}`}
        style={tooltip ? { left: tooltip.x, top: tooltip.y } : {}}
      >
        {tooltip && (
          <>
            <div className="label">{tooltip.source} → {tooltip.target}</div>
            <div className="detail">
              {tooltip.value} innspill · {tooltip.sentiment === 'negativ' ? 'negativ/kritisk' : 'positiv'}
            </div>
          </>
        )}
      </div>
    </>
  )
}
