class QuantumMesh {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext("2d");
    this.nodes = [];
    this.connections = [];
    this.mouse = { x: -1000, y: -1000 };
    this.connectionDistance = 150;
    this.nodeCount = 0;
    this.animationFrameId = null;
    this.resizeTimeout = null;

    this.init();
  }

  init() {
    this.resize();
    this.calculateNodeCount();
    this.createNodes();
    this.bindEvents();
    this.animate();
  }

  resize() {
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = window.innerWidth * dpr;
    this.canvas.height = window.innerHeight * dpr;
    this.ctx.scale(dpr, dpr);
    this.canvas.style.width = `${window.innerWidth}px`;
    this.canvas.style.height = `${window.innerHeight}px`;
  }

  calculateNodeCount() {
    const area = window.innerWidth * window.innerHeight;
    this.nodeCount = Math.floor(area / 12000);
  }

  createNodes() {
    this.nodes = [];
    for (let i = 0; i < this.nodeCount; i++) {
      this.nodes.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        radius: Math.random() * 1.5 + 0.5
      });
    }
  }

  bindEvents() {
    window.addEventListener("resize", () => {
      clearTimeout(this.resizeTimeout);
      this.resizeTimeout = setTimeout(() => {
        this.resize();
        this.calculateNodeCount();
        this.createNodes();
      }, 200);
    });

    window.addEventListener("mousemove", (e) => {
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;
    });

    window.addEventListener("mouseout", () => {
      this.mouse.x = -1000;
      this.mouse.y = -1000;
    });
  }

  update() {
    for (const node of this.nodes) {
      node.x += node.vx;
      node.y += node.vy;

      if (node.x < 0 || node.x > window.innerWidth) node.vx *= -1;
      if (node.y < 0 || node.y > window.innerHeight) node.vy *= -1;

      const dx = this.mouse.x - node.x;
      const dy = this.mouse.y - node.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 200) {
        const force = (200 - dist) / 200;
        node.x -= dx * force * 0.02;
        node.y -= dy * force * 0.02;
      }
    }
  }

  draw() {
    this.ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

    for (let i = 0; i < this.nodes.length; i++) {
      const n1 = this.nodes[i];

      this.ctx.beginPath();
      this.ctx.arc(n1.x, n1.y, n1.radius, 0, Math.PI * 2);
      this.ctx.fillStyle = "rgba(139, 92, 246, 0.6)";
      this.ctx.fill();

      for (let j = i + 1; j < this.nodes.length; j++) {
        const n2 = this.nodes[j];
        const dx = n1.x - n2.x;
        const dy = n1.y - n2.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < this.connectionDistance) {
          const opacity = (1 - dist / this.connectionDistance) * 0.3;
          this.ctx.beginPath();
          this.ctx.moveTo(n1.x, n1.y);
          this.ctx.lineTo(n2.x, n2.y);
          this.ctx.strokeStyle = `rgba(6, 182, 212, ${opacity})`;
          this.ctx.lineWidth = 0.5;
          this.ctx.stroke();
        }
      }
    }
  }

  animate() {
    this.update();
    this.draw();
    this.animationFrameId = requestAnimationFrame(() => this.animate());
  }

  destroy() {
    cancelAnimationFrame(this.animationFrameId);
  }
}

class AetherisUI {
  constructor() {
    this.modal = document.getElementById("handshake-modal");
    this.initBtn = document.getElementById("initiate-handshake");
    this.deployBtn = document.getElementById("deploy-cluster");
    this.metrics = {
      latency: document.getElementById("metric-latency"),
      throughput: document.getElementById("metric-throughput"),
      uptime: document.getElementById("metric-uptime")
    };

    this.bindUI();
    this.startMetricSimulation();
  }

  bindUI() {
    this.initBtn.addEventListener("click", () => this.modal.showModal());
    this.deployBtn.addEventListener("click", () => this.modal.showModal());

    this.modal.addEventListener("click", (e) => {
      if (e.target === this.modal) this.modal.close();
    });
  }

  startMetricSimulation() {
    setInterval(() => {
      const lat = (0.35 + Math.random() * 0.15).toFixed(2);
      const thr = (14.2 + Math.random() * 1.2).toFixed(1);

      this.metrics.latency.textContent = lat;
      this.metrics.throughput.textContent = thr;
    }, 2000);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  new QuantumMesh("quantum-mesh");
  new AetherisUI();
});
