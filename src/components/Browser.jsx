import { useState } from 'react';

export default function Browser({ cards }) {
    const paginate = (cards, page = 1, pageSize = 10) => {
        if (!cards)
            return [];

        const start = (page - 1) * pageSize;
        return cards.slice(start, start + pageSize);
    };

    const [page, setPage] = useState(1);

    return (
        <div className="h-[85vh] w-[80%] pl-6 flex flex-col gap-4 overflow-y-auto scrollbar-thin scrollbar-track-[var(--app-panel)] scrollbar-thumb-[var(--app-accent)]">
            <div className="grid grid-cols-5 content-start">
              {cards?.map((card) => {
                const uri = card?.item?.image_uris?.normal;

                return uri ? (
                    <img key={card.item.id} src={uri} className='max-h-[85%] w-auto object-contain'/>
                ) : null;
              })}
            </div>
        </div>
    );
}
