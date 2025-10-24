// src/components/NeuralCanvas.js
import React, { useRef, useEffect } from 'react';

const NeuralCanvas = () => {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        let w, h, nodes = [], animationFrameId;
        let mouse = { x: null, y: null, radius: 150 };

        const resizeCanvas = () => {
            w = canvas.width = window.innerWidth;
            h = canvas.height = window.innerHeight;
            nodes = [];
            let nodeCount = (w * h) / 12000;
            for(let i = 0; i < nodeCount; i++){
                nodes.push({
                    x: Math.random() * w,
                    y: Math.random() * h,
                    vx: Math.random() * 0.4 - 0.2,
                    vy: Math.random() * 0.4 - 0.2,
                    radius: Math.random() * 2 + 1
                });
            }
        };

        const handleMouseMove = (e) => { mouse.x = e.clientX; mouse.y = e.clientY; };
        const handleMouseOut = () => { mouse.x = null; mouse.y = null; };

        window.addEventListener('resize', resizeCanvas);
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseout', handleMouseOut);

        const animate = () => {
            ctx.clearRect(0, 0, w, h);
            for(let i = 0; i < nodes.length; i++){
                let node = nodes[i];

                if(mouse.x != null && mouse.y != null) {
                    let dx = mouse.x - node.x;
                    let dy = mouse.y - node.y;
                    let dist = Math.sqrt(dx * dx + dy * dy);
                    if(dist < mouse.radius){
                        node.x -= dx * 0.01;
                        node.y -= dy * 0.01;
                    }
                }

                node.x += node.vx;
                node.y += node.vy;

                if(node.x < 0 || node.x > w) node.vx *= -1;
                if(node.y < 0 || node.y > h) node.vy *= -1;

                ctx.beginPath();
                ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
                // UPDATED: Changed particle fillStyle to the new mint green
                ctx.fillStyle = `rgba(102, 255, 176, 0.7)`;
                ctx.fill();
                
                for(let j = i + 1; j < nodes.length; j++){
                    let otherNode = nodes[j];
                    let dx = node.x - otherNode.x;
                    let dy = node.y - otherNode.y;
                    let dist = Math.sqrt(dx * dx + dy * dy);
                    
                    if(dist < 120){
                        ctx.beginPath();
                        ctx.moveTo(node.x, node.y);
                        ctx.lineTo(otherNode.x, otherNode.y);
                        // UPDATED: Changed link strokeStyle to the new light blue
                        ctx.strokeStyle = `rgba(136, 221, 255, ${1 - dist / 120})`;
                        ctx.stroke();
                    }
                }
            }
            animationFrameId = requestAnimationFrame(animate);
        };
        
        resizeCanvas();
        animate();

        return () => {
            window.removeEventListener('resize', resizeCanvas);
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseout', handleMouseOut);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return <canvas id="neural-canvas" ref={canvasRef} />;
};

export default NeuralCanvas;