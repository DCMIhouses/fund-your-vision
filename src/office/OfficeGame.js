import { Application, Container, Graphics, Text } from 'pixi.js'
import { ACT, H, HAIR, HANDOFF, LEFT, PANTS, RIGHT, SHIRT, SKIN, TASKS, W, rowY, seatOf, where } from './layout'

const STATUS = { ok: 0x39ff88, watch: 0xfbbf24, alert: 0xff2e63 }
const TINT = { ok: 0x03140c, watch: 0x1f1704, alert: 0x22060d }
const WALK = 125
const lerp = (a, b, t) => a + (b - a) * t
const txt = (text, size, fill, weight = '700') => new Text({ text, style: { fontFamily: 'Inter, Arial, sans-serif', fontSize: size, fill, fontWeight: weight, align: 'center' }, resolution: 3 })

class Worker {
  constructor(game, id) {
    this.game = game
    this.id = id
    this.seat = seatOf(id)
    this.deskFacing = this.seat.side === 'L' ? -1 : 1
    this.x = this.seat.x
    this.y = this.seat.y
    this.state = 'typing'
    this.t = Math.random() * 10
    this.stateT = 0
    this.path = []
    this.onArrive = null
    this.job = null
    this.inbox = []
    this.hasDoc = false
    this.react = null
    this.away = false
    this.task = ACT[id]
    this.build()
  }
  build() {
    const c = new Container()
    c.eventMode = 'static'
    c.cursor = 'pointer'
    c.hitArea = { contains: (x, y) => x * x + (y + 6) * (y + 6) < 34 * 34 }
    c.on('pointertap', (e) => { e.stopPropagation(); this.game.cb.onSelect?.(this.id) })
    const g = (fn) => { const x = new Graphics(); fn(x); return x }
    this.ring = g((x) => x.ellipse(0, 26, 24, 8).stroke({ width: 3, color: 0xfbbf24 }))
    this.ring.visible = false
    this.shadow = g((x) => x.ellipse(0, 26, 16, 5).fill({ color: 0x000000, alpha: 0.35 }))
    const leg = () => g((x) => { x.roundRect(-3.5, 0, 7, 19, 3).fill(PANTS[this.id]); x.roundRect(-4, 16, 9, 5, 2).fill(0x0f172a) })
    this.legL = leg(); this.legL.position.set(-5, 10)
    this.legR = leg(); this.legR.position.set(5, 10)
    this.torso = g((x) => { x.roundRect(-12, -8, 24, 24, 8).fill(SHIRT[this.id]); x.rect(-2, -8, 4, 10).fill({ color: 0xffffff, alpha: 0.5 }) })
    const arm = () => g((x) => { x.roundRect(-3, 0, 6, 15, 3).fill(SHIRT[this.id]); x.circle(0, 16, 3.6).fill(SKIN[this.id]) })
    this.armL = arm(); this.armL.position.set(-11, -4)
    this.armR = arm(); this.armR.position.set(11, -4)
    this.doc = g((x) => { x.roundRect(-8, 0, 16, 20, 2).fill(0xf8fafc).stroke({ width: 1, color: 0x94a3b8 }); for (let i = 0; i < 3; i++) x.rect(-5, 5 + i * 4, 10, 1.6).fill(0x64748b) })
    this.doc.position.set(-8, 14)
    this.doc.visible = false
    this.armR.addChild(this.doc)
    this.head = new Container()
    this.head.position.set(0, -14)
    this.head.addChild(g((x) => { x.circle(0, -4, 11).fill(SKIN[this.id]); x.arc(0, -5, 11.5, Math.PI, 0).fill(HAIR[this.id]); x.circle(4, -3, 1.6).fill(0x111827) }))
    this.bubble = new Container()
    this.bubble.position.set(0, -50)
    this.bubbleBg = new Graphics()
    this.bubbleTx = txt('!', 16, 0xffffff, '900')
    this.bubbleTx.anchor.set(0.5)
    this.bubble.addChild(this.bubbleBg, this.bubbleTx)
    this.bubble.visible = false
    this.body = new Container()
    this.body.addChild(this.legL, this.legR, this.armL, this.torso, this.head, this.armR)
    c.addChild(this.ring, this.shadow, this.body, this.bubble)
    this.c = c
  }
  setBubble(ch, color) {
    this.bubbleBg.clear().circle(0, 0, 13).fill(color).stroke({ width: 2, color: 0xffffff })
    this.bubbleTx.text = ch
    this.bubble.visible = true
  }
  go(points, done) { this.path = points.map((p) => ({ ...p })); this.onArrive = done; this.state = 'walking' }
  sitting() { return ['typing', 'reading', 'idle', 'receiving', 'celebrating', 'error'].includes(this.state) && !this.away }
  update(dt) {
    this.t += dt
    this.stateT += dt
    const t = this.t
    const b = this.body
    let facing = this.deskFacing
    b.y = 0; b.x = 0
    this.armL.rotation = -0.9; this.armR.rotation = -0.9
    this.legL.rotation = 0; this.legR.rotation = 0
    this.head.rotation = 0
    this.torso.scale.y = 1
    const seated = this.sitting()
    this.legL.visible = this.legR.visible = !seated || this.state === 'standing'
    if (this.state === 'walking' || this.state === 'returning') {
      const p = this.path[0]
      if (p) {
        if (p.wait > 0) { p.wait -= dt } else {
          const dx = p.x - this.x, dy = p.y - this.y, d = Math.hypot(dx, dy)
          const blocked = this.game.workers.some((o) => o !== this && o.path.length && o.walkFacing === Math.sign(dx) && Math.sign(o.x - this.x) === Math.sign(dx) && Math.hypot(o.x - this.x, o.y - this.y) < 24)
          const step = blocked ? 0 : WALK * dt
          if (d <= step) { this.x = p.x; this.y = p.y; this.path.shift() } else { this.x += (dx / d) * step; this.y += (dy / d) * step }
          if (Math.abs(dx) > 1) this.walkFacing = Math.sign(dx)
        }
      }
      facing = this.walkFacing || facing
      const s = Math.sin(t * 11)
      this.legL.rotation = s * 0.6; this.legR.rotation = -s * 0.6
      b.y = -Math.abs(Math.sin(t * 11)) * 2
      this.armL.rotation = -s * 0.5
      this.armR.rotation = this.hasDoc ? -1.05 : s * 0.5
      if (!this.path.length) { const f = this.onArrive; this.onArrive = null; f?.() }
    } else if (this.state === 'standing') {
      const k = Math.min(1, this.stateT / 0.4)
      this.legL.scale.y = this.legR.scale.y = lerp(0.3, 1, k)
      b.y = lerp(4, -2, k)
      this.armR.rotation = this.hasDoc ? lerp(-0.9, -1.05, k) : -0.6
      if (k >= 1) { this.legL.scale.y = this.legR.scale.y = 1; const f = this.onStood; this.onStood = null; f?.() }
    } else if (this.state === 'delivering' || this.state === 'meeting') {
      facing = this.faceTo || facing
      this.armR.rotation = -1.55 + Math.sin(t * 4) * 0.05
      this.armL.rotation = -0.3
    } else if (this.state === 'receiving') {
      facing = this.faceTo || facing
      this.armR.rotation = -1.55
      this.head.rotation = 0.1
    } else if (this.state === 'typing') {
      this.armL.rotation = -1.35 + Math.sin(t * 18) * 0.14
      this.armR.rotation = -1.35 - Math.sin(t * 18 + 1) * 0.14
      this.head.rotation = Math.sin(t * 0.7) * 0.04
    } else if (this.state === 'reading') {
      this.armL.rotation = -1.1; this.armR.rotation = -1.15
      this.head.rotation = 0.12 + Math.sin(t * 1.3) * 0.03
    } else if (this.state === 'idle') {
      this.torso.scale.y = 1 + Math.sin(t * 2) * 0.03
      this.head.rotation = Math.sin(t * 0.8) * 0.18
    } else if (this.state === 'celebrating') {
      this.armL.rotation = 2.9; this.armR.rotation = -2.9
      b.y = -Math.abs(Math.sin(t * 9)) * 7
      if (this.stateT > 1.6) this.setState(this.job ? 'typing' : 'idle')
    } else if (this.state === 'error') {
      this.armL.rotation = 2.5; this.armR.rotation = -2.5
      b.x = Math.sin(t * 40) * 1.6
      if (this.stateT > 1.8) this.setState(this.job ? 'typing' : 'idle')
    }
    if (this.state !== 'standing') { this.legL.scale.y = this.legR.scale.y = 1 }
    if (!this.job && !this.away && (this.state === 'typing' || this.state === 'idle') && this.stateT > 4 + (this.id.length % 3)) this.setState(this.state === 'typing' ? 'idle' : 'typing')
    this.doc.visible = this.hasDoc
    this.body.scale.x = facing
    if (this.react && this.t > this.react) { this.bubble.visible = false; this.react = null }
    this.c.position.set(this.x, this.y)
    this.c.zIndex = this.y + (seated ? 0 : 5)
  }
  setState(s) { this.state = s; this.stateT = 0 }
  taskText() {
    if (this.state === 'returning') return 'Walking back to desk'
    if (this.state === 'walking') return this.carryTo ? `Carrying ${this.job?.title || 'work'} → ${this.game.name(this.carryTo)}` : 'Walking back to desk'
    if (this.state === 'standing') return 'Standing up'
    if (this.state === 'delivering') return `Handing over → ${this.game.name(this.carryTo)}`
    if (this.state === 'receiving') return 'Receiving a document'
    if (this.state === 'celebrating') return 'Celebrating a win!'
    if (this.state === 'error') return 'Problem! Needs attention'
    if (this.job) return `${this.job.title} · ${Math.round(this.progress * 100)}%`
    return `${ACT[this.id]}${this.state === 'idle' ? ' (idle)' : ''}`
  }
}

export default class OfficeGame {
  async init(host, cb) {
    this.cb = cb
    this.speed = 1
    this.paused = false
    this.cam = { zoom: 1, cx: W / 2, cy: H / 2 }
    this.followId = null
    this.agents = {}
    this.app = new Application()
    await this.app.init({ resizeTo: host, background: '#0a1124', antialias: true, autoDensity: true, resolution: Math.min(2, window.devicePixelRatio || 1) })
    if (this.dead) { this.app.destroy(true, { children: true }); return }
    host.appendChild(this.app.canvas)
    this.app.canvas.style.touchAction = 'none'
    this.world = new Container()
    this.world.sortableChildren = true
    this.app.stage.addChild(this.world)
    this.drawRoom()
    this.workers = [...LEFT, ...RIGHT].filter(Boolean).map((id) => new Worker(this, id))
    this.workers.forEach((w) => this.world.addChild(w.c))
    this.bindCamera()
    this.app.ticker.add((tk) => this.tick(tk.deltaMS / 1000))
    window.__fyvOffice = this
  }
  name(id) { return this.agents[id]?.name || id }
  worker(id) { return this.workers.find((w) => w.id === id) }
  drawRoom() {
    const floor = new Graphics()
    floor.roundRect(0, 0, W, H, 18).fill(0x0d1530)
    for (let x = -H; x < W + H; x += 44) floor.moveTo(x, 0).lineTo(x + H * 0.25, H).stroke({ width: 1, color: 0x94a3b8, alpha: 0.06 })
    for (let y = 0; y < H; y += 44) floor.moveTo(0, y).lineTo(W, y).stroke({ width: 1, color: 0x94a3b8, alpha: 0.06 })
    floor.rect(0, 0, W, 26).fill(0x0f172a)
    floor.rect(0, 0, 36, H).fill(0x0b1226); floor.rect(W - 36, 0, 36, H).fill(0x0b1226)
    floor.roundRect(404, 34, 192, H - 46, 14).fill({ color: 0x22d3ee, alpha: 0.035 }).stroke({ width: 1.5, color: 0x22d3ee, alpha: 0.18 })
    floor.zIndex = -10
    this.world.addChild(floor)
    const sign = txt('FYV CAPITAL OFFICE', 11, 0x64748b, '800'); sign.anchor.set(0.5, 0); sign.position.set(W / 2, 7); sign.zIndex = -9
    const aisle = txt('CENTER AISLE', 11, 0x475569, '800'); aisle.anchor.set(0.5); aisle.position.set(W / 2, H - 22); aisle.zIndex = -9
    this.world.addChild(sign, aisle)
    this.desks = {}
    const desk = (id, side, i) => {
      const L = side === 'L', y = rowY(i), dx = L ? 56 : 748, sx = L ? 84 : 778, sy = y - 8, sw = 138, sh = 76
      const g = new Graphics()
      g.roundRect(dx, y + 22, 196, 56, 6).fill(0x1e293b).stroke({ width: 1, color: 0x334155 })
      g.roundRect(dx, y + 76, 196, 10, 3).fill(0x0b1222)
      g.roundRect(L ? dx + 148 : dx + 10, y + 52, 38, 12, 2).fill(0x0f172a).stroke({ width: 1, color: 0x334155 })
      g.rect(sx + sw / 2 - 6, sy + sh, 12, 14).fill(0x334155)
      const seat = id ? seatOf(id) : { x: L ? 286 : 714, y: y + 44 }
      g.roundRect(seat.x - 18, seat.y - 10, 36, 36, 10).fill(0x1f2937).stroke({ width: 1, color: 0x334155 })
      g.zIndex = y - 40
      const frame = new Graphics(); frame.zIndex = y - 39
      const scr = new Graphics(); scr.zIndex = y - 38
      frame.eventMode = 'static'; frame.cursor = 'pointer'
      frame.on('pointertap', (e) => { e.stopPropagation(); cbScreen(id || (L ? 'empty9' : 'empty10')) })
      const cbScreen = (k) => this.cb.onScreen?.(k)
      const lx = L ? 160 : 840
      const nm = txt(id ? '' : `Future Agent ${L ? 9 : 10}`, 16, id ? 0xf8fafc : 0x64748b, '800'); nm.anchor.set(0.5, 0); nm.position.set(lx, y + 92); nm.zIndex = 900
      const tk = txt(id ? '' : 'Open desk · ready for expansion', 12, 0x94a3b8, '600'); tk.anchor.set(0.5, 0); tk.position.set(lx, y + 112); tk.zIndex = 900
      this.world.addChild(g, frame, scr, nm, tk)
      this.desks[id || side] = { frame, scr, nm, tk, sx, sy, sw, sh, empty: !id }
      if (!id) { frame.roundRect(sx - 4, sy - 4, sw + 8, sh + 8, 8).fill(0x0b1020).stroke({ width: 3, color: 0x334155 }); scr.roundRect(sx, sy, sw, sh, 5).fill(0x020617); const off = txt('OFF', 13, 0x475569, '800'); off.anchor.set(0.5); off.position.set(sx + sw / 2, sy + sh / 2); off.zIndex = y - 37; this.world.addChild(off) }
    }
    LEFT.forEach((id, i) => desk(id, 'L', i))
    RIGHT.forEach((id, i) => desk(id, 'R', i))
  }
  drawScreen(w) {
    const d = this.desks[w.id], a = this.agents[w.id]
    const st = a?.status || 'ok', col = STATUS[st]
    const { sx: x, sy: y, sw, sh } = d, t = w.t, cx = x + sw / 2
    const blink = st === 'alert' ? 0.55 + 0.45 * Math.abs(Math.sin(t * 3)) : 1
    d.frame.clear().roundRect(x - 4, y - 4, sw + 8, sh + 8, 8).fill(0x0b1020).stroke({ width: w.job ? 4 : 3, color: col, alpha: blink })
    const g = d.scr.clear()
    g.roundRect(x, y, sw, sh, 5).fill(TINT[st])
    if (w.away) { g.roundRect(cx - 40, y + sh / 2 - 8, 80, 16, 8).fill({ color: 0x334155, alpha: 0.6 }); return }
    const sp = w.job ? 2.2 : 1
    const k = (t * sp) % 4 / 4
    switch (w.id) {
      case 'cfo': { const pts = [[10, 60], [34, 50], [58, 54], [82, 34], [106, 26], [128, 14]]; const n = Math.max(2, Math.ceil(k * pts.length)); g.moveTo(x + 10, y + 64).lineTo(x + 128, y + 64).stroke({ width: 1, color: 0x334155 }); for (let i = 0; i < 4; i++) g.rect(x + 14 + i * 18, y + 64 - (14 + 10 * Math.abs(Math.sin(t * sp + i))), 10, 14 + 10 * Math.abs(Math.sin(t * sp + i))).fill({ color: 0x16a34a, alpha: 0.5 }); g.moveTo(x + pts[0][0], y + pts[0][1]); for (let i = 1; i < n; i++) g.lineTo(x + pts[i][0], y + pts[i][1]); g.stroke({ width: 3, color: col }); break }
      case 'reporting': { g.roundRect(cx - 34, y + 7, 68, sh - 14, 3).fill(0xe2e8f0); g.rect(cx - 28, y + 12, 36, 6).fill(0x2563eb); for (let i = 0; i < 4; i++) g.rect(cx - 28, y + 24 + i * 9, 56 * Math.min(1, Math.max(0, k * 5 - i)), 4).fill(0x64748b); g.circle(cx + 22, y + 15, 5).fill(0xfbbf24); break }
      case 'risk': { const a2 = 0.4 + 0.6 * Math.abs(Math.sin(t * 3 * sp)); g.poly([cx - 22, y + 52, cx, y + 12, cx + 22, y + 52]).stroke({ width: 4, color: col, alpha: a2 }); g.rect(cx - 2, y + 24, 4, 14).fill(col); g.rect(cx - 2, y + 42, 4, 4).fill(col); for (let i = 0; i < 2; i++) g.rect(x + 12 + i * (sw - 34), y + 60 - 34 * Math.abs(Math.sin(t * sp + i)), 10, 34 * Math.abs(Math.sin(t * sp + i))).fill({ color: 0xff2e63, alpha: 0.45 }); break }
      case 'architect': { for (let i = 0; i < 3; i++) { const v = Math.min(1, Math.max(0, k * 4 - i)); g.roundRect(x + 14, y + 14 + i * 18, (sw - 60) * v, 12, 3).fill([0x7c3aed, 0x22d3ee, 0xfbbf24][i]) } g.circle(x + sw - 24, y + sh / 2, 15).stroke({ width: 5, color: 0x334155 }); g.moveTo(x + sw - 24, y + sh / 2 - 15).arc(x + sw - 24, y + sh / 2, 15, -Math.PI / 2, -Math.PI / 2 + k * Math.PI * 2).stroke({ width: 5, color: col }); break }
      case 'underwriting': { g.roundRect(cx - 34, y + 7, 68, sh - 14, 3).fill(0xcffafe); for (let i = 0; i < 4; i++) { g.rect(cx - 28, y + 13 + i * 12, 12, 7).fill({ color: 0x0891b2, alpha: 0.6 }); g.rect(cx - 12, y + 14 + i * 12, 38, 5).fill(0x94a3b8) } g.rect(cx - 38, y + 9 + Math.abs(Math.sin(t * 1.4 * sp)) * 52, 76, 4).fill({ color: col, alpha: 0.9 }); break }
      case 'vc': { const hi = Math.floor(t * sp) % 2; for (let i = 0; i < 2; i++) { const ox = x + 12 + i * 62; g.roundRect(ox, y + 10, 52, sh - 20, 4).fill(i === hi ? 0xfce7f3 : 0x334155).stroke({ width: 2, color: i === hi ? col : 0x475569 }); g.rect(ox + 6, y + 18, 40, 4).fill(0x64748b); g.rect(ox + 6, y + 48 - 18 * (i ? 0.6 : 1), 14, 18 * (i ? 0.6 : 1) + 0).fill(0xdb2777); g.rect(ox + 24, y + 48 - 12, 14, 12).fill(0x94a3b8) } break }
      case 'growth': { for (let i = 0; i < 5; i++) { const hgt = 10 + i * 9 * (0.7 + 0.3 * Math.sin(t * sp + i)); g.rect(x + 14 + i * 18, y + 66 - hgt, 12, hgt).fill(0xea580c) } g.poly([x + sw - 26, y + 16, x + sw - 14, y + 30, x + sw - 38, y + 30]).fill(col); break }
      case 'guide': { for (let i = 0; i < 3; i++) { const on = Math.floor(k * 4) > i; g.roundRect(i % 2 ? x + sw - 84 : x + 12, y + 10 + i * 20, i === 2 ? 50 : 72, 14, 7).fill(on ? (i % 2 ? 0x334155 : 0x0d9488) : { color: 0x334155, alpha: 0.25 }) } break }
      default:
    }
    if (w.job) { g.roundRect(x + 6, y + sh - 8, sw - 12, 4, 2).fill(0x1e293b); g.roundRect(x + 6, y + sh - 8, (sw - 12) * w.progress, 4, 2).fill(0xfbbf24) }
  }
  visitPoint(id) { const s = seatOf(id); return { x: s.x + (s.side === 'L' ? 44 : -44), y: s.y } }
  aislePoint(id, lane) { const s = seatOf(id); return { x: s.side === 'L' ? 440 : 560, y: s.y + lane } }
  startJob(id, title, chain, source = 'player') {
    const w = this.worker(id)
    if (!w || w.job || w.away) return false
    const job = { id: `${id}-${Date.now()}`, title, chain, idx: 0, source }
    this.cb.onEvent?.({ type: 'start', text: `${this.name(id)} started: ${title}${source === 'event' ? ' (game event)' : ''}` })
    this.work(w, job, 3)
    return true
  }
  assign(id) { const t = TASKS[id]; return this.startJob(id, t.title, t.chain, 'player') }
  work(w, job, secs) {
    w.job = job; w.progress = 0; w.workLeft = secs; w.workTotal = secs
    w.setState(w.hasDoc ? 'reading' : 'typing')
  }
  finishWork(w) {
    const job = w.job
    const next = job.chain[job.idx + 1]
    if (!next) {
      w.job = null; w.hasDoc = false
      w.setState('celebrating'); w.setBubble('★', 0x16a34a); w.react = w.t + 1.6
      this.cb.onEvent?.({ type: 'done', job, by: w.id, text: `${this.name(w.id)} finished: ${job.title}. Output ready.` })
      this.nextFromInbox(w)
      return
    }
    w.hasDoc = true
    w.carryTo = next
    w.setState('standing')
    w.away = true
    w.onStood = () => {
      const lane = -14
      w.go([this.visitPoint(w.id), this.aislePoint(w.id, lane), this.aislePoint(next, lane), this.visitPoint(next)], () => this.handoff(w, next, job))
    }
    this.cb.onEvent?.({ type: 'walk', text: `${this.name(w.id)} picks up the ${job.title} folder and walks it to ${this.name(next)}` })
  }
  seatSide(id) { return where(id)[0] }
  handoff(w, toId, job) {
    const r = this.worker(toId)
    w.faceTo = Math.sign(r.x - w.x) || 1
    w.setState('delivering')
    const rSeated = r.sitting() && !r.job
    if (rSeated) { r.faceTo = Math.sign(w.x - r.x) || 1; r.setState('receiving') }
    setTimeoutScaled(this, 0.9, () => {
      w.hasDoc = false
      const nextJob = { ...job, idx: job.idx + 1 }
      this.cb.onEvent?.({ type: 'handoff', text: `${this.name(w.id)} handed the ${job.title} to ${this.name(toId)}` })
      if (rSeated) { r.hasDoc = true; this.work(r, nextJob, toId === 'reporting' ? 4 : 3) } else r.inbox.push(nextJob)
      w.carryTo = null
      w.go([this.aislePoint(toId, 14), this.aislePoint(w.id, 14), this.visitPoint(w.id), { x: w.seat.x, y: w.seat.y }], () => {
        w.away = false; w.walkFacing = 0
        w.setState('typing')
        this.nextFromInbox(w)
      })
      w.state = 'returning'
    })
  }
  nextFromInbox(w) { const j = w.inbox.shift(); if (j) { w.hasDoc = true; this.work(w, j, 3) } }
  setAgents(list) {
    for (const a of list) {
      const prev = this.agents[a.id]
      this.agents[a.id] = a
      const d = this.desks?.[a.id]
      if (d) d.nm.text = `${a.icon} ${a.name}`
      const w = this.worker(a.id)
      if (!prev || !w) continue
      if (prev.status !== 'alert' && a.status === 'alert' && !w.away) { w.setState('error'); w.setBubble('!', 0xdc2626); w.react = w.t + 1.8 }
      else if (prev.status !== 'ok' && a.status === 'ok' && !w.away) { w.setState('celebrating'); w.setBubble('★', 0x16a34a); w.react = w.t + 1.6 }
      if (prev.finding !== a.finding && HANDOFF[a.id]) setTimeoutScaled(this, 2, () => this.startJob(a.id, 'New finding', [a.id, HANDOFF[a.id]], 'event'))
    }
  }
  tick(rawDt) {
    if (this.dead) return
    const dt = this.paused ? 0 : Math.min(0.25, rawDt) * this.speed
    this.timers = (this.timers || []).filter((tm) => { tm.left -= dt; if (tm.left <= 0) { tm.fn(); return false } return true })
    for (const w of this.workers) {
      if (w.job && !w.away && (w.state === 'typing' || w.state === 'reading')) {
        w.workLeft -= dt
        w.progress = Math.min(1, 1 - w.workLeft / w.workTotal)
        if (w.state === 'reading' && w.workTotal - w.workLeft > 1) w.setState('typing')
        if (w.workLeft <= 0) this.finishWork(w)
      }
      w.update(dt)
      this.drawScreen(w)
      const d = this.desks[w.id]
      const tt = w.taskText(), fill = STATUS[this.agents[w.id]?.status || 'ok']
      if (d.tk.text !== tt) d.tk.text = tt
      if (d.lastFill !== fill) { d.tk.style.fill = fill; d.lastFill = fill }
      w.ring.visible = this.selected === w.id
    }
    this.applyCamera()
  }
  bindCamera() {
    const cv = this.app.canvas
    let drag = null
    this.app.stage.eventMode = 'static'
    this.app.stage.hitArea = this.app.screen
    this.app.stage.on('pointerdown', (e) => { drag = { x: e.global.x, y: e.global.y, cx: this.cam.cx, cy: this.cam.cy } })
    this.app.stage.on('pointermove', (e) => { if (!drag) return; const s = this.scale(); this.cam.cx = drag.cx - (e.global.x - drag.x) / s; this.cam.cy = drag.cy - (e.global.y - drag.y) / s; if (Math.hypot(e.global.x - drag.x, e.global.y - drag.y) > 4) this.followId = null })
    const end = () => { drag = null }
    this.app.stage.on('pointerup', end); this.app.stage.on('pointerupoutside', end)
    cv.addEventListener('wheel', (e) => { e.preventDefault(); this.zoomBy(Math.exp(-e.deltaY * 0.0015)) }, { passive: false })
  }
  base() { const r = this.app.screen; return Math.min(r.width / W, r.height / H) }
  scale() { return this.base() * this.cam.zoom }
  zoomBy(f) { this.cam.zoom = Math.max(0.7, Math.min(3, this.cam.zoom * f)) }
  overview() { this.cam = { zoom: 1, cx: W / 2, cy: H / 2 }; this.followId = null }
  follow(id) { this.followId = id; if (this.cam.zoom < 1.6) this.cam.zoom = 1.8 }
  select(id) { this.selected = id }
  applyCamera() {
    const r = this.app.screen, s = this.scale()
    if (this.followId) { const w = this.worker(this.followId); this.cam.cx = lerp(this.cam.cx, w.x, 0.12); this.cam.cy = lerp(this.cam.cy, w.y, 0.12) }
    this.world.scale.set(s)
    this.world.position.set(r.width / 2 - this.cam.cx * s, r.height / 2 - this.cam.cy * s)
  }
  screenPoint(id) { const w = this.worker(id); const p = this.world.toGlobal({ x: w.x, y: w.y - 6 }); const b = this.app.canvas.getBoundingClientRect(); return { x: b.left + p.x, y: b.top + p.y } }
  stateOf(id) { const w = this.worker(id); return w ? { state: w.state, task: w.taskText(), busy: !!w.job || w.away } : null }
  destroy() { this.dead = true; if (this.app?.renderer) { this.app.destroy(true, { children: true }) } if (window.__fyvOffice === this) window.__fyvOffice = null }
}

function setTimeoutScaled(game, secs, fn) { (game.timers ||= []).push({ left: secs, fn }) }
