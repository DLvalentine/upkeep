// Libs
import { CircleX } from 'lucide-react';

export default function SearchBox({ value, onChange, showX, onClickX }) {
    return (
        <div style={{ position: 'relative', display: 'inline-block' }}>
            <input
                style={{
                    boxSizing: 'border-box',
                    height: '45px',
                    width: '350px',
                    paddingLeft: '15px',
                    paddingRight: '44px'
                }}
                type='text'
                placeholder='Find that perfect card...'
                value={value}
                onChange={onChange}
            />
            {showX && (
                <button
                    type='button'
                    aria-label='Clear search'
                    onClick={onClickX}
                    style={{
                        position: 'absolute',
                        right: '10px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        display: 'flex',
                        padding: 0,
                        border: 'none',
                        background: 'none',
                        cursor: 'pointer'
                    }}
                >
                    <CircleX size={24} />
                </button>
            )}
        </div>
    );
}