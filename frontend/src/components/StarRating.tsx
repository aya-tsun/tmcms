
interface Props {
  value?: number;
  onChange?: (v: number) => void;
  readonly?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const sizes = { sm: 16, md: 20, lg: 28 };

export default function StarRating({ value, onChange, readonly = false, size = 'md' }: Props) {
  const px = sizes[size];
  const stars = [1, 2, 3, 4, 5];

  return (
    <div className="flex gap-0.5">
      {stars.map((s) => {
        const filled = value !== undefined && s <= value;
        return (
          <svg
            key={s}
            width={px}
            height={px}
            viewBox="0 0 24 24"
            fill={filled ? '#f59e0b' : 'none'}
            stroke={filled ? '#f59e0b' : '#d1d5db'}
            strokeWidth="1.5"
            style={{ cursor: readonly ? 'default' : 'pointer' }}
            onClick={() => !readonly && onChange?.(s)}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
            />
          </svg>
        );
      })}
    </div>
  );
}
