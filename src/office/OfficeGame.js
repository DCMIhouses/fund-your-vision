import { Application, Container, FillGradient, Graphics, Rectangle, Text } from 'pixi.js'
import { ACT, H, HAIR, HANDOFF, LEFT, PANTS, RIGHT, SHIRT, SKIN, STYLE, TASKS, W, rowY, seatOf, where } from './layout'

const STATUS = { ok: 0x39ff88, watch: 0xfbbf24, alert: 0xff2e63 }
const TINT = { ok: 0x03140c, watch: 0x1f1704, alert: 0x22060d }
const WALK = 125
const lerp = (a, b, t) => a + (b - a) * t
const shade = (c, f) => { const m = (v) => Math.max(0, Math.min(255, Math.round(f < 0 ? v * (1 + f) : v + (255 - v) * f))); return (m((c >> 16) & 255) << 16) | (m((c >> 8) & 255) << 8) | m(c & 255) }
const rnd = (i) => { const v = Math.sin(i * 99.13) * 43758.5453; return v - Math.floor(v) }
const lin = (a, b) => new FillGradient({ type: 'linear', start: { x: 0, y: 0 }, end: { x: 0, y: 1 }, colorStops: [{ offset: 0, color: a }, { offset: 1, color: b }], textureSpace: 'local' })
const DESK = lin(0x37475f, 0x222e44), WALL = lin(0x15213f, 0x0b1226), SKY = lin(0x1e3a8a, 0x0f172a)
const POOL = new FillGradient({ type: 'radial', center: { x: 0.5, y: 0.5 }, innerRadius: 0, outerCenter: { x: 0.5, y: 0.5 }, outerRadius: 0.5, colorStops: [{ offset: 0, color: 'rgba(255,214,150,0.16)' }, { offset: 1, color: 'rgba(255,214,150,0)' }], textureSpace: 'local' })
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
    const id = this.id, st = STYLE[id], sh = SHIRT[id], sk = SKIN[id], hr = HAIR[id]
    const c = new Container()
    c.eventMode = 'static'
    c.cursor = 'pointer'
    c.hitArea = { contains: (x, y) => x * x + (y + 6) * (y + 6) < 34 * 34 }
    c.on('pointertap', (e) => { e.stopPropagation(); this.game.cb.onSelect?.(this.id) })
    const g = (fn) => { const x = new Graphics(); fn(x); return x }
    const OL = { width: 1.4, color: 0x0b1020, alpha: 0.55 }
    this.ring = g((x) => x.ellipse(0, 26, 27, 9).fill({ color: 0xfbbf24, alpha: 0.14 }).stroke({ width: 3, color: 0xfbbf24 }))
    this.ring.visible = false
    this.shadow = g((x) => { x.ellipse(0, 27, 19, 6).fill({ color: 0x000000, alpha: 0.28 }); x.ellipse(0, 27, 11, 3.5).fill({ color: 0x000000, alpha: 0.3 }) })
    const leg = () => g((x) => {
      x.roundRect(-4, 0, 8, 19, 3.5).fill(PANTS[id]).stroke(OL)
      x.rect(-2.8, 1.5, 2, 13).fill({ color: 0xffffff, alpha: 0.1 })
      x.roundRect(-4.5, 16, 11, 6, 3).fill(0x0b1020)
      x.rect(-2, 17, 5, 1.4).fill({ color: 0xffffff, alpha: 0.28 })
    })
    this.legL = leg(); this.legL.position.set(-5, 10)
    this.legR = leg(); this.legR.position.set(5, 10)
    this.torso = g((x) => {
      x.roundRect(-13, -10, 26, 27, 9).fill(sh).stroke(OL)
      x.roundRect(3, -8, 9, 23, 6).fill({ color: 0x000000, alpha: 0.2 })
      x.roundRect(-11, -8, 5, 18, 3).fill({ color: 0xffffff, alpha: 0.14 })
      if (st.acc === 'blazer') {
        x.poly([-5, -10, 0, 6, 5, -10]).fill(0xf8fafc)
        x.poly([-12, -7, -5, -10, 0, 6, -10, 12]).fill(shade(sh, -0.35))
        x.poly([12, -7, 5, -10, 0, 6, 10, 12]).fill(shade(sh, -0.35))
      } else x.poly([-6, -10, 0, -3, 6, -10]).fill(0xf8fafc)
      if (st.acc === 'tie' || st.acc === 'blazer') x.poly([-1.7, -5, 1.7, -5, 2.8, 7, 0, 10, -2.8, 7]).fill(id === 'vc' ? 0x1e293b : 0xfbbf24)
      x.rect(-12, 13, 24, 3).fill(0x0f172a)
      x.rect(-2, 13, 4, 3).fill(0xfbbf24)
      x.circle(7.5, -2, 2).fill(0xfbbf24)
    })
    const arm = () => g((x) => {
      x.roundRect(-3.5, 0, 7, 15, 3.5).fill(sh).stroke(OL)
      x.rect(-3.5, 11.5, 7, 2.5).fill(shade(sh, -0.3))
      x.circle(0, 16.5, 4).fill(sk).stroke({ width: 1, color: shade(sk, -0.35) })
    })
    this.armL = arm(); this.armL.position.set(-11, -4)
    this.armR = arm(); this.armR.position.set(11, -4)
    this.doc = g((x) => {
      x.roundRect(-9, 0, 18, 22, 2).fill(0xe8b64c).stroke({ width: 1, color: 0x8c6a39 })
      x.roundRect(-7, -2, 15, 21, 1.5).fill(0xfffbeb).stroke({ width: 0.8, color: 0xcbd5e1 })
      for (let i = 0; i < 3; i++) x.rect(-4.5, 4 + i * 4, 10, 1.6).fill(0x64748b)
      x.circle(4.5, 15.5, 2.2).fill(0xfbbf24)
    })
    this.doc.position.set(-8, 14)
    this.doc.visible = false
    this.armR.addChild(this.doc)
    this.head = new Container()
    this.head.position.set(0, -14)
    const back = new Graphics(), face = new Graphics(), front = new Graphics()
    if (st.hair === 'afro') back.circle(0, -7, 15).fill(hr)
    if (st.hair === 'long') back.roundRect(-12, -14, 21, 27, 9).fill(hr)
    if (st.hair === 'pony') back.ellipse(-12, -1, 4.5, 9).fill(hr)
    if (st.hair === 'bun') back.circle(-5, -16, 5.5).fill(hr)
    face.rect(-3, 4, 6, 5).fill(shade(sk, -0.2))
    face.circle(0, -4, 11).fill(sk).stroke({ width: 1.2, color: shade(sk, -0.4) })
    face.circle(-7, -3, 2.6).fill(shade(sk, -0.12))
    face.circle(7, 0.5, 2.2).fill({ color: 0xff7a8a, alpha: 0.28 })
    face.moveTo(2.5, 3).quadraticCurveTo(5, 5.2, 7.5, 3).stroke({ width: 1.2, color: 0x7f1d1d })
    this.eyes = new Graphics()
    this.eyes.position.set(0, -4)
    this.eyes.ellipse(2, 0, 1.4, 1.9).fill(0x111827).ellipse(7, 0, 1.3, 1.8).fill(0x111827)
    this.eyes.circle(2.4, -0.7, 0.55).fill(0xffffff).circle(7.3, -0.7, 0.5).fill(0xffffff)
    switch (st.hair) {
      case 'side': front.arc(0, -5, 11.6, Math.PI, 0).fill(hr); front.poly([-11, -6, -2, -17, 12, -8, 7, -7, -1, -10]).fill(hr); break
      case 'curly': for (let i = 0; i < 7; i++) { const a = Math.PI + (i / 6) * Math.PI; front.circle(Math.cos(a) * 10, -5 + Math.sin(a) * 10, 4.2).fill(hr) } break
      case 'buzz': front.arc(0, -5, 11.3, Math.PI * 1.02, -0.02).fill({ color: hr, alpha: 0.85 }); break
      case 'afro': front.arc(0, -6, 12.5, Math.PI * 1.05, -0.05).fill(hr); break
      case 'long': front.arc(0, -5, 11.8, Math.PI, 0).fill(hr); front.roundRect(-12, -7, 5, 15, 2.5).fill(hr); break
      case 'pony': front.arc(0, -5, 11.6, Math.PI, 0).fill(hr); front.rect(-11.5, -4, 3, 3).fill(0xfbbf24); break
      default: front.arc(0, -5, 11.6, Math.PI, 0).fill(hr); front.poly([-11, -6, 6, -12, 11, -6, 3, -9]).fill(hr)
    }
    front.moveTo(0.4, -8.4).lineTo(3.6, -8.9).stroke({ width: 1.2, color: shade(hr, 0.1) }).moveTo(5.6, -8.9).lineTo(8.6, -8.4).stroke({ width: 1.2, color: shade(hr, 0.1) })
    if (st.acc === 'glasses') front.circle(2.3, -4, 3).stroke({ width: 1.2, color: 0x0f172a }).circle(7.6, -4, 2.6).stroke({ width: 1.2, color: 0x0f172a }).moveTo(-0.7, -4).lineTo(-6, -4.5).stroke({ width: 1, color: 0x0f172a })
    if (st.acc === 'headset') {
      front.arc(0, -5, 12.5, Math.PI * 1.05, -0.05).stroke({ width: 2, color: 0x1f2937 }).circle(-8.5, -3, 3.4).fill(0x1f2937)
      front.moveTo(-8, 0).quadraticCurveTo(-2, 7, 5, 4.5).stroke({ width: 1.4, color: 0x1f2937 }).circle(5, 4.5, 1.5).fill(0x22d3ee)
    }
    if (st.acc === 'beard') { front.moveTo(-6, -1).quadraticCurveTo(1, 11, 10, -1).quadraticCurveTo(3, 5, -6, -1).fill(hr); front.moveTo(3, 3.5).lineTo(7, 3.5).stroke({ width: 1.2, color: 0xfde2e4 }) }
    this.head.addChild(back, face, this.eyes, front)
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
    c.scale.set(1.12)
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
    this.eyes.scale.y = (t % 4.2) < 0.13 ? 0.15 : 1
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
    this.fx = new Graphics(); this.fx.zIndex = -5
    this.fxTop = new Graphics(); this.fxTop.zIndex = 950
    this.world.addChild(this.fx, this.fxTop)
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
    floor.zIndex = -10
    floor.roundRect(0, 0, W, H, 18).fill(0x0c1328)
    for (let y = 40, r = 0; y < H; y += 22, r++) {
      floor.rect(36, y, W - 72, 22).fill(r % 2 ? 0x1c2131 : 0x1e2334)
      for (let x = 36 + ((r * 97) % 230); x < W - 36; x += 230) floor.rect(x, y, 1, 22).fill({ color: 0x000000, alpha: 0.18 })
      floor.rect(36, y, W - 72, 1).fill({ color: 0x000000, alpha: 0.16 })
    }
    floor.rect(0, 0, 36, H).fill(0x0e1730); floor.rect(W - 36, 0, 36, H).fill(0x0e1730)
    floor.rect(34, 40, 3, H - 40).fill({ color: 0xc9a35e, alpha: 0.3 }); floor.rect(W - 37, 40, 3, H - 40).fill({ color: 0xc9a35e, alpha: 0.3 })
    floor.rect(0, 0, W, 40).fill(WALL)
    floor.rect(0, 38, W, 3).fill({ color: 0xc9a35e, alpha: 0.4 })
    const win = (x) => {
      floor.roundRect(x, 6, 72, 26, 3).fill(SKY).stroke({ width: 1.5, color: 0x475569 })
      for (let i = 0; i < 9; i++) {
        const h = 6 + rnd(x + i) * 14, bx = x + 2 + i * 7.6
        floor.rect(bx, 31 - h, 6.4, h).fill(0x0a1122)
        if (rnd(x * 3 + i) > 0.45) floor.rect(bx + 2, 33 - h + 2, 1.6, 1.6).fill({ color: 0xfbbf24, alpha: 0.8 })
      }
      floor.rect(x + 35, 6, 2, 26).fill(0x475569)
    }
    for (let x = 56; x < 380; x += 86) win(x)
    for (let x = 628; x < 950; x += 86) win(x)
    floor.roundRect(W / 2 - 124, 2, 248, 34, 12).fill({ color: 0xfbbf24, alpha: 0.08 })
    floor.roundRect(W / 2 - 112, 6, 224, 26, 8).fill(0x0b1020).stroke({ width: 1.5, color: 0xc9a35e })
    for (let i = 0; i < 5; i++) {
      const y = rowY(i) + 30
      for (const sx of [18, W - 18]) {
        floor.circle(sx, y, 34).fill({ color: 0xffd28a, alpha: 0.035 }).circle(sx, y, 18).fill({ color: 0xffd28a, alpha: 0.06 })
        floor.ellipse(sx, y, 3.5, 6).fill({ color: 0xffe8b0, alpha: 0.9 })
      }
    }
    floor.roundRect(404, 46, 192, H - 58, 14).fill(0x121b35).stroke({ width: 1.5, color: 0xc9a35e, alpha: 0.5 })
    floor.roundRect(414, 56, 172, H - 78, 10).stroke({ width: 1, color: 0xc9a35e, alpha: 0.22 })
    for (let y = 84; y < H - 30; y += 56) floor.poly([500, y - 9, 512, y, 500, y + 9, 488, y]).stroke({ width: 1, color: 0xc9a35e, alpha: 0.18 })
    for (let i = 0; i < 5; i++) {
      floor.ellipse(500, rowY(i) + 44, 120, 58).fill(POOL)
      floor.ellipse(154, rowY(i) + 48, 160, 72).fill(POOL)
      floor.ellipse(846, rowY(i) + 48, 160, 72).fill(POOL)
    }
    this.world.addChild(floor)
    const sign = txt('FYV CAPITAL OFFICE', 13, 0xfbbf24, '900'); sign.anchor.set(0.5); sign.position.set(W / 2, 19); sign.zIndex = -9
    const aisle = txt('CENTER AISLE', 11, 0xc9a35e, '800'); aisle.alpha = 0.6; aisle.anchor.set(0.5); aisle.position.set(W / 2, H - 24); aisle.zIndex = -9
    this.world.addChild(sign, aisle)
    this.desks = {}
    const desk = (id, side, i) => {
      const L = side === 'L', y = rowY(i), dx = L ? 56 : 748, sx = L ? 84 : 778, sy = y - 8, sw = 138, sh = 76
      const g = new Graphics()
      const seat = id ? seatOf(id) : { x: L ? 286 : 714, y: y + 44 }
      const cx0 = seat.x, cy0 = seat.y
      for (let k = 0; k < 5; k++) { const a = -Math.PI / 2 + (k / 5) * Math.PI * 2; g.moveTo(cx0, cy0 + 22).lineTo(cx0 + Math.cos(a) * 13, cy0 + 22 + Math.sin(a) * 5).stroke({ width: 2.5, color: 0x0b1222 }).circle(cx0 + Math.cos(a) * 13, cy0 + 22 + Math.sin(a) * 5, 2).fill(0x334155) }
      g.roundRect(cx0 - 16, cy0 + 2, 32, 18, 8).fill(0x1f2a3d).stroke({ width: 1, color: 0x475569 })
      const bx = L ? cx0 + 11 : cx0 - 23
      g.roundRect(bx, cy0 - 16, 12, 38, 6).fill(0x263449).stroke({ width: 1, color: 0x475569 })
      g.roundRect(bx + 3, cy0 - 12, 3, 28, 1.5).fill({ color: 0xffffff, alpha: 0.08 })
      g.rect(dx + 6, y + 84, 6, 12).fill(0x0b1222); g.rect(dx + 184, y + 84, 6, 12).fill(0x0b1222)
      g.roundRect(dx + 4, y + 88, 192, 8, 4).fill({ color: 0x000000, alpha: 0.35 })
      g.roundRect(dx, y + 20, 196, 60, 7).fill(DESK).stroke({ width: 1, color: 0x64748b, alpha: 0.5 })
      g.moveTo(dx + 7, y + 21.5).lineTo(dx + 189, y + 21.5).stroke({ width: 1, color: 0xffffff, alpha: 0.14 })
      g.roundRect(dx, y + 76, 196, 12, 4).fill(0x101827)
      g.moveTo(dx + 4, y + 76.5).lineTo(dx + 192, y + 76.5).stroke({ width: 1.5, color: 0xc9a35e, alpha: 0.6 })
      g.rect(sx + sw / 2 - 5, sy + sh, 10, 12).fill(0x475569)
      g.ellipse(sx + sw / 2, sy + sh + 12, 22, 4).fill(0x334155)
      if (id) {
        const kx = L ? dx + 176 : dx + 6
        g.roundRect(kx, y + 26, 14, 44, 3).fill(0x0f172a).stroke({ width: 1, color: 0x475569 })
        for (let r = 0; r < 3; r++) for (let k = 0; k < 8; k++) g.rect(kx + 2.5 + r * 3.4, y + 29 + k * 5, 2.4, 3.6).fill({ color: 0x94a3b8, alpha: 0.7 })
        g.ellipse(kx + 7, y + 75, 4, 3).fill(0xcbd5e1)
        const ox = L ? dx + 14 : dx + 182
        g.circle(ox, y + 36, 6).fill(0xf8fafc).circle(ox, y + 36, 4.2).fill(0x5b3a1e).circle(ox + (L ? 7 : -7), y + 36, 2.5).stroke({ width: 1.5, color: 0xf8fafc })
        g.roundRect(ox - 6, y + 60, 12, 10, 2).fill(0xb45309)
        for (const [lx2, ly2, r] of [[-4, 56, 4.5], [4, 55, 4.5], [0, 51, 5], [-2, 46, 3.5], [3, 47, 3.5]]) g.circle(ox + lx2, y + ly2, r).fill(r > 4 ? 0x16a34a : 0x22c55e)
      }
      g.zIndex = y - 40
      const frame = new Graphics(); frame.zIndex = y - 39
      const scr = new Graphics(); scr.zIndex = y - 38
      const glare = new Graphics(); glare.zIndex = y - 37.5
      glare.poly([sx + sw * 0.52, sy, sx + sw * 0.72, sy, sx + sw * 0.4, sy + sh, sx + sw * 0.2, sy + sh]).fill({ color: 0xffffff, alpha: 0.05 })
      glare.poly([sx + sw * 0.76, sy, sx + sw * 0.8, sy, sx + sw * 0.48, sy + sh, sx + sw * 0.44, sy + sh]).fill({ color: 0xffffff, alpha: 0.04 })
      frame.eventMode = 'static'; frame.cursor = 'pointer'; frame.hitArea = new Rectangle(sx - 6, sy - 6, sw + 12, sh + 12)
      scr.eventMode = glare.eventMode = 'none'
      frame.on('pointertap', (e) => { e.stopPropagation(); cbScreen(id || (L ? 'empty9' : 'empty10')) })
      const cbScreen = (k) => this.cb.onScreen?.(k)
      const lx = L ? 160 : 840
      const plq = new Graphics(); plq.zIndex = 899
      plq.roundRect(lx - 112, y + 88, 224, 39, 9).fill({ color: 0x0a1122, alpha: 0.92 }).stroke({ width: 1.5, color: id ? 0xc9a35e : 0x475569, alpha: id ? 0.75 : 0.5 })
      if (id) plq.roundRect(lx - 108, y + 95, 4, 25, 2).fill(SHIRT[id])
      const nm = txt(id ? '' : `Future Agent ${L ? 9 : 10}`, 16, id ? 0xf8fafc : 0x64748b, '800'); nm.anchor.set(0.5, 0); nm.position.set(lx, y + 90); nm.zIndex = 900
      const tk = txt(id ? '' : 'Open desk · ready for expansion', 12, 0x94a3b8, '600'); tk.anchor.set(0.5, 0); tk.position.set(lx, y + 110); tk.zIndex = 900
      this.world.addChild(g, frame, scr, glare, plq, nm, tk)
      this.desks[id || side] = { frame, scr, nm, tk, sx, sy, sw, sh, empty: !id }
      if (!id) {
        frame.roundRect(sx - 5, sy - 5, sw + 10, sh + 10, 8).fill(0x0b1020).stroke({ width: 2.5, color: 0x334155 }); scr.roundRect(sx, sy, sw, sh, 5).fill(0x020617)
        const off = txt('+  OPEN DESK', 12, 0x475569, '800'); off.anchor.set(0.5); off.position.set(sx + sw / 2, sy + sh / 2); off.zIndex = y - 37; this.world.addChild(off)
        g.roundRect(seat.x - 30, seat.y - 22, 60, 56, 10).stroke({ width: 1.5, color: 0x475569, alpha: 0.5 })
      }
    }
    LEFT.forEach((id, i) => desk(id, 'L', i))
    RIGHT.forEach((id, i) => desk(id, 'R', i))
  }
  drawScreen(w) {
    const d = this.desks[w.id], a = this.agents[w.id]
    const st = a?.status || 'ok', col = STATUS[st]
    const { sx: x, sy: y, sw, sh } = d, t = w.t, cx = x + sw / 2
    const blink = st === 'alert' ? 0.55 + 0.45 * Math.abs(Math.sin(t * 3)) : 1
    const f = d.frame.clear()
    f.ellipse(cx, y + sh + 16, sw * 0.6, 16).fill({ color: col, alpha: 0.07 })
    f.roundRect(x - 11, y - 11, sw + 22, sh + 22, 15).fill({ color: col, alpha: (0.07 + 0.04 * Math.sin(t * 2)) * blink })
    f.roundRect(x - 5, y - 5, sw + 10, sh + 10, 8).fill(0x0b1020).stroke({ width: w.job ? 3.5 : 2.5, color: col, alpha: blink })
    f.moveTo(x, y - 3).lineTo(x + sw, y - 3).stroke({ width: 1, color: 0xffffff, alpha: 0.18 })
    f.circle(cx, y + sh + 2.5, 1.4).fill(col)
    const g = d.scr.clear()
    g.roundRect(x, y, sw, sh, 5).fill(TINT[st])
    g.rect(x, y + ((t * 26) % sh), sw, 2).fill({ color: 0xffffff, alpha: 0.035 })
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
      this.burst(w.x, w.y - 30)
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
      this.burst((w.x + r.x) / 2, w.y - 6)
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
      if (d.tk.text !== tt) { d.tk.text = tt; d.tk.scale.set(1); if (d.tk.width > 212) d.tk.scale.set(212 / d.tk.width) }
      if (d.lastFill !== fill) { d.tk.style.fill = fill; d.lastFill = fill }
      w.ring.visible = this.selected === w.id
    }
    this.drawFx(dt)
    this.applyCamera()
  }
  drawFx(dt) {
    const f = this.fx.clear()
    for (const w of this.workers) {
      if (!w.carryTo || !w.hasDoc || w.state !== 'walking') continue
      const pts = [{ x: w.x, y: w.y + 28 }, ...w.path.map((p) => ({ x: p.x, y: p.y + 28 }))]
      const off = (w.t * 40) % 14
      for (let i = 0; i < pts.length - 1; i++) {
        const a = pts[i], b = pts[i + 1], len = Math.hypot(b.x - a.x, b.y - a.y)
        for (let s = i === 0 ? off : 0; s < len; s += 14) f.circle(a.x + ((b.x - a.x) * s) / len, a.y + ((b.y - a.y) * s) / len, 2.3).fill({ color: 0xfbbf24, alpha: 0.75 })
      }
      const r = this.worker(w.carryTo), pr = 24 + 4 * Math.sin(w.t * 6)
      f.ellipse(r.seat.x, r.seat.y + 29, pr + 6, pr * 0.38 + 2).stroke({ width: 2.5, color: 0xfbbf24, alpha: 0.85 })
    }
    const g = this.fxTop.clear()
    this.sparks = (this.sparks || []).filter((p) => (p.life -= dt) > 0)
    for (const p of this.sparks) {
      p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 70 * dt
      const k = p.life / p.max
      g.star(p.x, p.y, 4, 1.5 + 3 * k, 1, p.life * 4).fill({ color: p.c, alpha: k })
    }
  }
  burst(x, y) {
    for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2; (this.sparks ||= []).push({ x, y, vx: Math.cos(a) * (40 + rnd(i + y) * 50), vy: Math.sin(a) * 50 - 40, life: 0.9, max: 0.9, c: i % 2 ? 0xfde68a : 0xffffff }) }
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
