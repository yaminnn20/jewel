interface VerkoveLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function VerkoveLogo({ className = '', size = 'md' }: VerkoveLogoProps) {
  const sizeClasses = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-4xl'
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div className={`font-bold text-gray-800 tracking-wider ${sizeClasses[size]}`}>
        VERKOVE
      </div>
      <div className="text-amber-600">
        {size === 'sm' && '🌿'}
        {size === 'md' && '🌿'}
        {size === 'lg' && '🌿'}
      </div>
    </div>
  );
}
