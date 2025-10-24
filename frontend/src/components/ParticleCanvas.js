// src/components/ParticleCanvas.js
import React, { useRef, useEffect } from 'react';

const ParticleCanvas = () => {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        let particles = [];
        let animationFrameId;
        let mouse = { x: null, y: null, radius: 150 };

        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };

        class Particle {
            constructor(x, y, color, isTrail) {
                this.x = x || Math.random() * canvas.width;
                this.y = y || Math.random() * canvas.height;
                this.size = isTrail ? Math.random() * 2 + 1 : Math.random() * 1.5 + 1;
                this.baseX = this.x;
                this.baseY = this.y;
                this.density = (Math.random() * 40) + 5;
                this.color = color || `hsl(200, 100%, 80%)`;
                this.isTrail = isTrail;
                this.life = isTrail ? Math.random() * 30 + 20 : Infinity;
            }

            draw() {
                ctx.fillStyle = this.color;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.closePath();
                ctx.fill();
            }

            update() {
                if (this.isTrail) {
                    this.size -= 0.05;
                    this.life -= 1;
                    if (this.size < 0) this.size = 0;
                    return;
                }

                if (mouse.x && mouse.y) {
                    let dx = mouse.x - this.x;
                    let dy = mouse.y - this.y;
                    let distance = Math.sqrt(dx * dx + dy * dy);
                    if (distance < mouse.radius) {
                        let forceDirectionX = dx / distance;
                        let forceDirectionY = dy / distance;
                        let maxDistance = mouse.radius;
                        let force = (maxDistance - distance) / maxDistance;
                        let directionX = forceDirectionX * force * this.density;
                        let directionY = forceDirectionY * force * this.density;
                        this.x -= directionX;
                        this.y -= directionY;
                    } else {
                        if (this.x !== this.baseX) this.x -= (this.x - this.baseX) / 10;
                        if (this.y !== this.baseY) this.y -= (this.y - this.baseY) / 10;
                    }
                }
            }
        }

        const init = () => {
            particles = [];
            let numberOfParticles = (canvas.width * canvas.height) / 9000;
            for (let i = 0; i < numberOfParticles; i++) {
                particles.push(new Particle());
            }
        };

        const connect = () => {
            let opacityValue = 1;
            for (let a = 0; a < particles.length; a++) {
                for (let b = a; b < particles.length; b++) {
                    if (particles[a].isTrail || particles[b].isTrail) continue;
                    let distance = ((particles[a].x - particles[b].x) * (particles[a].x - particles[b].x)) +
                                 ((particles[a].y - particles[b].y) * (particles[a].y - particles[b].y));
                    if (distance < (canvas.width / 7) * (canvas.height / 7)) {
                        opacityValue = 1 - (distance / 20000);
                        // UPDATED: Changed the strokeStyle to use the new tertiary accent color
                        ctx.strokeStyle = `rgba(136, 221, 255, ${opacityValue})`;
                        ctx.lineWidth = 1;
                        ctx.beginPath();
                        ctx.moveTo(particles[a].x, particles[a].y);
                        ctx.lineTo(particles[b].x, particles[b].y);
                        ctx.stroke();
                    }
                }
            }
        };

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            for (let i = particles.length - 1; i >= 0; i--) {
                const p = particles[i];
                if (p.isTrail && (p.size <= 0 || p.life <= 0)) {
                    particles.splice(i, 1);
                } else {
                    p.update();
                    p.draw();
                }
            }
            connect();
            animationFrameId = requestAnimationFrame(animate);
        };

        const handleMouseMove = (event) => {
            mouse.x = event.clientX;
            mouse.y = event.clientY;
            if (particles.length < 200) {
                for (let i = 0; i < 2; i++) {
                    // UPDATED: Changed the HSL range to generate mint, cyan, and purple colors
                    const hue = 150 + Math.random() * 120;
                    particles.push(new Particle(event.clientX, event.clientY, `hsl(${hue}, 100%, 80%)`, true));
                }
            }
        };

        const handleMouseOut = () => {
            mouse.x = null;
            mouse.y = null;
        };
        
        // Setup
        resizeCanvas();
        init();
        animate();
        
        window.addEventListener('resize', resizeCanvas);
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseout', handleMouseOut);

        // Cleanup
        return () => {
            window.removeEventListener('resize', resizeCanvas);
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseout', handleMouseOut);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return <canvas id="particle-canvas" ref={canvasRef} />;
};

export default ParticleCanvas;