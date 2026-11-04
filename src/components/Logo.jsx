export default function Logo({
    className = 'inline-flex items-center justify-center flex-row gap-2 ml-8',
    iconClassName = 'h-auto w-16',
    titleClassName = ''
}) {
    return (
        <div className={className}>
            <img
                src={`${import.meta.env.BASE_URL}favicon.ico`}
                className={iconClassName}
                alt=""
            />
            <h1 className={`brand-font ${titleClassName}`}>Upkeep</h1>
        </div>
    );
}
