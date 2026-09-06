import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

export const Returns: React.FC = () => {
    const navigate = useNavigate();
    const { t } = useLanguage();

    return (
        <div className="static-page">
            <button onClick={() => navigate(-1)} className="btn btn-outline back-btn">← {t.admin.back}</button>
            <h1>{t.returns.title}</h1>
            <div className="static-content">
                <h2>{t.returns.section1Title}</h2>
                <p>{t.returns.section1Text}</p>

                <h2>{t.returns.section2Title}</h2>
                <p>{t.returns.section2Text}</p>

                <h2>{t.returns.section3Title}</h2>
                <p>{t.returns.section3Text}</p>
            </div>
        </div>
    );
};