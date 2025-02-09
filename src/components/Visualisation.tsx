import { FC, useEffect, useRef, useState } from "react";
import { WebMidi } from 'webmidi';
import Emitter, { events } from "../lib/eventemitter";
import { colorMap } from "../lib/color";

export interface AnimNote {
    id: number | string;
    pitch: number;
    startTime: number;
    endTime?: number;
    isPlaying: boolean;
    channel: number;
}

const MAX_DURATION = 4; // Duration for the line to become fully opaque

interface AnimCircle {
    x: number;
    y: number;
    radius: number;
    opacity: number;
    channel: number;
}

interface VisualizationProps {
    output: number;
}

// let circles : any[] = []; // Array to store expanding circles


// Update function to handle animation and state
function update(canvasRef: React.RefObject<HTMLCanvasElement>, speed: number, deltaTime: number, notes: React.MutableRefObject<AnimNote[]>, circles: React.MutableRefObject<AnimCircle[]>, timeElapsed: React.MutableRefObject<number>) {
    if (!canvasRef.current) {
        return;
    }

    const canvas = canvasRef.current

    const rect = canvas.getBoundingClientRect();
    if (canvas.width != rect.width || canvas.height != rect.height) {
        canvas.width = rect.width;
        canvas.height = rect.height;
    }

    timeElapsed.current += deltaTime;
    const centerX = canvas.width / 2

    // Remove notes that have completely slid off-screen
    notes.current = notes.current.filter(note => {
        const startX = centerX - speed * (timeElapsed.current - note.startTime);

        const endX = note.endTime !== undefined
            ? canvas.width - speed * (timeElapsed.current - note.endTime)
            : null;



        return endX === null || endX > 0 || startX > 0;
    });

    // Update expanding circles
    circles.current.forEach(circle => {
        circle.radius += 0.7; // Expand the circle
        circle.opacity -= 0.04; // Decrease opacity
    });

    // // Remove circles with zero or less opacity
    circles.current = circles.current.filter(circle => circle.opacity > 0);
}

function draw(canvasRef: React.RefObject<HTMLCanvasElement>, speed: number, notes: React.MutableRefObject<AnimNote[]>, circles: React.MutableRefObject<AnimCircle[]>, timeElapsed: React.MutableRefObject<number>) {
    if (!canvasRef.current) {
        return;
    }
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')!
    const CENTER_X = canvas.width - 50;

    ctx.fillStyle = `rgba(0,0,0,1)`; // Lime color with opacity
    // ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // ctx.shadowColor = `red`; // Glow with opacity
    // ctx.shadowBlur = 100; // Intensity of the glow
    ctx.lineWidth = 6

    // Draw circles first for layering
    circles.current.forEach(circle => {
        const offset = ((canvas.height - 50) / 84 * (circle.y - 24) - 25)
        const CENTER_Y = canvas.height - offset
        ctx.moveTo(CENTER_X, CENTER_Y)
        ctx.beginPath();
        ctx.arc(CENTER_X, CENTER_Y, circle.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${colorMap[circle.channel - 1]}, ${circle.opacity})`; // Lime color with opacity
        ctx.fill();
    });

    notes.current.forEach(note => {

        const startX = CENTER_X - speed * (timeElapsed.current - note.startTime);
        const endX = note.endTime !== undefined
            ? CENTER_X - speed * (timeElapsed.current - note.endTime)
            : CENTER_X; // Extend to the center if the note is still playing

            
            // Calculate opacity
        const playingTime = timeElapsed.current - note.startTime;
        const opacity = Math.max(0.1, 1 - playingTime / MAX_DURATION); // Line opacity
        
        // Set shadow for glow effect
        ctx.lineCap = "round";
        
        ctx.strokeStyle = `rgba(${colorMap[note.channel - 1]}, ${opacity})`; // Line color with opacity
        const offset = ((canvas.height - 50) / 84 * (note.pitch - 24) - 25)
        const CENTER_Y = canvas.height - offset

        ctx.beginPath();
        ctx.moveTo(startX, CENTER_Y); // Middle of canvas
        ctx.lineTo(endX, CENTER_Y); // Horizontal line
        ctx.stroke();
    });

    ctx.shadowBlur = 0;
    ctx.shadowColor = "transparent";    
}

const Visualization : FC<VisualizationProps> = ({output}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const timeElapsed = useRef<number>(0);
    const speed = useRef<number>(400);
    const notesRef = useRef<AnimNote[]>([]);
    const circlesRef = useRef<AnimCircle[]>([]);

    const [inputs, setInputs] = useState(WebMidi.inputs)
    
    useEffect(() => {
        if (!inputs.length) {
            return
        }

        const startNote = (n: any, channel: number) => {
            notesRef.current.push({ id: n.note.number, startTime: timeElapsed.current, isPlaying: true, pitch: n.note.number, channel });
            // Add a circle effect for this note
            circlesRef.current.push({
                x: (canvasRef.current?.width || 2) / 2,
                y: n.note.number,
                radius: 0,
                opacity: 1,
                channel: channel,
            });
        }

        const stopNote = (n: any, channel: number) => {
            const note = notesRef.current.find(note => note.id === n.note.number && note.isPlaying);

            if (note) {
                note.id = `${timeElapsed.current}-${note.id}`
                note.endTime = timeElapsed.current;
                note.isPlaying = false;
            }
        }

        const stopAllNote = (n: any, channel: number) => {
            notesRef.current.forEach(note => {
                note.id = `${timeElapsed.current}-${note.id}`
                note.endTime = note.endTime || timeElapsed.current;
                note.isPlaying = false;
            });
        }
        

        [1,2,3,4,5].forEach((channel) => {
            inputs[output].channels[channel].addListener('noteon', (n: any) => startNote(n, channel))
            inputs[output].channels[channel].addListener('noteoff', (n: any) => stopNote(n, channel))
            inputs[output].channels[channel].addListener('allnotesoff', (n: any) => stopAllNote(n, channel))
    
        })

        return () => {
            [1,2,3,4,5].forEach((channel) => {
                inputs[output].channels[channel].removeListener('noteon', (n: any) => startNote(n, channel))
                inputs[output].channels[channel].removeListener('noteoff', (n: any) => stopNote(n, channel))
                inputs[output].channels[channel].removeListener('allnotesoff', (n: any) => stopAllNote(n, channel))
        
            })
        }
    }, [inputs, output])

    useEffect(()=>{
        return Emitter.subscribe(events.eventChannelsChanged, () => {
            setInputs([...WebMidi.inputs])
        })
    }, []) 
    
    useEffect(() => {
        let running = true

        function loop() {
            const deltaTime = 1 / 60; // Assume a fixed 60 FPS for simplicity
            update(canvasRef, speed.current, deltaTime, notesRef, circlesRef, timeElapsed);
            draw(canvasRef, speed.current, notesRef, circlesRef, timeElapsed);

            running && requestAnimationFrame(loop);
        }

        loop()

        return () => {
            running = false
        }
    }, [])

    return <canvas style={{ position: 'absolute', top: 0, left: 0, width: "100%", height: "100vh", zIndex: -1}} ref={canvasRef}/>
}

export default Visualization;
