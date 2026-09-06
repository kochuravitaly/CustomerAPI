import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

export const Contact: React.FC = () => {
    const navigate = useNavigate();
    const { t } = useLanguage();

    return (
        <div className="static-page">
            <button onClick={() => navigate(-1)} className="btn btn-outline back-btn">← {t.admin.back}</button>
            <h1>{t.contact.title}</h1>
            <div className="static-content">
                <p>{t.contact.description}</p>
                <div className="contact-info">
                    <div>📧 {t.contact.email}: support@cheyenneshop.ru</div>
                    <div>📞 {t.contact.phone}: +7 (999) 123-45-67</div>
                    <div>🕐 {t.contact.hours}</div>
                </div>
            </div>
        </div>
    );
};