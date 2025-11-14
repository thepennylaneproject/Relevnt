/**
 * FeatureCard Component
 * 
 * 🎓 LEARNING NOTE: This component showcases a single feature with
 * an image, title, and description. It's used throughout the platform
 * to highlight different capabilities.
 */

import React from 'react';
import './FeatureCard.css';

interface FeatureCardProps {
    title: string;
    description: string;
    icon?: string;
    imageUrl?: string;
    onClick?: () => void;
}

export const FeatureCard: React.FC<FeatureCardProps> = ({
    title,
    description,
    imageUrl,
    onClick,
}) => {
    return (
        <div className="feature-card" onClick={onClick}>
            {imageUrl && (
                <div className="feature-card__image-container">
                    <img
                        src={imageUrl}
                        alt={title}
                        className="feature-card__image"
                        onError={(e) => {
                            // Fallback if image fails to load
                            e.currentTarget.style.display = 'none';
                        }}
                    />
                </div>
            )}

            <div className="feature-card__content">
                <h3 className="feature-card__title">{title}</h3>
                <p className="feature-card__description">{description}</p>
            </div>
        </div>
    );
};

export default FeatureCard;