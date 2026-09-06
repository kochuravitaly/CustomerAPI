import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { VisaLogo, MastercardLogo, MirLogo, YooMoneyLogo } from '../components/payment/PaymentLogos';

export const PaymentMethods: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { t } = useLanguage();
    const [selected, setSelected] = useState(() => {
        return sessionStorage.getItem('selectedPaymentMethod') || location.state?.selectedMethod || 'bank_card';
    });

    const paymentMethods = [
        {
            id: 'bank_card',
            label: t.checkout.bankCard,
            description: 'Visa, Mastercard, MIR',
            logos: [<VisaLogo key="visa" />, <MastercardLogo key="mc" />, <MirLogo key="mir" />]
        },
        {
            id: 'yoo_money',
            label: 'YooMoney',
            description: t.checkout.digitalWallet,
            logos: [<YooMoneyLogo key="yoomoney" />]
        },
    ];

    return (
        <div className="payment-methods-page">
            <button onClick={() => navigate(-1)} className="btn btn-outline back-btn">
                ← {t.admin.back}
            </button>
            <h1>{t.checkout.paymentMethod}</h1>

            <div className="payment-options-list">
                {paymentMethods.map(method => (
                    <label
                        key={method.id}
                        className={`payment-option-card ${selected === method.id ? 'active' : ''}`}
                        onClick={() => setSelected(method.id)}
                    >
                        <input
                            type="radio"
                            checked={selected === method.id}
                            onChange={() => setSelected(method.id)}
                            style={{ display: 'none' }}
                        />
                        <div className="payment-option-logos">
                            {method.logos}
                        </div>
                        <div className="payment-option-info">
                            <div className="payment-option-label">{method.label}</div>
                            <div className="payment-option-description">{method.description}</div>
                        </div>
                        {selected === method.id && <span className="payment-option-check">✓</span>}
                    </label>
                ))}
            </div>

            <button
                onClick={() => {
                    sessionStorage.setItem('selectedPaymentMethod', selected);
                    navigate('/checkout', {
                        state: {
                            selectedPaymentMethod: selected,
                        }
                    });
                }}
                className="btn btn-primary btn-block"
                style={{ marginTop: '16px' }}
            >
                {t.checkout.choose}
            </button>
        </div>
    );
};