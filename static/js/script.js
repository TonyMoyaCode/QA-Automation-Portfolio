document.addEventListener("DOMContentLoaded", () => {
    const hero = document.querySelector(".hero");

    if (!hero) return;

    // Crear canvas para la red de datos
    const canvas = document.createElement("canvas");
    canvas.id = "network-canvas";
    canvas.setAttribute("aria-hidden", "true");

    hero.prepend(canvas);

    const ctx = canvas.getContext("2d");

    let width;
    let height;
    let nodes = [];
    let particles = [];

    const mouse = {
        x: null,
        y: null,
        radius: 180
    };

    const prefersReducedMotion =
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function resizeCanvas() {
        const rect = hero.getBoundingClientRect();

        width = canvas.width = rect.width;
        height = canvas.height = rect.height;

        createNetwork();
    }

    function createNetwork() {
        nodes = [];
        particles = [];

        const isMobile = width < 768;

        const nodeCount = isMobile ? 28 : 55;

        for (let i = 0; i < nodeCount; i++) {
            nodes.push({
                x: Math.random() * width,
                y: Math.random() * height,
                vx: (Math.random() - 0.5) * 0.35,
                vy: (Math.random() - 0.5) * 0.35,
                radius: Math.random() * 1.8 + 1
            });
        }

        // Crear pequeños paquetes de datos
        if (!prefersReducedMotion) {
            for (let i = 0; i < 12; i++) {
                particles.push({
                    nodeA: Math.floor(Math.random() * nodes.length),
                    nodeB: Math.floor(Math.random() * nodes.length),
                    progress: Math.random(),
                    speed: Math.random() * 0.006 + 0.002
                });
            }
        }
    }

    function distance(a, b) {
        const dx = a.x - b.x;
        const dy = a.y - b.y;

        return Math.sqrt(dx * dx + dy * dy);
    }

    function updateNodes() {
        nodes.forEach(node => {
            if (!prefersReducedMotion) {
                node.x += node.vx;
                node.y += node.vy;
            }

            // Rebote suave en los bordes
            if (node.x < 0 || node.x > width) {
                node.vx *= -1;
            }

            if (node.y < 0 || node.y > height) {
                node.vy *= -1;
            }

            // Interacción con el mouse
            if (mouse.x !== null && mouse.y !== null) {
                const dx = node.x - mouse.x;
                const dy = node.y - mouse.y;

                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < mouse.radius && dist > 0) {
                    const force = (mouse.radius - dist) / mouse.radius;

                    node.x += (dx / dist) * force * 0.7;
                    node.y += (dy / dist) * force * 0.7;
                }
            }
        });
    }

    function drawConnections() {
        const maxDistance = width < 768 ? 125 : 165;

        for (let i = 0; i < nodes.length; i++) {
            for (let j = i + 1; j < nodes.length; j++) {
                const nodeA = nodes[i];
                const nodeB = nodes[j];

                const dist = distance(nodeA, nodeB);

                if (dist < maxDistance) {
                    let opacity = 1 - dist / maxDistance;

                    // Incrementar conexiones cercanas al mouse
                    if (mouse.x !== null && mouse.y !== null) {
                        const mouseDistA = Math.hypot(
                            nodeA.x - mouse.x,
                            nodeA.y - mouse.y
                        );

                        const mouseDistB = Math.hypot(
                            nodeB.x - mouse.x,
                            nodeB.y - mouse.y
                        );

                        if (
                            mouseDistA < mouse.radius ||
                            mouseDistB < mouse.radius
                        ) {
                            opacity += 0.25;
                        }
                    }

                    const gradient = ctx.createLinearGradient(
                        nodeA.x,
                        nodeA.y,
                        nodeB.x,
                        nodeB.y
                    );

                    gradient.addColorStop(0, `rgba(0, 229, 255, ${opacity * 0.45})`);
                    gradient.addColorStop(1, `rgba(155, 89, 255, ${opacity * 0.35})`);

                    ctx.beginPath();
                    ctx.moveTo(nodeA.x, nodeA.y);
                    ctx.lineTo(nodeB.x, nodeB.y);

                    ctx.strokeStyle = gradient;
                    ctx.lineWidth = 0.7;

                    ctx.stroke();
                }
            }
        }
    }

    function drawNodes() {
        nodes.forEach(node => {
            let opacity = 0.55;

            if (mouse.x !== null && mouse.y !== null) {
                const dist = Math.hypot(
                    node.x - mouse.x,
                    node.y - mouse.y
                );

                if (dist < mouse.radius) {
                    opacity = 1;
                }
            }

            ctx.beginPath();
            ctx.arc(
                node.x,
                node.y,
                node.radius,
                0,
                Math.PI * 2
            );

            ctx.fillStyle = `rgba(0, 229, 255, ${opacity})`;

            ctx.shadowBlur = 10;
            ctx.shadowColor = "rgba(0, 229, 255, 0.8)";

            ctx.fill();

            ctx.shadowBlur = 0;
        });
    }

    function drawParticles() {
        particles.forEach(packet => {
            const nodeA = nodes[packet.nodeA];
            const nodeB = nodes[packet.nodeB];

            if (!nodeA || !nodeB) return;

            packet.progress += packet.speed;

            if (packet.progress >= 1) {
                packet.progress = 0;

                packet.nodeA = Math.floor(Math.random() * nodes.length);
                packet.nodeB = Math.floor(Math.random() * nodes.length);
            }

            const x =
                nodeA.x +
                (nodeB.x - nodeA.x) * packet.progress;

            const y =
                nodeA.y +
                (nodeB.y - nodeA.y) * packet.progress;

            ctx.beginPath();
            ctx.arc(x, y, 2, 0, Math.PI * 2);

            ctx.fillStyle = "rgba(255, 255, 255, 0.9)";

            ctx.shadowBlur = 12;
            ctx.shadowColor = "rgba(0, 229, 255, 0.9)";

            ctx.fill();

            ctx.shadowBlur = 0;
        });
    }

    function animate() {
        ctx.clearRect(0, 0, width, height);

        updateNodes();
        drawConnections();
        drawParticles();
        drawNodes();

        if (!prefersReducedMotion) {
            requestAnimationFrame(animate);
        }
    }

    // Mouse
    hero.addEventListener("mousemove", event => {
        const rect = hero.getBoundingClientRect();

        mouse.x = event.clientX - rect.left;
        mouse.y = event.clientY - rect.top;
    });

    hero.addEventListener("mouseleave", () => {
        mouse.x = null;
        mouse.y = null;
    });

    // Touch / mobile
    hero.addEventListener("touchstart", () => {
        mouse.x = null;
        mouse.y = null;
    }, { passive: true });

    window.addEventListener("resize", resizeCanvas);

    resizeCanvas();
    animate();
});