interface LoadingOverlayProps {
  isVisible: boolean;
}

export default function LoadingOverlay({ isVisible }: LoadingOverlayProps) {
  if (!isVisible) return null;

  return (
    <div className="loading-overlay">
      <div className="flex flex-col items-center">
        <div className="sparkle-container">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="sparkle" />
          ))}
        </div>
        <div className="loading-text">
          Creating your masterpiece...
        </div>
      </div>
    </div>
  );
}
