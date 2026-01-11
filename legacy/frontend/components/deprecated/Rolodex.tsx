import React, { useEffect, useRef } from 'react'
import './rolodex.css'

interface Face {
    key: string
    title: string
    node: React.ReactNode
}

interface RolodexProps {
    activeFace: number
    onChangeFace: (index: number) => void
    faces: Face[]
}

export function Rolodex({ activeFace, onChangeFace, faces }: RolodexProps) {
    const containerRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowLeft') {
                onChangeFace(Math.max(0, activeFace - 1))
            } else if (e.key === 'ArrowRight') {
                onChangeFace(Math.min(faces.length - 1, activeFace + 1))
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [activeFace, faces.length, onChangeFace])

    // Rotation offsets for 3 faces in a shallow arc
    // Face 0: -35deg, Face 1: 0deg, Face 2: 35deg
    const getRotationForTray = () => {
        if (activeFace === 0) return 35
        if (activeFace === 1) return 0
        if (activeFace === 2) return -35
        return 0
    }

    return (
        <div className="rolodex-container" ref={containerRef}>
            <div className="rolodex-index">
                {faces.map((face, index) => (
                    <React.Fragment key={face.key}>
                        <span
                            className={`rolodex-index-item ${activeFace === index ? 'active' : ''}`}
                            onClick={() => onChangeFace(index)}
                        >
                            {face.title}
                        </span>
                        {index < faces.length - 1 && <span className="rolodex-index-sep">·</span>}
                    </React.Fragment>
                ))}
            </div>

            <div className="rolodex-stage">
                <div 
                    className="rolodex-tray"
                    style={{ transform: `rotateY(${getRotationForTray()}deg)` }}
                >
                    {faces.map((face, index) => {
                        const isActive = activeFace === index
                        // Position each face in 3D space
                        // Face 0: rotateY(-35deg) translateZ(50px)
                        // Face 1: rotateY(0deg) translateZ(100px)
                        // Face 2: rotateY(35deg) translateZ(50px)
                        
                        let transform = ''
                        if (index === 0) transform = 'rotateY(-35deg) translateZ(50px) translateX(-10%)'
                        if (index === 1) transform = 'rotateY(0deg) translateZ(100px)'
                        if (index === 2) transform = 'rotateY(35deg) translateZ(50px) translateX(10%)'

                        return (
                            <div
                                key={face.key}
                                className={`rolodex-face ${isActive ? 'active' : 'inactive'}`}
                                style={{ transform }}
                                onClick={() => !isActive && onChangeFace(index)}
                            >
                                <div className="rolodex-face-content">
                                    {face.node}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}
