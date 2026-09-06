import React from 'react';
import { SiVisa } from '@icons-pack/react-simple-icons';
import mastercardLogo from '../../assets/payment-logos/mastercard.webp';
import mirLogo from '../../assets/payment-logos/mir.png';
import yooMoneyLogo from '../../assets/payment-logos/yoomoney.webp';

export const VisaLogo: React.FC = () => (
    <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 38,
        height: 24,
        background: 'white',
        borderRadius: '3px',
        border: '1px solid #E5E7EB',
        overflow: 'hidden',
    }}>
        <SiVisa size={30} color="#1A1F71" />
    </div>
);

export const MastercardLogo: React.FC = () => (
    <img
        src={mastercardLogo}
        alt="Mastercard"
        width={38}
        height={24}
        style={{ objectFit: 'contain', borderRadius: '3px', background: 'white', border: '1px solid #E5E7EB' }}
    />
);

export const MirLogo: React.FC = () => (
    <img
        src={mirLogo}
        alt="MIR"
        width={38}
        height={24}
        style={{ objectFit: 'contain', borderRadius: '3px', background: 'white', border: '1px solid #E5E7EB' }}
    />
);

export const YooMoneyLogo: React.FC = () => (
    <img
        src={yooMoneyLogo}
        alt="YooMoney"
        width={38}
        height={24}
        style={{ objectFit: 'contain', borderRadius: '3px', background: 'white', border: '1px solid #E5E7EB' }}
    />
);